import { Router } from "express";
import { db } from "../firebaseAdmin.js";

const router = Router();

// Accepts "9876543210", "+91 98765 43210", "09876543210" -> "9876543210"
const normalizePhoneNumber = (raw) => {
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
 * POST /api/auth/phone-lookup
 * Public endpoint used on the login/signup screens (user is not
 * authenticated yet, so it cannot live behind requireAuth).
 * Maps a registered phone number to its account email so the client
 * can finish sign-in with signInWithEmailAndPassword.
 */
router.post("/phone-lookup", async (req, res) => {
  const phone = normalizePhoneNumber(req.body?.phone);

  if (!phone) {
    return res.status(400).json({ error: "invalid-phone" });
  }

  try {
    const snapshot = await db
      .collection("users")
      .where("phoneNumber", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty || !snapshot.docs[0].data()?.email) {
      return res.status(404).json({ error: "phone-not-registered" });
    }

    return res.json({ email: snapshot.docs[0].data().email });
  } catch (error) {
    console.error("[auth] phone lookup failed", {
      message: error.message,
    });
    return res.status(500).json({ error: "phone-lookup-failed" });
  }
});

export default router;
