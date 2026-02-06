import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/modal.css';

const ROLE_OPTIONS = ['admin', 'team_leader', 'team_member'];

export default function Members() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, userId: null, userName: '', action: '' });

  const isAdmin = user?.role_id === 1;
  const isLeader = user?.role_id === 2;

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      if (isAdmin) {
        // Admin sees all users
        const data = await api.get('/users');
        setUsers(data || []);
      } else if (isLeader) {
        // Team leader sees their team members and available users
        try {
          const teamMembers = await api.get('/users/team/members');
          setUsers(teamMembers || []);
        } catch (e) {
          console.error('Failed to load team members:', e);
          setError('Failed to load team members: ' + (e.body?.error || e.message));
        }

        try {
          const available = await api.get('/users/available');
          setAvailableUsers(available || []);
        } catch (e) {
          console.error('Failed to load available users:', e);
          setError('Failed to load available users: ' + (e.body?.error || e.message));
        }
      }
    } catch (err) {
      console.error('Load users error:', err);
      setError(err.body?.error || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(userId, roleName) {
    try {
      setError('');
      const updated = await api.put(`/users/${userId}/role`, { role_name: roleName });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role_id: updated.role_id, role_name: roleName } : u));
      setEditingId(null);
      setNewRole('');
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to update role');
    }
  }

  async function toggleActive(userId, isActive) {
    try {
      setError('');
      await api.put(`/users/${userId}/active`, { is_active: !isActive });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !isActive } : u));
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to update user');
    }
  }

  async function addMemberToTeam() {
    if (!selectedUserId) {
      setError('Please select a member');
      return;
    }
    try {
      setError('');
      await api.put(`/users/${selectedUserId}/team`, {});
      // Reload data
      await loadUsers();
      setSelectedUserId('');
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to add member');
    }
  }

  async function removeMemberFromTeam(userId) {
    try {
      setError('');
      await api.del(`/users/${userId}/team`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setConfirmDialog({ show: false, userId: null, userName: '', action: '' });
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to remove member');
    }
  }

  if (!isAdmin && !isLeader) {
    return (
      <div className="card" style={{ color: 'red' }}>
        <h3>Access Denied</h3>
        <p>Only admins and team leaders can manage members.</p>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  // ADMIN VIEW
  if (isAdmin) {
    return (
      <div>
        <h1>Members Management (Admin)</h1>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

        <div className="card" style={{ marginBottom: 24 }}>
          {/* Search Input */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Search user by name or email"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input"
              style={{ width: '100%', background: '#f8fafc' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0b5fff' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Role</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter(u => 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>
                    {editingId === u.id ? (
                      <select
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        className="input"
                        style={{ width: 150 }}
                      >
                        <option value="">Select role</option>
                        {ROLE_OPTIONS.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{u.role_name}</span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: u.is_active ? 'green' : 'red' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    {editingId === u.id ? (
                      <>
                        <button
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                          onClick={() => changeRole(u.id, newRole)}
                        >
                          Save
                        </button>
                        <button
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '0.9rem', marginLeft: 4 }}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '0.9rem' }}
                          onClick={() => {
                            setEditingId(u.id);
                            setNewRole(u.role_name);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '0.9rem', marginLeft: 4, background: 'white', color: '#64748b', border: '1px solid #e2e8f0' }}
                          onClick={() => toggleActive(u.id, u.is_active)}
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // TEAM LEADER VIEW
  return (
    <div>
      <h1>Members</h1>
      {error && <div style={{ color: 'red', marginBottom: 12, padding: 12, background: '#ffe6e6', borderRadius: 4 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        {/* Search and Add Button */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search Member"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input"
            style={{ flex: 1, background: '#f8fafc' }}
          />
          <button 
            className="btn"
            onClick={() => {
              setShowAddMemberModal(true);
              setSelectedUserId('');
            }}
            style={{
              background: '#0b5fff',
              color: 'white',
              padding: '10px 20px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            Add Member
          </button>
        </div>

        {/* Members Table */}
        {users.length === 0 ? (
          <div className="small" style={{ color: '#666', textAlign: 'center', padding: 24 }}>
            No team members yet. Add members from the button above.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Nome</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => 
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 8px', color: '#1e293b', fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: '12px 8px', color: '#64748b' }}>{u.email}</td>
                      <td style={{ padding: '12px 8px', color: '#64748b' }}>Member</td>
                      <td style={{ padding: '12px 8px' }}>
                        <button
                          onClick={() => setConfirmDialog({ show: true, userId: u.id, userName: u.name })}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0b5fff',
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            padding: 0,
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>Add Member</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddMemberModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#1e293b' }}>Select a member to add</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="input"
                style={{ width: '100%', marginBottom: 20 }}
              >
                <option value="">-- Select Member --</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  className="btn"
                  onClick={() => setShowAddMemberModal(false)}
                  style={{ background: '#6c757d', color: 'white', padding: '8px 16px' }}
                >
                  Cancel
                </button>
                <button 
                  className="btn"
                  onClick={() => {
                    if (selectedUserId) {
                      addMemberToTeam();
                      setShowAddMemberModal(false);
                    }
                  }}
                  style={{ background: '#0b5fff', color: 'white', padding: '8px 16px' }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove/Delete Confirmation Modal */}
      {confirmDialog.show && (
        <div className="modal-overlay" onClick={() => setConfirmDialog({ show: false, userId: null, userName: '', action: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2>Remove Member</h2>
              <button 
                className="modal-close"
                onClick={() => setConfirmDialog({ show: false, userId: null, userName: '', action: '' })}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: 24 }}>
                Are you sure you want to remove <strong>{confirmDialog.userName}</strong> from the team?
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={() => setConfirmDialog({ show: false, userId: null, userName: '', action: '' })}
                  className="btn"
                  style={{ background: '#6c757d', color: 'white', padding: '8px 24px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => removeMemberFromTeam(confirmDialog.userId)}
                  className="btn"
                  style={{ background: '#ff6b6b', color: 'white', padding: '8px 24px' }}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
