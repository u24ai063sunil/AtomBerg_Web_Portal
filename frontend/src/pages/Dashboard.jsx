import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Overview from './dashboard/Overview';
import GoalSheet from './dashboard/GoalSheet';
import CheckIns from './dashboard/CheckIns';
import TeamReview from './dashboard/TeamReview';
import AdminConsole from './dashboard/AdminConsole';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-search">
                        {/* Placeholder for search or breadcrumbs */}
                    </div>
                    <div className="header-actions">
                        <div className="notification-bell">
                            {/* Icon here */}
                        </div>
                    </div>
                </header>
                
                <div className="dashboard-content">
                    <Routes>
                        <Route path="/" element={<Overview />} />
                        <Route path="/goals" element={<GoalSheet />} />
                        <Route path="/check-ins" element={<CheckIns />} />
                        <Route path="/team" element={<TeamReview />} />
                        <Route path="/admin" element={<AdminConsole />} />
                        {/* More routes as needed */}
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
