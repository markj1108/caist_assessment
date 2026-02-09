import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/settings.css';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const saveName = async () => {
    setError(''); setSuccess(''); setLoading(true);
    // validate non-blank name
    if (!name || !name.trim()) {
      setError('Name cannot be blank');
      setLoading(false);
      return;
    }
    try {
      await updateProfile({ name: name.trim() });
      setSuccess('Profile updated');
      setEditingName(false);
    } catch (err) {
      setError(err?.body?.error || err?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const savePassword = async () => {
    setError(''); setSuccess('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword && newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await updateProfile({ current_password: currentPassword, new_password: newPassword });
      setSuccess('Password updated');
      setEditingPassword(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err?.body?.error || err?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  // validation states for disabling save buttons
  const isNameValid = Boolean(name && name.trim());
  const isPasswordValid = Boolean(currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6);

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px 0' }}>Settings</h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Manage your account</p>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 12 }}>{success}</div>}

      {/* Profile Card */}
      <div className="settings-panel" style={{ marginBottom: 20 }}>
        <div className="settings-header">
          <div className="profile-top">
            <div className="avatar">{initials}</div>
            <div>
              <div className="profile-name">{user?.name}</div>
              <div className="profile-email">{user?.email}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '4px 0' }}>
          <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full Name</div>
          {!editingName ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>{user?.name}</div>
              <button className="btn" onClick={() => setEditingName(true)}>Edit</button>
            </div>
          ) : (
            <div className="form-inline">
              <input value={name} onChange={e => setName(e.target.value)} style={{ flex: 1 }} />
              <div className="btn-group">
                <button className="btn" onClick={saveName} disabled={!isNameValid || loading} style={{ opacity: (!isNameValid || loading) ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save'}</button>
                <button className="btn secondary" onClick={() => { setEditingName(false); setName(user?.name || ''); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Card */}
      <div className="settings-panel">
        <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</div>
        {!editingPassword ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#94a3b8' }}>••••••••</div>
            <button className="btn" onClick={() => setEditingPassword(true)}>Change Password</button>
          </div>
        ) : (
          <div className="form-inline" style={{ flexWrap: 'wrap' }}>
            <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ minWidth: 120 }} />
            <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ minWidth: 120 }} />
            <input type="password" placeholder="Confirm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ minWidth: 120 }} />
            <div className="btn-group">
              <button className="btn" onClick={savePassword} disabled={!isPasswordValid || loading} style={{ opacity: (!isPasswordValid || loading) ? 0.6 : 1 }}>{loading ? 'Saving...' : 'Save'}</button>
              <button className="btn secondary" onClick={() => { setEditingPassword(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
