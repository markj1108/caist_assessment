// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'caist_secret';

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid auth header' });
  const token = parts[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Attach user info including team_leader_id
    const { rows } = await db.query('SELECT id, name, email, role_id, team_leader_id FROM users WHERE id = $1', [payload.userId]);
    if (rows.length === 0) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...allowedRoleNames) {
  // allowedRoleNames: e.g., ['team_leader', 'admin']
  return async (req, res, next) => {
    try {
      const { rows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
      if (rows.length === 0) return res.status(403).json({ error: 'Role not found' });
      const roleName = rows[0].name;
      if (allowedRoleNames.includes(roleName) || allowedRoleNames.includes('*')) return next();
      return res.status(403).json({ error: 'Forbidden' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
}

module.exports = {
  authenticate,
  requireRole,
};