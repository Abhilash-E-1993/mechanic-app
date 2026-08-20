import { useCallback, useEffect, useMemo, useState } from "react";

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

import { getCurrentLocation } from "../utils/locationService";
import {
  createMechanicRoutingQueue,
  rankMechanicsByDistance,
} from "../utils/mechanicRoutingService";

const NEARBY_RADIUS_KM = 15;
const DEMO_TIP_KEY = "garagegoCustomerDemoTipDismissed";

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

    const nearestHub = findNearestHub(location);

    setCustomerLocation(location);
    setLocationLabel(
      nearestHub
        ? `Near ${nearestHub.area}, ${nearestHub.city}`
        : "Live GPS location"
    );
    setLocationStatus("ready");
  }, []);

  const applyManualLocation = () => {
    const hub = getHubsForCity(manualCity).find((h) => h.id === manualHubId);
    if (!hub) return;

    setCustomerLocation({
      lat: hub.lat,
      lng: hub.lng,
      accuracy: null,
      isFallback: false,
    });
    setLocationLabel(`${hub.area}, ${manualCity}`);
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
    setRequestModalMechanic(mechanic);
  };

  const closeRequestModal = () => {
    if (creatingRequest) return;
    setRequestModalMechanic(null);
  };

  const confirmRequest = async () => {
    if (!requestModalMechanic || creatingRequest) return;

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
        area: locationLabel || "Customer location",

        serviceType: selectedServiceType,
        customerLocation,

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
    <div className="space-y-8">

      {/* DEMO TIP */}

      {!demoTipDismissed && (
        <div className="demo-banner">
          <div>
            <p className="demo-banner-title">Demo tip</p>
            <p className="demo-banner-body">
              GarageGo is role-based. After sending a request, open GarageGo in
              an incognito window (or another browser), log in as a mechanic,
              and accept it there to see the full flow.
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
        <h2 className="text-xl font-semibold">Your Location</h2>
        <p className="text-muted text-sm mt-1">
          We use your live GPS location to show the nearest available mechanics.
        </p>

        <div className="mt-5">
          {locationStatus === "detecting" && (
            <Loader compact label="Detecting your location..." />
          )}

          {locationStatus === "ready" && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="badge badge-success">Location detected</span>
              <span className="text-sm text-muted">{locationLabel}</span>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={detectLocation}
              >
                Re-detect
              </button>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => setLocationStatus("manual")}
              >
                Choose manually
              </button>
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

      {/* MECHANICS */}

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



