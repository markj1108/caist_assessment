// routes/comments.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /tasks/:taskId/comments
router.get('/tasks/:taskId/comments', authenticate, async (req, res) => {
  try {
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

// POST /tasks/:taskId/comments
router.post('/tasks/:taskId/comments', authenticate, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Missing body' });
  try {
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