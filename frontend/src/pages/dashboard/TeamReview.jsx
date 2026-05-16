import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, CheckCircle, RotateCcw, User } from 'lucide-react';
import Avatar from '../../components/Avatar';
import './TeamReview.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TeamReview = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [cycle, setCycle] = useState('2024-25');

    useEffect(() => {
        fetchTeam();
    }, [cycle]);

    const fetchTeam = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/manager/team?cycle=${cycle}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTeam(res.data);
        } catch (err) {
            console.error('Failed to fetch team');
        } finally {
            setLoading(false);
        }
    };

    const approveGoalSheet = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/manager/approve`, { goalSheetId: id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTeam();
        } catch (err) {
            alert('Approval failed');
        }
    };

    if (loading) return <div>Loading team data...</div>;

    return (
        <div className="team-review-container animate-fade-in">
            <div className="page-header">
                <h1>Team Review</h1>
                <p>Monitor and manage goal sheets for your direct reports.</p>
            </div>

            <div className="team-grid">
                {team.length === 0 ? (
                    <div className="glass-card empty-state" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center' }}>
                        <User size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
                        <h3>No Team Members Found</h3>
                        <p style={{ color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto' }}>
                            Ask your direct reports to select you as their **Reporting Manager** in their Profile settings to see them here.
                        </p>
                    </div>
                ) : (
                    team.map((member) => (
                        <div key={member._id} className="member-card glass-card">
                            <div className="member-info">
                                <Avatar src={member.picture} name={member.name} size={60} />
                                <div>
                                    <h3>{member.name}</h3>
                                    <p className="member-email">{member.email}</p>
                                </div>
                            </div>
                            
                            <div className="member-status-section">
                                <div className={`status-badge ${member.goalSheetStatus}`}>
                                    {member.goalSheetStatus.replace('_', ' ')}
                                </div>
                                
                                <div className="action-btns">
                                    {member.goalSheetId && (
                                        <>
                                            <button className="icon-btn" title="View Details">
                                                <Eye size={18} />
                                            </button>
                                            {member.goalSheetStatus === 'submitted' && (
                                                <button 
                                                    className="icon-btn success" 
                                                    title="Approve"
                                                    onClick={() => approveGoalSheet(member.goalSheetId)}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {member.goalSheetStatus === 'submitted' && (
                                                <button className="icon-btn error" title="Return for Rework">
                                                    <RotateCcw size={18} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TeamReview;
