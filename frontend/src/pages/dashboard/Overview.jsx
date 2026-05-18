import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp, Clock, AlertCircle, Award, Send, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BADGE_TEMPLATES = [
    { id: 'early_aligner', name: 'Early Aligner', icon: '⚡', desc: 'Submitted Goal Sheet ahead of the cycle deadline!' },
    { id: 'alignment_champion', name: 'Alignment Champion', icon: '🎯', desc: 'Goalsheet aligned and officially approved by manager!' },
    { id: 'champion_reviewer', name: 'Champion Reviewer', icon: '⭐', desc: 'Approved your direct reportee goal sheet in record time!' },
    { id: 'feedback_friend', name: 'Feedback Friend', icon: '🤝', desc: 'Sent your very first coworker kudos appreciation card!' },
    { id: 'praise_magnet', name: 'Praise Magnet', icon: '🧲', desc: 'Received public recognition from an aligned teammate!' }
];

const THRUST_AREAS = [
    'R&D / BLDC Innovation',
    'Smart Appliances & IoT',
    'Supply Chain & Manufacturing',
    'D2C Sales & Marketing',
    'Customer Experience & Support'
];

const Overview = () => {
    const { user } = useAuth();
    const [achievements, setAchievements] = useState([]);
    const [praises, setPraises] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [stats, setStats] = useState([]);
    
    // Praise Form State
    const [receiverId, setReceiverId] = useState('');
    const [message, setMessage] = useState('');
    const [thrustArea, setThrustArea] = useState(THRUST_AREAS[0]);
    const [submittingPraise, setSubmittingPraise] = useState(false);
    const [showKudosForm, setShowKudosForm] = useState(false);
    const [praiseSuccess, setPraiseSuccess] = useState('');
    const [praiseError, setPraiseError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Fetch Achievements
            const achRes = await axios.get(`${API_URL}/gamification/achievements`, { headers });
            if (achRes.data?.success) {
                setAchievements(achRes.data.achievements);
            }

            // 2. Fetch Praises
            const praiseRes = await axios.get(`${API_URL}/gamification/praise`, { headers });
            if (praiseRes.data?.success) {
                setPraises(praiseRes.data.praises);
            }

            // 3. Fetch All Users for Kudos select dropdown
            const usersRes = await axios.get(`${API_URL}/auth/users`, { headers });
            if (usersRes.data) {
                // Filter out self
                const others = usersRes.data.filter(u => u.email !== user?.email);
                setUsersList(others);
            }

            // 4. Load dynamic stats
            const pendingVal = user?.role === 'MANAGER' ? '3' : '0';
            setStats([
                { title: 'Active Goals', value: '5', icon: <Target />, color: 'var(--primary)' },
                { title: 'Current Achievement', value: '68%', icon: <TrendingUp />, color: 'var(--success)' },
                { title: 'Days to Q1 Review', value: '12', icon: <Clock />, color: 'var(--warning)' },
                { title: 'Pending Approvals', value: pendingVal, icon: <AlertCircle />, color: 'var(--error)' },
            ]);

        } catch (err) {
            console.error("Dashboard overview data load error", err);
        }
    };

    const handleSendPraise = async (e) => {
        e.preventDefault();
        if (!receiverId || !message || !thrustArea) {
            setPraiseError('Please select a recipient, a thrust area, and write a message.');
            return;
        }

        setSubmittingPraise(true);
        setPraiseError('');
        setPraiseSuccess('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/gamification/praise`, {
                receiverId,
                message,
                thrustArea
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.success) {
                setPraiseSuccess('Kudos successfully sent! 🤝 Badge updated!');
                setMessage('');
                setReceiverId('');
                setShowKudosForm(false);
                // Refresh data to update cabinet & feed
                fetchDashboardData();
                setTimeout(() => setPraiseSuccess(''), 4000);
            }
        } catch (err) {
            setPraiseError(err.response?.data?.message || 'Failed to dispatch kudos.');
        } finally {
            setSubmittingPraise(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="page-header">
                <h1>Welcome back, {user?.name}!</h1>
                <p>Here's what's happening with your goals and alignments this quarter.</p>
            </div>

            {/* Dynamic Stats Grid */}
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

            {/* Achievements Cabinet Section */}
            <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Award style={{ color: 'var(--warning)' }} size={24} />
                    <h2 style={{ margin: 0 }}>Achievements Cabinet</h2>
                </div>
                <div className="badge-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {BADGE_TEMPLATES.map(badge => {
                        const isUnlocked = achievements.some(a => a.id === badge.id);
                        const match = achievements.find(a => a.id === badge.id);
                        return (
                            <div key={badge.id} className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`} style={{
                                background: isUnlocked ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.05))' : 'rgba(255, 255, 255, 0.02)',
                                border: isUnlocked ? '1px solid var(--primary)' : '1px dashed var(--border)',
                                borderRadius: '16px',
                                padding: '1.5rem 1rem',
                                textAlign: 'center',
                                transition: 'all 0.3s ease',
                                opacity: isUnlocked ? 1 : 0.4
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.75rem', filter: isUnlocked ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' : 'grayscale(100%)' }}>
                                    {badge.icon}
                                </div>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: isUnlocked ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '1rem' }}>{badge.name}</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{badge.desc}</p>
                                {isUnlocked && (
                                    <div style={{ fontSize: '0.65rem', color: 'var(--success)', marginTop: '0.75rem', fontWeight: 600 }}>
                                        🔓 Unlocked {new Date(match.unlockedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Praise Wall & Kudos Grid */}
            <div className="dashboard-grid" style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 1fr',
                gap: '2rem'
            }}>
                {/* Public Praise Feed */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Users style={{ color: 'var(--success)' }} size={24} />
                            <h2 style={{ margin: 0 }}>Coworker Praise Wall</h2>
                        </div>
                        <button 
                            className="primary-btn" 
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            onClick={() => setShowKudosForm(!showKudosForm)}
                        >
                            🤝 Send Kudos
                        </button>
                    </div>

                    {/* Praise Sending Form Overlay/Inline */}
                    {showKudosForm && (
                        <form onSubmit={handleSendPraise} className="kudos-form glass-card" style={{
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            animation: 'slide-down 0.3s ease'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--primary)' }}>Recognize a Teammate</h3>
                            {praiseError && <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}><ShieldAlert size={14} style={{ display: 'inline', marginRight: '4px' }} /> {praiseError}</div>}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teammate</label>
                                    <select 
                                        value={receiverId}
                                        onChange={(e) => setReceiverId(e.target.value)}
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '6px' }}
                                    >
                                        <option value="">Select Coworker...</option>
                                        {usersList.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.department || 'General'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Thrust Area Value</label>
                                    <select 
                                        value={thrustArea}
                                        onChange={(e) => setThrustArea(e.target.value)}
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '6px' }}
                                    >
                                        {THRUST_AREAS.map(ta => (
                                            <option key={ta} value={ta}>{ta}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Praise Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write a clear appreciation message describing how they demonstrated this alignment..."
                                    rows="3"
                                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '6px', resize: 'none' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" className="secondary-btn" onClick={() => setShowKudosForm(false)} style={{ padding: '0.4rem 1rem' }}>Cancel</button>
                                <button type="submit" className="primary-btn" disabled={submittingPraise} style={{ padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Send size={14} /> Send Kudos
                                </button>
                            </div>
                        </form>
                    )}

                    {praiseSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem' }}>{praiseSuccess}</div>}

                    {/* Praises List Feed */}
                    <div style={{
                        maxHeight: '400px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        paddingRight: '0.5rem'
                    }}>
                        {praises.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                <Award size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No praises received yet. Be the first to appreciate a teammate!</p>
                            </div>
                        ) : (
                            praises.map(praise => (
                                <div key={praise._id} className="praise-card glass-card" style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                background: 'var(--primary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1.25rem',
                                                fontWeight: 800,
                                                color: '#ffffff'
                                            }}>
                                                {praise.senderId?.name ? praise.senderId.name[0] : 'U'}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{praise.senderId?.name || 'Teammate'}</h4>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{praise.senderId?.designation || 'Aligned Peer'}</p>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1.5rem' }}>🤝</div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5', background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                        Recognized <strong>{praise.receiverId?.name || 'Teammate'}</strong>: "{praise.message}"
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                        <span style={{
                                            background: 'rgba(99, 102, 241, 0.15)',
                                            color: 'var(--primary)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '20px',
                                            fontWeight: 600
                                        }}>
                                            🏷️ {praise.thrustArea}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {new Date(praise.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Upcoming deadlines cabinet */}
                <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h2>Upcoming Cycles & Deadlines</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <Clock style={{ color: 'var(--warning)', marginTop: '2px' }} size={18} />
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0' }}>Q1 Goal Sheet Lock</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Deadline: June 1st, 2026</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <Clock style={{ color: 'var(--primary)', marginTop: '2px' }} size={18} />
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0' }}>Q1 Performance Check-in</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Begins: July 15th, 2026</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <Award style={{ color: 'var(--success)', marginTop: '2px' }} size={18} />
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0' }}>Appraisal Multipliers Release</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target: October 30th, 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Overview;
