import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    // Validate name: letters and spaces only (no numbers or special characters)
    const validName = /^[A-Za-z\s]+$/;
    if (!validName.test(name.trim())) {
      setError('Name may only contain letters and spaces');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Registration failed');
    }
  }

  const allFilled = name && email && password && confirmPassword;

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', marginBottom: 16 }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem' }}>≡</span>
          </div>
          <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: '1.5rem' }}>Get started</h2>
        </div>
        <h3>Create your account</h3>
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', border: '1px solid #fecaca', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="login-form-row">
            <label>Full Name</label>
            <input className="login-input" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
          </div>
          <div className="login-form-row">
            <label>Email</label>
            <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="login-form-row">
              <label>Password</label>
              <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" required />
            </div>
            <div className="login-form-row">
              <label>Confirm</label>
              <input className="login-input" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••" required />
            </div>
          </div>
          <button className="login-btn" type="submit" disabled={!allFilled}
            style={{ opacity: !allFilled ? 0.5 : 1, cursor: !allFilled ? 'not-allowed' : 'pointer', marginTop: 8 }}
          >Create account</button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Already have an account? </span>
          <Link to="/" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
