import React, { useState } from 'react';
import './Escalation.css';

const mockRules = [
  { id: 1, type: 'NO_SUBMISSION', days: 5, emp: true, mgr: true, skip: true, hr: true, active: true },
  { id: 2, type: 'NO_APPROVAL', days: 3, emp: false, mgr: true, skip: true, hr: true, active: true },
  { id: 3, type: 'NO_CHECKIN', days: 7, emp: true, mgr: true, skip: false, hr: true, active: false }
];

const EscalationConfigPage = () => {
  const [rules, setRules] = useState(mockRules);
  const [editingRule, setEditingRule] = useState(null);

  const getTypeClass = (type) => {
    if(type === 'NO_SUBMISSION') return 'type-submission';
    if(type === 'NO_APPROVAL') return 'type-approval';
    return 'type-checkin';
  };

  const handleSave = () => {
    setRules(rules.map(r => r.id === editingRule.id ? editingRule : r));
    setEditingRule(null);
  };

  return (
    <div className="escalation-container">
      <div className="escalation-header">
        <div>
          <h1>Escalation Rules Configuration</h1>
          <p style={{color:'#6b7280', margin:0}}>Configure automated warnings and escalations for the active cycle.</p>
        </div>
        <button className="btn btn-primary">Save All Changes</button>
      </div>

      <div className="escalation-panel">
        <table className="escalation-table">
          <thead>
            <tr>
              <th>Rule Type</th>
              <th>Days Threshold</th>
              <th>Notify Employee</th>
              <th>Notify Manager</th>
              <th>Notify Skip-Level</th>
              <th>Notify HR</th>
              <th>Is Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(rule => (
              <tr key={rule.id}>
                <td><span className={`type-badge ${getTypeClass(rule.type)}`}>{rule.type.replace('_', ' ')}</span></td>
                <td><strong style={{fontSize:'1.1rem'}}>{rule.days} Days</strong></td>
                <td>{rule.emp ? '✅' : '❌'}</td>
                <td>{rule.mgr ? '✅' : '❌'}</td>
                <td>{rule.skip ? '✅' : '❌'}</td>
                <td>{rule.hr ? '✅' : '❌'}</td>
                <td>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={rule.active} 
                      onChange={() => {
                        setRules(rules.map(r => r.id === rule.id ? {...r, active: !r.active} : r));
                      }} 
                    />
                    <span className="slider"></span>
                  </label>
                </td>
                <td>
                  <button className="btn btn-outline" onClick={() => setEditingRule(rule)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingRule && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Rule: {editingRule.type}</h3>
            
            <div className="form-group">
              <label>Days Threshold (After trigger event)</label>
              <input 
                type="number" 
                className="form-input" 
                value={editingRule.days} 
                onChange={e => setEditingRule({...editingRule, days: Number(e.target.value)})}
              />
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'0.5rem', marginTop:'1.5rem'}}>
              <label style={{fontWeight:600}}>Escalation Chain</label>
              <label><input type="checkbox" checked={editingRule.emp} onChange={e=>setEditingRule({...editingRule, emp: e.target.checked})} /> Notify Employee</label>
              <label><input type="checkbox" checked={editingRule.mgr} onChange={e=>setEditingRule({...editingRule, mgr: e.target.checked})} /> Notify L1 Manager</label>
              <label><input type="checkbox" checked={editingRule.skip} onChange={e=>setEditingRule({...editingRule, skip: e.target.checked})} /> Notify Skip-Level Manager</label>
              <label><input type="checkbox" checked={editingRule.hr} onChange={e=>setEditingRule({...editingRule, hr: e.target.checked})} /> Notify HR Admin</label>
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setEditingRule(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EscalationConfigPage;
