import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import RequestList from '../components/RequestList';
import { useAuth } from '../context/AuthContext';
import {
  createOrUpdateUserProfile,
  getRequestsForMechanic,
  updateRequestStatus,
} from '../services/firestoreService';

const MechanicDashboard = () => {
  const { currentUser, profile, refreshProfile } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);

  const loadRequests = async () => {
    if (!currentUser) return;
    setLoading(true);
    const requestList = await getRequestsForMechanic(currentUser.uid);
    setRequests(requestList);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser]);

  const handleRequestAction = async (requestId, nextStatus) => {
    setSavingStatus(true);
    await updateRequestStatus(requestId, nextStatus);
    await loadRequests();
    setSavingStatus(false);
  };

  const handleAvailabilityChange = async (status) => {
    await createOrUpdateUserProfile(currentUser.uid, {
      ...profile,
      role: 'mechanic',
      availabilityStatus: status,
      name: profile?.name || currentUser.displayName || 'Mechanic',
      email: profile?.email || currentUser.email,
    });
    await refreshProfile(currentUser.uid);
  };

  if (loading) return <Loader label="Loading mechanic dashboard..." />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-white p-4">
        <h2 className="text-xl font-semibold">Mechanic Dashboard</h2>
        <p className="mt-1 text-sm text-slate-600">Manage your availability and requests.</p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleAvailabilityChange('available')}
            className={`rounded px-3 py-1 text-sm text-white ${
              profile?.availabilityStatus === 'available' ? 'bg-green-600' : 'bg-slate-500'
            }`}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => handleAvailabilityChange('busy')}
            className={`rounded px-3 py-1 text-sm text-white ${
              profile?.availabilityStatus === 'busy' ? 'bg-amber-600' : 'bg-slate-500'
            }`}
          >
            Busy
          </button>
        </div>
      </section>

      {savingStatus && <p className="text-sm text-blue-700">Saving request status...</p>}

      <section>
        <h3 className="mb-3 text-lg font-semibold">Incoming Requests</h3>
        <RequestList requests={requests} forMechanic onAction={handleRequestAction} />
      </section>
    </div>
  );
};

export default MechanicDashboard;
