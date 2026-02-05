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

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: '2rem' }}>☰ TaskEr</h2>
        </div>
        <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Create your account</h3>
        {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="login-form-row">
            <input
              className="login-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="full name"
              required
            />
          </div>
          <div className="login-form-row">
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email"
              required
            />
          </div>
          <div className="login-form-row">
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>
          <div className="login-form-row">
            <input
              className="login-input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="confirm password"
              required
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="login-btn" type="submit">Sign up</button>
          </div>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.95rem' }}>Already have an account? </span>
          <Link to="/" style={{ color: '#0b5fff', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
