import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { CITY_OPTIONS } from "../constants/appConstants";
import { getHubsForCity } from "../constants/garageHubs";

import CustomerDashboard from "./CustomerDashboard";
import MechanicDashboard from "./MechanicDashboard";

/* ---------------- INTERACTIVE DISPATCH RADAR SIMULATOR ---------------- */

const DispatchSimulator = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: "1. SOS Request Triggered",
      status: "Detecting live GPS coordinates",
      coords: "12.9716° N, 77.5946° E",
      detail: "Sub-10m accuracy achieved · Battery Jumpstart selected",
      badge: "GPS Pinpointed",
      badgeType: "badge-success",
    },
    {
      label: "2. Nearest Garage Matched",
      status: "Indiranagar FastTrack Auto Hub",
      coords: "1.8 km away · Estimated ETA: 7 mins",
      detail: "Assigned to Senior Technician Rajesh Kumar",
      badge: "Matched in 0.4s",
      badgeType: "badge-warning",
    },
    {
      label: "3. Real-Time Technician Route",
      status: "Technician dispatched & en route",
      coords: "Live route tracking on Leaflet Map",
      detail: "Turn-by-turn navigation active · ETA updating",
      badge: "En Route (~6m)",
      badgeType: "badge-warning",
    },
    {
      label: "4. Secure OTP Handshake",
      status: "Service Completed at Customer Location",
      coords: "Mutual 4-digit OTP verification: #8492",
      detail: "Work order closed · Zero payment discrepancies",
      badge: "Verified & Closed",
      badgeType: "badge-success",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [steps.length]);

  const current = steps[activeStep];

  return (
    <div className="radar-simulation-card animate-fade-up">
      <div className="radar-sim-header">
        <div className="flex items-center gap-2">
          <span className="radar-live-dot" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber">
            Live Dispatch Engine Preview
          </span>
        </div>
        <span className={`badge ${current.badgeType} text-xs font-mono`}>
          {current.badge}
        </span>
      </div>

      <div className="radar-display-area">
        {/* Radar concentric rings */}
        <div className="radar-ring radar-ring-1" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-ring radar-ring-3" />
        <div className="radar-sweep" />

        {/* Central user pin */}
        <div className="radar-center-pin" title="Customer Pinpoint">
          <span className="radar-pin-pulse" />
          <span className="radar-pin-core">🚗</span>
        </div>

        {/* Moving mechanic blips */}
        <div className="radar-blip radar-blip-1" title="Technician en route">
          <span className="radar-blip-pulse" />
          <span className="radar-blip-icon">🔧</span>
        </div>
        <div className="radar-blip radar-blip-2" title="Backup Hub">
          <span className="radar-blip-icon">🏢</span>
        </div>
      </div>

      <div className="radar-status-drawer">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{current.label}</span>
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`radar-step-dot ${activeStep === idx ? "radar-step-dot-active" : ""}`}
              />
            ))}
          </div>
        </div>

        <p className="font-semibold text-sm text-[var(--text)] mt-1">
          {current.status}
        </p>
        <p className="text-xs font-mono text-amber-light mt-0.5">
          {current.coords}
        </p>
        <p className="text-xs text-muted mt-1">
          {current.detail}
        </p>
      </div>
    </div>
  );
};

/* ---------------- MAIN HOMEPAGE COMPONENT ---------------- */

const HomePage = () => {
  const { currentUser, profile, loading, profileLoading } = useAuth();
  const [activeWorkflowTab, setActiveWorkflowTab] = useState("customer");
  const [selectedCity, setSelectedCity] = useState("Bengaluru");

  const isLoading = loading || profileLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Loading dashboard..." />
      </div>
    );
  }

  /* ---------- PUBLIC LANDING PAGE (WHEN LOGGED OUT) ---------- */
  if (!currentUser) {
    const cityHubs = getHubsForCity(selectedCity);

    return (
      <div className="landing-shell-premium animate-fade-up">

        {/* HERO SECTION */}
        <section className="landing-hero-grid">
          <div className="landing-hero-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber/30 bg-amber/10 text-amber text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Real-Time Emergency Roadside Platform
            </div>

            <h1 className="hero-headline">
              Instant Mechanic Support, <br />
              <span className="text-gradient-amber">Pinpointed & Dispatched</span> in Seconds.
            </h1>

            <p className="hero-subtext">
              When your vehicle stops, GarageGo connects you instantly to the nearest certified garage.
              Live GPS pinpointing, automated failover routing, real-time map tracking, and secure OTP handshakes.
            </p>

            <div className="hero-cta-group">
              <Link to="/signup" className="btn-primary flex items-center gap-2">
                <span>Get Instant Assistance</span>
                <span aria-hidden="true">→</span>
              </Link>

              <Link to="/signup" className="btn-secondary flex items-center gap-2">
                <span>Join as Mechanic Partner</span>
              </Link>
            </div>

            {/* LIVE TRUST & METRIC METRICS */}
            <div className="hero-metrics-ticker">
              <div className="metric-cell">
                <span className="metric-val">&lt; 15 min</span>
                <span className="metric-lbl">Average Arrival ETA</span>
              </div>
              <div className="metric-cell">
                <span className="metric-val">Sub-10m</span>
                <span className="metric-lbl">GPS Pinpoint Accuracy</span>
              </div>
              <div className="metric-cell">
                <span className="metric-val">100%</span>
                <span className="metric-lbl">OTP Verified Handshake</span>
              </div>
              <div className="metric-cell">
                <span className="metric-val">24 / 7</span>
                <span className="metric-lbl">Real-Time Sync</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-right">
            <DispatchSimulator />
          </div>
        </section>

        {/* CORE PLATFORM CAPABILITIES */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Engineered for Reliability</span>
            <h2 className="section-heading">State-of-the-Art Architecture</h2>
            <p className="section-subheading">
              Built with high-availability real-time technologies to deliver instantaneous dispatching under high stress.
            </p>
          </div>

          <div className="features-grid-3x2">
            <div className="feature-box">
              <div className="feature-icon-bubble">🛰️</div>
              <h3 className="feature-title">Precision GPS Pinpoint</h3>
              <p className="feature-copy">
                Accurate sub-10m coordinate extraction with Nominatim reverse-geocoding to display exact street-level addresses.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">⚡</div>
              <h3 className="feature-title">Smart Proximity Routing</h3>
              <p className="feature-copy">
                Calculates real-time haversine distance matrices and queues backup mechanics automatically if the first is busy.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">🗺️</div>
              <h3 className="feature-title">Live Turn-by-Turn Tracking</h3>
              <p className="feature-copy">
                Interactive OpenStreetMap & Leaflet integration with dynamic ETA updates, route polylines, and Google Maps direct navigation.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">🔒</div>
              <h3 className="feature-title">Cryptographic OTP Handshake</h3>
              <p className="feature-copy">
                Mutual 4-digit verification code system prevents premature closure, guaranteeing the technician is on-site before completing.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">📲</div>
              <h3 className="feature-title">Cloud Push Notifications</h3>
              <p className="feature-copy">
                Integrated Web Push & Service Workers deliver immediate audio-visual dispatch alerts to mechanics even with browser minimized.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">👥</div>
              <h3 className="feature-title">Two-Sided Real-Time Sync</h3>
              <p className="feature-copy">
                Firestore real-time snapshot listeners synchronize job requests, status changes, and technician assignment in sub-second latency.
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE HOW IT WORKS */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Seamless Workflow</span>
            <h2 className="section-heading">How GarageGo Works</h2>
            <p className="section-subheading">
              Select your role to explore the end-to-end dispatch and resolution pipeline.
            </p>

            <div className="role-switch-pills">
              <button
                type="button"
                onClick={() => setActiveWorkflowTab("customer")}
                className={`role-switch-btn ${activeWorkflowTab === "customer" ? "role-switch-btn-active" : ""}`}
              >
                🚗 For Stranded Motorists
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkflowTab("mechanic")}
                className={`role-switch-btn ${activeWorkflowTab === "mechanic" ? "role-switch-btn-active" : ""}`}
              >
                🔧 For Garage Technicians
              </button>
            </div>
          </div>

          {activeWorkflowTab === "customer" ? (
            <div className="steps-cards-grid">
              <div className="workflow-card">
                <span className="workflow-step-num">01</span>
                <h4 className="workflow-card-title">1-Click GPS Pinpointing</h4>
                <p className="workflow-card-copy">
                  GarageGo detects your exact GPS coordinates and reverse-geocodes your street location instantly.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">02</span>
                <h4 className="workflow-card-title">Select Issue & Dispatch</h4>
                <p className="workflow-card-copy">
                  Pick your breakdown type (Puncture, Battery, Towing, Engine) and dispatch to the closest verified garage.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">03</span>
                <h4 className="workflow-card-title">Live Tracking & OTP Close</h4>
                <p className="workflow-card-copy">
                  Watch technician approach in real time on the Leaflet map and share your 4-digit OTP upon job completion.
                </p>
              </div>
            </div>
          ) : (
            <div className="steps-cards-grid">
              <div className="workflow-card">
                <span className="workflow-step-num">01</span>
                <h4 className="workflow-card-title">Realtime Distress Alert</h4>
                <p className="workflow-card-copy">
                  Get instant audio-visual push notifications on your dashboard when a stranded motorist requests help nearby.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">02</span>
                <h4 className="workflow-card-title">1-Click Accept & GPS Route</h4>
                <p className="workflow-card-copy">
                  Accept the job to receive exact customer pinpoint coordinates and launch turn-by-turn driving navigation.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">03</span>
                <h4 className="workflow-card-title">Verify OTP & Complete</h4>
                <p className="workflow-card-copy">
                  Generate and verify the customer’s secure completion OTP to close the service ticket seamlessly.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* CITY COVERAGE & HUBS EXPLORER */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Coverage Network</span>
            <h2 className="section-heading">Strategic Metropolitan Hubs</h2>
            <p className="section-subheading">
              Our network covers prime high-traffic corridors to guarantee rapid roadside dispatch.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {CITY_OPTIONS.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`city-pill ${selectedCity === city ? "city-pill-active" : ""}`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="city-hubs-grid">
            {cityHubs.map((hub) => (
              <div key={hub.id} className="hub-display-card">
                <div className="flex items-center justify-between">
                  <span className="hub-area-tag">{hub.area}</span>
                  <span className="hub-status-online">● Ready</span>
                </div>
                <h4 className="hub-name-text">{hub.name}</h4>
                <p className="text-xs text-muted mt-2 font-mono">
                  Coordinates: {hub.lat.toFixed(4)}° N, {hub.lng.toFixed(4)}° E
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TECH STACK & PRODUCTION ARCHITECTURE */}
        <section className="landing-section">
          <div className="tech-stack-banner">
            <div>
              <span className="section-tag">Production Stack</span>
              <h3 className="text-xl font-bold mt-2">Engineered for Performance & Scalability</h3>
              <p className="text-sm text-muted mt-1 max-w-xl">
                Built with modern web standards, resilient cloud synchronization, and responsive styling for desktop and mobile devices.
              </p>
            </div>

            <div className="tech-badge-container">
              <span className="tech-badge">React 18</span>
              <span className="tech-badge">Vite 5</span>
              <span className="tech-badge">Tailwind CSS</span>
              <span className="tech-badge">Leaflet & OSM</span>
              <span className="tech-badge">Firebase Firestore</span>
              <span className="tech-badge">Firebase Auth</span>
              <span className="tech-badge">Service Worker FCM</span>
              <span className="tech-badge">Nominatim Geocoding</span>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER */}
        <section className="landing-cta-banner">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-shimmer">
              Ready to Experience Next-Gen Roadside Help?
            </h2>
            <p className="text-muted text-sm sm:text-base mt-2">
              Create an account in 30 seconds or log in to access the driver and mechanic dashboards.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 sm:mt-0">
            <Link to="/signup" className="btn-primary">
              Create Free Account
            </Link>
            <Link to="/login" className="btn-secondary">
              Login to Portal
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="landing-footer">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="brand-mark">G</span>
              <span className="font-bold text-sm">GarageGo</span>
              <span className="text-xs text-muted ml-2">© 2026 · Real-Time Roadside Assistance</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted">
              <Link to="/login" className="hover:text-amber">Login</Link>
              <Link to="/signup" className="hover:text-amber">Register</Link>
              <span>Built for high-reliability emergency response</span>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  /* ---------- PROFILE STATE HANDLING ---------- */
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

