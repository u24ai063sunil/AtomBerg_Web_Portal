import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, Mail, Lock, User, Briefcase } from 'lucide-react';
import './LoginPage.css'; // Reuse login styles

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'employee'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${API_URL}/auth/signup`, formData);
            navigate(`/verify-email?email=${formData.email}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass-card animate-fade-in">
                <div className="logo-section">
                    <div className="logo-circle">
                        <img src="/atomberg-logo.png" alt="Atomberg" className="logo-img" />
                    </div>
                    <div className="title-group">
                        <h1>Join AtomQuest</h1>
                        <p className="subtitle">CREATE YOUR ACCOUNT</p>
                    </div>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="alert error">{error}</div>}
                    
                    <div className="form-group-auth">
                        <User size={18} />
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            required 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>

                    <div className="form-group-auth">
                        <Mail size={18} />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            required 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    <div className="form-group-auth">
                        <Lock size={18} />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <div className="form-group-auth">
                        <Briefcase size={18} />
                        <select 
                            value={formData.role}
                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                        >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">HR / Admin</option>
                        </select>
                    </div>

                    <button type="submit" className="primary-btn w-full" disabled={loading}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <p className="footer-text">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default SignupPage;
