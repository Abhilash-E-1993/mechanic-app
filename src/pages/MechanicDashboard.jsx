import { useEffect, useState } from "react";

import Loader from "../components/Loader";
import RequestList from "../components/RequestList";

import { useAuth } from "../context/AuthContext";

import {
  expirePendingRequest,
  requestCompletionOTP,
  subscribeToMechanicRequests,
  updateRequestStatus,
  verifyCompletionOTP,
} from "../services/firestoreService";

import {
  advanceRequestToNextMechanic,
  notifyCustomerAboutAcceptedRequest,
} from "../services/notificationService";

const DEMO_TIP_KEY = "garagegoMechanicDemoTipDismissed";

const MechanicDashboard = () => {

  const { currentUser, profile, refreshProfile } = useAuth();

  const [requests, setRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingStatusMessage, setSavingStatusMessage] = useState("");

  const [error, setError] = useState("");

  const [demoTipDismissed, setDemoTipDismissed] = useState(
    () => window.localStorage.getItem(DEMO_TIP_KEY) === "1"
  );

  /* ---------- REALTIME REQUEST SUBSCRIPTION ---------- */

  useEffect(() => {

    if (!currentUser?.uid) return undefined;

    setLoading(true);

    const unsubscribe = subscribeToMechanicRequests(
      currentUser.uid,
      (requestList) => {
        const sorted = (requestList || []).sort((a, b) => {
          const priority = {
            Pending: 1,
            Accepted: 2,
            Completed: 3,
            Rejected: 4,
            Cancelled: 5,
          };
          return (priority[a.status] || 99) - (priority[b.status] || 99);
        });

        setRequests(sorted);
        setLoading(false);
      },
      () => {
        setError("Unable to load requests in real time.");
        setLoading(false);
      }
    );

    return unsubscribe;

  }, [currentUser?.uid]);

  const mechanicBusy = requests.some((req) => req.status === "Accepted");

  /* ---------- ACCEPT / REJECT ---------- */

  const handleRequestAction = async (requestId, nextStatus) => {

    if (savingStatus) return;

    try {

      if (nextStatus === "Accepted" && mechanicBusy) {
        setError("You already have an active job. Complete it first.");
        return;
      }

      setSavingStatus(true);
      setError("");
      setSavingStatusMessage("Updating the request status...");

      if (nextStatus === "Rejected") {
        setSavingStatusMessage(
          "Offering the request to the next nearest mechanic..."
        );

        const advanceResult = await advanceRequestToNextMechanic({
          currentUser,
          requestId,
        });

        // Backend offline -> advance the queue client-side so the
        // request is never left stuck on a mechanic who rejected it.
        if (advanceResult?.skipped) {
          await expirePendingRequest(requestId);
        }
      } else {
        await updateRequestStatus(requestId, nextStatus, currentUser.uid);
      }

      if (nextStatus === "Accepted") {
        setSavingStatusMessage("Notifying the customer that you are on the way...");

        // Fire-and-forget: realtime listeners keep both dashboards in sync
        // even if the notification backend is offline.
        notifyCustomerAboutAcceptedRequest({
          currentUser,
          requestId,
        }).catch(() => {});
      }

      await refreshProfile(currentUser.uid);

    } catch (err) {

      setError(err.message || "Unable to update request status.");

    } finally {

      setSavingStatus(false);
      setSavingStatusMessage("");

    }

  };

  /* ---------- OTP ---------- */

  const handleGenerateOtp = async (requestId) => {

    if (savingStatus) return;

    setSavingStatus(true);
    setError("");
    setSavingStatusMessage("Generating the completion OTP...");

    try {
      await requestCompletionOTP(requestId, currentUser.uid);
    } catch (err) {
      setError(err.message || "Unable to generate completion OTP.");
    } finally {
      setSavingStatus(false);
      setSavingStatusMessage("");
    }

  };

  const handleVerifyOtp = async (requestId, otp) => {

    if (savingStatus) return;

    setSavingStatus(true);
    setError("");
    setSavingStatusMessage("Verifying OTP and closing the request...");

    try {

      await verifyCompletionOTP(requestId, currentUser.uid, otp);

      await refreshProfile(currentUser.uid);

    } catch (err) {

      setError(err.message || "Invalid OTP. Please ask the customer again.");
      throw err;

    } finally {

      setSavingStatus(false);
      setSavingStatusMessage("");

    }

  };

  /* ---------- RENDER ---------- */

  if (loading) {
    return (
      <div className="flex justify-center pt-20">
        <Loader label="Loading mechanic dashboard..." />
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
            <p className="demo-banner-title mt-1">Technician Dispatch Console</p>
            <p className="demo-banner-body">
              This technician console listens for real-time customer distress calls. When a customer sends a request, it appears here instantly without refreshing. Accept the request to view the customer’s exact pinpoint location, GPS turn-by-turn route, and verify their OTP upon service completion.
            </p>
          </div>
          <button
            type="button"
            className="demo-banner-dismiss"
            onClick={() => {
              setDemoTipDismissed(true);
              window.localStorage.setItem(DEMO_TIP_KEY, "1");
            }}
          >
            Got it
          </button>
        </div>
      )}

      {/* DASHBOARD HEADER */}

      <section className="card">

        <h2 className="text-xl font-semibold">
          Mechanic Operations Console
        </h2>

        <p className="text-muted text-sm mt-1">
          Incoming customer distress calls and active jobs update here in real time.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">

          <span className="text-sm text-muted">
            Technician Status:
          </span>

          <span
            className={
              profile?.availabilityStatus === "busy"
                ? "badge badge-warning"
                : "badge badge-success"
            }
          >
            {profile?.availabilityStatus || "available"}
          </span>

          {profile?.hubName && (
            <span className="badge">
              {profile.hubName}
              {profile.serviceArea ? ` · ${profile.serviceArea}` : ""}
            </span>
          )}

        </div>

      </section>

      {/* STATUS UPDATE MESSAGE */}

      {savingStatus && (
        <Loader
          compact
          label="Working on it"
          detail={savingStatusMessage || "Updating request status..."}
        />
      )}

      {error && (
        <div className="badge badge-danger">
          {error}
        </div>
      )}

      {/* REQUESTS */}

      <section className="card">

        <h3 className="text-lg font-semibold mb-4">
          Incoming Service Requests
        </h3>

        {requests.length === 0 ? (
          <div className="text-muted text-center py-6">
            No service requests yet. When a customer nearby requests help, it
            shows up here in real time.
          </div>
        ) : (
          <RequestList
            requests={requests}
            forMechanic
            acceptanceBlocked={mechanicBusy}
            onAction={handleRequestAction}
            onGenerateOtp={handleGenerateOtp}
            onVerifyOtp={handleVerifyOtp}
          />
        )}

      </section>

    </div>

  );

};

export default MechanicDashboard;

