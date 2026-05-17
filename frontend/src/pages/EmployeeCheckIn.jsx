import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './EmployeeCheckIn.css';

// SVG Icons
const CheckIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>);
const LockIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);

// Utility: compute score based on UoM
const computeScore = (uomType, target, actual) => {
  if (actual === '' || actual === null || actual === undefined) return 0;
  const act = parseFloat(actual);
  const tgt = parseFloat(target);
  
  if (uomType === 'MIN') {
    if (tgt === 0) return act > 0 ? 150 : 0;
    return Math.min((act / tgt) * 100, 150);
  }
  if (uomType === 'MAX') {
    if (act === 0) return 150; // zero actual on MAX is excellent
    return Math.min((tgt / act) * 100, 150);
  }
  if (uomType === 'ZERO') {
    return act === 0 ? 100 : 0;
  }
  // TIMELINE omitted for simplicity in this mock
  return 0;
};

const getScoreColorClass = (score) => {
  if (score === 0) return 'score-gray';
  if (score >= 80) return 'score-green';
  if (score >= 50) return 'score-yellow';
  return 'score-red';
};

const getUoMTooltip = (uom) => {
  if(uom === 'MIN') return "Score = (Achievement ÷ Target) × 100. Higher achievement = better score.";
  if(uom === 'MAX') return "Score = (Target ÷ Achievement) × 100. Lower achievement = better score.";
  if(uom === 'ZERO') return "100% if zero, 0% if any incidents occur.";
  return "Status based assessment.";
};

const AnimatedScore = ({ score, colorClass }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    setIsPulsing(true);
    let start = displayScore;
    const end = Math.round(score);
    if (start === end) {
      setTimeout(() => setIsPulsing(false), 300);
      return;
    }
    const duration = 300; // Fast debounce/count
    const startTime = performance.now();
    
    const animate = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      setDisplayScore(Math.round(start + (end - start) * progress));
      if (progress < 1) requestAnimationFrame(animate);
      else setTimeout(() => setIsPulsing(false), 300);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line
  }, [score]);

  return <div className={`score-value ${colorClass} ${isPulsing ? 'pulse-anim' : ''}`} aria-live="polite">{displayScore}%</div>;
};

const EmployeeCheckIn = () => {
  const [activeQuarter, setActiveQuarter] = useState('Q1');
  const [isWindowOpen, setIsWindowOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [goals, setGoals] = useState([]);

  // Form State: structure { goalId: { planned, actual, status, comment } }
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/goals/my-sheet`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.data) {
          const fetchedGoals = res.data.data.goals || [];
          setGoals(fetchedGoals);
          
          const initData = {};
          fetchedGoals.forEach(g => {
            initData[g._id] = { planned: '', actual: '', status: 'NOT_STARTED', comment: '', score: 0 };
          });
          setFormData(initData);
        }
      } catch (err) {
        console.error("Failed to fetch goals:", err);
      }
    };
    fetchGoals();
  }, [API_URL]);

  // Autosave simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastSaved(`Auto-saved at ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (goalId, field, value) => {
    setFormData(prev => {
      const updatedGoal = { ...prev[goalId], [field]: value };
      
      if (field === 'actual') {
        const goal = goals.find(g => g._id === goalId);
        updatedGoal.score = computeScore(goal.uomType, goal.targetNumeric || 0, value);
        
        // Auto-suggest status
        if (updatedGoal.score >= 100) updatedGoal.status = 'COMPLETED';
        else if (updatedGoal.score > 0) updatedGoal.status = 'ON_TRACK';
        else updatedGoal.status = 'NOT_STARTED';
      }
      
      return { ...prev, [goalId]: updatedGoal };
    });
  };

  // Overall Score Calculation
  let overallScore = 0;
  goals.forEach(g => {
    const s = formData[g._id]?.score || 0;
    overallScore += (s * (g.weightage / 100));
  });
  overallScore = Math.round(overallScore);

  const projectedScore = Math.round(overallScore * 1.1); // Mock projection logic

  const handleSubmit = () => {
    alert('Submitted successfully!');
    setIsWindowOpen(false); // mock locking it after submit
    setShowSubmitModal(false);
  };

  return (
    <div className="checkin-page">
      {/* Timeline */}
      <div className="quarter-timeline">
        <div className="timeline-line"></div>
        <div className="timeline-progress" style={{width: activeQuarter === 'Q1' ? '0%' : '33%'}}></div>
        
        {['Q1', 'Q2', 'Q3', 'Q4'].map((q, idx) => {
          let nodeClass = '';
          if (q === 'Q1') nodeClass = isWindowOpen ? 'active' : 'completed';
          else if (q === 'Q2') nodeClass = 'locked';
          else nodeClass = 'locked';

          return (
            <div key={q} className={`quarter-node ${nodeClass}`} onClick={() => setActiveQuarter(q)}>
              <div className="quarter-circle">
                {nodeClass === 'completed' ? <CheckIcon /> : nodeClass === 'locked' ? <LockIcon /> : q}
              </div>
              <div className="quarter-label">{q}</div>
              <div className="quarter-subtext">
                {nodeClass === 'completed' ? 'Submitted' : nodeClass === 'locked' ? `Opens in ${['Oct','Jan','Mar'][idx-1]}` : 'Active Window'}
              </div>
            </div>
          );
        })}
      </div>

      {!isWindowOpen ? (
        <div className="window-closed-msg">
          <h2><LockIcon /> Your {activeQuarter} data is locked</h2>
          <p style={{color:'#6b7280', marginTop:'1rem'}}>Submitted on 28 July 2026. Next window opens in October 2026.</p>
        </div>
      ) : (
        <>
          <div className="window-banner open">
            <span>🟢 Q1 Check-in window is open until 31 July 2026</span>
            <span>14 days remaining</span>
          </div>

          <div className="goal-list">
            {goals.map((goal, idx) => {
              const data = formData[goal._id] || {};
              const scoreColor = getScoreColorClass(data.score);

              return (
                <div key={goal._id} className="checkin-card">
                  <div className="card-header">
                    <div>
                      <h3 style={{margin:0, fontSize:'1.25rem'}}>{idx + 1}. {goal.title}</h3>
                      <div className="goal-meta">
                        <span className="badge badge-uom" title={getUoMTooltip(goal.uomType)} style={{cursor: 'help'}}>{goal.uomType} ⓘ</span>
                        <span className="badge badge-weight">Weight: {goal.weightage}%</span>
                        <span className="badge">{goal.thrustArea}</span>
                      </div>
                    </div>
                    <div className="target-display">
                      <span>Annual Target</span>
                      <strong>{goal.target}</strong>
                    </div>
                  </div>

                  <div className="input-grid">
                    <div className="form-group">
                      <label>Q1 Planned Milestone</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="What did you plan?"
                        value={data.planned || ''}
                        onChange={(e) => handleChange(goal._id, 'planned', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Q1 Actual Achievement</label>
                      {goal.uomType === 'ZERO' ? (
                        <div style={{display:'flex', gap:'0.5rem', height:'46px'}}>
                          <button 
                            className={`toggle-btn ${data.actual === 0 ? 'active' : ''}`}
                            style={{flex:1}}
                            onClick={() => handleChange(goal._id, 'actual', 0)}
                          >✓ Zero Achieved</button>
                          <button 
                            className={`toggle-btn ${data.actual === 1 ? 'active' : ''}`}
                            style={{flex:1, background: data.actual === 1 ? 'var(--error)' : 'var(--bg-card)', borderColor: data.actual === 1 ? 'var(--error)' : 'var(--border)', color: data.actual === 1 ? 'white' : 'var(--text-main)'}}
                            onClick={() => handleChange(goal._id, 'actual', 1)}
                          >✗ Occurred</button>
                        </div>
                      ) : (
                        <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                          <input 
                            type="number" 
                            className="form-input" 
                            style={{width:'100%'}}
                            placeholder="Actual value"
                            value={data.actual || ''}
                            onChange={(e) => handleChange(goal._id, 'actual', e.target.value)}
                          />
                          <span style={{color:'#6b7280', fontWeight:600}}>{(goal.target || '').replace(/[\d.]/g, '').trim()}</span>
                        </div>
                      )}
                    </div>

                    <div className="score-display">
                      <div style={{fontSize:'0.875rem', fontWeight:600, color:'#6b7280'}}>Computed Score</div>
                      <AnimatedScore score={data.score || 0} colorClass={scoreColor} />
                      
                      {goal.uomType === 'ZERO' && data.actual === 1 && (
                        <div style={{color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: 500, animation: 'shake 0.4s'}}>
                          ⚠️ This goal requires zero incidents. Current: 1 incident = 0%
                        </div>
                      )}

                      <div className="status-options" style={{marginTop: '1rem'}}>
                        <button 
                          className={`status-pill ${data.status === 'NOT_STARTED' ? 'active' : ''}`}
                          onClick={() => handleChange(goal._id, 'status', 'NOT_STARTED')}
                        >Not Started</button>
                        <button 
                          className={`status-pill ${data.status === 'ON_TRACK' ? 'active' : ''} ${data.score > 0 && data.score < 100 ? 'suggested' : ''}`}
                          onClick={() => handleChange(goal._id, 'status', 'ON_TRACK')}
                        >On Track</button>
                        <button 
                          className={`status-pill ${data.status === 'COMPLETED' ? 'active' : ''} ${data.score >= 100 ? 'suggested' : ''}`}
                          onClick={() => handleChange(goal._id, 'status', 'COMPLETED')}
                        >Completed</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group" style={{marginTop:'1.5rem'}}>
                    <label>Comments (Optional)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Any context or blockers to note?"
                      value={data.comment || ''}
                      onChange={(e) => handleChange(goal._id, 'comment', e.target.value)}
                    />
                  </div>

                </div>
              );
            })}
          </div>

          {/* Sticky Footer */}
          <div className="sticky-footer">
            <div className="overall-score-panel">
              <span className="label">Weighted Overall Score</span>
              <span className={`value ${getScoreColorClass(overallScore)}`}>{overallScore}%</span>
              <span className="projected-text">Projected year-end score: {projectedScore}% based on trajectory</span>
            </div>
            
            <div className="footer-actions">
              <span className="autosave-indicator">{lastSaved}</span>
              <button className="btn btn-outline" onClick={() => alert('Draft saved.')}>Save & Continue Later</button>
              <button className="btn btn-primary" onClick={() => setShowSubmitModal(true)}>Submit Q1 Check-in →</button>
            </div>
          </div>

          {/* Confirm Modal */}
          {showSubmitModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Submit Check-in</h3>
                <p>You're submitting Q1 actuals. Your manager will review this during the check-in discussion. Once submitted, these values will be locked.</p>
                <div className="modal-actions">
                  <button className="btn btn-outline" onClick={() => setShowSubmitModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmit}>Continue</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeCheckIn;
