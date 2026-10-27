import { useEffect, useRef, useState } from "react";
import LocationMap from "./LocationMap";
import ChatBox from "./ChatBox";
import { estimateEtaMinutesFromLocation } from "../utils/etaService";
import { expirePendingRequest } from "../services/firestoreService";

const statusStyles = {
  Pending: "badge badge-warning",
  Accepted: "badge badge-success",
  Rejected: "badge badge-danger",
  Completed: "badge",
};

const WHEEL_LABELS = {
  2: "🏍️ 2-Wheeler",
  3: "🛺 3-Wheeler",
  4: "🚗 4-Wheeler",
  "6+": "🚚 Heavy Vehicle",
};

/* ---------- WAITING BANNER (CUSTOMER, PENDING) ---------- */

const toMillis = (value) => {
  if (!value) return Date.now();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
};

const WaitingBanner = ({ request }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    const start = toMillis(
      request.routingLastAdvancedAt || request.updatedAt || request.createdAt
    );

    const tick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsedSeconds(elapsed);

      // Auto-expire or advance after 60 seconds
      if (elapsed >= 60 && !expiredRef.current) {
        expiredRef.current = true;
        expirePendingRequest(request.id);
      }
    };

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [request.id, request.routingLastAdvancedAt, request.updatedAt, request.createdAt]);

  const remainingSeconds = Math.max(0, 60 - elapsedSeconds);
  const remainingFormatted = `0:${remainingSeconds.toString().padStart(2, "0")}`;

  return (
    <div className="waiting-banner" role="status">
      <span className="waiting-pulse" aria-hidden="true" />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="waiting-banner-title">
            Waiting for {request.mechanicName || "the mechanic"} to respond...
          </p>
          <span className="badge badge-warning text-xs font-mono">
            {remainingFormatted}
          </span>
        </div>
        <p className="waiting-banner-subtitle">
          If no mechanic in your area accepts within 1 minute, the request will automatically close.
        </p>
      </div>
    </div>
  );
};

const RequestList = ({
  requests,
  forMechanic = false,
  acceptanceBlocked = false,
  onAction,
  onGenerateOtp,
  onVerifyOtp,
}) => {

  const [otpInputs, setOtpInputs] = useState({});
  const [otpErrors, setOtpErrors] = useState({});
  const [copiedOtp, setCopiedOtp] = useState(null);
  const [openChats, setOpenChats] = useState({});
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  const toggleChat = (requestId) =>
    setOpenChats((prev) => ({ ...prev, [requestId]: !prev[requestId] }));

  const getMapMechanicLocation = (request) =>
    request.mechanicLocation || request.assignedMechanicLocation || null;

  const shouldShowMechanicMap = (request) =>
    forMechanic &&
    ["Pending", "Accepted"].includes(request.status) &&
    request.customerLocation;

  const shouldShowCustomerTracking = (request) =>
    !forMechanic &&
    ["Pending", "Accepted"].includes(request.status) &&
    request.customerLocation &&
    getMapMechanicLocation(request);

  /* ---------- COPY OTP ---------- */

  const copyOtp = async (otp) => {

    try {

      await navigator.clipboard.writeText(otp);

      setCopiedOtp(otp);

      setTimeout(() => setCopiedOtp(null), 2000);

    } catch (err) {

      console.error("Failed to copy OTP", err);

    }

  };

  /* ---------- NAVIGATION ---------- */

  const openNavigation = (customerLocation, mechanicLocation) => {

    if (!customerLocation?.lat || !customerLocation?.lng) return;

    const destination = `${customerLocation.lat},${customerLocation.lng}`;

    let url;

    if (mechanicLocation?.lat && mechanicLocation?.lng) {

      const origin = `${mechanicLocation.lat},${mechanicLocation.lng}`;

      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    } else {

      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    }

    window.open(url, "_blank");

  };

  /* ---------- CALL MECHANIC ---------- */

  const callMechanic = (phoneNumber) => {

    if (!phoneNumber) return;

    window.location.href = `tel:+91${phoneNumber}`;

  };

  /* ---------- OTP INPUT ---------- */

  const updateOtpValue = (requestId, value) => {

    setOtpInputs((prev) => ({
      ...prev,
      [requestId]: value.replace(/\D/g, "").slice(0, 4),
    }));

    setOtpErrors((prev) => ({
      ...prev,
      [requestId]: "",
    }));

  };

  const handleVerifyOtp = async (requestId) => {

    const otpValue = otpInputs[requestId] || "";

    if (otpValue.length !== 4) {

      setOtpErrors((prev) => ({
        ...prev,
        [requestId]: "Enter the 4 digit OTP",
      }));

      return;

    }

    try {

      await onVerifyOtp(requestId, otpValue);

      setOtpInputs((prev) => ({
        ...prev,
        [requestId]: "",
      }));

    } catch (error) {

      setOtpErrors((prev) => ({
        ...prev,
        [requestId]:
          error.message || "Invalid OTP. Ask the customer again.",
      }));

    }

  };

  if (!requests.length) {

    return (
      <div className="card text-center text-muted">
        No requests found.
      </div>
    );

  }

  return (

    <div className="space-y-4">

      {requests.map((request) => {

        const mapMechanicLocation = getMapMechanicLocation(request);

        const etaMinutes = ["Pending", "Accepted"].includes(request.status)
          ? request.currentMechanicEtaMinutes ??
            (mapMechanicLocation
              ? estimateEtaMinutesFromLocation(
                  request.customerLocation,
                  mapMechanicLocation
                )
              : null)
          : null;

        return (

          <div key={request.id} className="card space-y-4">

            {/* HEADER */}

            <div className="flex justify-between items-start">

              <div>

                <p className="font-semibold text-base flex flex-wrap items-center gap-2">
                  <span>{request.serviceType}</span>
                  {request.vehicleWheels && (
                    <span className="badge text-[11px] !py-0.5 !px-2">
                      {WHEEL_LABELS[request.vehicleWheels] ||
                        `🛞 ${request.vehicleWheels} wheels`}
                    </span>
                  )}
                </p>

                <p className="text-sm text-[var(--text)] mt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-amber">📍</span>
                  <span>{request.customerLocation?.address || request.area}</span>
                  {request.customerLocation?.lat && request.customerLocation?.lng && (
                    <span className="badge text-[11px] font-mono !py-0.5 !px-2">
                      {request.customerLocation.lat.toFixed(4)}° N, {request.customerLocation.lng.toFixed(4)}° E
                    </span>
                  )}
                </p>

                <p className="text-muted text-xs mt-1">
                  {forMechanic
                    ? `Customer: ${request.customerName}`
                    : `Mechanic: ${request.mechanicName} (${request.garageName || 'Garage'})`}
                </p>

              </div>

              <span className={statusStyles[request.status]}>
                {request.status}
              </span>

            </div>

            {/* VEHICLE PHOTOS */}

            {Array.isArray(request.vehiclePhotos) &&
              request.vehiclePhotos.length > 0 && (
                <div>
                  <p className="text-muted text-xs mb-1.5">
                    📷 Vehicle photos from customer — tap to enlarge
                  </p>
                  <div className="photo-strip">
                    {request.vehiclePhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Vehicle condition ${index + 1}`}
                        className="photo-thumb"
                        loading="lazy"
                        onClick={() => setEnlargedPhoto(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}

            {/* CUSTOMER VIEW */}

            {!forMechanic &&
              request.status === "Accepted" && (

                <div className="tracking-request-summary">

                  <div>
                    <span className="tracking-request-label">Garage</span>
                    <p className="tracking-request-value">
                      {request.garageName || "Not shared"}
                    </p>
                  </div>

                  <div>
                    <span className="tracking-request-label">Phone</span>
                    <p className="tracking-request-value">
                      {request.mechanicPhoneNumber
                        ? `+91 ${request.mechanicPhoneNumber}`
                        : "Not shared"}
                    </p>
                  </div>

                  <div>
                    <span className="tracking-request-label">Starting ETA</span>
                    <p className="tracking-request-value">
                      {etaMinutes ? `~ ${etaMinutes} minutes` : "Calculating"}
                    </p>
                  </div>

                </div>

              )}

            {/* WAITING BANNER (CUSTOMER, PENDING) */}

            {!forMechanic && request.status === "Pending" && (
              <WaitingBanner request={request} />
            )}

            {/* CUSTOMER REJECTED / TIMEOUT BANNER */}

            {!forMechanic && request.status === "Rejected" && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-sm text-red-300 space-y-1">
                <p className="font-semibold text-red-200">❌ No Mechanic Found</p>
                <p className="text-xs text-red-300/90">
                  {request.rejectionReason || "No mechanics in your area responded within 1 minute. Please retry or choose another hub location."}
                </p>
              </div>
            )}

            {/* CALL BUTTON */}

            {!forMechanic &&
              request.status === "Accepted" &&
              request.mechanicPhoneNumber && (

                <button
                  onClick={() =>
                    callMechanic(request.mechanicPhoneNumber)
                  }
                  className="btn-primary"
                >
                  Call Mechanic
                </button>

              )}

            {shouldShowCustomerTracking(request) && (
              <LocationMap
                customerLocation={request.customerLocation}
                mechanicLocation={getMapMechanicLocation(request)}
                requestStatus={request.status}
                completionOTP={request.completionOTP}
                heading={
                  request.status === "Pending"
                    ? "Assigned Mechanic Location"
                    : "Mechanic Route Overview"
                }
              />
            )}

            {/* MECHANIC ACTIONS */}

            {forMechanic &&
              request.status === "Pending" && (

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      onAction?.(request.id, "Accepted")
                    }
                    className="btn-primary"
                    type="button"
                    disabled={acceptanceBlocked}
                  >
                    {acceptanceBlocked
                      ? "Complete Current Job First"
                      : "Accept Request"}
                  </button>

                  <button
                    onClick={() =>
                      onAction?.(request.id, "Rejected")
                    }
                    className="btn-secondary"
                    type="button"
                  >
                    Reject Request
                  </button>

                </div>

              )}

            {/* OTP DISPLAY WITH COPY */}

            {!forMechanic &&
              request.status === "Accepted" &&
              request.completionOTP && (

                <div className="card bg-[var(--surface-2)]">

                  <p className="font-semibold text-sm">
                    Service Completion OTP
                  </p>

                  <p className="text-muted text-sm mt-1">
                    Share this OTP with the mechanic
                  </p>

                  <div className="flex items-center gap-3 mt-3">

                    <p className="text-amber text-xl font-semibold">
                      {request.completionOTP}
                    </p>

                    <button
                      onClick={() =>
                        copyOtp(request.completionOTP)
                      }
                      className="btn-secondary text-sm"
                    >
                      {copiedOtp === request.completionOTP
                        ? "Copied!"
                        : "Copy OTP"}
                    </button>

                  </div>

                </div>

              )}

            {/* MECHANIC VERIFY OTP */}

            {forMechanic &&
              request.status === "Accepted" && (

                <div className="space-y-3">

                  {!request.completionOTP ? (

                    <button
                      onClick={() =>
                        onGenerateOtp(request.id)
                      }
                      className="btn-primary"
                    >
                      Complete Request
                    </button>

                  ) : (

                    <div className="space-y-3">

                      <p className="text-sm text-muted">
                        Ask customer for OTP
                      </p>

                      <input
                        className="input"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter OTP"
                        value={otpInputs[request.id] || ""}
                        onChange={(e) =>
                          updateOtpValue(
                            request.id,
                            e.target.value
                          )
                        }
                      />

                      {otpErrors[request.id] && (
                        <div className="badge badge-danger">
                          {otpErrors[request.id]}
                        </div>
                      )}

                      <button
                        onClick={() =>
                          handleVerifyOtp(request.id)
                        }
                        className="btn-primary"
                      >
                        Verify OTP & Complete
                      </button>

                    </div>

                  )}

                </div>

              )}

            {forMechanic &&
              request.status === "Rejected" && (

                <div className="text-sm text-muted">
                  This request was rejected. It will remain in history for reference.
                </div>

              )}

            {forMechanic &&
              request.status === "Completed" && (

                <div className="text-sm text-muted">
                  This job is complete. You can review the request details any time.
                </div>

              )}

            {/* CHAT — AVAILABLE ONCE ACCEPTED (BOTH SIDES) */}

            {request.status === "Accepted" && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => toggleChat(request.id)}
                  className="btn-primary w-full"
                >
                  {openChats[request.id]
                    ? "Close Chat"
                    : `🎙️ Chat with ${
                        forMechanic
                          ? request.customerName || "Customer"
                          : request.mechanicName || "Mechanic"
                      } (Voice & Text)`}
                </button>

                {openChats[request.id] && <ChatBox requestId={request.id} />}
              </div>
            )}

            {/* CUSTOMER LOCATION MAP (MECHANIC VIEW) */}

            {shouldShowMechanicMap(request) && (

              <div className="space-y-3">

                <LocationMap
                  customerLocation={request.customerLocation}
                  mechanicLocation={getMapMechanicLocation(request)}
                  requestStatus={request.status}
                  completionOTP={request.completionOTP}
                  heading="Customer Location"
                />

                {request.status === "Accepted" && (

                  <button
                    onClick={() =>
                      openNavigation(
                        request.customerLocation,
                        getMapMechanicLocation(request)
                      )
                    }
                    className="btn-secondary"
                  >
                    Navigate to Customer
                  </button>

                )}

              </div>

            )}

          </div>

        );

      })}

      {/* PHOTO LIGHTBOX */}

      {enlargedPhoto && (
        <div
          className="modal-backdrop"
          onClick={() => setEnlargedPhoto(null)}
        >
          <img
            src={enlargedPhoto}
            alt="Vehicle condition enlarged"
            className="photo-lightbox-img"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

    </div>

  );

};

export default RequestList;
