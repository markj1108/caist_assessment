import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';

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
          console.log('Available users:', available);
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

        <div className="card">
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
              {users.map(u => (
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
                          style={{ padding: '4px 8px', fontSize: '0.9rem', marginLeft: 4 }}
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
      <h1>My Team Members</h1>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Add Member to Team</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedUserId}
            onChange={e => setSelectedUserId(e.target.value)}
            className="input"
            style={{ flex: 1 }}
          >
            <option value="">Select a team member to add</option>
            {availableUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
          <button className="btn" onClick={addMemberToTeam}>
            Add
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Team Members ({users.length})</h3>
        {users.length === 0 ? (
          <div className="small">No team members yet. Add members from the section above.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #0b5fff' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>{u.name}</td>
                  <td style={{ padding: 8 }}>{u.email}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ color: u.is_active ? 'green' : 'red' }}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: 8 }}>
                    <button
                      className="btn"
                      style={{ padding: '4px 8px', fontSize: '0.9rem', background: '#ff6b6b' }}
                      onClick={() => removeMemberFromTeam(u.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
