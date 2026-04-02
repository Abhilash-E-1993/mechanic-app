import { useEffect, useState } from 'react';
import MechanicCard from '../components/MechanicCard';
import RequestList from '../components/RequestList';
import Loader from '../components/Loader';
import { AREAS, SERVICE_TYPES } from '../constants/appConstants';
import { useAuth } from '../context/AuthContext';
import {
  createOrUpdateUserProfile,
  createServiceRequest,
  getAvailableMechanicsByArea,
  getRequestsForCustomer,
} from '../services/firestoreService';

const CustomerDashboard = () => {
  const { currentUser, profile, refreshProfile } = useAuth();
  const [selectedArea, setSelectedArea] = useState(profile?.serviceArea || AREAS[0]);
  const [mechanics, setMechanics] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');

    try {
      const [mechanicList, requestList] = await Promise.all([
        getAvailableMechanicsByArea(selectedArea),
        getRequestsForCustomer(currentUser.uid),
      ]);
      setMechanics(mechanicList);
      setRequests(requestList);
    } catch {
      setError('Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedArea, currentUser]);

  const updateArea = async (area) => {
    setSelectedArea(area);
    await createOrUpdateUserProfile(currentUser.uid, {
      ...profile,
      role: 'customer',
      serviceArea: area,
      name: profile?.name || currentUser.displayName || 'Customer',
      email: profile?.email || currentUser.email,
    });
    await refreshProfile(currentUser.uid);
  };

  const handleRequest = async (mechanic) => {
    const serviceType = window.prompt(`Enter service type:\n${SERVICE_TYPES.join(', ')}`, SERVICE_TYPES[0]);
    if (!serviceType) return;

    if (!SERVICE_TYPES.includes(serviceType)) {
      alert('Please enter one of the listed service types exactly.');
      return;
    }

    await createServiceRequest({
      customerId: currentUser.uid,
      customerName: profile?.name || currentUser.displayName || 'Customer',
      mechanicId: mechanic.id,
      mechanicName: mechanic.name,
      area: selectedArea,
      serviceType,
    });

    await loadData();
  };

  if (loading) return <Loader label="Loading customer dashboard..." />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-xl font-semibold">Customer Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Choose your area to find available mechanics.</p>
        <select
          className="mt-3 rounded border px-3 py-2"
          value={selectedArea}
          onChange={(e) => updateArea(e.target.value)}
        >
          {AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </section>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <section>
        <h3 className="mb-3 text-lg font-semibold">Available Mechanics in {selectedArea}</h3>
        {mechanics.length === 0 ? (
          <p className="rounded-lg border bg-white p-4 text-sm text-slate-500">No mechanics available in this area.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mechanics.map((mechanic) => (
              <MechanicCard key={mechanic.id} mechanic={mechanic} onRequest={handleRequest} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">My Service Requests</h3>
        <RequestList requests={requests} />
      </section>
    </div>
  );
};

export default CustomerDashboard;
