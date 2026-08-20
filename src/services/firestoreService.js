import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const generateCompletionOTP = () =>
  `${Math.floor(1000 + Math.random() * 9000)}`;

const getRequestDocumentOrThrow = async (requestId) => {
  const requestDoc = doc(db, "serviceRequests", requestId);
  const requestSnap = await getDoc(requestDoc);

  if (!requestSnap.exists()) {
    throw new Error("Request not found.");
  }

  return {
    requestDoc,
    requestData: requestSnap.data(),
  };
};

const updateMechanicAvailability = async (
  mechanicId,
  availabilityStatus
) => {
  if (!mechanicId) return;

  await updateDoc(doc(db, "users", mechanicId), {
    availabilityStatus,
    updatedAt: serverTimestamp(),
  });
};

const ensureMechanicCanAcceptRequest = async (
  requestId,
  mechanicId
) => {
  const acceptedQuery = query(
    collection(db, "serviceRequests"),
    where("mechanicId", "==", mechanicId),
    where("status", "==", "Accepted")
  );

  const acceptedSnapshot = await getDocs(acceptedQuery);
  const hasAnotherAcceptedRequest = acceptedSnapshot.docs.some(
    (item) => item.id !== requestId
  );

  if (hasAnotherAcceptedRequest) {
    throw new Error("You already have an active job. Complete it first.");
  }

  const mechanicProfile = await getDoc(doc(db, "users", mechanicId));

  if (
    mechanicProfile.exists() &&
    mechanicProfile.data()?.availabilityStatus === "busy"
  ) {
    throw new Error("You are currently busy with another accepted request.");
  }
};

export const createOrUpdateUserProfile = async (
  uid,
  profileData
) => {
  const ref = doc(db, "users", uid);
  const current = await getDoc(ref);

  if (current.exists()) {
    await updateDoc(ref, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(ref, {
    ...profileData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const saveUserFcmToken = async (uid, fcmToken) => {
  if (!uid || !fcmToken) {
    return;
  }

  await setDoc(
    doc(db, "users", uid),
    {
      fcmTokens: arrayUnion(fcmToken),
      fcmToken,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const getUserProfile = async (uid) => {
  const profileRef = doc(db, "users", uid);
  const snap = await getDoc(profileRef);

  return snap.exists()
    ? { id: snap.id, ...snap.data() }
    : null;
};

export const getAvailableMechanics = async () => {
  const usersRef = collection(db, "users");

  const mechanicsQuery = query(
    usersRef,
    where("role", "==", "mechanic"),
    where("availabilityStatus", "==", "available")
  );

  const snap = await getDocs(mechanicsQuery);

  return snap.docs.map((item) => {
    const mechanic = {
      id: item.id,
      ...item.data(),
    };

    const mechanicBaseLocation = mechanic.mechanicBaseLocation || null;

    return {
      ...mechanic,
      mechanicBaseLocation,
      latitude: mechanic.latitude ?? mechanicBaseLocation?.lat ?? null,
      longitude: mechanic.longitude ?? mechanicBaseLocation?.lng ?? null,
    };
  });
};

export const createServiceRequest = async (payload) => {
  const requestRef = collection(db, "serviceRequests");

  const docRef = await addDoc(requestRef, {
    ...payload,
    status: "Pending",
    completionOTP: null,
    otpGeneratedAt: null,
    mechanicLocation: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getRequestsForCustomer = async (customerId) => {
  const requestRef = collection(db, "serviceRequests");

  const requestQuery = query(
    requestRef,
    where("customerId", "==", customerId)
  );

  const snap = await getDocs(requestQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const subscribeToCustomerRequests = (
  customerId,
  onUpdate,
  onError
) => {
  const requestRef = collection(db, "serviceRequests");

  const requestQuery = query(
    requestRef,
    where("customerId", "==", customerId)
  );

  return onSnapshot(
    requestQuery,
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    onError
  );
};

export const getRequestsForMechanic = async (mechanicId) => {
  const requestRef = collection(db, "serviceRequests");

  const requestQuery = query(
    requestRef,
    where("mechanicId", "==", mechanicId)
  );

  const snap = await getDocs(requestQuery);

  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const subscribeToMechanicRequests = (
  mechanicId,
  onUpdate,
  onError
) => {
  const requestRef = collection(db, "serviceRequests");

  const requestQuery = query(
    requestRef,
    where("mechanicId", "==", mechanicId)
  );

  return onSnapshot(
    requestQuery,
    (snapshot) => {
      onUpdate(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );
    },
    onError
  );
};

export const hasActiveRequestBetweenUsers = async (
  customerId,
  mechanicId
) => {
  if (!customerId || !mechanicId) {
    return false;
  }

  const requestRef = collection(db, "serviceRequests");

  const requestQuery = query(
    requestRef,
    where("customerId", "==", customerId),
    where("mechanicId", "==", mechanicId),
    where("status", "in", ["Pending", "Accepted"])
  );

  const snap = await getDocs(requestQuery);
  return !snap.empty;
};

export const hasCustomerAcceptedRequest = async (customerId) => {
  if (!customerId) {
    return false;
  }

  const requestQuery = query(
    collection(db, "serviceRequests"),
    where("customerId", "==", customerId),
    where("status", "==", "Accepted")
  );

  const snap = await getDocs(requestQuery);
  return !snap.empty;
};

export const updateRequestStatus = async (requestId, status, actorId) => {
  const { requestDoc, requestData } = await getRequestDocumentOrThrow(requestId);

  if (actorId && requestData.mechanicId !== actorId) {
    throw new Error("Only the assigned mechanic can update this request.");
  }

  let updatePayload = {
    status,
    updatedAt: serverTimestamp(),
  };

  // When mechanic ACCEPTS request → attach the mechanic's fixed garage location
  if (status === "Accepted") {
    await ensureMechanicCanAcceptRequest(
      requestId,
      requestData.mechanicId
    );

    let mechanicLocation = requestData.assignedMechanicLocation || null;

    if (!mechanicLocation) {
      const mechanicSnap = await getDoc(
        doc(db, "users", requestData.mechanicId)
      );
      mechanicLocation = mechanicSnap.data()?.mechanicBaseLocation || null;
    }

    updatePayload.mechanicLocation = mechanicLocation;

    updatePayload.completionOTP = null;
    updatePayload.otpGeneratedAt = null;
  }

  if (status === "Rejected") {
    updatePayload.completionOTP = null;
    updatePayload.otpGeneratedAt = null;
  }

  await updateDoc(requestDoc, updatePayload);

  if (status === "Accepted") {
    await updateMechanicAvailability(requestData.mechanicId, "busy");
  }

  if (status === "Rejected") {
    await updateMechanicAvailability(requestData.mechanicId, "available");
  }
};

export const requestCompletionOTP = async (
  requestId,
  actorId
) => {
  const { requestDoc, requestData } =
    await getRequestDocumentOrThrow(requestId);

  if (requestData.mechanicId !== actorId) {
    throw new Error(
      "Only the assigned mechanic can generate the OTP."
    );
  }

  if (requestData.status !== "Accepted") {
    throw new Error(
      "OTP can only be generated for accepted requests."
    );
  }

  const completionOTP = generateCompletionOTP();

  await updateDoc(requestDoc, {
    completionOTP,
    otpGeneratedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const verifyCompletionOTP = async (
  requestId,
  actorId,
  enteredOTP
) => {
  const { requestDoc, requestData } =
    await getRequestDocumentOrThrow(requestId);

  if (requestData.mechanicId !== actorId) {
    throw new Error(
      "Only the assigned mechanic can verify the OTP."
    );
  }

  if (
    !requestData.completionOTP ||
    `${enteredOTP}` !== `${requestData.completionOTP}`
  ) {
    throw new Error(
      "Invalid OTP. Please ask the customer again."
    );
  }

  await updateDoc(requestDoc, {
    status: "Completed",
    completionOTP: null,
    otpGeneratedAt: null,
    updatedAt: serverTimestamp(),
  });

  await updateMechanicAvailability(
    requestData.mechanicId,
    "available"
  );
};

export const expirePendingRequest = async (requestId) => {
  if (!requestId) return;

  try {
    const requestDoc = doc(db, "serviceRequests", requestId);
    const snap = await getDoc(requestDoc);
    if (!snap.exists()) return;

    const data = snap.data();
    if (data.status !== "Pending") return;

    const queue = data.mechanicRoutingQueue || [];
    const currentIndex = data.mechanicRoutingIndex ?? 0;
    const nextIndex = currentIndex + 1;

    if (queue.length > 0 && nextIndex < queue.length) {
      const nextMechanic = queue[nextIndex];
      await updateDoc(requestDoc, {
        mechanicId: nextMechanic.id,
        mechanicName: nextMechanic.name,
        garageName: nextMechanic.garageName || null,
        mechanicPhoneNumber: nextMechanic.phoneNumber || null,
        mechanicCity: nextMechanic.city || null,
        mechanicServiceArea: nextMechanic.serviceArea || null,
        assignedMechanicLocation: nextMechanic.mechanicBaseLocation || null,
        currentMechanicEtaMinutes: nextMechanic.estimatedEtaMinutes ?? null,
        currentMechanicDistanceKm:
          nextMechanic.distanceKm != null
            ? Number(nextMechanic.distanceKm.toFixed(2))
            : null,
        mechanicRoutingIndex: nextIndex,
        routingLastAdvancedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // No more mechanics available in this area -> mark as Rejected
      await updateDoc(requestDoc, {
        status: "Rejected",
        rejectionReason: "No mechanic available in your area within 1 minute.",
        completionOTP: null,
        otpGeneratedAt: null,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.error("Failed to expire/advance request", err);
  }
};

