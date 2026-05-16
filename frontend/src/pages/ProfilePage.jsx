import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Camera, Lock, Save, Briefcase, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Avatar from '../components/Avatar';
import './ProfilePage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        designation: '',
        department: '',
        picture: '',
        managerId: ''
    });
    const [managers, setManagers] = useState([]);
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/auth/managers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setManagers(res.data);
        } catch (err) {
            console.error('Failed to fetch managers');
        }
    };

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                designation: user.designation || '',
                department: user.department || '',
                picture: user.picture || '',
                managerId: user.managerId || ''
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`${API_URL}/auth/profile`, profile, {
                headers: { Authorization: `Bearer ${token}` }
            });
            updateUser(profile); // Optimistic update
            setMsg({ type: 'success', text: 'Profile updated successfully' });
            // Optionally refresh user context
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update profile' });
        } finally { setLoading(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/change-password`, passwords, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMsg({ type: 'success', text: 'Password changed successfully' });
            setPasswords({ oldPassword: '', newPassword: '' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/auth/profile-picture`, formData, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfile({ ...profile, picture: res.data.picture });
            updateUser({ picture: res.data.picture }); // Optimistic update
            setMsg({ type: 'success', text: 'Profile picture updated' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Image upload failed' });
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                <div className="profile-container animate-fade-in">
                    <div className="page-header">
                        <h1>User Profile</h1>
                        <p>Manage your account settings and preferences.</p>
                    </div>

                    {msg.text && (
                        <div className={`alert ${msg.type}`} style={{ marginBottom: '1.5rem' }}>
                            {msg.text}
                        </div>
                    )}

                    <div className="profile-grid">
                        <div className="profile-card glass-card main-info">
                            <div className="avatar-section">
                                <div className="profile-avatar-wrapper">
                                    <Avatar src={profile.picture} name={profile.name} size={150} />
                                    <label className="upload-label">
                                        <Camera size={20} />
                                        <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                                    </label>
                                </div>
                                <h2>{profile.name}</h2>
                                <p>{user?.role?.toUpperCase()}</p>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="profile-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-with-icon">
                                            <User size={18} />
                                            <input 
                                                type="text" 
                                                value={profile.name} 
                                                onChange={(e) => setProfile({...profile, name: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-with-icon">
                                            <Mail size={18} />
                                            <input type="email" value={profile.email} disabled />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Designation</label>
                                        <div className="input-with-icon">
                                            <Briefcase size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Senior Developer"
                                                value={profile.designation} 
                                                onChange={(e) => setProfile({...profile, designation: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <div className="input-with-icon">
                                            <Building size={18} />
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Engineering"
                                                value={profile.department} 
                                                onChange={(e) => setProfile({...profile, department: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Reporting Manager</label>
                                    <div className="input-with-icon">
                                        <User size={18} />
                                        <select 
                                            value={profile.managerId} 
                                            onChange={(e) => setProfile({...profile, managerId: e.target.value})}
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', width: '100%', padding: '0.75rem 0' }}
                                        >
                                            <option value="" style={{ background: 'var(--bg-card)' }}>Select a Manager</option>
                                            {managers.map(m => (
                                                <option key={m._id} value={m._id} style={{ background: 'var(--bg-card)' }}>
                                                    {m.name} ({m.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button type="submit" className="primary-btn" disabled={loading}>
                                    <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>

                        <div className="profile-card glass-card security-info">
                            <h3><Lock size={20} /> Security</h3>
                            <p className="hint">Update your password to keep your account secure.</p>
                            
                            <form onSubmit={handleChangePassword} className="security-form">
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwords.oldPassword} 
                                            onChange={(e) => setPasswords({...passwords, oldPassword: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input 
                                            type="password" 
                                            placeholder="••••••••"
                                            value={passwords.newPassword} 
                                            onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="primary-btn w-full">
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
