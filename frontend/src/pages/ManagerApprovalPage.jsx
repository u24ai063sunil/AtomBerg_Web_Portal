import React, { useState, useEffect } from 'react';
import './ManagerApprovalPage.css';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Icons
const AlertIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>);
const CheckIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>);

const ManagerApprovalPage = () => {
  const { sheetId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [employeeInfo, setEmployeeInfo] = useState({ name: 'Employee', dept: 'General', totalGoals: 0 });
  
  // Left side - Original
  const [originalGoals, setOriginalGoals] = useState([]);
  // Right side - Editable
  const [reviewGoals, setReviewGoals] = useState([]);
  
  const [modals, setModals] = useState({ return: false, approve: false });
  const [managerComment, setManagerComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchSheet = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/manager/sheet/${sheetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const { sheet, goals } = res.data.data;
          setEmployeeInfo({
            name: sheet.employeeId?.name || 'Employee',
            dept: sheet.employeeId?.department || 'General',
            totalGoals: goals.length
          });
          setOriginalGoals(goals);
          setReviewGoals(JSON.parse(JSON.stringify(goals)));
        }
      } catch (err) {
        console.error("Failed to fetch sheet details", err);
      }
    };
    if (sheetId) fetchSheet();
  }, [sheetId, API_URL]);

  const handleReviewChange = (index, field, value) => {
    const updated = [...reviewGoals];
    updated[index][field] = value;
    if (field === 'target') updated[index].targetNumeric = parseFloat(value) || 0;
    setReviewGoals(updated);
  };

  const reviewTotalWeightage = reviewGoals.reduce((sum, g) => sum + Number(g.weightage), 0);

  const getDiffSummary = () => {
    if (!originalGoals.length || !reviewGoals.length) return null;
    const changes = [];
    reviewGoals.forEach((g, idx) => {
      const og = originalGoals[idx];
      if (g.target !== og.target) changes.push(`target for Goal ${idx + 1}`);
      if (g.weightage !== og.weightage) changes.push(`weightage for Goal ${idx + 1}`);
    });
    if (changes.length === 0) return null;
    return `You changed ${changes.length} value${changes.length > 1 ? 's' : ''} — ${changes.join(', ')}`;
  };
  const diffSummary = getDiffSummary();

  const syncModifiedGoals = async () => {
    const token = localStorage.getItem('token');
    const promises = [];
    reviewGoals.forEach((g, idx) => {
      const og = originalGoals[idx];
      if (g.target !== og.target || g.weightage !== og.weightage) {
        promises.push(axios.put(`${API_URL}/manager/goal/${g._id}/inline-edit`, 
          { target: g.target, weightage: g.weightage },
          { headers: { Authorization: `Bearer ${token}` } }
        ));
      }
    });
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  const handleReturn = async () => {
    setIsProcessing(true);
    try {
      await syncModifiedGoals();
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/manager/sheet/${sheetId}/return`, { managerComment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModals({ ...modals, return: false });
      navigate('/dashboard/team');
    } catch (err) {
      console.error(err);
      alert("Failed to return goals.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await syncModifiedGoals();
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/manager/sheet/${sheetId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModals({ ...modals, approve: false });
      navigate('/dashboard/team');
    } catch (err) {
      console.error(err);
      alert("Failed to approve goals.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="approval-page-container">
      <div className="approval-header">
        <div>
          <h2>Review Goals: {employeeInfo.name}</h2>
          <p>{employeeInfo.dept} • {employeeInfo.totalGoals} Goals Submitted</p>
        </div>
        <div>
          <button className="btn" style={{background:'transparent', color:'var(--text-muted)'}} onClick={() => navigate('/dashboard/team')}>Back to Team</button>
        </div>
      </div>

      <div className="split-layout">
        {/* LEFT PANEL */}
        <div className="panel panel-left">
          <h3 className="panel-title">Employee Submitted</h3>
          <div className="total-weightage-indicator valid">
            Total Weightage: 100%
          </div>

          {originalGoals.map((g, idx) => (
            <div key={g._id || idx} className="goal-compare-card">
              <h4 style={{marginTop:0}}>{idx + 1}. {g.title}</h4>
              <p style={{fontSize:'0.875rem', color:'#6b7280'}}>{g.description}</p>
              
              <div style={{display:'flex', gap:'2rem', marginTop:'1rem'}}>
                <div className="field-group">
                  <div className="field-label">Target ({g.uomType})</div>
                  <div className="field-value">{g.target}</div>
                </div>
                <div className="field-group">
                  <div className="field-label">Weightage</div>
                  <div className="field-value">{g.weightage}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT PANEL */}
        <div className="panel panel-right">
          <h3 className="panel-title">Manager Review (Editable)</h3>
          <div className={`total-weightage-indicator ${reviewTotalWeightage === 100 ? 'valid' : 'invalid'}`}>
            Total Weightage: {reviewTotalWeightage}% 
            {reviewTotalWeightage !== 100 && ' (Must be 100%)'}
          </div>
          
          {diffSummary && (
            <div style={{padding: '1rem', background: 'rgba(217, 119, 6, 0.05)', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 500, fontSize: '0.875rem'}}>
              {diffSummary}
            </div>
          )}

          {reviewGoals.map((g, idx) => {
            const og = originalGoals[idx];
            const isTargetModified = g.target !== og.target;
            const isWeightModified = g.weightage !== og.weightage;
            const isModified = isTargetModified || isWeightModified;

            return (
              <div key={g._id || idx} className={`goal-compare-card editable ${isModified ? 'modified' : ''}`}>
                <h4 style={{marginTop:0}}>
                  {idx + 1}. {g.title}
                  {isModified && <span className="modified-badge">Modified</span>}
                </h4>

                <div style={{display:'flex', gap:'1rem', marginTop:'1rem'}}>
                  <div className="field-group" style={{flex:1}}>
                    <div className="field-label">Target</div>
                    <input 
                      className="field-input" 
                      value={g.target} 
                      onChange={(e) => handleReviewChange(idx, 'target', e.target.value)} 
                    />
                    {isTargetModified && (
                      <div style={{marginTop:'0.25rem'}}>
                        <span className="diff-old">{og.target}</span>
                        <span className="diff-new">{g.target}</span>
                      </div>
                    )}
                  </div>

                  <div className="field-group" style={{width:'100px'}}>
                    <div className="field-label">Weightage %</div>
                    <input 
                      type="number"
                      className="field-input" 
                      value={g.weightage} 
                      onChange={(e) => handleReviewChange(idx, 'weightage', Number(e.target.value))} 
                    />
                    {isWeightModified && (
                      <div style={{marginTop:'0.25rem'}}>
                        <span className="diff-old">{og.weightage}%</span>
                        <span className="diff-new">{g.weightage}%</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="action-bar">
        <button className="btn btn-return" onClick={() => setModals({ ...modals, return: true })}>
          <AlertIcon /> Return for Rework
        </button>
        <button 
          className="btn btn-approve" 
          disabled={reviewTotalWeightage !== 100}
          onClick={() => setModals({ ...modals, approve: true })}
        >
          <CheckIcon /> Approve & Lock Goals →
        </button>
      </div>

      {/* Return Modal */}
      {modals.return && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Return to Employee</h3>
            <p>You are sending these goals back to {employeeInfo.name} for revision. A comment is required.</p>
            <textarea 
              rows="4" 
              placeholder="Explain what needs to be changed..."
              value={managerComment}
              onChange={(e) => setManagerComment(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn" style={{background:'transparent'}} onClick={() => setModals({...modals, return: false})}>Cancel</button>
              <button className="btn btn-return" disabled={!managerComment.trim() || isProcessing} onClick={handleReturn}>{isProcessing ? 'Processing...' : 'Confirm Return'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {modals.approve && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Approve & Lock Goals</h3>
            <p>You are approving {employeeInfo.name}'s goals for this cycle. Once approved:</p>
            <ul style={{color:'#6b7280', fontSize:'0.9rem', marginBottom:'1.5rem'}}>
              <li>Goals will become read-only for the employee.</li>
              <li>Quarterly check-ins will be unlocked.</li>
              <li>An email and Teams notification will be sent.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" style={{background:'transparent'}} onClick={() => setModals({...modals, approve: false})}>Cancel</button>
              <button className="btn btn-approve" disabled={isProcessing} onClick={handleApprove}>{isProcessing ? 'Processing...' : 'Confirm Approval'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManagerApprovalPage;
