import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { isOnboardingPending } from "../utils/onboardingSession";

import CustomerDashboard from "./CustomerDashboard";
import MechanicDashboard from "./MechanicDashboard";

const HomePage = () => {
  const { currentUser, profile, loading, profileLoading } = useAuth();

  const isLoading = loading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Loading dashboard..." />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="landing-shell animate-fade-up">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <span className="section-tag">
              Smart roadside help
            </span>

            <h1 className="landing-title text-shimmer">
              GarageGo
            </h1>

            <p className="landing-copy">
              Instant mechanic support when your vehicle stops moving. Find
              nearby help, send a live service request, and stay updated from
              pickup to completion.
            </p>

            <div className="landing-actions">
              <Link
                to="/signup"
                className="btn-primary"
              >
                Create Account
              </Link>

              <Link
                to="/login"
                className="btn-secondary"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="landing-status-panel" aria-label="Service highlights">
            <div>
              <span className="landing-stat-value">Fast</span>
              <span className="landing-stat-label">Nearby response</span>
            </div>

            <div>
              <span className="landing-stat-value">Live</span>
              <span className="landing-stat-label">Mechanic matching</span>
            </div>

            <div>
              <span className="landing-stat-value">ETA</span>
              <span className="landing-stat-label">Distance aware</span>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="flex justify-center pt-20">
        <Loader label="Loading profile..." />
      </div>
    );
  }

  if (!profile?.role) {
    if (!isOnboardingPending(currentUser?.uid)) {
      return (
        <div className="onboarding-shell">
          <div className="setup-panel text-center max-w-md">
            <h2 className="text-xl font-semibold">
              Preparing Your Dashboard
            </h2>

            <p className="text-muted text-sm mt-2">
              Your account is signed in. We are syncing your role details in the background.
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mt-6"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="onboarding-shell">
        <div className="setup-panel text-center max-w-md">
          <h2 className="text-xl font-semibold">
            Complete Your Profile
          </h2>

          <p className="text-muted text-sm mt-2">
            Please select your role to continue.
          </p>

          <Link
            to="/role-selection"
            className="btn-primary mt-6"
          >
            Continue Setup
          </Link>
        </div>
      </div>
    );
  }

  if (profile.role === "customer") {
    return <CustomerDashboard />;
  }

  if (profile.role === "mechanic") {
    return <MechanicDashboard />;
  }

  return null;
};

export default HomePage;
