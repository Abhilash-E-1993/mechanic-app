import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export const createOrUpdateUserProfile = async (uid, profileData) => {
  const ref = doc(db, 'users', uid);
  const current = await getDoc(ref);

  if (current.exists()) {
    await updateDoc(ref, { ...profileData, updatedAt: serverTimestamp() });
    return;
  }

  await setDoc(ref, {
    ...profileData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (uid) => {
  const profileRef = doc(db, 'users', uid);
  const snap = await getDoc(profileRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAvailableMechanicsByArea = async (area) => {
  const usersRef = collection(db, 'users');
  const mechanicsQuery = query(
    usersRef,
    where('role', '==', 'mechanic'),
    where('serviceArea', '==', area),
    where('availabilityStatus', '==', 'available'),
  );

  const snap = await getDocs(mechanicsQuery);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const createServiceRequest = async (payload) => {
  const requestRef = collection(db, 'serviceRequests');
  const docRef = await addDoc(requestRef, {
    ...payload,
    status: 'Pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getRequestsForCustomer = async (customerId) => {
  const requestRef = collection(db, 'serviceRequests');
  const requestQuery = query(requestRef, where('customerId', '==', customerId));
  const snap = await getDocs(requestQuery);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const getRequestsForMechanic = async (mechanicId) => {
  const requestRef = collection(db, 'serviceRequests');
  const requestQuery = query(requestRef, where('mechanicId', '==', mechanicId));
  const snap = await getDocs(requestQuery);
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const updateRequestStatus = async (requestId, status) => {
  const requestDoc = doc(db, 'serviceRequests', requestId);
  await updateDoc(requestDoc, {
    status,
    updatedAt: serverTimestamp(),
  });
};
