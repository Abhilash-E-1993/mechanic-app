import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MechanicCard from "../components/MechanicCard";
import NearbyMap from "../components/NearbyMap";
import RequestList from "../components/RequestList";
import Loader from "../components/Loader";

import {
  CITY_OPTIONS,
  DEFAULT_CITY,
  SERVICE_TYPES,
} from "../constants/appConstants";
import { findNearestHub, getHubsForCity } from "../constants/garageHubs";

import { useAuth } from "../context/AuthContext";

import {
  createServiceRequest,
  getAvailableMechanics,
  hasActiveRequestBetweenUsers,
  hasCustomerAcceptedRequest,
  subscribeToCustomerRequests,
} from "../services/firestoreService";

import { notifyMechanicAboutNewRequest } from "../services/notificationService";
import { compressImageToBase64 } from "../services/mediaService";

import {
  getCurrentLocation,
  formatCoordinates,
  reverseGeocode,
} from "../utils/locationService";
import {
  createMechanicRoutingQueue,
  rankMechanicsByDistance,
} from "../utils/mechanicRoutingService";

const NEARBY_RADIUS_KM = 15;
const DEMO_TIP_KEY = "garagegoCustomerDemoTipDismissed";
const MAX_VEHICLE_PHOTOS = 3;

const WHEEL_OPTIONS = [
  { value: "2", icon: "🏍️", label: "2 Wheeler" },
  { value: "3", icon: "🛺", label: "3 Wheeler" },
  { value: "4", icon: "🚗", label: "4 Wheeler" },
  { value: "6+", icon: "🚚", label: "Heavy" },
];

const CustomerDashboard = () => {
  const { currentUser, profile } = useAuth();

  const [mechanics, setMechanics] = useState([]);
  const [requests, setRequests] = useState([]);

  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("detecting"); // detecting | ready | manual
  const [locationLabel, setLocationLabel] = useState("");

  const [manualCity, setManualCity] = useState(DEFAULT_CITY);
  const [manualHubId, setManualHubId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [error, setError] = useState("");
  const [requestProgressMessage, setRequestProgressMessage] = useState("");

  const [requestModalMechanic, setRequestModalMechanic] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState(SERVICE_TYPES[0]);
  const [vehicleWheels, setVehicleWheels] = useState("");
  const [vehiclePhotos, setVehiclePhotos] = useState([]); // [{ id, base64 }]
  const photoInputRef = useRef(null);

  const [demoTipDismissed, setDemoTipDismissed] = useState(
    () => window.localStorage.getItem(DEMO_TIP_KEY) === "1"
  );

  /* ---------- LOAD MECHANICS ---------- */

  const loadMechanics = useCallback(async () => {
    try {
      const list = await getAvailableMechanics();
      setMechanics(list || []);
    } catch {
      setError("Unable to load mechanics right now. Please retry.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------- LOCATION ---------- */

  const detectLocation = useCallback(async () => {
    setLocationStatus("detecting");
    setCustomerLocation(null);

    const location = await getCurrentLocation();

    if (location.isFallback) {
      // GPS denied or unavailable -> let the user pick the nearest hub manually
      setLocationStatus("manual");
      return;
    }

    // Accurately reverse geocode the customer GPS pinpoint
    const geoResult = await reverseGeocode(location.lat, location.lng);
    const coordsFormatted = formatCoordinates(location.lat, location.lng);
    const resolvedAddress = geoResult?.shortAddress || coordsFormatted;

    const enrichedLocation = {
      ...location,
      address: resolvedAddress,
      fullAddress: geoResult?.fullAddress || resolvedAddress,
      formattedCoords: coordsFormatted,
      isFallback: false,
    };

    setCustomerLocation(enrichedLocation);
    setLocationLabel(resolvedAddress);
    setLocationStatus("ready");
  }, []);

  const applyManualLocation = () => {
    const hub = getHubsForCity(manualCity).find((h) => h.id === manualHubId);
    if (!hub) return;

    const coordsFormatted = formatCoordinates(hub.lat, hub.lng);
    const address = `${hub.area}, ${manualCity}`;

    const manualLocation = {
      lat: hub.lat,
      lng: hub.lng,
      accuracy: null,
      address,
      fullAddress: `${hub.name}, ${hub.area}, ${manualCity}`,
      formattedCoords: coordsFormatted,
      isFallback: false,
    };

    setCustomerLocation(manualLocation);
    setLocationLabel(address);
    setLocationStatus("ready");
  };

  useEffect(() => {
    loadMechanics();
    detectLocation();
  }, [loadMechanics, detectLocation]);

  /* ---------- REALTIME REQUESTS ---------- */

  useEffect(() => {
    if (!currentUser?.uid) return undefined;

    const unsubscribe = subscribeToCustomerRequests(
      currentUser.uid,
      (requestList) => setRequests(requestList || []),
      () => setError("Unable to keep request updates in sync.")
    );

    return unsubscribe;
  }, [currentUser?.uid]);

  /* ---------- RANKED + NEARBY MECHANICS ---------- */

  const rankedMechanics = useMemo(
    () =>
      customerLocation
        ? rankMechanicsByDistance({ mechanics, customerLocation })
        : mechanics,
    [mechanics, customerLocation]
  );

  const { nearbyMechanics, showingExtendedList } = useMemo(() => {
    if (!customerLocation) {
      return { nearbyMechanics: rankedMechanics, showingExtendedList: false };
    }

    const withinRadius = rankedMechanics.filter(
      (mechanic) =>
        mechanic.distanceKm != null &&
        mechanic.distanceKm <= NEARBY_RADIUS_KM
    );

    const withRank = (list) =>
      list.map((mechanic, index) => ({ ...mechanic, rank: index + 1 }));

    if (withinRadius.length) {
      return {
        nearbyMechanics: withRank(withinRadius),
        showingExtendedList: false,
      };
    }

    return {
      nearbyMechanics: withRank(rankedMechanics.slice(0, 6)),
      showingExtendedList: rankedMechanics.length > 0,
    };
  }, [rankedMechanics, customerLocation]);

  /* ---------- REQUEST DERIVED STATE ---------- */

  const activeRequestsByMechanic = requests.reduce((acc, request) => {
    if (["Pending", "Accepted"].includes(request.status)) {
      acc[request.mechanicId] = request.status;
    }
    return acc;
  }, {});

  const sortedRequests = [...requests].sort((a, b) => {
    const priority = { Accepted: 1, Pending: 2, Completed: 3, Rejected: 4 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  const customerHasAcceptedRequest = requests.some(
    (request) => request.status === "Accepted"
  );

  /* ---------- REQUEST MODAL ---------- */

  const handleRequest = (mechanic) => {
    setSelectedServiceType(SERVICE_TYPES[0]);
    setVehicleWheels("");
    setVehiclePhotos([]);
    setRequestModalMechanic(mechanic);
  };

  /* ---------- VEHICLE PHOTOS ---------- */

  const handlePhotoSelect = async (event) => {
    const files = Array.from(event.target.files || []).slice(
      0,
      MAX_VEHICLE_PHOTOS - vehiclePhotos.length
    );

    event.target.value = "";

    if (!files.length) return;

    for (const file of files) {
      try {
        const base64 = await compressImageToBase64(file);

        setVehiclePhotos((prev) =>
          prev.length >= MAX_VEHICLE_PHOTOS
            ? prev
            : [
                ...prev,
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  base64,
                },
              ]
        );
      } catch {
        setError("One photo could not be processed. Please try another one.");
      }
    }
  };

  const removePhoto = (photoId) => {
    setVehiclePhotos((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  const closeRequestModal = () => {
    if (creatingRequest) return;
    setRequestModalMechanic(null);
  };

  const confirmRequest = async () => {
    if (!requestModalMechanic || creatingRequest) return;

    if (!vehicleWheels) {
      setError("Please select how many wheels your vehicle has.");
      return;
    }

    setCreatingRequest(true);
    setError("");
    setRequestProgressMessage("Checking for active requests...");

    try {
      const alreadyHasAcceptedRequest =
        customerHasAcceptedRequest ||
        (await hasCustomerAcceptedRequest(currentUser.uid));

      if (alreadyHasAcceptedRequest) {
        setError(
          "You already have an accepted request in progress. Complete it before sending another one."
        );
        return;
      }

      const alreadyHasActiveRequest =
        activeRequestsByMechanic[requestModalMechanic.id] ||
        (await hasActiveRequestBetweenUsers(
          currentUser.uid,
          requestModalMechanic.id
        ));

      if (alreadyHasActiveRequest) {
        setError("You already have an active request with this mechanic.");
        return;
      }

      if (!customerLocation) {
        throw new Error(
          "We need your location first. Detect GPS or pick the nearest hub above."
        );
      }

      setRequestProgressMessage("Building the best mechanic queue for you...");

      // The mechanic the customer CLICKED is always first in the queue.
      // Everyone else who supports the service follows, sorted by distance.
      const serviceMatches = rankMechanicsByDistance({
        mechanics,
        customerLocation,
        serviceType: selectedServiceType,
      });

      const queueMechanics = [
        requestModalMechanic,
        ...serviceMatches.filter(
          (mechanic) => mechanic.id !== requestModalMechanic.id
        ),
      ];

      const routingQueue = createMechanicRoutingQueue(queueMechanics);

      setRequestProgressMessage("Sending your request to the mechanic...");

      const requestId = await createServiceRequest({
        customerId: currentUser.uid,
        customerName: profile?.name || "Customer",

        mechanicId: requestModalMechanic.id,
        mechanicName: requestModalMechanic.name,
        garageName: requestModalMechanic.garageName,
        mechanicPhoneNumber: requestModalMechanic.phoneNumber,

        mechanicCity: requestModalMechanic.city,
        mechanicServiceArea: requestModalMechanic.serviceArea,
        assignedMechanicLocation:
          requestModalMechanic.mechanicBaseLocation || null,

        mechanicRoutingQueue: routingQueue,
        mechanicRoutingIndex: 0,
        matchedMechanicCount: routingQueue.length,

        currentMechanicEtaMinutes:
          requestModalMechanic.estimatedEtaMinutes ?? null,
        currentMechanicDistanceKm:
          requestModalMechanic.distanceKm != null
            ? Number(requestModalMechanic.distanceKm.toFixed(2))
            : null,

        city: "",
        area: customerLocation.address || locationLabel || "Customer pinpoint location",

        serviceType: selectedServiceType,
        vehicleWheels,
        vehiclePhotos: vehiclePhotos.map((photo) => photo.base64),
        customerLocation: {
          lat: customerLocation.lat,
          lng: customerLocation.lng,
          accuracy: customerLocation.accuracy,
          address: customerLocation.address || locationLabel,
          formattedCoords: customerLocation.formattedCoords || formatCoordinates(customerLocation.lat, customerLocation.lng),
        },

        createdAt: new Date(),
      });

      // Fire-and-forget push alert. Silently skipped when the
      // notification backend is offline; realtime listeners still update UI.
      notifyMechanicAboutNewRequest({ currentUser, requestId }).catch(() => {});

      setRequestModalMechanic(null);
    } catch (err) {
      setError(err.message || "Unable to create service request.");
    } finally {
      setCreatingRequest(false);
      setRequestProgressMessage("");
    }
  };

  const dismissDemoTip = () => {
    setDemoTipDismissed(true);
    window.localStorage.setItem(DEMO_TIP_KEY, "1");
  };

  /* ---------- RENDER ---------- */

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">

      {/* REVIEWER & DEMO GUIDE */}

      {!demoTipDismissed && (
        <div className="demo-banner">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-warning text-xs font-mono">Portfolio Review Guide</span>
            </div>
            <p className="demo-banner-title mt-1">Tip for reviewers</p>
            <p className="demo-banner-body">
              Send a request here, then open GarageGo in an <strong>incognito window</strong> with a mechanic account to watch it arrive in real time.
            </p>
          </div>
          <button
            type="button"
            className="demo-banner-dismiss"
            onClick={dismissDemoTip}
          >
            Got it
          </button>
        </div>
      )}

      {/* LOCATION */}

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Your Location</h2>
            <p className="text-muted text-sm mt-1">
              Your GPS position helps us find the closest mechanic.
            </p>
          </div>

          {customerLocation?.accuracy && (
            <span className="badge badge-success text-xs">
              GPS Accuracy: ±{Math.round(customerLocation.accuracy)}m
            </span>
          )}
        </div>

        <div className="mt-5">
          {locationStatus === "detecting" && (
            <Loader compact label="Pinpointing your GPS coordinates & reverse geocoding..." />
          )}

          {locationStatus === "ready" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-sm text-[var(--text)]">
                    {customerLocation?.address || locationLabel}
                  </span>
                </div>
                <p className="text-xs font-mono text-amber-light">
                  {customerLocation?.formattedCoords || formatCoordinates(customerLocation?.lat, customerLocation?.lng)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary text-xs !py-2 !px-4"
                  onClick={detectLocation}
                >
                  🛰️ Re-detect GPS
                </button>
                <button
                  type="button"
                  className="btn-secondary text-xs !py-2 !px-4"
                  onClick={() => setLocationStatus("manual")}
                >
                  📍 Select Hub Manually
                </button>
              </div>
            </div>
          )}

          {locationStatus === "manual" && (
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="input-label">City</label>
                <select
                  value={manualCity}
                  onChange={(e) => {
                    setManualCity(e.target.value);
                    setManualHubId("");
                  }}
                  className="input"
                >
                  {CITY_OPTIONS.map((cityOption) => (
                    <option key={cityOption}>{cityOption}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Nearest landmark</label>
                <select
                  value={manualHubId}
                  onChange={(e) => setManualHubId(e.target.value)}
                  className="input"
                >
                  <option value="">Select a location</option>
                  {getHubsForCity(manualCity).map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.area} — {hub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!manualHubId}
                  onClick={applyManualLocation}
                >
                  Use this location
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={detectLocation}
                >
                  Try GPS again
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* NEARBY MAP */}

      {customerLocation && (
        <NearbyMap
          customerLocation={customerLocation}
          mechanics={nearbyMechanics}
        />
      )}

      {/* MECHANICS — hidden while a mechanic is on the way; the list
          comes back automatically if the request is rejected or closed */}

      {!customerHasAcceptedRequest && (
      <section className="card">

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold">Mechanics Near You</h3>
            <p className="text-muted text-sm mt-1">
              {customerLocation
                ? "Sorted by real distance from your location."
                : "Detect your location to sort mechanics by distance."}
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={loadMechanics}
          >
            Refresh list
          </button>
        </div>

        {error && (
          <div className="badge badge-danger mb-4">{error}</div>
        )}

        {showingExtendedList && (
          <div className="badge badge-warning mb-4">
            No mechanics within {NEARBY_RADIUS_KM} km of you — showing the
            closest available instead.
          </div>
        )}

        {nearbyMechanics.length === 0 ? (
          <div className="text-muted text-center py-6">
            No available mechanics right now. Please check again in a moment.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyMechanics.map((mechanic) => (
              <MechanicCard
                key={mechanic.id}
                mechanic={mechanic}
                onRequest={handleRequest}
                requestDisabled={
                  customerHasAcceptedRequest ||
                  Boolean(activeRequestsByMechanic[mechanic.id])
                }
                requestLabel={
                  customerHasAcceptedRequest
                    ? "Active Service In Progress"
                    : activeRequestsByMechanic[mechanic.id]
                      ? `Request ${activeRequestsByMechanic[mechanic.id]}`
                      : "Request Help"
                }
              />
            ))}
          </div>
        )}

      </section>
      )}

      {/* REQUEST HISTORY */}

      <section className="card">
        <h3 className="text-lg font-semibold mb-4">My Service Requests</h3>
        <RequestList requests={sortedRequests} />
      </section>

      {/* REQUEST MODAL */}

      {requestModalMechanic && (

        <div className="modal-backdrop" onClick={closeRequestModal}>

          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >

            <h3 className="text-xl font-semibold">
              {requestModalMechanic.garageName}
            </h3>

            <p className="text-muted text-sm">
              Mechanic: {requestModalMechanic.name}
            </p>

            <p className="text-muted text-sm mb-4">
              {requestModalMechanic.hubName ||
                `${requestModalMechanic.serviceArea}, ${requestModalMechanic.city}`}
              {requestModalMechanic.distanceKm != null
                ? ` · ${requestModalMechanic.distanceKm.toFixed(1)} km away`
                : ""}
            </p>

            <div className="badge badge-warning mb-4">
              Your request goes to this mechanic first. If they don't respond,
              we automatically try the next nearest mechanic.
            </div>

            <div className="service-option-grid">

              {SERVICE_TYPES.map((serviceType) => (

                <button
                  key={serviceType}
                  type="button"
                  onClick={() => setSelectedServiceType(serviceType)}
                  className={`service-option-card ${
                    selectedServiceType === serviceType
                      ? "service-option-card-active"
                      : ""
                  }`}
                >
                  {serviceType}
                </button>

              ))}

            </div>

            {/* VEHICLE WHEELS */}

            <div className="mt-5">
              <p className="input-label mb-2">
                How many wheels does your vehicle have?
              </p>

              <div className="wheel-grid">
                {WHEEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVehicleWheels(option.value)}
                    className={`wheel-card ${
                      vehicleWheels === option.value ? "wheel-card-active" : ""
                    }`}
                  >
                    <span className="wheel-card-icon">{option.icon}</span>
                    <span className="wheel-card-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VEHICLE PHOTOS */}

            <div className="mt-5">
              <p className="input-label mb-2">
                Photos of the vehicle (helps the mechanic judge the problem)
              </p>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <div className="photo-strip">
                {vehiclePhotos.map((photo) => (
                  <div key={photo.id} className="photo-thumb-wrap">
                    <img
                      src={photo.base64}
                      alt="Vehicle damage"
                      className="photo-thumb"
                    />
                    <button
                      type="button"
                      className="photo-remove"
                      onClick={() => removePhoto(photo.id)}
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {vehiclePhotos.length < MAX_VEHICLE_PHOTOS && (
                  <button
                    type="button"
                    className="photo-add-btn"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <span className="photo-add-icon">📷</span>
                    <span className="text-xs">
                      Add photo ({vehiclePhotos.length}/{MAX_VEHICLE_PHOTOS})
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">

              <button
                onClick={confirmRequest}
                className="btn-primary"
                disabled={creatingRequest || locationStatus !== "ready"}
              >
                {creatingRequest ? "Sending Request..." : "Confirm Request"}
              </button>

              <button
                onClick={closeRequestModal}
                className="btn-secondary"
                disabled={creatingRequest}
              >
                Cancel
              </button>

            </div>

            {creatingRequest && (
              <div className="mt-6">
                <Loader
                  compact
                  label="Request in progress"
                  detail={
                    requestProgressMessage ||
                    "This usually finishes in a few seconds."
                  }
                />
              </div>
            )}

          </div>

        </div>

      )}

    </div>
  );
};

export default CustomerDashboard;



