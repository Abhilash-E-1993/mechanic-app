import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AREAS, SERVICE_TYPES } from '../constants/appConstants';
import { createOrUpdateUserProfile } from '../services/firestoreService';

const RoleSelectionPage = () => {
  const { currentUser, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [role, setRole] = useState(profile?.role || 'customer');
  const [serviceArea, setServiceArea] = useState(profile?.serviceArea || AREAS[0]);
  const [garageName, setGarageName] = useState(profile?.garageName || '');
  const [experienceYears, setExperienceYears] = useState(profile?.experienceYears || 1);
  const [services, setServices] = useState(profile?.services || []);
  const [availabilityStatus, setAvailabilityStatus] = useState(profile?.availabilityStatus || 'available');

  const toggleService = (service) => {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service],
    );
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!currentUser) return;

    if (role === 'mechanic' && services.length === 0) {
      setError('Please choose at least one service type.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createOrUpdateUserProfile(currentUser.uid, {
        name: profile?.name || currentUser.displayName || 'User',
        email: profile?.email || currentUser.email,
        role,
        serviceArea,
        ...(role === 'mechanic'
          ? {
              garageName,
              experienceYears: Number(experienceYears),
              services,
              availabilityStatus,
            }
          : {}),
      });
      await refreshProfile(currentUser.uid);
      navigate('/');
    } catch {
      setError('Unable to save profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-2xl rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold">Complete Your Profile</h1>
      <form className="space-y-4" onSubmit={handleSave}>
        <div>
          <label className="mb-2 block text-sm font-medium">Choose role</label>
          <select className="w-full rounded border px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">Customer</option>
            <option value="mechanic">Mechanic</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Service area</label>
          <select className="w-full rounded border px-3 py-2" value={serviceArea} onChange={(e) => setServiceArea(e.target.value)}>
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        {role === 'mechanic' && (
          <>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Garage name"
              value={garageName}
              onChange={(e) => setGarageName(e.target.value)}
              required
            />
            <input
              className="w-full rounded border px-3 py-2"
              type="number"
              min="0"
              placeholder="Experience in years"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              required
            />

            <div>
              <p className="mb-2 text-sm font-medium">Services offered</p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_TYPES.map((service) => (
                  <label key={service} className="flex items-center gap-2 rounded border p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={services.includes(service)}
                      onChange={() => toggleService(service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Availability</label>
              <select
                className="w-full rounded border px-3 py-2"
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
              </select>
            </div>
          </>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};

export default RoleSelectionPage;
