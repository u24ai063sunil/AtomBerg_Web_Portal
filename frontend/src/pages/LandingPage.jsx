import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, BarChart, UserCheck } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="nav-logo">
                    <img src="/atomberg-logo.png" alt="Atomberg" />
                    <span>AtomQuest</span>
                </div>
                <div className="nav-links">
                    <Link to="/login" className="login-link">Sign In</Link>
                    <Link to="/login" className="cta-btn">Get Started</Link>
                </div>
            </nav>

            <main className="hero-section">
                <div className="hero-content">
                    <h1 className="animate-fade-in">
                        Elevate Performance with <span className="gradient-text">Precision</span>
                    </h1>
                    <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        The unified platform for goal alignment, real-time tracking, and quarterly excellence. 
                        Empower your team to reach new heights.
                    </p>
                    <div className="hero-btns animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <Link to="/login" className="primary-btn">Initialize Portal</Link>
                        <button className="secondary-btn">Watch Demo</button>
                    </div>
                </div>
                
                <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="visual-card glass-card">
                        <div className="card-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                        </div>
                        <div className="card-body">
                            <div className="skeleton-line long"></div>
                            <div className="skeleton-line mid"></div>
                            <div className="skeleton-grid">
                                <div className="skeleton-box"></div>
                                <div className="skeleton-box"></div>
                                <div className="skeleton-box"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <section className="features">
                <div className="feature-card">
                    <Shield className="feature-icon" />
                    <h3>Secure Alignment</h3>
                    <p>Roles and permissions managed via Microsoft Entra ID integration.</p>
                </div>
                <div className="feature-card">
                    <Zap className="feature-icon" />
                    <h3>Real-time Insights</h3>
                    <p>Track progress with system-computed scores and live dashboards.</p>
                </div>
                <div className="feature-card">
                    <BarChart className="feature-icon" />
                    <h3>Audit-Ready</h3>
                    <p>Complete version history and change logs for every goal sheet.</p>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
