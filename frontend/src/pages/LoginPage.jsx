import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    const handleNormalLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/auth/login`, formData);
            login(res.data.token, res.data.user);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
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
                        <h1>AtomQuest 1.0</h1>
                        <p className="subtitle">Goal Setting & Tracking Portal</p>
                    </div>
                </div>
                
                <form className="auth-form" onSubmit={handleNormalLogin}>
                    {error && <div className="alert error">{error}</div>}
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
                    <button type="submit" className="primary-btn w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button className="google-btn" onClick={handleGoogleLogin}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                    <span>Continue with Google</span>
                </button>
                
                <p className="footer-text">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
            <div className="bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
        </div>
    );
};

export default LoginPage;
