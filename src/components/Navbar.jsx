import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { currentUser, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-blue-700">
          Breakdown Assist
        </Link>
        {currentUser && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{profile?.role || 'No role selected'}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-slate-800 px-3 py-1 text-sm text-white"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
