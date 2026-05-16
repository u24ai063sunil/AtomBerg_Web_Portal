import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle, Clock, Info } from 'lucide-react';
import './CheckIns.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CheckIns = () => {
    const [goalSheet, setGoalSheet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quarter, setQuarter] = useState('q1');
    const [cycle, setCycle] = useState('2024-25');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchGoalSheet();
    }, [cycle]);

    const fetchGoalSheet = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/goals/me?cycle=${cycle}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGoalSheet(res.data);
        } catch (err) {
            console.error('Failed to fetch goals');
        } finally {
            setLoading(false);
        }
    };

    const updateAchievement = (goalIndex, field, value) => {
        const newGoalSheet = { ...goalSheet };
        if (!newGoalSheet.goals[goalIndex].achievements) {
            newGoalSheet.goals[goalIndex].achievements = { q1: {}, q2: {}, q3: {}, q4: {} };
        }
        newGoalSheet.goals[goalIndex].achievements[quarter][field] = value;
        setGoalSheet(newGoalSheet);
    };

    const saveAchievements = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/goals`, goalSheet, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Achievements updated successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Failed to save achievements');
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!goalSheet || goalSheet.status !== 'approved') {
        return (
            <div className="glass-card text-center" style={{ padding: '4rem' }}>
                <Info size={48} className="text-dim" style={{ marginBottom: '1rem' }} />
                <h3>No Approved Goals Found</h3>
                <p>You can only track achievements once your manager has approved your goal sheet.</p>
            </div>
        );
    }

    return (
        <div className="check-ins-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>Quarterly Check-ins</h1>
                    <p>Log your progress and actual achievements for {cycle}.</p>
                </div>
                <div className="quarter-selector">
                    {['q1', 'q2', 'q3', 'q4'].map(q => (
                        <button 
                            key={q} 
                            className={`q-btn ${quarter === q ? 'active' : ''}`}
                            onClick={() => setQuarter(q)}
                        >
                            {q.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {success && <div className="alert success">{success}</div>}

            <div className="goals-tracking-list">
                {goalSheet.goals.map((goal, index) => {
                    const achievement = goal.achievements?.[quarter] || { actual: '', status: 'Not Started' };
                    return (
                        <div key={index} className="tracking-card glass-card">
                            <div className="tracking-info">
                                <h3>{goal.title}</h3>
                                <div className="goal-meta">
                                    <span>Target: <strong>{goal.target}</strong></span>
                                    <span>UoM: <strong>{goal.uom}</strong></span>
                                    <span>Weightage: <strong>{goal.weightage}%</strong></span>
                                </div>
                            </div>
                            
                            <div className="tracking-inputs">
                                <div className="form-group">
                                    <label>Actual Achievement</label>
                                    <input 
                                        type={goal.uom === 'timeline' ? 'date' : 'text'} 
                                        placeholder="Enter actual value"
                                        value={achievement.actual || ''}
                                        onChange={(e) => updateAchievement(index, 'actual', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select 
                                        value={achievement.status || 'Not Started'}
                                        onChange={(e) => updateAchievement(index, 'status', e.target.value)}
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="On Track">On Track</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="footer-actions">
                <button className="primary-btn" onClick={saveAchievements}>
                    Update All Achievements
                </button>
            </div>
        </div>
    );
};

export default CheckIns;
