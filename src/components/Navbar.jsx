import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { currentUser, profile, profileLoading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="app-navbar">
      <div className="container-ui app-navbar-inner">

        {/* BRAND */}

        <Link
          to="/"
          className="brand-link"
        >
          <span className="brand-mark" aria-hidden="true">
            G
          </span>

          <span className="brand-name">
            GarageGo
          </span>
        </Link>

        {/* RIGHT SIDE */}

        {currentUser && (
          <div className="app-navbar-actions">

            {/* ROLE BADGE */}

            <span className="nav-role-badge">
              {profileLoading ? "loading..." : (profile?.role || "setup")}
            </span>

            {/* LOGOUT */}

            <button
              onClick={handleLogout}
              className="nav-logout-button"
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
