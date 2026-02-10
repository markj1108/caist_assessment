import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const isLocked = lockoutSeconds > 0;

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked]);

  async function onSubmit(e) {
    e.preventDefault();
    if (isLocked) return;
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err.body?.error || err.message || 'Login failed';
      setError(message);
      if (err.status === 429) {
        const match = message.match(/(\d+)\s*seconds?/);
        if (match) setLockoutSeconds(parseInt(match[1], 10));
      }
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: 'var(--primary)', marginBottom: 16 }}>
            <span style={{ color: 'white', fontWeight: 800, fontSize: '1.3rem' }}>≡</span>
          </div>
          <h2 style={{ marginTop: 0, marginBottom: 4, fontSize: '1.5rem' }}>Welcome back</h2>
        </div>
        <h3>Sign in to your account</h3>
        {error && !isLocked && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', border: '1px solid #fecaca', textAlign: 'center' }}>
            {error}
          </div>
        )}
        {isLocked && (
          <div style={{ textAlign: 'center', marginBottom: 16, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, color: '#dc2626', fontWeight: 600, fontSize: '0.9rem', border: '1px solid #dc2626' }}>
            🔒 Locked — try again in {lockoutSeconds}s
          </div>
        )}
        <form onSubmit={onSubmit}>
          <div className="login-form-row">
            <label>Email</label>
            <input className="login-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="login-form-row">
            <label>Password</label>
            <input className="login-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="login-btn" type="submit" disabled={isLocked}
            style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer', marginTop: 8 }}
          >Sign in</button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>Create one</Link>
        </div>
      </div>
    </div>
  );
}