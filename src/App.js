import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import SavedItineraries from './pages/SavedItineraries';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useAuth } from './contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './components/PrivateRoute';
import 'leaflet/dist/leaflet.css';
import PlanJourney from './pages/PlanJourney';

function App() {
  const { user, logout } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 p-6 font-sans">
        <nav className="mb-6 text-sm flex items-center gap-4">
          <Link to="/" className="text-indigo-600 hover:underline">🏠 Home</Link>
          <Link to="/plan" className="text-indigo-600 hover:underline">🚆 Plan</Link>
          <Link to="/saved" className="text-indigo-600 hover:underline">💾 Saved</Link>

          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-700">👤 {user.username}</span>
                <button
                  onClick={logout}
                  className="text-red-600 hover:underline text-sm"
                >
                  🔓 Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-indigo-600 hover:underline">🔐 Login</Link>
                <Link to="/signup" className="text-indigo-600 hover:underline">📝 Signup</Link>
              </>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plan" element={<PlanJourney />} />
          <Route
            path="/saved"
            element={
              <PrivateRoute>
                <SavedItineraries />
              </PrivateRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;