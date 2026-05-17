import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Shield, User, Briefcase, Save, X, Edit2, Users } from 'lucide-react';
import Avatar from '../components/Avatar';
import './AdminPages.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AdminOrgHierarchy = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ role: '', managerId: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setMsg({ type: 'error', text: 'Failed to load organization directory.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setEditForm({
      role: user.role || 'EMPLOYEE',
      managerId: user.managerId ? (user.managerId._id || user.managerId) : ''
    });
    setMsg({ type: '', text: '' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveUser = async (userId) => {
    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/admin/users/${userId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? res.data.data : u));
        setMsg({ type: 'success', text: 'User access and hierarchy updated successfully!' });
        setEditingUserId(null);
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update user.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Managers derived from active users list (either MANAGER or ADMIN roles can manage others)
  const managers = users.filter(u => ['MANAGER', 'ADMIN'].includes(u.role));

  // Filtered users for directory display
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (u.designation && u.designation.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Organization Hierarchy...</div>;
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h1>User Management & Hierarchy</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Configure user roles, departments, and manager reporting lines.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => alert('AD Sync Simulated: 12 new users imported.')}>
            Sync from Azure AD
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`alert ${msg.type}`} style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)', background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: msg.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
          {msg.text}
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="dashboard-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, email, department, designation..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <select 
            className="form-input" 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ minWidth: '180px' }}
          >
            <option value="ALL">All Roles</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="MANAGER">Managers</option>
            <option value="ADMIN">HR / Admins</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="dashboard-panel" style={{ overflowX: 'auto', padding: 0 }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th>Employee Details</th>
              <th>Department / Designation</th>
              <th>System Role</th>
              <th>Reporting Manager</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No employees found matching the search filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const isEditing = editingUserId === user._id;
                return (
                  <tr key={user._id} style={{ background: isEditing ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Avatar src={user.picture} name={user.name} size={40} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{user.designation || 'Not Configured'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.department || 'Not Configured'}</div>
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-input"
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          style={{ padding: '0.4rem', fontSize: '0.85rem' }}
                        >
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className={`status-badge status-${user.role}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: user.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.1)' : user.role === 'MANAGER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: user.role === 'ADMIN' ? '#8b5cf6' : user.role === 'MANAGER' ? '#3b82f6' : '#6b7280' }}>
                          {user.role === 'ADMIN' ? <Shield size={12} /> : user.role === 'MANAGER' ? <Briefcase size={12} /> : <User size={12} />}
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select 
                          className="form-input"
                          value={editForm.managerId}
                          onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                          style={{ padding: '0.4rem', fontSize: '0.85rem', maxWidth: '220px' }}
                        >
                          <option value="">No Reporting Manager</option>
                          {managers
                            .filter(m => m._id !== user._id) // Prevent manager self-assignment
                            .map(m => (
                              <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
                            ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {user.managerId ? (
                            <>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                              <span>{user.managerId.name || user.managerId}</span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Not Assigned</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleSaveUser(user._id)}
                            disabled={submitting}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                          >
                            <Save size={14} /> Save
                          </button>
                          <button 
                            className="btn btn-outline" 
                            onClick={handleCancelEdit}
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleEditClick(user)}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Edit2 size={12} /> Edit Role & Manager
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrgHierarchy;
