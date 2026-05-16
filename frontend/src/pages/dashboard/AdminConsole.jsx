import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BarChart2, Shield, Settings } from 'lucide-react';
import Avatar from '../../components/Avatar';
import './AdminConsole.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminConsole = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [usersRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setUsers(usersRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading admin console...</div>;

    return (
        <div className="admin-console-container animate-fade-in">
            <div className="page-header">
                <h1>Admin Console</h1>
                <p>Oversee organization performance and manage access.</p>
            </div>

            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)' }}>
                        <Users />
                    </div>
                    <div className="stat-info">
                        <h3>Total Employees</h3>
                        <div className="stat-value">{stats?.totalEmployees}</div>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ color: 'var(--info)', background: 'rgba(59, 130, 246, 0.1)' }}>
                        <BarChart2 />
                    </div>
                    <div className="stat-info">
                        <h3>Submitted Goals</h3>
                        <div className="stat-value">{stats?.submittedCount}</div>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="stat-icon" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)' }}>
                        <Shield />
                    </div>
                    <div className="stat-info">
                        <h3>Approved Goals</h3>
                        <div className="stat-value">{stats?.approvedCount}</div>
                    </div>
                </div>
            </div>

            <div className="glass-card users-table-card">
                <div className="card-header-with-actions">
                    <h2>User Management</h2>
                    <button className="secondary-btn">
                        <Settings size={16} /> Sync with Azure AD
                    </button>
                </div>
                
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Manager</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>
                                    <div className="user-cell">
                                        <Avatar src={user.picture} name={user.name} size={32} />
                                        <div>
                                            <div className="user-name-cell">{user.name}</div>
                                            <div className="user-email-cell">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                                </td>
                                <td>{user.managerId?.name || 'Not Assigned'}</td>
                                <td>
                                    <button className="edit-link">Edit Access</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminConsole;
