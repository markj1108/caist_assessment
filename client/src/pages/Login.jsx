import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Login failed');
    }
  }

  return (
    <div className="login-container">

      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: '2rem' }}>☰ TaskEr</h2>
        </div>
        <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Login to your account</h3>
        {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
        <form onSubmit={onSubmit}>
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
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="login-btn" type="submit">Sign in</button>
          </div>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span style={{ color: '#666', fontSize: '0.95rem' }}>Don't have an account? </span>
          <Link to="/register" style={{ color: '#0b5fff', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}