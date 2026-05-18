import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

// Original stubs - we keep Overview for the welcome page
import Overview from './dashboard/Overview';

// Our new highly detailed components
import GoalSheetPage from './GoalSheetPage';
import EmployeeCheckIn from './EmployeeCheckIn';
import ManagerDashboard from './ManagerDashboard';
import ManagerApprovalPage from './ManagerApprovalPage';
import ManagerCheckIn from './ManagerCheckIn';
import AdminOverview from './AdminOverview';
import AnalyticsDashboard from './AnalyticsDashboard';
import ProfilePage from './ProfilePage';

import './Dashboard.css';

const RoleRoute = ({ allowedRoles, children }) => {
    const { user } = useAuth();
    const role = user?.role?.toUpperCase() || 'EMPLOYEE';
    if (!allowedRoles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

const Dashboard = () => {
    const { user } = useAuth();
    const role = user?.role?.toUpperCase() || 'EMPLOYEE';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="dashboard-layout">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            {/* Dark Dim Overlay when Sidebar is toggled open on Mobile */}
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            <main className="dashboard-main">
                {/* Mobile Top Bar */}
                <div className="mobile-top-bar">
                    <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} title="Open Menu">
                        <Menu size={24} />
                    </button>
                    <div className="mobile-logo">
                        <img src="/atomberg-logo.png" alt="Atomberg" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span>AtomQuest</span>
                    </div>
                    <div style={{ width: 24 }}></div>
                </div>
                
                <div className="dashboard-content" style={{padding: 0, height: '100vh', overflowY: 'auto'}}>
                    <Routes>
                        <Route path="/" element={role === 'ADMIN' ? <Navigate to="/dashboard/admin" replace /> : <Overview />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/goals" element={<GoalSheetPage />} />
                        <Route path="/check-ins" element={<EmployeeCheckIn />} />
                        <Route path="/team" element={<RoleRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerDashboard /></RoleRoute>} />
                        <Route path="/manager/approve/:sheetId" element={<RoleRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerApprovalPage /></RoleRoute>} />
                        <Route path="/manager/check-ins" element={<RoleRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerCheckIn /></RoleRoute>} />
                        <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><AdminOverview /></RoleRoute>} />
                        <Route path="/reports" element={<RoleRoute allowedRoles={['ADMIN']}><AnalyticsDashboard /></RoleRoute>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
