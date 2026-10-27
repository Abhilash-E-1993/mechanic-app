import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { markOnboardingPending } from "../utils/onboardingSession";
import { isPhoneIdentifier } from "../services/phoneAuthService";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.7-.4-3.9z"/>
  </svg>
);

const LoginPage = () => {
  const { signInWithEmail, signInWithPhone, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
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

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const identifier = formData.identifier.trim();
    const usingPhone = isPhoneIdentifier(identifier);

    try {
      if (usingPhone) {
        await signInWithPhone(identifier, formData.password);
      } else {
        await signInWithEmail(identifier, formData.password);
      }

      navigate("/");
    } catch (err) {
      if (err?.code === "auth/phone-not-registered") {
        setError("This phone number is not registered. Please create an account.");
      } else if (err?.message === "invalid-phone") {
        setError("Enter a valid 10 digit phone number or your email.");
      } else if (
        err?.message === "phone-lookup-failed" ||
        err?.name === "AbortError" ||
        err instanceof TypeError
      ) {
        setError(
          "Phone login service is unavailable right now. Please login with your email instead."
        );
      } else {
        setError(
          usingPhone
            ? "Invalid phone number or password. Please check your credentials."
            : "Invalid email or password. Please check your credentials."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-140px)] py-10">
      <div className="card max-w-md w-full animate-fade-up shadow-2xl">
        <div className="text-center mb-8">
          <span className="brand-mark mb-3 mx-auto text-base">G</span>
          <h1 className="text-3xl font-semibold text-shimmer">
            Welcome Back
          </h1>

          <p className="text-muted mt-2 text-sm">
            Sign in to continue using GarageGo
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="divider my-6">
          or with email / phone
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
          autoComplete="off"
          data-form-type="other"
        >
          <div>
            <label className="input-label">
              Phone Number or Email
            </label>

            <input
              name="identifier"
              type="text"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              spellCheck="false"
              placeholder="9876543210 or you@example.com"
              value={formData.identifier}
              onChange={handleChange}
              className="input"
              required
            />

            <p className="text-muted text-xs mt-1">
              Mechanics can login with just their phone number and password.
            </p>
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
              placeholder="Enter your password"
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
            {loading ? "Signing in..." : "Login to Account"}
          </button>
        </form>

        {error && (
          <div className="mt-5 badge badge-danger w-full text-center py-2">
            {error}
          </div>
        )}

        <p className="text-sm text-muted mt-8 text-center">
          New to GarageGo?{" "}

          <Link
            to="/signup"
            className="text-amber hover:text-amber-light font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

