import React, { useState, useEffect } from 'react';
import './ManagerDashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AVATAR_COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#14b8a6', '#06b6d4', '#ec4899'];

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_URL}/manager/team`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const fetchedTeam = res.data.data;
          const sorted = [...fetchedTeam].sort((a, b) => {
            if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
            if (b.status === 'SUBMITTED' && a.status !== 'SUBMITTED') return 1;
            return new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0);
          });
          setTeam(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch team:", err);
      }
    };
    fetchTeam();
  }, [API_URL]);

  const handleSendReport = async () => {
    setReportLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/manager/send-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
      } else {
        setMsg({ type: 'error', text: 'Failed to send team status report.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to send team status report.' });
    } finally {
      setReportLoading(false);
    }
  };

  const stats = {
    total: team.length,
    pending: team.filter(t => t.status === 'SUBMITTED').length,
    checkins: team.filter(t => t.score > 0).length,
    avg: Math.round(team.reduce((acc, t) => acc + t.score, 0) / (team.filter(t => t.score > 0).length || 1))
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0,2);

  return (
    <div className="manager-dashboard-container">
      <div className="manager-dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0 }}>My Team — FY 2025-26</h1>
          <button 
            className="btn-sm btn-primary" 
            onClick={handleSendReport} 
            disabled={reportLoading}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '0.95rem' }}
          >
            {reportLoading ? 'Sending Report...' : 'Send Team Report to HR'}
          </button>
        </div>

        {msg.text && (
          <div className={`alert ${msg.type}`} style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)', background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: msg.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
            {msg.text}
          </div>
        )}

        <div className="manager-stats-row">
          <div className="manager-stat-card">
            <span className="stat-label">Direct Reports</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="manager-stat-card">
            <span className="stat-label">Pending Approval</span>
            <span className="stat-value" style={{color: '#f59e0b'}}>{stats.pending}</span>
          </div>
          <div className="manager-stat-card">
            <span className="stat-label">Check-ins Done</span>
            <span className="stat-value" style={{color: '#10b981'}}>{stats.checkins}</span>
          </div>
          <div className="manager-stat-card">
            <span className="stat-label">Team Avg Score</span>
            <span className="stat-value" style={{color: '#8b5cf6'}}>{stats.avg}%</span>
          </div>
        </div>
      </div>

      <div className="team-grid">
        {team.map((member, idx) => (
          <div className="team-card" key={member.id}>
            <div className="card-header">
              <div className="avatar" style={{background: AVATAR_COLORS[idx % AVATAR_COLORS.length]}}>
                {getInitials(member.name)}
              </div>
              <div className="member-info">
                <h3>{member.name}</h3>
                <p>{member.designation} • {member.department}</p>
              </div>
            </div>
            
            <div className="card-body">
              <div className="detail-row">
                <span>Status</span>
                <span className={`status-badge status-${member.status}`}>
                  {member.status.replace('_', ' ')}
                </span>
              </div>
              <div className="detail-row">
                <span>Goals</span>
                <strong>{member.goalsCount} / 8</strong>
              </div>
              <div className="detail-row">
                <span>Submitted</span>
                <strong>{member.submittedAt ? new Date(member.submittedAt).toLocaleDateString() : 'N/A'}</strong>
              </div>
              {member.status === 'APPROVED' && (
                <div>
                  <div className="detail-row">
                    <span>Q1 Achievement</span>
                    <strong>{member.score}%</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{width: `${Math.min(member.score, 100)}%`}}></div>
                  </div>
                </div>
              )}
            </div>

            <div className="card-actions">
              {member.status === 'SUBMITTED' && (
                <button className="btn-sm btn-primary" onClick={() => navigate(`/dashboard/manager/approve/${member.sheetId}`)}>
                  Review & Approve
                </button>
              )}
              {member.status === 'APPROVED' && (
                <>
                  <button className="btn-sm btn-outline" onClick={() => navigate(`/dashboard/goals`)}>View Goals</button>
                  <button className="btn-sm btn-primary" onClick={() => navigate(`/dashboard/check-ins`)}>Log Check-in</button>
                </>
              )}
              {member.status === 'RETURNED' && (
                <button className="btn-sm btn-outline">Awaiting Re-submission</button>
              )}
              {member.status === 'NOT_SUBMITTED' && (
                <button className="btn-sm btn-outline">Nudge</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDashboard;
