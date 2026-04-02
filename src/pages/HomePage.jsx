import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import CustomerDashboard from './CustomerDashboard';
import MechanicDashboard from './MechanicDashboard';

const HomePage = () => {
  const { currentUser, profile, loading } = useAuth();

  if (loading) return <Loader />;

  if (!currentUser) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-xl border bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Vehicle Breakdown Assistance</h1>
        <p className="mt-2 text-slate-600">Quickly connect customers with nearby mechanics.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
            Login
          </Link>
          <Link to="/signup" className="rounded border px-4 py-2">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  if (!profile?.role) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-xl font-semibold">Welcome!</h2>
        <p className="mt-2 text-slate-600">Please complete your role and profile details first.</p>
        <Link to="/role-selection" className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white">
          Complete profile
        </Link>
      </div>
    );
  }

  if (profile.role === 'customer') return <CustomerDashboard />;

  return <MechanicDashboard />;
};

export default HomePage;
