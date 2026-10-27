const AUTH_API_BASE_URL = (
  import.meta.env.VITE_NOTIFICATION_API_BASE_URL || "http://localhost:4000"
).replace(/\/$/, "");

const REQUEST_TIMEOUT_MS = 7000;

/**
 * Normalizes Indian phone numbers to the 10-digit format stored on
 * user profiles. Accepts "9876543210", "+91 98765 43210", "09876543210".
 * Returns null when the input is not a valid phone number.
 */
export const normalizePhoneNumber = (raw) => {
  if (!raw) return null;

  let digits = String(raw).replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return /^\d{10}$/.test(digits) ? digits : null;
};

/**
 * Decides whether a login identifier should be treated as a phone
 * number (digits, spaces, +, - only) or as an email address.
 */
export const isPhoneIdentifier = (value) => {
  if (!value) return false;
  if (value.includes("@")) return false;
  return normalizePhoneNumber(value) !== null;
};

/**
 * Asks the backend which email is tied to a phone number.
 * Returns the email string, or null when the phone is not registered.
 * Throws only when the server itself is unreachable / failing.
 */
export const lookupEmailByPhone = async (phone) => {
  const normalized = normalizePhoneNumber(phone);

  if (!normalized) {
    throw new Error("invalid-phone");
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(
      `${AUTH_API_BASE_URL}/api/auth/phone-lookup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
        signal: controller.signal,
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("phone-lookup-failed");
    }

    const payload = await response.json();
    return payload.email || null;
  } finally {
    window.clearTimeout(timeoutId);
  }
};
