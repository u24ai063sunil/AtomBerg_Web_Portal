import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const THRUST_AREAS = [
  'R&D / BLDC Innovation',
  'Smart Appliances & IoT',
  'Supply Chain & Manufacturing',
  'D2C Sales & Marketing',
  'Customer Experience & Support'
];

const DEPARTMENTS = [
  { key: 'engineering', label: 'Engineering / R&D' },
  { key: 'sales', label: 'Sales & Marketing' },
  { key: 'supply chain', label: 'Supply Chain & Manufacturing' },
  { key: 'customer experience', label: 'Customer Experience' }
];

const AdminSharedGoals = () => {
  const [showModal, setShowModal] = useState(false);
  const [sharedGoals, setSharedGoals] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [thrustArea, setThrustArea] = useState(THRUST_AREAS[0]);
  const [uomType, setUomType] = useState('MAX'); // Default to MAX
  const [recipientType, setRecipientType] = useState('ALL'); // 'ALL' | 'DEPT' | 'INDIVIDUAL'
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch active employees
      const empRes = await axios.get(`${API_URL}/auth/users`, { headers });
      if (empRes.data) {
        setEmployees(empRes.data);
      }

      // 2. Fetch OKR cascade list to represent active shared goals
      const cascadeRes = await axios.get(`${API_URL}/goals/cascade`, { headers });
      if (cascadeRes.data?.success) {
        setSharedGoals(cascadeRes.data.cascade || []);
      }
    } catch (err) {
      console.error("Failed to load admin shared goals data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptToggle = (deptKey) => {
    if (selectedDepts.includes(deptKey)) {
      setSelectedDepts(selectedDepts.filter(d => d !== deptKey));
    } else {
      setSelectedDepts([...selectedDepts, deptKey]);
    }
  };

  const handleEmployeeToggle = (empId) => {
    if (selectedEmployees.includes(empId)) {
      setSelectedEmployees(selectedEmployees.filter(id => id !== empId));
    } else {
      setSelectedEmployees([...selectedEmployees, empId]);
    }
  };

  const handlePushGoalSubmit = async (e) => {
    e.preventDefault();
    if (!title || !target) {
      setErrorMsg('Goal Title and Target are required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Resolve recipientIds
      let recipientIds = [];
      if (recipientType === 'ALL') {
        recipientIds = employees.map(emp => emp._id);
      } else if (recipientType === 'DEPT') {
        if (selectedDepts.length === 0) {
          setErrorMsg('Please check at least one department.');
          setSubmitting(false);
          return;
        }
        recipientIds = employees
          .filter(emp => {
            const empDept = emp.department?.toLowerCase() || '';
            return selectedDepts.some(selected => empDept.includes(selected));
          })
          .map(emp => emp._id);
      } else {
        if (selectedEmployees.length === 0) {
          setErrorMsg('Please select at least one employee.');
          setSubmitting(false);
          return;
        }
        recipientIds = selectedEmployees;
      }

      if (recipientIds.length === 0) {
        setErrorMsg('No employees matched the selected criteria. Make sure employees have their department configured in their profiles.');
        setSubmitting(false);
        return;
      }

      const res = await axios.post(`${API_URL}/admin/shared-goal`, {
        title,
        thrustArea,
        uomType,
        target,
        recipientIds
      }, { headers });

      if (res.data?.success) {
        setSuccessMsg(`Goal successfully pushed to ${recipientIds.length} employees! 🎉`);
        setTitle('');
        setTarget('');
        setSelectedEmployees([]);
        setSelectedDepts([]);
        setShowModal(false);
        fetchData();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to push corporate shared goal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>Shared Goals Management</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0 0' }}>Deploy organization-wide targets and trace their child alignments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Push New Shared Goal</button>
      </div>

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid var(--success)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      <div className="dashboard-panel">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>Loading corporate goals...</div>
        ) : sharedGoals.length === 0 ? (
          <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            <h3>No corporate goals set yet.</h3>
            <p>Click "+ Push New Shared Goal" above to create one.</p>
          </div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Goal Title</th>
                <th>Thrust Area</th>
                <th>Target</th>
                <th>Pushed To</th>
                <th>Sync Status</th>
              </tr>
            </thead>
            <tbody>
              {sharedGoals.map(sg => (
                <tr key={sg.id}>
                  <td style={{ fontWeight: 600 }}>{sg.title}</td>
                  <td>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {sg.thrustArea}
                    </span>
                  </td>
                  <td>{sg.target}</td>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                    👥 {sg.children?.length || 0} Employees
                  </td>
                  <td>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                      ● Active Cascade
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem', width: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>Push Corporate Shared Goal</h2>
            
            {errorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handlePushGoalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Goal Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input" 
                  placeholder="e.g. Org-wide compliance training" 
                  style={{ marginTop: '0.5rem', width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.8rem', borderRadius: '8px' }} 
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Thrust Area</label>
                  <select 
                    value={thrustArea}
                    onChange={(e) => setThrustArea(e.target.value)}
                    style={{ marginTop: '0.5rem', width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}
                  >
                    {THRUST_AREAS.map(ta => (
                      <option key={ta} value={ta}>{ta}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Unit of Measure (UoM)</label>
                  <select 
                    value={uomType}
                    onChange={(e) => setUomType(e.target.value)}
                    style={{ marginTop: '0.5rem', width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}
                  >
                    <option value="MAX">MAX (Higher is better)</option>
                    <option value="MIN">MIN (Lower is better)</option>
                    <option value="TIMELINE">TIMELINE (Date/Due date)</option>
                    <option value="ZERO">ZERO (Zero incidents/errors)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>Target KPI</label>
                  <input 
                    type="text" 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="form-input" 
                    placeholder="e.g. 100% completion" 
                    style={{ marginTop: '0.5rem', width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.6rem 0.8rem', borderRadius: '8px' }} 
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Target Recipients Mode</label>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input type="radio" name="recipientType" checked={recipientType === 'ALL'} onChange={() => setRecipientType('ALL')} /> Entire Organization
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input type="radio" name="recipientType" checked={recipientType === 'DEPT'} onChange={() => setRecipientType('DEPT')} /> By Department
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                    <input type="radio" name="recipientType" checked={recipientType === 'INDIVIDUAL'} onChange={() => setRecipientType('INDIVIDUAL')} /> Specific Employees
                  </label>
                </div>

                {/* Mode 1: By Department Checkboxes */}
                {recipientType === 'DEPT' && (
                  <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-input)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {DEPARTMENTS.map(dept => (
                      <label key={dept.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedDepts.includes(dept.key)}
                          onChange={() => handleDeptToggle(dept.key)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                        /> {dept.label}
                      </label>
                    ))}
                  </div>
                )}

                {/* Mode 2: Specific Employees Multi-select List */}
                {recipientType === 'INDIVIDUAL' && (
                  <div style={{ 
                    padding: '1rem', 
                    border: '1px solid var(--border)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-input)', 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.6rem' 
                  }}>
                    {employees.length === 0 ? (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No employees registered.</div>
                    ) : (
                      employees.map(emp => (
                        <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.875rem' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedEmployees.includes(emp._id)}
                            onChange={() => handleEmployeeToggle(emp._id)}
                            style={{ width: '15px', height: '15px', cursor: 'pointer' }} 
                          /> 
                          <div>
                            <strong>{emp.name}</strong> <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({emp.email} • {emp.department || 'No Dept'})</span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Pushing Goal...' : 'Review & Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSharedGoals;
