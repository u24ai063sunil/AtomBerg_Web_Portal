import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, BarChart, Trophy, ArrowRight, Star, HeartHandshake } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-container">
            {/* Glowing background circles for visual depth */}
            <div className="glow-circle primary"></div>
            <div className="glow-circle secondary"></div>

            <nav className="landing-nav animate-fade-in">
                <div className="nav-logo">
                    <div className="logo-icon-wrapper">
                        <img src="/atomberg-logo.png" alt="Atomberg" onError={(e) => { e.target.style.display = 'none'; }} />
                        <span className="logo-spark">⚡</span>
                    </div>
                    <span>AtomQuest</span>
                </div>
                <div className="nav-links">
                    <Link to="/login" className="login-link">Sign In</Link>
                    <Link to="/login" className="cta-btn">Initialize Portal <ArrowRight size={16} /></Link>
                </div>
            </nav>

            <main className="hero-section">
                <div className="hero-content">
                    <div className="badge-announcement animate-fade-in">
                        <span className="badge-pulse">●</span> Active Cycle: Q1 2026 Goal Alignment is LIVE
                    </div>
                    <h1 className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        Elevate Performance with <span className="gradient-text">Precision</span>
                    </h1>
                    <p className="hero-desc animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        The premium enterprise engine for OKR cascade tree mapping, real-time performance alignment, 
                        and peer kudos feedback. Specially tailored for Atomberg's R&D, Sales, and Supply Chain excellence.
                    </p>
                    <div className="hero-btns animate-fade-in" style={{ animationDelay: '0.3s' }}>
                        <Link to="/login" className="primary-btn">
                            Get Started Now <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                        </Link>
                        <Link to="/login" className="secondary-btn">Explore Features</Link>
                    </div>

                    <div className="client-logos animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <span className="logo-title">TRUSTED BY TEAMS IN</span>
                        <div className="logos-grid">
                            <span>BLDC Tech</span>
                            <span>Smart Appliances</span>
                            <span>Sales & R&D</span>
                            <span>Supply Chain</span>
                        </div>
                    </div>
                </div>
                
                <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="visual-card glass-card">
                        <div className="card-header">
                            <div className="dot red"></div>
                            <div className="dot yellow"></div>
                            <div className="dot green"></div>
                            <span className="card-title">AtomQuest Analytics Console</span>
                        </div>
                        <div className="card-body">
                            {/* Score ring */}
                            <div className="mock-analytics-header">
                                <div className="mock-score-ring">
                                    <svg viewBox="0 0 36 36" className="circular-chart indigo">
                                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="circle" strokeDasharray="84, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <div className="percentage">84%</div>
                                </div>
                                <div className="mock-metrics">
                                    <div className="metric-title">ALIGNMENT MATRIX</div>
                                    <div className="metric-value">Active Cascade</div>
                                    <div className="metric-status">● Synchronized</div>
                                </div>
                            </div>

                            {/* Active tasks list */}
                            <div className="mock-task-list">
                                <div className="mock-task-item">
                                    <div className="task-indicator max">MAX</div>
                                    <div className="task-details">
                                        <div className="task-title">Reduce BLDC Motor Core Losses</div>
                                        <div className="task-progress-bar"><div className="fill" style={{ width: '90%' }}></div></div>
                                    </div>
                                    <div className="task-score">90%</div>
                                </div>
                                <div className="mock-task-item">
                                    <div className="task-indicator min">MIN</div>
                                    <div className="task-details">
                                        <div className="task-title">Optimize Supply Chain Lead Time</div>
                                        <div className="task-progress-bar"><div className="fill" style={{ width: '75%' }}></div></div>
                                    </div>
                                    <div className="task-score">75%</div>
                                </div>
                            </div>

                            {/* Achievements Cabinet Preview */}
                            <div className="mock-badges-preview">
                                <span className="section-title">GAMIFICATION CABINET</span>
                                <div className="badges-row">
                                    <div className="badge-pill active">⚡ Early Aligner</div>
                                    <div className="badge-pill active">🎯 Alignment Champion</div>
                                    <div className="badge-pill active">🤝 Feedback Friend</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <section className="features-grid">
                <div className="feature-card glass-panel">
                    <div className="icon-wrapper sec">
                        <Shield className="feature-icon" />
                    </div>
                    <h3>Secure Enterprise SSO</h3>
                    <p>Seamless role management, manager assignment matrices, and secure login with zero maintenance.</p>
                </div>
                <div className="feature-card glass-panel">
                    <div className="icon-wrapper prim">
                        <Zap className="feature-icon" />
                    </div>
                    <h3>Real-time OKR Cascade</h3>
                    <p>Dynamically trace corporate shared targets down to individual goals and contributions instantly.</p>
                </div>
                <div className="feature-card glass-panel">
                    <div className="icon-wrapper tert">
                        <Trophy className="feature-icon" />
                    </div>
                    <h3>Digital Achievements</h3>
                    <p>Boost alignment and team culture with automated event badges and continuous coworker praise feeds.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>© 2026 Atomberg Technologies. All rights reserved. AtomQuest performance portal.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
