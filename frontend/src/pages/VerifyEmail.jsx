import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Mail } from 'lucide-react';
import './LoginPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/auth/verify-email`, { email, code });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box glass-card animate-fade-in">
                <div className="logo-section">
                    <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
                    <h1>Verify Email</h1>
                    <p className="subtitle">We've sent a code to {email}</p>
                </div>

                {success ? (
                    <div className="alert success">
                        Email verified! Redirecting to login...
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="alert error">{error}</div>}
                        <div className="form-group-auth">
                            <Mail size={18} />
                            <input 
                                type="text" 
                                placeholder="6-digit code" 
                                required 
                                maxLength="6"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="primary-btn w-full">
                            Verify Account
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
