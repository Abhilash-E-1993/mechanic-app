import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import SignupPage from './pages/SignupPage';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  return children;
};

const App = () => (
  <div className="min-h-screen bg-slate-50">
    <Navbar />
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/role-selection"
          element={
            <ProtectedRoute>
              <RoleSelectionPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>
  </div>
);

export default App;
