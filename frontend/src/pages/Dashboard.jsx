import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

// Original stubs - we keep Overview for the welcome page
import Overview from './dashboard/Overview';

// Our new highly detailed components
import GoalSheetPage from './GoalSheetPage';
import EmployeeCheckIn from './EmployeeCheckIn';
import ManagerDashboard from './ManagerDashboard';
import ManagerApprovalPage from './ManagerApprovalPage';
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

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                {/* Optional Header - usually handled internally by the new pages, but we can keep a simple top bar if needed */}
                <header className="dashboard-header" style={{display:'none'}}>
                </header>
                
                <div className="dashboard-content" style={{padding: 0, height: '100vh', overflowY: 'auto'}}>
                    <Routes>
                        <Route path="/" element={role === 'ADMIN' ? <Navigate to="/dashboard/admin" replace /> : <Overview />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/goals" element={<GoalSheetPage />} />
                        <Route path="/check-ins" element={<EmployeeCheckIn />} />
                        <Route path="/team" element={<RoleRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerDashboard /></RoleRoute>} />
                        <Route path="/manager/approve/:sheetId" element={<RoleRoute allowedRoles={['MANAGER', 'ADMIN']}><ManagerApprovalPage /></RoleRoute>} />
                        <Route path="/admin" element={<RoleRoute allowedRoles={['ADMIN']}><AdminOverview /></RoleRoute>} />
                        <Route path="/reports" element={<RoleRoute allowedRoles={['ADMIN']}><AnalyticsDashboard /></RoleRoute>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
