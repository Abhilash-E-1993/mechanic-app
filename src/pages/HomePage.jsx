import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { CITY_OPTIONS } from "../constants/appConstants";
import { getHubsForCity } from "../constants/garageHubs";

import CustomerDashboard from "./CustomerDashboard";
import MechanicDashboard from "./MechanicDashboard";

/* ---------------- DISPATCH TICKET (hero signature visual) ----------------
   A sample walkthrough of a job's lifecycle, styled like a garage work
   order / service ticket. Clearly labeled as an example — no invented
   names, coordinates, or timings are presented as real data. */

const TICKET_STAGES = [
  {
    label: "Request sent",
    detail: "Location and issue type shared with nearby garages",
  },
  {
    label: "Garage matched",
    detail: "Closest available garage accepts the job",
  },
  {
    label: "Technician en route",
    detail: "Route shown on the map until arrival",
  },
  {
    label: "Job verified & closed",
    detail: "A matching code confirms the work before it's marked done",
  },
];

const DispatchTicket = () => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % TICKET_STAGES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="ticket-card animate-fade-up">
      <div className="ticket-card-header">
        <span className="ticket-eyebrow">Sample dispatch ticket</span>
        <span className="ticket-icon" aria-hidden="true">🔧</span>
      </div>

      <div className="ticket-perforation" aria-hidden="true">
        {Array.from({ length: 22 }).map((_, i) => (
          <span key={i} className="ticket-perf-dot" />
        ))}
      </div>

      <div className="ticket-body">
        {TICKET_STAGES.map((stage, idx) => {
          const state =
            idx < activeStage ? "done" : idx === activeStage ? "active" : "pending";
          return (
            <div key={stage.label} className={`ticket-row ticket-row-${state}`}>
              <span className="ticket-row-dot" aria-hidden="true" />
              <div className="ticket-row-text">
                <p className="ticket-row-label">{stage.label}</p>
                {state === "active" && (
                  <p className="ticket-row-detail">{stage.detail}</p>
                )}
              </div>
              {state === "done" && <span className="ticket-row-check">✓</span>}
            </div>
          );
        })}
      </div>

      <div className="ticket-footer">
        <span className="ticket-footer-label">Illustrative — not live data</span>
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
            <div className="section-tag mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              Roadside assistance, on demand
            </div>

            <h1 className="hero-headline">
              Your car breaks down.<br />
              <span className="text-gradient-amber">We get a mechanic there.</span>
            </h1>

            <p className="hero-subtext">
              GarageGo connects stranded drivers with nearby garages — pinpointed
              by GPS, tracked on a live map, and confirmed with a secure handoff
              when the job is done.
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

            {/* CAPABILITY PILLS (no fabricated metrics — just what it does) */}
            <div className="capability-pill-row">
              <span className="capability-pill">GPS-based matching</span>
              <span className="capability-pill">Live map tracking</span>
              <span className="capability-pill">Code-verified handoff</span>
            </div>
          </div>

          <div className="landing-hero-right">
            <DispatchTicket />
          </div>
        </section>

        {/* CORE PLATFORM CAPABILITIES */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Under the hood</span>
            <h2 className="section-heading">How the platform is built</h2>
            <p className="section-subheading">
              A quick look at the pieces that make dispatch and tracking work.
            </p>
          </div>

          <div className="features-grid-3x2">
            <div className="feature-box">
              <div className="feature-icon-bubble">🛰️</div>
              <h3 className="feature-title">GPS Location Pinpoint</h3>
              <p className="feature-copy">
                Reads your device's GPS coordinates and reverse-geocodes them
                into a readable street address using Nominatim.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">⚡</div>
              <h3 className="feature-title">Proximity Routing</h3>
              <p className="feature-copy">
                Ranks nearby garages by distance and automatically queues a
                backup if the closest one is already on a job.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">🗺️</div>
              <h3 className="feature-title">Turn-by-Turn Tracking</h3>
              <p className="feature-copy">
                A Leaflet and OpenStreetMap view shows the technician's route
                and ETA, with a handoff to Google Maps for navigation.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">🔒</div>
              <h3 className="feature-title">Verified Completion</h3>
              <p className="feature-copy">
                A matching 4-digit code between customer and technician
                confirms the job before it's marked closed.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">📲</div>
              <h3 className="feature-title">Push Notifications</h3>
              <p className="feature-copy">
                Web Push and a service worker alert technicians to new jobs
                even when the browser tab isn't in focus.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">👥</div>
              <h3 className="feature-title">Two-Sided Sync</h3>
              <p className="feature-copy">
                Firestore listeners keep job status, requests, and assignment
                in sync between the customer and technician views.
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE HOW IT WORKS */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Two sides, one flow</span>
            <h2 className="section-heading">How GarageGo works</h2>
            <p className="section-subheading">
              Select a role to see what the flow looks like from each side.
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
                <h4 className="workflow-card-title">Share your location</h4>
                <p className="workflow-card-copy">
                  GarageGo reads your GPS coordinates and shows your
                  approximate street location.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">02</span>
                <h4 className="workflow-card-title">Pick the issue & dispatch</h4>
                <p className="workflow-card-copy">
                  Choose your breakdown type — puncture, battery, towing,
                  engine — and send it to the nearest available garage.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">03</span>
                <h4 className="workflow-card-title">Track & confirm</h4>
                <p className="workflow-card-copy">
                  Watch the technician approach on the map, then share your
                  code once the job is finished.
                </p>
              </div>
            </div>
          ) : (
            <div className="steps-cards-grid">
              <div className="workflow-card">
                <span className="workflow-step-num">01</span>
                <h4 className="workflow-card-title">Get notified</h4>
                <p className="workflow-card-copy">
                  A push notification lands on your dashboard when a
                  motorist nearby requests help.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">02</span>
                <h4 className="workflow-card-title">Accept & navigate</h4>
                <p className="workflow-card-copy">
                  Accept the job to see the customer's pinpointed location
                  and get turn-by-turn directions.
                </p>
              </div>

              <div className="workflow-card">
                <span className="workflow-step-num">03</span>
                <h4 className="workflow-card-title">Verify & close</h4>
                <p className="workflow-card-copy">
                  Check the customer's completion code against yours to
                  close out the ticket.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* CITY COVERAGE & HUBS EXPLORER */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Coverage</span>
            <h2 className="section-heading">Garage hubs by city</h2>
            <p className="section-subheading">
              Garages onboarded in each city, ready to take dispatch requests.
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
                  <span className="hub-status-tag">Garage hub</span>
                </div>
                <h4 className="hub-name-text">{hub.name}</h4>
                <p className="text-xs text-muted mt-2 font-mono">
                  {hub.lat.toFixed(4)}° N, {hub.lng.toFixed(4)}° E
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* TECH STACK & PRODUCTION ARCHITECTURE */}
        <section className="landing-section">
          <div className="tech-stack-banner">
            <div>
              <span className="section-tag">Built with</span>
              <h3 className="text-xl font-bold mt-2">The stack behind GarageGo</h3>
              <p className="text-sm text-muted mt-1 max-w-xl">
                A modern web stack with real-time sync and responsive styling
                for both desktop and mobile.
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
              Set up your account
            </h2>
            <p className="text-muted text-sm sm:text-base mt-2">
              Create an account or log in to reach your driver or mechanic
              dashboard.
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
              <span className="text-xs text-muted ml-2">© 2026 · Roadside Assistance</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted">
              <Link to="/login" className="hover:text-amber">Login</Link>
              <Link to="/signup" className="hover:text-amber">Register</Link>
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

