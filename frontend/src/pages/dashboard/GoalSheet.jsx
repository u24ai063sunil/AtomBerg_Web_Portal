import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react';
import './GoalSheet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const GoalSheet = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('draft');
    const [cycle, setCycle] = useState('2024-25');
    const [error, setError] = useState('');
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
            if (res.data) {
                setGoals(res.data.goals || []);
                setStatus(res.data.status);
            }
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('Failed to fetch goals');
            }
        } finally {
            setLoading(false);
        }
    };

    const addGoal = () => {
        if (goals.length >= 8) {
            setError('Maximum 8 goals allowed');
            return;
        }
        setGoals([...goals, {
            title: '',
            description: '',
            thrustArea: 'R&D / BLDC Innovation',
            uom: 'numeric',
            target: '',
            weightage: 10
        }]);
    };

    const removeGoal = (index) => {
        const newGoals = goals.filter((_, i) => i !== index);
        setGoals(newGoals);
    };

    const updateGoal = (index, field, value) => {
        const newGoals = [...goals];
        newGoals[index][field] = value;
        setGoals(newGoals);
    };

    const totalWeight = goals.reduce((sum, g) => sum + Number(g.weightage), 0);

    const saveDraft = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/goals`, { goals, cycle, status: 'draft' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuccess('Draft saved successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save draft');
        }
    };

    const submitGoals = async () => {
        if (totalWeight !== 100) {
            setError('Total weightage must equal 100%');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/goals/submit`, { cycle }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus('submitted');
            setSuccess('Goals submitted for approval');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit goals');
        }
    };

    if (loading) return <div>Loading goal sheet...</div>;

    const isLocked = status === 'submitted' || status === 'approved';

    return (
        <div className="goal-sheet-container animate-fade-in">
            <div className="page-header">
                <div>
                    <h1>My Goal Sheet</h1>
                    <p>Cycle: {cycle} • Status: <span className={`status-badge ${status}`}>{status}</span></p>
                </div>
                {!isLocked && (
                    <div className="header-btns">
                        <button className="secondary-btn" onClick={saveDraft}>
                            <Save size={18} /> Save Draft
                        </button>
                        <button className="primary-btn" onClick={submitGoals}>
                            <Send size={18} /> Submit for Approval
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="alert error"><AlertCircle size={20} /> {error}</div>}
            {success && <div className="alert success">{success}</div>}

            <div className="weightage-summary glass-card">
                <div className="weight-info">
                    <span>Total Weightage:</span>
                    <span className={totalWeight === 100 ? 'text-success' : 'text-error'}>
                        {totalWeight}%
                    </span>
                </div>
                <div className="weight-bar-bg">
                    <div className="weight-bar-fill" style={{ width: `${Math.min(totalWeight, 100)}%`, backgroundColor: totalWeight === 100 ? 'var(--success)' : 'var(--primary)' }}></div>
                </div>
                {totalWeight !== 100 && <p className="hint">Sum of all goal weightages must be exactly 100%.</p>}
            </div>

            <div className="goals-list">
                {goals.map((goal, index) => (
                    <div key={index} className="goal-card glass-card">
                        <div className="goal-card-header">
                            <h3>Goal #{index + 1}</h3>
                            {!isLocked && (
                                <button className="delete-btn" onClick={() => removeGoal(index)}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                        
                        <div className="goal-form-grid">
                            <div className="form-group">
                                <label>Atomberg Thrust Area</label>
                                <select 
                                    disabled={isLocked}
                                    value={goal.thrustArea} 
                                    onChange={(e) => updateGoal(index, 'thrustArea', e.target.value)}
                                >
                                    <option value="R&D / BLDC Innovation">R&D / BLDC Innovation</option>
                                    <option value="Smart Appliances & IoT">Smart Appliances & IoT</option>
                                    <option value="Supply Chain & Manufacturing">Supply Chain & Manufacturing</option>
                                    <option value="D2C Sales & Marketing">D2C Sales & Marketing</option>
                                    <option value="Customer Experience & Support">Customer Experience & Support</option>
                                </select>
                            </div>
                            
                            <div className="form-group span-2">
                                <label>Goal Title</label>
                                <input 
                                    disabled={isLocked}
                                    type="text" 
                                    placeholder="Enter a descriptive title" 
                                    value={goal.title}
                                    onChange={(e) => updateGoal(index, 'title', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>UoM</label>
                                <select 
                                    disabled={isLocked}
                                    value={goal.uom} 
                                    onChange={(e) => updateGoal(index, 'uom', e.target.value)}
                                >
                                    <option value="numeric">Numeric (Higher is better)</option>
                                    <option value="percentage">% (Higher is better)</option>
                                    <option value="timeline">Timeline (Date-based)</option>
                                    <option value="zero-based">Zero-based (0 = Success)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Target</label>
                                <input 
                                    disabled={isLocked}
                                    type={goal.uom === 'timeline' ? 'date' : 'text'} 
                                    placeholder="Target value" 
                                    value={goal.target}
                                    onChange={(e) => updateGoal(index, 'target', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Weightage (%)</label>
                                <input 
                                    disabled={isLocked}
                                    type="number" 
                                    min="10"
                                    max="100"
                                    value={goal.weightage}
                                    onChange={(e) => updateGoal(index, 'weightage', parseInt(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1rem' }}>
                            <label>Description</label>
                            <textarea 
                                disabled={isLocked}
                                rows="2"
                                placeholder="Details on how this goal will be achieved..."
                                value={goal.description}
                                onChange={(e) => updateGoal(index, 'description', e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                ))}

                {!isLocked && goals.length < 8 && (
                    <button className="add-goal-btn" onClick={addGoal}>
                        <Plus size={20} /> Add New Goal
                    </button>
                )}
            </div>
        </div>
    );
};

export default GoalSheet;
