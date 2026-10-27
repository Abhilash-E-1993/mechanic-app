import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

const getMessagesRef = (requestId) =>
  collection(db, "serviceRequests", requestId, "messages");

/** Realtime listener for the chat thread of one service request. */
export const subscribeToMessages = (requestId, onUpdate, onError) => {
  const messagesQuery = query(
    getMessagesRef(requestId),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) =>
      onUpdate(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    onError
  );
};

export const sendTextMessage = async (requestId, senderId, text) =>
  addDoc(getMessagesRef(requestId), {
    senderId,
    type: "text",
    text: `${text}`.trim(),
    createdAt: serverTimestamp(),
  });

/** audioData is a base64 data URL (small low-bitrate recording). */
export const sendVoiceMessage = async (
  requestId,
  senderId,
  audioData,
  durationSec
) =>
  addDoc(getMessagesRef(requestId), {
    senderId,
    type: "audio",
    audioData,
    durationSec: Math.max(1, Math.round(durationSec || 0)),
    createdAt: serverTimestamp(),
  });
