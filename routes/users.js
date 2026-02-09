// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// GET /users - list all users (admin only)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.is_active, u.created_at
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== SPECIFIC ROUTES (must come before :id routes) =====

// GET /users/team/members - get team members for a team leader
router.get('/team/members', authenticate, requireRole('team_leader'), async (req, res) => {
  try {
    const leaderId = req.user.id;
    // Get all team members assigned to this team leader
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.is_active
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.team_leader_id = $1
       ORDER BY u.name`,
      [leaderId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /users/available - get available team members to add (team leaders only)
router.get('/available', authenticate, requireRole('team_leader'), async (req, res) => {
  try {
    // Get all unassigned team_member users (team_leader_id IS NULL)
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE r.name = 'team_member' AND u.team_leader_id IS NULL
       ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===== PARAMETERIZED ROUTES (come after specific routes) =====

// GET /users/:id - get user by ID
router.get('/:id', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.role_id, r.name as role_name, u.is_active, u.created_at
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /users/:id - update user's name and/or password (self or admin)
router.put('/:id', authenticate, async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { name, current_password, new_password } = req.body;

  try {
    // allow if the requester is the user themselves or an admin
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const requesterRole = roleRows.length ? roleRows[0].name : null;
    if (req.user.id !== userId && requesterRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If changing password, current_password must be provided and verified
    if (new_password) {
      if (!current_password) return res.status(400).json({ error: 'Current password required' });

      const { rows: urows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (urows.length === 0) return res.status(404).json({ error: 'User not found' });

      const ok = await bcrypt.compare(current_password, urows[0].password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid current password' });

      const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
      await db.query('UPDATE users SET password_hash = $1, name = COALESCE($2, name), updated_at = now() WHERE id = $3', [hashed, name, userId]);
    } else {
      // only update name if provided
      if (typeof name !== 'undefined') {
        if (!String(name).trim()) return res.status(400).json({ error: 'Name cannot be blank' });
        const validName = /^[A-Za-z\s]+$/;
        if (!validName.test(String(name).trim())) return res.status(400).json({ error: 'Name may only contain letters and spaces' });
        await db.query('UPDATE users SET name = $1, updated_at = now() WHERE id = $2', [name.trim(), userId]);
      }
    }

    const { rows: updated } = await db.query('SELECT id, name, email, role_id, is_active FROM users WHERE id = $1', [userId]);
    if (updated.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /users/:id/role - change user role (admin only)
router.put('/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { role_name } = req.body;

  if (!role_name) return res.status(400).json({ error: 'Missing role_name' });

  try {
    // Get role id from role name
    const { rows: roleRows } = await db.query('SELECT id FROM roles WHERE name = $1', [role_name]);
    if (roleRows.length === 0) return res.status(400).json({ error: 'Invalid role' });
    const role_id = roleRows[0].id;

    // Update user role
    const { rows } = await db.query(
      'UPDATE users SET role_id = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, role_id',
      [role_id, userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /users/:id/active - toggle user active status (admin only)
router.put('/:id/active', authenticate, requireRole('admin'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') return res.status(400).json({ error: 'Missing is_active' });

  try {
    const { rows } = await db.query(
      'UPDATE users SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, is_active',
      [is_active, userId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /users/:id/team - assign member to team leader
router.put('/:id/team', authenticate, requireRole('team_leader'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const leaderId = req.user.id;

  try {
    const { rows } = await db.query(
      'UPDATE users SET team_leader_id = $1, updated_at = now() WHERE id = $2 AND role_id = (SELECT id FROM roles WHERE name = $3) RETURNING id, name, email',
      [leaderId, userId, 'team_member']
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found or invalid role' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /users/:id/team - remove member from team
router.delete('/:id/team', authenticate, requireRole('team_leader'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const leaderId = req.user.id;

  try {
    const { rows } = await db.query(
      'UPDATE users SET team_leader_id = NULL, updated_at = now() WHERE id = $1 AND team_leader_id = $2 RETURNING id, name, email',
      [userId, leaderId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found or not in your team' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
