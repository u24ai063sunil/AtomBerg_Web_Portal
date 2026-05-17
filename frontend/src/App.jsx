import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import AuthSuccess from './pages/AuthSuccess';

// Admin / Demo extra pages (If you want them accessible directly)
import EscalationConfigPage from './pages/EscalationConfigPage';
import EscalationLogsPage from './pages/EscalationLogsPage';
import TeamsPreviewPage from './pages/TeamsPreviewPage';

import './index.css';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          
          {/* Unified Core Portal Layout (Wrapped in Sidebar) */}
          <Route 
            path="/dashboard/*" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* External standalone testing routes for Escalations/Teams */}
          <Route path="/escalations/config" element={<EscalationConfigPage />} />
          <Route path="/escalations/logs" element={<EscalationLogsPage />} />
          <Route path="/teams-preview" element={<TeamsPreviewPage />} />
        </Routes>
        
      </Router>
    </AuthProvider>
  );
}

export default App;
