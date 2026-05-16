import React from 'react';
import { Target, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Overview = () => {
    const { user } = useAuth();

    const stats = [
        { title: 'Active Goals', value: '5', icon: <Target />, color: 'var(--primary)' },
        { title: 'Current Achievement', value: '68%', icon: <TrendingUp />, color: 'var(--success)' },
        { title: 'Days to Q1 Review', value: '12', icon: <Clock />, color: 'var(--warning)' },
        { title: 'Pending Approvals', value: user?.role === 'manager' ? '3' : '0', icon: <AlertCircle />, color: 'var(--error)' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1>Welcome back, {user?.name}!</h1>
                <p>Here's what's happening with your goals this quarter.</p>
            </div>

            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="glass-card stat-card">
                        <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}15` }}>
                            {stat.icon}
                        </div>
                        <div className="stat-info">
                            <h3>{stat.title}</h3>
                            <div className="stat-value">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-grid">
                <div className="glass-card">
                    <h2>Recent Activity</h2>
                    <div style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
                        No recent activity found.
                    </div>
                </div>
                <div className="glass-card">
                    <h2>Upcoming Deadlines</h2>
                    <div style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>
                        Q1 Goal Submission: 1st June
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
