// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'caist_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// Simple in-memory tracking of failed login attempts.
// We track by email and by IP. This is ephemeral and resets on server restart.
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MINUTES = 3;
const loginAttempts = new Map();
const ipAttempts = new Map();

// POST /auth/register
// For simplicity we allow registering with a role name (in real app restrict this)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const role = 'team_member'; // Always register as team_member; role promotion requires admin
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  // Validate name: only letters and spaces allowed (no numbers or special characters)
  const validName = /^[A-Za-z\s]+$/;
  if (!validName.test(String(name))) return res.status(400).json({ error: 'Name may only contain letters and spaces' });

  // Validate email format
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!validEmail.test(String(email))) return res.status(400).json({ error: 'Invalid email format' });

  // Validate password strength
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    // find role id
    const r = await db.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (r.rows.length === 0) return res.status(400).json({ error: 'Invalid role' });
    const role_id = r.rows[0].id;

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role_id) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role_id`,
      [name, email, hashed, role_id]
    );
    const user = rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const key = String(email).toLowerCase();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const attempt = loginAttempts.get(key) || { count: 0, lockUntil: null };
  const ipAttempt = ipAttempts.get(ip) || { count: 0, lockUntil: null };

  // If IP is locked, block any login attempts from that IP (prevents trying other accounts)
  if (ipAttempt.lockUntil && Date.now() < ipAttempt.lockUntil) {
    const remainingMs = ipAttempt.lockUntil - Date.now();
    const remainingSec = Math.ceil(remainingMs / 1000);
    return res.status(429).json({ error: `Too many failed attempts from this IP. Try again in ${remainingSec} seconds` });
  }

  // If this specific email is locked, block login for that email
  if (attempt.lockUntil && Date.now() < attempt.lockUntil) {
    const remainingMs = attempt.lockUntil - Date.now();
    const remainingSec = Math.ceil(remainingMs / 1000);
    return res.status(429).json({ error: `Too many failed attempts for this account. Try again in ${remainingSec} seconds` });
  }

  try {
    const { rows } = await db.query('SELECT id, password_hash, name, email, role_id, is_active FROM users WHERE email = $1', [email]);
    const user = rows[0];
    const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !passwordMatches) {
      // increment per-email failed attempts
      const nextCount = (attempt.count || 0) + 1;
      // increment per-ip failed attempts
      const nextIpCount = (ipAttempt.count || 0) + 1;

      // If email reaches threshold, lock the account and also lock the IP to prevent trying other accounts
      if (nextCount >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        loginAttempts.set(key, { count: 0, lockUntil });
        ipAttempts.set(ip, { count: 0, lockUntil });
        const remainingSec = Math.ceil((lockUntil - Date.now()) / 1000);
        return res.status(429).json({ error: `Too many failed attempts. All login attempts from this IP are blocked for ${remainingSec} seconds` });
      }

      // If IP reaches threshold independently, lock the IP
      if (nextIpCount >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = Date.now() + LOCK_MINUTES * 60 * 1000;
        ipAttempts.set(ip, { count: 0, lockUntil });
        const remainingSec = Math.ceil((lockUntil - Date.now()) / 1000);
        return res.status(429).json({ error: `Too many failed attempts from this IP. Try again in ${remainingSec} seconds` });
      }

      // Save updated counts
      loginAttempts.set(key, { count: nextCount, lockUntil: null });
      ipAttempts.set(ip, { count: nextIpCount, lockUntil: null });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Check if user account is active
    if (user.is_active === false) {
      if (loginAttempts.has(key)) loginAttempts.delete(key);
      if (ipAttempts.has(ip)) ipAttempts.delete(ip);
      return res.status(403).json({ error: 'Your account has been disabled. Please contact an administrator.' });
    }
    // successful login — clear attempts for this email and this IP
    if (loginAttempts.has(key)) loginAttempts.delete(key);
    if (ipAttempts.has(ip)) ipAttempts.delete(ip);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id, is_active: user.is_active } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;