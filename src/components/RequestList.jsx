import { useEffect, useState } from "react";
import LocationMap from "./LocationMap";
import { estimateEtaMinutesFromLocation } from "../utils/etaService";

const statusStyles = {
  Pending: "badge badge-warning",
  Accepted: "badge badge-success",
  Rejected: "badge badge-danger",
  Completed: "badge",
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

  useEffect(() => {
    const start = toMillis(
      request.routingLastAdvancedAt || request.updatedAt || request.createdAt
    );

    const tick = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - start) / 1000))
      );

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [request.id, request.routingLastAdvancedAt, request.updatedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = `${elapsedSeconds % 60}`.padStart(2, "0");

  return (
    <div className="waiting-banner" role="status">
      <span className="waiting-pulse" aria-hidden="true" />
      <div>
        <p className="waiting-banner-title">
          Waiting for {request.mechanicName || "the mechanic"} to respond...
        </p>
        <p className="waiting-banner-subtitle">
          {minutes}:{seconds} elapsed. If they don't respond, the request
          automatically moves to the next nearest mechanic.
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

                <p className="font-semibold">
                  {request.serviceType}
                </p>

                <p className="text-muted text-sm">
                  {request.area}
                  {request.city ? `, ${request.city}` : ""}
                </p>

                <p className="text-muted text-sm mt-1">
                  {forMechanic
                    ? `Customer: ${request.customerName}`
                    : `Mechanic: ${request.mechanicName}`}
                </p>

              </div>

              <span className={statusStyles[request.status]}>
                {request.status}
              </span>

            </div>

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

    </div>

  );

};

export default RequestList;
