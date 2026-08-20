import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  subscribeToCustomerRequests,
  subscribeToMechanicRequests,
} from "../services/firestoreService";
import { showBrowserNotification } from "../fcm";

const TOAST_TIMEOUT_MS = 6000;

/* Short double-beep for new mechanic requests (no audio asset needed). */
const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();

    [880, 660].forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.06;
      const startAt = ctx.currentTime + index * 0.18;
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.15);
    });

    window.setTimeout(() => ctx.close(), 900);
  } catch {
    // Audio is best-effort only.
  }
};

const makeToast = (title, body, tone = "info") => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title,
  body,
  tone,
});

/*
  Realtime in-app notification center.
  Works purely off Firestore listeners — no backend required — so request
  alerts are always delivered to both roles even when FCM is offline.
*/
const NotificationCenter = () => {
  const { currentUser, profile } = useAuth();
  const [toasts, setToasts] = useState([]);

  const seenPendingIdsRef = useRef(null);
  const customerSnapshotRef = useRef(null);

  const pushToast = (toast, { notify = false } = {}) => {
    setToasts((prev) => [...prev.slice(-3), toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, TOAST_TIMEOUT_MS);

    if (notify) {
      showBrowserNotification({
        title: toast.title,
        body: toast.body,
        url: "/",
      }).catch(() => {});
    }
  };

  /* ---------- MECHANIC: new pending request alerts ---------- */

  useEffect(() => {
    if (!currentUser?.uid || profile?.role !== "mechanic") return undefined;

    seenPendingIdsRef.current = null;

    const unsubscribe = subscribeToMechanicRequests(
      currentUser.uid,
      (list) => {
        const pendingIds = new Set(
          (list || [])
            .filter((request) => request.status === "Pending")
            .map((request) => request.id)
        );

        // First snapshot: record state only, no toasts for historic data.
        if (seenPendingIdsRef.current === null) {
          seenPendingIdsRef.current = pendingIds;
          return;
        }

        (list || []).forEach((request) => {
          if (
            request.status === "Pending" &&
            !seenPendingIdsRef.current.has(request.id)
          ) {
            playBeep();
            pushToast(
              makeToast(
                "New breakdown request",
                `${request.customerName || "A customer"} needs help for ${request.serviceType}.`,
                "warning"
              ),
              { notify: true }
            );
          }
        });

        seenPendingIdsRef.current = pendingIds;
      },
      () => {}
    );

    return unsubscribe;
  }, [currentUser?.uid, profile?.role]);

  /* ---------- CUSTOMER: status transition alerts ---------- */

  useEffect(() => {
    if (!currentUser?.uid || profile?.role !== "customer") return undefined;

    customerSnapshotRef.current = null;

    const unsubscribe = subscribeToCustomerRequests(
      currentUser.uid,
      (list) => {
        const nextSnapshot = new Map(
          (list || []).map((request) => [
            request.id,
            `${request.status}:${request.mechanicId}`,
          ])
        );

        const previousSnapshot = customerSnapshotRef.current;

        // First snapshot: record state only, no toasts for historic data.
        if (previousSnapshot === null) {
          customerSnapshotRef.current = nextSnapshot;
          return;
        }

        (list || []).forEach((request) => {
          const previousValue = previousSnapshot.get(request.id);
          if (!previousValue) return;

          const [previousStatus, previousMechanicId] =
            previousValue.split(":");

          if (previousStatus !== "Accepted" && request.status === "Accepted") {
            pushToast(
              makeToast(
                "Mechanic accepted your request",
                `${request.mechanicName || "Your mechanic"} from ${
                  request.garageName || "the garage"
                } is on the way.`,
                "success"
              ),
              { notify: true }
            );
            return;
          }

          if (
            previousStatus === "Pending" &&
            request.status === "Pending" &&
            previousMechanicId !== request.mechanicId
          ) {
            pushToast(
              makeToast(
                "Request reassigned",
                `Your request moved to the next nearest mechanic: ${
                  request.mechanicName || "another mechanic"
                }.`,
                "info"
              ),
              { notify: true }
            );
            return;
          }

          if (
            previousStatus !== "Completed" &&
            request.status === "Completed"
          ) {
            pushToast(
              makeToast(
                "Service completed",
                "Your breakdown request was marked complete.",
                "success"
              ),
              { notify: true }
            );
            return;
          }

          if (previousStatus === "Pending" && request.status === "Rejected") {
            pushToast(
              makeToast(
                "No mechanic available",
                "All nearby mechanics are busy right now. Please try again.",
                "danger"
              ),
              { notify: true }
            );
          }
        });

        customerSnapshotRef.current = nextSnapshot;
      },
      () => {}
    );

    return unsubscribe;
  }, [currentUser?.uid, profile?.role]);

  /* ---------- RENDER ---------- */

  if (!toasts.length) {
    return null;
  }

  return (
    <div
      className="notification-toast-stack"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`notification-toast toast-${toast.tone}`}
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="notification-toast-title">{toast.title}</p>
              <p className="notification-toast-body">{toast.body}</p>
            </div>

            <button
              onClick={() =>
                setToasts((prev) =>
                  prev.filter((item) => item.id !== toast.id)
                )
              }
              className="text-xs opacity-70 hover:opacity-100"
            >
              X
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;

