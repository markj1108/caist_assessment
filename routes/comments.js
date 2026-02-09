// routes/comments.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /:taskId/comments (mounted at /tasks)
router.get('/:taskId/comments', authenticate, async (req, res) => {
  try {
    // Verify task exists and check authorization
    const { rows: taskCheck } = await db.query('SELECT assignee_id, reporter_id FROM tasks WHERE id = $1', [req.params.taskId]);
    if (taskCheck.length === 0) return res.status(404).json({ error: 'Task not found' });
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    if (roleRows[0].name === 'team_member' && taskCheck[0].assignee_id !== req.user.id && taskCheck[0].reporter_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await db.query(
      `SELECT c.*, u.name as author_name
       FROM comments c
       LEFT JOIN users u ON u.id = c.author_id
       WHERE c.task_id = $1
       ORDER BY c.created_at`,
      [req.params.taskId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /:taskId/comments (mounted at /tasks)
router.post('/:taskId/comments', authenticate, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Missing body' });
  try {
    // Verify task exists and check authorization
    const { rows: taskCheck } = await db.query('SELECT assignee_id, reporter_id FROM tasks WHERE id = $1', [req.params.taskId]);
    if (taskCheck.length === 0) return res.status(404).json({ error: 'Task not found' });
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    if (roleRows[0].name === 'team_member' && taskCheck[0].assignee_id !== req.user.id && taskCheck[0].reporter_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const author_id = req.user.id;
    const task_id = parseInt(req.params.taskId, 10);
    const { rows } = await db.query(
      `INSERT INTO comments (task_id, author_id, body) VALUES ($1,$2,$3) RETURNING *`,
      [task_id, author_id, body]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;