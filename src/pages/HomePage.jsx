import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";

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

        {/* HOW IT WORKS */}

        <section className="how-it-works">
          <h2 className="text-xl font-semibold text-center">
            How GarageGo works
          </h2>

          <div className="steps-grid mt-6">
            <div className="step-card">
              <span className="step-number">1</span>
              <p className="step-title">Share your location</p>
              <p className="step-copy">
                We detect your GPS position and rank nearby mechanics by real
                distance and ETA.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">2</span>
              <p className="step-title">Request help</p>
              <p className="step-copy">
                Pick your problem — the mechanic you choose is alerted first,
                with backup mechanics queued automatically.
              </p>
            </div>

            <div className="step-card">
              <span className="step-number">3</span>
              <p className="step-title">Track and complete</p>
              <p className="step-copy">
                Follow the request status live on the map and close the job
                with a secure OTP.
              </p>
            </div>
          </div>

          <p className="demo-note">
            Demo note: GarageGo has two roles. Log in as a{" "}
            <strong>customer</strong> to send a request, and as a{" "}
            <strong>mechanic</strong> in another browser or incognito window
            to accept it in real time.
          </p>
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
    return (
      <div className="onboarding-shell">
        <div className="setup-panel text-center max-w-md">
          <h2 className="text-xl font-semibold">
            Complete Your Profile
          </h2>

          <p className="text-muted text-sm mt-2">
            Choose whether you need help (customer) or provide help (mechanic)
            to unlock your dashboard.
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
