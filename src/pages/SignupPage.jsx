import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { createOrUpdateUserProfile } from "../services/firestoreService";
import {
  lookupEmailByPhone,
  normalizePhoneNumber,
} from "../services/phoneAuthService";
import { markOnboardingPending } from "../utils/onboardingSession";

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

        <div className="divider my-6">
          or
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="btn-secondary w-full"
        >
          Continue with Google
        </button>

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
