import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { CITY_OPTIONS } from "../constants/appConstants";
import { getHubsForCity } from "../constants/garageHubs";

import CustomerDashboard from "./CustomerDashboard";
import MechanicDashboard from "./MechanicDashboard";

/* ---------------- HERO ROUTE CARD (hero signature visual) ----------------
   A stylized "tracking view" showing a route from customer to garage with
   a flowing dispatch stage tracker underneath. Explicitly labeled as a
   preview — no invented names, coordinates, or timings are presented as
   real, live data. */

const ROUTE_STAGES = [
  { tag: "SOS", label: "Request sent", detail: "Location and issue type shared with nearby garages" },
  { tag: "MATCH", label: "Garage matched", detail: "Closest available garage accepts the job" },
  { tag: "ROUTE", label: "Technician en route", detail: "Route shown on the map until arrival" },
  { tag: "DONE", label: "Job verified & closed", detail: "A matching code confirms the work before it's marked done" },
];

const ROUTE_PATH_D = "M40,208 C130,208 118,86 210,86 S318,58 348,44";

const HeroRouteCard = () => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % ROUTE_STAGES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  const current = ROUTE_STAGES[activeStage];

  return (
    <div className="hero-route-card animate-fade-up">
      <div className="hero-route-header">
        <span className="hero-route-eyebrow">Sample tracking view</span>
        <span className="hero-route-live">
          <span className="hero-route-live-dot" />
          Preview
        </span>
      </div>

      <div className="hero-route-map">
        <svg viewBox="0 0 400 240" className="route-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="mapGrid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.4" cy="1.4" r="1.4" className="route-grid-dot" />
            </pattern>
          </defs>
          <rect width="400" height="240" fill="url(#mapGrid)" />

          <path className="route-path-base" d={ROUTE_PATH_D} />
          <path className="route-path-flow" d={ROUTE_PATH_D} />

          <circle className="route-flow-dot" r="4.5">
            <animateMotion dur="3.2s" repeatCount="indefinite" path={ROUTE_PATH_D} />
          </circle>

          <g>
            <circle className="route-pin-pulse" cx="40" cy="208" r="15" />
            <circle className="route-pin-base route-pin-start" cx="40" cy="208" r="14" />
            <text x="40" y="213" textAnchor="middle" className="route-pin-icon">🚗</text>
          </g>

          <g>
            <circle className="route-pin-base route-pin-end" cx="348" cy="44" r="14" />
            <text x="348" y="49" textAnchor="middle" className="route-pin-icon">🔧</text>
          </g>
        </svg>
      </div>

      <div className="hero-route-footer">
        <div className="route-stage-track">
          {ROUTE_STAGES.map((stage, idx) => (
            <span
              key={stage.tag}
              className={`route-stage-seg ${idx <= activeStage ? "route-stage-seg-active" : ""}`}
            />
          ))}
        </div>

        <div className="route-status-row">
          <span className="route-status-tag">{current.tag}</span>
          <div>
            <p className="route-status-label">{current.label}</p>
            <p className="route-status-detail">{current.detail}</p>
          </div>
        </div>
      </div>

      <div className="hero-route-caption">Illustrative preview — not live tracking data</div>
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
            <HeroRouteCard />
          </div>
        </section>

        {/* CORE PLATFORM CAPABILITIES */}
        <section className="landing-section">
          <div className="section-header-center">
            <span className="section-tag">Why GarageGo</span>
            <h2 className="section-heading">Built for breakdowns</h2>
            <p className="section-subheading">
              The essentials that get help to you fast — nothing extra.
            </p>
          </div>

          <div className="features-grid-3x2">
            <div className="feature-box">
              <div className="feature-icon-bubble">🛰️</div>
              <h3 className="feature-title">GPS Location Pinpoint</h3>
              <p className="feature-copy">
                We detect your exact spot, so help finds you — not the other
                way around.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">⚡</div>
              <h3 className="feature-title">Proximity Routing</h3>
              <p className="feature-copy">
                Nearby garages are ranked by distance, with an automatic
                backup if one is busy.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">🗺️</div>
              <h3 className="feature-title">Turn-by-Turn Tracking</h3>
              <p className="feature-copy">
                Watch the technician approach on a live map with a real ETA.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">🔒</div>
              <h3 className="feature-title">Verified Completion</h3>
              <p className="feature-copy">
                A 4-digit code confirms the job before it's marked done.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">📲</div>
              <h3 className="feature-title">Instant Alerts</h3>
              <p className="feature-copy">
                Technicians get notified the moment someone nearby needs help.
              </p>
            </div>

            <div className="feature-box">
              <div className="feature-icon-bubble">👥</div>
              <h3 className="feature-title">Two-Sided Sync</h3>
              <p className="feature-copy">
                Status updates appear live on both sides — no refreshing.
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

