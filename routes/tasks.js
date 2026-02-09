
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');


async function getStatusId(name) {
  const { rows } = await db.query('SELECT id FROM statuses WHERE name = $1', [name]);
  return rows[0] ? rows[0].id : null;
}


router.post('/projects/:projectId/tasks', authenticate, requireRole('team_leader', 'admin'), async (req, res) => {
  const { title, description, assignee_id, status_id, priority, due_date, parent_task_id } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing title' });
  // validate title: allow letters, numbers, spaces, hyphen, underscore
  const validTitle = /^[A-Za-z0-9\s\-_]+$/;
  if (!validTitle.test(String(title))) return res.status(400).json({ error: 'Task title contains invalid characters' });
  try {

    let finalStatusId = status_id;
    if (!finalStatusId) {
      const { rows } = await db.query('SELECT id FROM statuses WHERE name = $1 LIMIT 1', ['todo']);
      finalStatusId = rows[0].id;
    }
    const reporter_id = req.user.id;
    const project_id = parseInt(req.params.projectId, 10);
    const { rows } = await db.query(
      `INSERT INTO tasks (project_id, title, description, reporter_id, assignee_id, status_id, priority, due_date, parent_task_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [project_id, title, description || null, reporter_id, assignee_id || null, finalStatusId, priority || 'medium', due_date || null, parent_task_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/projects/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const project_id = parseInt(req.params.projectId, 10);
    const { rows } = await db.query(
      `SELECT t.*, s.name as status_name, u.name as assignee_name
       FROM tasks t
       LEFT JOIN statuses s on s.id = t.status_id
       LEFT JOIN users u on u.id = t.assignee_id
       WHERE t.project_id = $1
       ORDER BY t.due_date NULLS LAST, CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END`,
      [project_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/assigned', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, p.name as project_name, s.name as status_name
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       JOIN statuses s ON s.id = t.status_id
       WHERE t.assignee_id = $1
       ORDER BY t.due_date NULLS LAST`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /tasks/statuses - list all available statuses
router.get('/statuses', authenticate, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, order_index FROM statuses ORDER BY order_index');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /tasks/:id - get a single task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const tid = parseInt(req.params.id, 10);
    if (isNaN(tid)) return res.status(400).json({ error: 'Invalid task ID' });
    const { rows } = await db.query(
      `SELECT t.*, s.name as status_name, u.name as assignee_name, p.name as project_name
       FROM tasks t
       LEFT JOIN statuses s ON s.id = t.status_id
       LEFT JOIN users u ON u.id = t.assignee_id
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.id = $1`,
      [tid]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /tasks/:id - update task fields (leaders can update; assignee can update limited fields)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const tid = parseInt(req.params.id, 10);
    const { rows: existingRows } = await db.query('SELECT * FROM tasks WHERE id = $1', [tid]);
    if (existingRows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const task = existingRows[0];

    // check role/permission: allow full edit for team_leader/admin; assignee can only update description/due_date maybe
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = roleRows[0].name;

    const isLeader = roleName === 'team_leader' || roleName === 'admin';
    const isAssignee = task.assignee_id === req.user.id;

    if (!isLeader && !isAssignee) return res.status(403).json({ error: 'Forbidden' });

    // Build update dynamically allowed fields
    const allowedForLeader = ['title','description','assignee_id','priority','due_date','status_id','parent_task_id'];
    const allowedForAssignee = ['description','due_date'];

    const updates = [];
    const params = [];
    let idx = 1;

    for (const key of (isLeader ? allowedForLeader : allowedForAssignee)) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        // if updating title, validate characters
        if (key === 'title') {
          const validTitle = /^[A-Za-z0-9\s\-_]+$/;
          if (!validTitle.test(String(req.body.title))) return res.status(400).json({ error: 'Task title contains invalid characters' });
        }
        updates.push(`${key} = $${idx}`);
        params.push(req.body[key]);
        idx++;
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No updatable fields provided' });

    params.push(tid);
    const q = `UPDATE tasks SET ${updates.join(', ')}, updated_at = now() WHERE id = $${idx} RETURNING *`;
    const { rows } = await db.query(q, params);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /tasks/:id/status - change status (assignee or leader)
router.post('/:id/status', authenticate, async (req, res) => {
  const tid = parseInt(req.params.id, 10);
  const { new_status_id, note } = req.body;
  if (!new_status_id) return res.status(400).json({ error: 'Missing new_status_id' });

  try {
    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [tid]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const task = rows[0];

    // permission: assignee or team_leader/admin
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = roleRows[0].name;
    const isLeader = roleName === 'team_leader' || roleName === 'admin';
    const isAssignee = task.assignee_id === req.user.id;
    if (!isLeader && !isAssignee) return res.status(403).json({ error: 'Forbidden' });

    // read old status
    const old_status_id = task.status_id;

    // update task status and insert status_log within transaction
    await db.query('BEGIN');
    await db.query('UPDATE tasks SET status_id = $1, updated_at = now() WHERE id = $2', [new_status_id, tid]);
    const insert = await db.query(
      `INSERT INTO status_logs (task_id, old_status_id, new_status_id, changed_by, note) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [tid, old_status_id, new_status_id, req.user.id, note || null]
    );
    await db.query('COMMIT');

    // return updated task and new log
    const { rows: updatedRows } = await db.query('SELECT t.*, s.name as status_name FROM tasks t LEFT JOIN statuses s ON s.id = t.status_id WHERE t.id = $1', [tid]);
    res.json({ task: updatedRows[0], status_log: insert.rows[0] });
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /tasks/:id/status_logs
router.get('/:id/status_logs', authenticate, async (req, res) => {
  try {
    const tid = parseInt(req.params.id, 10);
    const { rows } = await db.query(
      `SELECT sl.*, s_old.name as old_status, s_new.name as new_status, u.name as changed_by_name
       FROM status_logs sl
       LEFT JOIN statuses s_old ON s_old.id = sl.old_status_id
       LEFT JOIN statuses s_new ON s_new.id = sl.new_status_id
       LEFT JOIN users u ON u.id = sl.changed_by
       WHERE sl.task_id = $1
       ORDER BY sl.created_at`,
      [tid]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /tasks/:id - delete task (team_leader or admin only)
router.delete('/:id', authenticate, requireRole('team_leader', 'admin'), async (req, res) => {
  try {
    const tid = parseInt(req.params.id, 10);
    const { rows: taskRows } = await db.query('SELECT * FROM tasks WHERE id = $1', [tid]);
    
    if (taskRows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete the task (cascade will handle status_logs and comments)
    await db.query('DELETE FROM tasks WHERE id = $1', [tid]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;