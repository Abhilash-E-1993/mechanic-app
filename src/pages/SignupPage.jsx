import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { createOrUpdateUserProfile } from "../services/firestoreService";
import {
  lookupEmailByPhone,
  normalizePhoneNumber,
} from "../services/phoneAuthService";
import { markOnboardingPending } from "../utils/onboardingSession";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
  </svg>
);

const SignupPage = () => {

  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {

    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));

  };

  const handleSubmit = async (event) => {

    event.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    const phoneNumber = normalizePhoneNumber(formData.phone);

    if (!phoneNumber) {
      setError("Enter a valid 10 digit phone number.");
      setLoading(false);
      return;
    }

    try {

      // block duplicate phone numbers — the phone is a login identifier
      try {
        const existingEmail = await lookupEmailByPhone(phoneNumber);
        if (existingEmail) {
          setError("Phone number already registered. Please login.");
          setLoading(false);
          return;
        }
      } catch (lookupErr) {
        // If the backend is unreachable we cannot verify uniqueness —
        // allow signup to continue rather than blocking the user.
        console.warn("Phone uniqueness check skipped:", lookupErr);
      }

      const credentials = await signUpWithEmail(
        formData.email.trim(),
        formData.password
      );

      const uid = credentials.user.uid;

      // create profile
      await createOrUpdateUserProfile(uid, {

        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber,

        role: null,
        city: null,
        serviceArea: null,

        garageName: null,
        experienceYears: null,
        services: [],
        availabilityStatus: null,

      });

      markOnboardingPending(uid);

      navigate("/role-selection");

    } catch (err) {

      if (err.code === "auth/email-already-in-use") {
        setError("Email already registered. Please login.");
      }

      else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      }

      else {
        setError("Unable to create account. Please try again.");
      }

    } finally {

      setLoading(false);

    }

  };

  const handleGoogleSignup = async () => {

    if (loading) return;

    setError("");
    setLoading(true);

    try {

      const googleLoginResult = await signInWithGoogle();
      const { result, needsRoleSelection } = googleLoginResult;

      if (needsRoleSelection) {
        markOnboardingPending(result.user.uid);
        navigate("/role-selection");
      } else {
        navigate("/");
      }

    } catch {

      setError("Google signup failed. Please try again.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="flex justify-center pt-20">

      <div className="card max-w-md w-full animate-fade-up">

        {/* HEADER */}

        <div className="text-center mb-8">

          <h1 className="text-3xl font-semibold text-shimmer">
            Create Account
          </h1>

          <p className="text-muted text-sm mt-2">
            Join GarageGo and get help on the road instantly
          </p>

        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="divider my-6">
          or with email
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
          autoComplete="off"
          data-form-type="other"
        >

          <div>

            <label className="input-label">
              Full Name
            </label>

            <input
              name="name"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />

          </div>

          <div>

            <label className="input-label">
              Phone Number
            </label>

            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="9876543210"
              value={formData.phone}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              className="input"
              required
            />

            <p className="text-muted text-xs mt-1">
              You can login later using this number and your password.
            </p>

          </div>

          <div>

            <label className="input-label">
              Email
            </label>

            <input
              name="email"
              type="email"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              spellCheck="false"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />

          </div>

          <div>

            <label className="input-label">
              Password
            </label>

            <input
              name="password"
              type="password"
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />

          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* ERROR */}

        {error && (
          <div className="badge badge-danger mt-5">
            {error}
          </div>
        )}

        {/* LOGIN LINK */}

        <p className="text-sm text-muted mt-8 text-center">

          Already have an account?{" "}

          <Link
            to="/login"
            className="text-amber hover:text-amber-light font-medium"
          >
            Login
          </Link>

        </p>

      </div>

    </div>

  );

};

export default SignupPage;
