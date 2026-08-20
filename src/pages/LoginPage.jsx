import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { markOnboardingPending } from "../utils/onboardingSession";

const DEMO_ACCOUNTS = {
  customer: { email: "customer@garagego.app", password: "GarageGo@123" },
  mechanic: { email: "mechanic@garagego.app", password: "GarageGo@123" },
};

const LoginPage = () => {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
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

  const handleEmailLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signInWithEmail(
        formData.email,
        formData.password
      );

      navigate("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (account) => {
    setError("");
    setFormData({
      email: account.email,
      password: account.password,
    });
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
    <div className="flex justify-center pt-20">
      <div className="card max-w-md w-full animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-shimmer">
            Welcome Back
          </h1>

          <p className="text-muted mt-2 text-sm">
            Sign in to continue using GarageGo
          </p>
        </div>

        <form
          onSubmit={handleEmailLogin}
          className="space-y-4"
          autoComplete="off"
          data-form-type="other"
        >
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
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="divider my-6">
          or
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="btn-secondary w-full"
        >
          Continue with Google
        </button>

        {/* DEMO ACCOUNTS */}

        <div className="demo-login-panel">
          <p className="demo-login-title">Demo accounts</p>
          <p className="demo-login-copy">
            Reviewing GarageGo? One-click fill below. Use the customer account
            in this browser and the mechanic account in an incognito window to
            see the live two-role flow.
          </p>

          <div className="demo-login-actions">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => fillDemoAccount(DEMO_ACCOUNTS.customer)}
            >
              Fill Demo Customer
            </button>

            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => fillDemoAccount(DEMO_ACCOUNTS.mechanic)}
            >
              Fill Demo Mechanic
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 badge badge-danger">
            {error}
          </div>
        )}

        <p className="text-sm text-muted mt-8 text-center">
          New user?{" "}

          <Link
            to="/signup"
            className="text-amber hover:text-amber-light font-medium"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
