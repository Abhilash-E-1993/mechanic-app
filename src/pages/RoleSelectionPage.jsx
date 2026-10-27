import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  CITY_OPTIONS,
  DEFAULT_CITY,
  SERVICE_TYPES,
} from "../constants/appConstants";
import { getHubsForCity } from "../constants/garageHubs";

import { createOrUpdateUserProfile } from "../services/firestoreService";
import HubPreviewMap from "../components/HubPreviewMap";

const RoleSelectionPage = () => {

  const { currentUser, profile, loading, profileLoading, refreshProfile } = useAuth();

  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [role, setRole] = useState("customer");

  const [city, setCity] = useState(DEFAULT_CITY);
  const [hubId, setHubId] = useState("");

  const [garageName, setGarageName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");
  const [experienceYears, setExperienceYears] = useState(1);

  const [services, setServices] = useState([]);

  const hubOptions = getHubsForCity(city);
  const selectedHub =
    hubOptions.find((hub) => hub.id === hubId) || null;

  const isLoading = loading || profileLoading;

  useEffect(() => {

    if (isLoading) return;

    if (!currentUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (profile?.role) {
      navigate("/", { replace: true });
    }

  }, [currentUser, profile, isLoading, navigate]);

  // prefill the phone collected at signup once the profile loads
  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneNumber((current) => current || profile.phoneNumber);
    }
  }, [profile?.phoneNumber]);

  /* ---------------- SERVICE TOGGLE ---------------- */

  const toggleService = (service) => {

    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service]
    );

  };

  /* ---------------- CITY CHANGE ---------------- */

  const handleCityChange = (nextCity) => {

    setCity(nextCity);
    setHubId("");

  };

  /* ---------------- SAVE PROFILE ---------------- */

  const handleSave = async (event) => {

    event.preventDefault();

    if (!currentUser) return;

    setSaving(true);
    setError("");

    try {

      if (role === "mechanic") {

        if (!selectedHub) {
          setError("Please choose your garage location hub.");
          setSaving(false);
          return;
        }

        if (!garageName.trim()) {
          setError("Garage name required.");
          setSaving(false);
          return;
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
          setError("Enter a valid 10 digit phone number.");
          setSaving(false);
          return;
        }

        if (services.length === 0) {
          setError("Select at least one service.");
          setSaving(false);
          return;
        }

      }

      await createOrUpdateUserProfile(currentUser.uid, {
        ...(role === "mechanic"
          ? {
              city,
              serviceArea: selectedHub.area,
              hubId: selectedHub.id,
              hubName: selectedHub.name,
              garageName,
              phoneNumber,
              experienceYears: Number(experienceYears),
              services,
              availabilityStatus: "available",
              mechanicBaseLocation: {
                addressLine1: selectedHub.name,
                addressLine2: `${selectedHub.area}, ${city}`,
                lat: selectedHub.lat,
                lng: selectedHub.lng,
              },
              latitude: selectedHub.lat,
              longitude: selectedHub.lng,
            }
          : {}),

        name: profile?.name || currentUser.displayName || "User",
        email: profile?.email || currentUser.email,

        role,

        ...(role === "mechanic"
          ? {}
          : {
              city: null,
              serviceArea: null,
              garageName: null,
              // keep the signup phone — it is the customer's login identifier
              phoneNumber: profile?.phoneNumber || null,
              experienceYears: null,
              services: [],
              availabilityStatus: null,
              mechanicBaseLocation: null,
              latitude: null,
              longitude: null,
            }),

      });

      await refreshProfile(currentUser.uid);

      navigate("/");

    } catch (err) {

      console.error(err);
      setError("Unable to save profile.");

    } finally {

      setSaving(false);

    }

  };

  /* ---------------- LOADING ---------------- */

  if (isLoading) {

    return (
      <div className="flex justify-center pt-20">
        Loading profile...
      </div>
    );

  }

  /* ---------------- UI ---------------- */

  return (

    <div className="onboarding-shell">

      <div className="onboarding-panel w-full max-w-4xl">

        <div className="onboarding-header">
          <span className="section-tag">
            Account setup
          </span>

          <h1 className="onboarding-title">
            Choose how you want to use GarageGo
          </h1>

          <p className="onboarding-copy">
            Pick the role that fits you. We will keep the next steps focused
            so your dashboard feels ready from the first visit.
          </p>
        </div>

        <form className="space-y-6 mt-8" onSubmit={handleSave}>

          {/* ROLE SELECT */}

          <div className="role-selector-grid">

            <button
              type="button"
              onClick={() => setRole("customer")}
              aria-pressed={role === "customer"}
              className={`role-option-card ${
                role === "customer" ? "role-option-card-active" : ""
              }`}
            >
              <span className="role-option-kicker">
                I need help
              </span>

              <span className="role-option-title">
                Customer
              </span>

              <span className="role-option-copy">
                Request nearby mechanics and track active service requests.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole("mechanic")}
              aria-pressed={role === "mechanic"}
              className={`role-option-card ${
                role === "mechanic" ? "role-option-card-active" : ""
              }`}
            >
              <span className="role-option-kicker">
                I provide service
              </span>

              <span className="role-option-title">
                Mechanic
              </span>

              <span className="role-option-copy">
                Share your garage details, service area, and repair skills.
              </span>
            </button>

          </div>

          {/* MECHANIC SETTINGS */}

          {role === "mechanic" && (

            <div className="mechanic-profile-grid">

              {/* CITY */}

              <div>
                <label className="input-label">
                  City
                </label>

                <select
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="input"
                >
                  {CITY_OPTIONS.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* GARAGE LOCATION HUB */}

              <div className="mechanic-services-field">

                <p className="input-label mb-3">
                  Garage Location — pick the hub nearest to your garage
                </p>

                <div className="hub-grid">

                  {hubOptions.map((hub) => (

                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => setHubId(hub.id)}
                      className={`hub-card ${
                        hubId === hub.id ? "hub-card-active" : ""
                      }`}
                    >
                      <span className="hub-card-name">
                        {hub.name}
                      </span>
                      <span className="hub-card-area">
                        {hub.area}
                      </span>
                    </button>

                  ))}

                </div>

                {selectedHub && (
                  <HubPreviewMap hub={selectedHub} />
                )}

              </div>

              {/* GARAGE */}

              <div>
                <label className="input-label">
                  Garage Name
                </label>

                <input
                  className="input"
                  placeholder="Garage Name"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                />
              </div>

              {/* PHONE */}

              <div>
                <label className="input-label">
                  Phone Number
                </label>

                <input
                  className="input"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                />
              </div>

              {/* EXPERIENCE */}

              <div>
                <label className="input-label">
                  Years of Experience
                </label>

                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="Years of experience"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>

              {/* SERVICES PROVIDED */}

              <div className="mechanic-services-field">

                <p className="input-label mb-3">
                  Services Provided
                </p>

                <div className="flex flex-wrap gap-2">

                  {SERVICE_TYPES.map((service) => (

                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`badge ${
                        services.includes(service)
                          ? "badge-success"
                          : ""
                      }`}
                    >
                      {service}
                    </button>

                  ))}

                </div>

              </div>

            </div>

          )}

          {/* ERROR */}

          {error && (
            <div className="badge badge-danger">
              {error}
            </div>
          )}

          {/* SAVE */}

          <button
            className="btn-primary w-full"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>

        </form>

      </div>

    </div>

  );

};

export default RoleSelectionPage;
