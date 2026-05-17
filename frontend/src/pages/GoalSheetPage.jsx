import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import './GoalSheetPage.css';

const LockIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const TrashIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);
const GripIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>);
const CheckCircleIcon = () => (<svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>);
const HelpCircleIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>);

const THRUST_AREAS = [
    'Sales & Revenue', 'Customer Success', 'Operational Efficiency',
    'Product Quality', 'People & Culture', 'Cost Optimization',
    'Safety & Compliance', 'Innovation & R&D'
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const GoalSheetPage = () => {
    const { user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const [sheet, setSheet] = useState({ status: 'DRAFT', isLocked: false, managerComment: '' });
    const [cycle, setCycle] = useState({ name: 'FY 2025-26', maxGoals: 8, minWeight: 10, deadline: new Date(Date.now() + 864000000) });
    const [employee, setEmployee] = useState({ name: '', department: '' });
    const [goals, setGoals] = useState([]);
    const [validationErrors, setValidationErrors] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [submitStep, setSubmitStep] = useState(0);
    const [tourStep, setTourStep] = useState(0);
    
    // Initial Fetch
    useEffect(() => {
        const fetchSheet = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_URL}/goals/my-sheet`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success && res.data.data) {
                    setSheet(res.data.data.sheet);
                    if (res.data.data.goals && res.data.data.goals.length > 0) {
                        setGoals(res.data.data.goals);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch goals", err);
            }
        };
        fetchSheet();
        
        const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
        if (!hasCompletedOnboarding) {
            setTourStep(1);
        }
        if (user) {
            setEmployee({ name: user.name || 'Employee', department: user.department || 'General' });
        }
    }, [user, API_URL]);

    const endTour = () => {
        setTourStep(0);
        localStorage.setItem('hasCompletedOnboarding', 'true');
    };

    const totalWeightage = goals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
    const isLocked = sheet.status === 'APPROVED' || sheet.isLocked || sheet.status === 'SUBMITTED';

    // Auto-balance logic
    const handleAutoBalance = () => {
        if (goals.length === 0) return;
        const base = Math.floor(100 / goals.length);
        let remainder = 100 % goals.length;
        
        let newGoals = goals.map(g => ({ ...g, weightage: base }));
        
        // Add remainder to highest weightage goal (or first if equal)
        if (remainder > 0) {
            newGoals[0].weightage += remainder;
        }
        setGoals(newGoals);
    };

    // Update specific goal
    const updateGoal = (index, field, value) => {
        const newGoals = [...goals];
        newGoals[index] = { ...newGoals[index], [field]: value };
        setGoals(newGoals);
    };

    const addGoal = () => {
        if (goals.length >= cycle.maxGoals) return;
        const newGoal = { id: Date.now().toString(), title: '', description: '', thrustArea: 'Sales & Revenue', uomType: 'MIN', target: '', weightage: cycle.minWeight, isShared: false };
        setGoals([...goals, newGoal]);
    };

    const removeGoal = (index) => {
        setGoals(goals.filter((_, i) => i !== index));
    };

    // Validation
    const validate = () => {
        const errors = [];
        if (totalWeightage !== 100) errors.push('Total weightage must be exactly 100%');
        goals.forEach((g, i) => {
            if (!g.title.trim()) errors.push(`Goal #${i+1} is missing a title`);
            if (!g.target.trim() && g.uomType !== 'ZERO') errors.push(`Goal #${i+1} is missing a target`);
            if (g.weightage < cycle.minWeight) errors.push(`Goal #${i+1} weightage is below minimum ${cycle.minWeight}%`);
        });
        return errors;
    };

    const handleSubmitClick = () => {
        const errs = validate();
        if (errs.length > 0) {
            setValidationErrors(errs);
            return;
        }
        setValidationErrors([]);
        setSubmitStep(1); // Open Wizard
    };

    const handleSaveDraft = async () => {
        try {
            setIsSaving(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/goals/bulk-save`, { goals }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setGoals(res.data.data);
            }
        } catch (err) {
            console.error("Failed to save draft", err);
        } finally {
            setIsSaving(false);
        }
    };

    const confirmSubmit = async () => {
        try {
            await handleSaveDraft();
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/goals/submit`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSheet(res.data.data);
                setSubmitStep(3);
                triggerConfetti();
            }
        } catch (err) {
            console.error("Failed to submit goals", err);
            alert("Failed to submit goals: " + (err.response?.data?.error || err.message));
        }
    };

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: COLORS });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: COLORS });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
    };

    // DRAG LOGIC FOR WEIGHTAGE
    const barRef = useRef(null);
    const [draggingIdx, setDraggingIdx] = useState(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (draggingIdx === null || !barRef.current) return;
            const barRect = barRef.current.getBoundingClientRect();
            let newMousePct = ((e.clientX - barRect.left) / barRect.width) * 100;
            
            let cumulativeBefore = 0;
            for(let i=0; i<draggingIdx; i++) cumulativeBefore += goals[i].weightage;
            
            let wLeft = newMousePct - cumulativeBefore;
            const totalAvailable = goals[draggingIdx].weightage + goals[draggingIdx+1].weightage;
            
            if (wLeft < cycle.minWeight) wLeft = cycle.minWeight;
            if (wLeft > totalAvailable - cycle.minWeight) wLeft = totalAvailable - cycle.minWeight;
            
            let wRight = totalAvailable - wLeft;
            wLeft = Math.round(wLeft);
            wRight = Math.round(wRight);

            const newGoals = [...goals];
            newGoals[draggingIdx].weightage = wLeft;
            newGoals[draggingIdx+1].weightage = wRight;
            setGoals(newGoals);
        };

        const handleMouseUp = () => setDraggingIdx(null);

        if (draggingIdx !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingIdx, goals, cycle.minWeight]);

    return (
        <div className="goal-sheet-container" aria-live="polite">
            {/* Top Navigation Bar for Mobile Simulation */}
            <div className="mobile-nav">
                <button>Home</button>
                <button className="active">Goals</button>
                <button>Check-in</button>
                <button>Profile</button>
            </div>

            {/* Tour Overlay */}
            {tourStep > 0 && (
                <div className="tour-overlay">
                    <div className="tour-box">
                        <h3>Step {tourStep} of 5</h3>
                        {tourStep === 1 && <p><strong>Welcome to the Goal Portal!</strong> Let me show you around.</p>}
                        {tourStep === 2 && <p>Here's where you define your goals. Click '+ Add Goal' to start.</p>}
                        {tourStep === 3 && <p><strong>Weightage Allocator:</strong> Your goals must total exactly 100%. Drag the segments to adjust their weightage dynamically.</p>}
                        {tourStep === 4 && <p>Each quarter, you'll log your actual progress against these goals in the Check-in tab.</p>}
                        {tourStep === 5 && <p>You're all set! After submitting, your manager will review and approve your goals.</p>}
                        
                        <div className="tour-actions">
                            <button className="btn btn-outline" onClick={endTour}>Skip Tour</button>
                            <button className="btn btn-primary" onClick={() => tourStep < 5 ? setTourStep(tourStep+1) : endTour()}>
                                {tourStep < 5 ? 'Next →' : 'Finish Tour'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="cycle-banner">
                <div className="cycle-info">
                    <h2>{cycle.name} Goal Setting</h2>
                    <p>Window is currently Open</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                    <div className="countdown">Closes in {Math.ceil((cycle.deadline - new Date()) / 86400000)} days</div>
                    <button className="help-btn" onClick={() => setTourStep(1)} aria-label="Start Tour"><HelpCircleIcon /></button>
                </div>
            </div>

            {sheet.status === 'RETURNED' && (
                <div className="returned-banner">
                    <strong>Your manager returned this for revision:</strong>
                    <p style={{margin: '0.5rem 0 0 0'}}>{sheet.managerComment}</p>
                </div>
            )}

            <div className={`header-card ${tourStep===2?'tour-highlight':''}`}>
                <div className="employee-info">
                    <h1>{employee.name}</h1>
                    <p>{employee.department} • Goal Setting</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:'2rem'}}>
                    <div>
                        <div style={{fontSize:'0.875rem', color:'var(--text-muted)', marginBottom:'0.25rem'}}>Goals</div>
                        <div style={{fontWeight:700, fontSize:'1.25rem'}}>{goals.length} / {cycle.maxGoals}</div>
                    </div>
                    <div>
                        <div className={`status-badge status-${sheet.status}`}>{sheet.status}</div>
                    </div>
                </div>
            </div>

            <div className={`weightage-section ${tourStep===3?'tour-highlight':''}`}>
                <div className="weightage-header">
                    <div>
                        <h3 style={{margin:0}}>Weightage Allocation</h3>
                        <p style={{margin:0, fontSize:'0.875rem', color:'var(--text-muted)'}}>Drag segments to adjust. Min {cycle.minWeight}% per goal.</p>
                    </div>
                    <div className="weightage-actions-mobile">
                        <button className="auto-balance-btn" onClick={handleAutoBalance} disabled={isLocked}>
                            Auto-balance
                        </button>
                        <div className={`weightage-total ${totalWeightage === 100 ? 'total-valid' : totalWeightage > 100 ? 'total-over' : 'total-under'}`} aria-label={`Total weightage is ${totalWeightage}%`}>
                            {totalWeightage}% / 100%
                        </div>
                    </div>
                </div>

                <div className="weightage-bar-container" ref={barRef} aria-label="Weightage Allocator Bar">
                    {goals.map((g, i) => (
                        <div key={g.id} className="weightage-segment" style={{ width: `${Math.max(g.weightage, 0)}%`, background: COLORS[i % COLORS.length] }}>
                            {g.weightage}%
                            {!isLocked && i < goals.length - 1 && (
                                <div className="weightage-dragger" aria-label={`Resize goal ${i+1}`} role="slider" tabIndex="0" onMouseDown={(e) => { e.preventDefault(); setDraggingIdx(i); }} />
                            )}
                        </div>
                    ))}
                    {goals.length === 0 && <div style={{width:'100%', textAlign:'center', color:'#9ca3af', fontSize:'0.875rem', padding:'1rem 0'}}>Add goals to allocate weightage</div>}
                </div>
            </div>

            {/* Empty States */}
            {goals.length === 0 && !isLocked && (
                <div className="empty-state-card">
                    <h3>FY 2025-26 has started. Add your first goal →</h3>
                    <p>Tip: You can add up to 8 goals. Start with your biggest priority.</p>
                    <button className="btn btn-primary" onClick={addGoal}>+ Add First Goal</button>
                </div>
            )}
            
            {sheet.status === 'SUBMITTED' && (
                <div className="empty-state-card" style={{borderColor:'var(--warning)', background:'rgba(217, 119, 6, 0.05)'}}>
                    <h3>Your goals are with your manager.</h3>
                    <p>They'll review within 3 working days. You'll get an email when done.</p>
                </div>
            )}

            <div className="goal-list">
                {goals.map((goal, index) => (
                    <div key={goal.id} className="goal-card" style={{borderLeft: `4px solid ${COLORS[index % COLORS.length]}`}}>
                        {goal.isShared && <div style={{position:'absolute', top:'1.5rem', right:'1.5rem'}}><span className="shared-badge">Shared</span></div>}
                        
                        <div className="goal-card-header">
                            <div className="goal-number">
                                {!isLocked && <span className="drag-handle"><GripIcon /></span>}
                                Goal #{index + 1}
                            </div>
                            {!isLocked && !goal.isShared && (
                                <div className="goal-actions">
                                    <button onClick={() => removeGoal(index)} aria-label="Delete Goal"><TrashIcon /></button>
                                </div>
                            )}
                        </div>

                        <div className="goal-grid">
                            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                                <div className="form-group">
                                    <label>Goal Title</label>
                                    {isLocked || goal.isShared ? <div className="read-only-text">{goal.title || 'Untitled'}</div> : <input className="form-input" value={goal.title} onChange={e => updateGoal(index, 'title', e.target.value)} placeholder="e.g. Increase Q3 Revenue" />}
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    {isLocked || goal.isShared ? <div className="read-only-text" style={{whiteSpace:'pre-wrap'}}>{goal.description || 'No description'}</div> : <textarea className="form-input" rows="3" value={goal.description} onChange={e => updateGoal(index, 'description', e.target.value)} placeholder="Provide context..." />}
                                </div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                                <div className="form-group">
                                    <label>Thrust Area</label>
                                    {isLocked || goal.isShared ? <div className="read-only-text">{goal.thrustArea}</div> : <select className="form-input" value={goal.thrustArea} onChange={e => updateGoal(index, 'thrustArea', e.target.value)}>{THRUST_AREAS.map(ta => <option key={ta} value={ta}>{ta}</option>)}</select>}
                                </div>
                                <div className="form-group">
                                    <label>UoM Type</label>
                                    {isLocked || goal.isShared ? <div className="read-only-text">{goal.uomType}</div> : (
                                        <div className="uom-pills">
                                            {['MIN', 'MAX', 'TIMELINE', 'ZERO'].map(type => (
                                                <button key={type} type="button" className={`uom-pill ${goal.uomType === type ? 'active' : ''}`} onClick={() => updateGoal(index, 'uomType', type)}>
                                                    {type === 'MIN' ? 'Min ↑' : type === 'MAX' ? 'Max ↓' : type === 'TIMELINE' ? 'Timeline 📅' : 'Zero ✓'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Target</label>
                                    {isLocked || goal.isShared ? <div className="read-only-text">{goal.target || (goal.uomType==='ZERO' ? '0' : 'N/A')}</div> : (
                                        goal.uomType === 'TIMELINE' ? <input type="date" className="form-input" value={goal.target} onChange={e => updateGoal(index, 'target', e.target.value)} /> :
                                        goal.uomType === 'ZERO' ? <input type="text" className="form-input" value="0 (Zero errors/incidents)" disabled /> :
                                        <div className="target-input-group">
                                            <input type="text" className="form-input" value={goal.target} onChange={e => updateGoal(index, 'target', e.target.value)} placeholder="e.g. 2.5" />
                                            <select className="form-input" style={{width: 'auto'}}><option>₹Cr</option><option>%</option><option>hrs</option><option>units</option></select>
                                        </div>
                                    )}
                                </div>
                                <div className="form-group mobile-vertical-input">
                                    <label>Weightage (%)</label>
                                    {isLocked ? <div className="read-only-text">{goal.weightage}%</div> : <input type="number" className="form-input" style={{maxWidth:'100px'}} value={goal.weightage} onChange={e => updateGoal(index, 'weightage', Number(e.target.value))} min={cycle.minWeight} max={100} />}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {!isLocked && goals.length > 0 && (
                    <button className="add-goal-btn" onClick={addGoal} disabled={goals.length >= cycle.maxGoals} aria-label="Add new goal">
                        + Add Goal ({cycle.maxGoals - goals.length} remaining)
                    </button>
                )}
            </div>

            {!isLocked && goals.length > 0 && (
                <div className="bottom-bar">
                    {validationErrors.length > 0 && (
                        <div style={{color: 'var(--error)', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, animation: 'shake 0.4s'}}>
                            ⚠️ Please fill all required fields (Titles & Targets) and ensure minimum weightage.
                        </div>
                    )}
                    <div style={{display:'flex', gap:'1rem', marginLeft:'auto'}}>
                        <button className="btn btn-outline" onClick={handleSaveDraft} disabled={isSaving} aria-label="Save draft">
                            {isSaving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmitClick} disabled={totalWeightage !== 100 || isSaving} aria-label="Submit for Approval">
                            Submit for Approval
                        </button>
                    </div>
                </div>
            )}

            {/* 3-STEP SUBMISSION WIZARD MODAL */}
            {submitStep > 0 && (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
                    <div className="modal-content" style={{maxWidth: '600px'}}>
                        
                        {submitStep === 1 && (
                            <>
                                <h3 id="wizard-title">Step 1: Review Summary</h3>
                                <div className="review-list">
                                    {goals.map((g, i) => (
                                        <div key={i} style={{padding:'0.5rem 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between'}}>
                                            <span style={{fontWeight:500}}>{i+1}. {g.title}</span>
                                            <span style={{color:'var(--primary)', fontWeight:600}}>{g.weightage}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'1.5rem', padding:'1rem', background:'rgba(16, 185, 129, 0.1)', color:'var(--success)', borderRadius:'8px', fontWeight:600}}>
                                    ✓ Total weightage exactly 100%
                                </div>
                                <p style={{marginTop:'1.5rem'}}>Everything looks good — ready to submit?</p>
                                <div className="modal-actions">
                                    <button className="btn btn-outline" onClick={() => setSubmitStep(0)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={() => setSubmitStep(2)}>Continue to Confirm →</button>
                                </div>
                            </>
                        )}

                        {submitStep === 2 && (
                            <div style={{textAlign:'center', padding:'2rem 0'}}>
                                <h3 id="wizard-title">Step 2: Confirm Submission</h3>
                                <p style={{fontSize:'1.1rem', color:'var(--text-muted)', lineHeight:'1.6', marginBottom:'2rem'}}>
                                    By submitting, you're sharing these goals with <strong>your manager</strong> for review. Goals will be locked after approval.
                                </p>
                                <div style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
                                    <button className="btn btn-outline" style={{padding:'1rem 2rem', fontSize:'1.1rem'}} onClick={() => setSubmitStep(1)}>← Go Back</button>
                                    <button className="btn-primary" style={{padding:'1rem 2rem', fontSize:'1.1rem'}} onClick={confirmSubmit}>Submit Goals →</button>
                                </div>
                            </div>
                        )}

                        {submitStep === 3 && (
                            <div style={{textAlign:'center', padding:'3rem 0'}}>
                                <h2 id="wizard-title" style={{color:'var(--success)', fontSize:'2.5rem', marginBottom:'1rem'}}>Submitted! 🎉</h2>
                                <p style={{fontSize:'1.1rem', color:'var(--text-muted)', marginBottom:'2rem'}}>
                                    Your goals have been submitted! Your manager will review them within 3 working days.
                                </p>
                                <button className="btn btn-primary" onClick={() => setSubmitStep(0)}>View My Submitted Goals</button>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};

export default GoalSheetPage;
