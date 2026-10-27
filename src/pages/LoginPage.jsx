import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { markOnboardingPending } from "../utils/onboardingSession";
import { isPhoneIdentifier } from "../services/phoneAuthService";

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

        <div className="divider my-6">
          or
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary w-full"
        >
          Continue with Google
        </button>

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

