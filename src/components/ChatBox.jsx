import { useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import {
  sendTextMessage,
  sendVoiceMessage,
  subscribeToMessages,
} from "../services/chatService";
import { blobToBase64 } from "../services/mediaService";

const MAX_RECORD_SECONDS = 60;

const formatDuration = (seconds) => {
  const safe = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(safe / 60)}:${`${safe % 60}`.padStart(2, "0")}`;
};

const formatTime = (value) => {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/**
 * In-request chat. Voice-first by design: the mic is the biggest,
 * brightest control so an illiterate mechanic can just tap and speak.
 */
const ChatBox = ({ requestId }) => {
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);
  const discardRef = useRef(false);
  const bottomRef = useRef(null);

  /* ---------- REALTIME MESSAGES ---------- */

  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      requestId,
      (items) => setMessages(items),
      () => setChatError("Chat is unavailable right now.")
    );

    return unsubscribe;
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, recording]);

  /* ---------- CLEANUP ON UNMOUNT ---------- */

  useEffect(
    () => () => {
      window.clearInterval(timerRef.current);
      discardRef.current = true;
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        try {
          recorderRef.current.stop();
        } catch {}
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  /* ---------- VOICE RECORDING ---------- */

  const stopTimer = () => {
    window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    if (recording || sending) return;

    setChatError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 16000 }
        : { audioBitsPerSecond: 16000 };

      const recorder = new MediaRecorder(stream, options);

      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;
      secondsRef.current = 0;
      setRecordSeconds(0);

      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stopTimer();
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);

        if (discardRef.current) return;

        const duration = Math.max(1, secondsRef.current);

        try {
          setSending(true);

          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });

          if (!blob.size) return;

          const audioData = await blobToBase64(blob);
          await sendVoiceMessage(
            requestId,
            currentUser.uid,
            audioData,
            duration
          );
        } catch {
          setChatError("Could not send voice message. Please try again.");
        } finally {
          setSending(false);
        }
      };

      recorder.start();
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1;
        setRecordSeconds(secondsRef.current);

        if (secondsRef.current >= MAX_RECORD_SECONDS) {
          stopRecording(); // auto-send at the limit
        }
      }, 1000);
    } catch {
      setChatError("Microphone permission is needed for voice messages.");
    }
  };

  const cancelRecording = () => {
    discardRef.current = true;
    stopRecording();
  };

  /* ---------- TEXT ---------- */

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || recording) return;

    setSending(true);
    setChatError("");

    try {
      await sendTextMessage(requestId, currentUser.uid, trimmed);
      setText("");
    } catch {
      setChatError("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  /* ---------- RENDER ---------- */

  return (
    <div className="chat-panel">
      {/* MESSAGES */}

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="text-muted text-xs text-center py-3">
            No messages yet. Tap the mic and speak, or type below.
          </p>
        )}

        {messages.map((message) => {
          const own = message.senderId === currentUser?.uid;

          return (
            <div
              key={message.id}
              className={`chat-bubble ${
                own ? "chat-bubble-own" : "chat-bubble-other"
              }`}
            >
              {message.type === "audio" ? (
                <div className="space-y-1">
                  <audio
                    controls
                    preload="metadata"
                    src={message.audioData}
                    className="chat-audio"
                  />
                  <p className="chat-bubble-meta">
                    🎤 Voice message · {formatDuration(message.durationSec)}
                  </p>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              )}

              <p className="chat-bubble-meta">{formatTime(message.createdAt)}</p>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {chatError && (
        <div className="badge badge-danger w-full text-center py-1.5">
          {chatError}
        </div>
      )}

      {/* VOICE — PRIMARY CONTROL */}

      <div className="chat-voice-row">
        {recording ? (
          <>
            <span className="chat-rec-indicator">
              <span className="chat-rec-dot" /> {formatDuration(recordSeconds)}
            </span>

            <button
              type="button"
              onClick={stopRecording}
              className="chat-mic-btn chat-mic-send"
              title="Send voice message"
            >
              ➤
            </button>

            <button
              type="button"
              onClick={cancelRecording}
              className="chat-mic-cancel"
              title="Discard recording"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="chat-mic-btn"
              disabled={sending}
              title="Record a voice message"
            >
              🎤
            </button>

            <span className="text-muted text-xs flex-1">
              {sending ? "Sending..." : "Tap the mic and speak"}
            </span>
          </>
        )}
      </div>

      {/* TEXT — SECONDARY OPTION */}

      <div className="chat-input-row">
        <input
          className="input"
          type="text"
          placeholder="Or type a message..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSendText();
            }
          }}
          disabled={recording}
          maxLength={500}
        />

        <button
          type="button"
          onClick={handleSendText}
          className="btn-secondary !py-2.5"
          disabled={sending || recording || !text.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBox;

