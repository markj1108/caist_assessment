// routes/projects.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /projects - visibility based on user role
// Admin: sees all projects
// Team Leader: sees all projects
// Team Member: sees only projects of their team leader
router.get('/', authenticate, async (req, res) => {
  try {
    // Get user role
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = roleRows[0].name;

    // Build query based on role
    let query = `SELECT p.*, 
              u.name as owner_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status_id = (SELECT id FROM statuses WHERE name = 'done' LIMIT 1)) as completed_tasks,
              CASE 
                WHEN (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) = 0 THEN 0
                ELSE ROUND(100 * (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status_id = (SELECT id FROM statuses WHERE name = 'done' LIMIT 1))::numeric / (SELECT COUNT(*) FROM tasks WHERE project_id = p.id), 2)
              END as progress
       FROM projects p 
       LEFT JOIN users u ON u.id = p.owner_id`;

    let params = [];

    // Filter based on role
    if (roleName === 'team_member') {
      // Team members only see projects of their team leader
      query += ` WHERE p.owner_id = $1`;
      params.push(req.user.team_leader_id);
    }
    // Admin and Team Leader see all projects

    query += ` ORDER BY p.created_at DESC`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /projects - require team_leader or admin
router.post('/', authenticate, requireRole('team_leader', 'admin'), async (req, res) => {
  const { name, description, start_date, due_date } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  try {
    const owner_id = req.user.id;
    const { rows } = await db.query(
      `INSERT INTO projects (name, description, owner_id, start_date, due_date) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, description, owner_id, start_date, due_date, is_active, created_at, updated_at`,
      [name, description || null, owner_id, start_date || null, due_date || null]
    );
    console.log('Created project:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    console.log('Fetching project ID:', projectId);
    
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });
    
    const { rows } = await db.query(
      `SELECT p.*, 
              u.name as owner_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status_id = (SELECT id FROM statuses WHERE name = 'done' LIMIT 1)) as completed_tasks,
              CASE 
                WHEN (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) = 0 THEN 0
                ELSE ROUND(100 * (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status_id = (SELECT id FROM statuses WHERE name = 'done' LIMIT 1))::numeric / (SELECT COUNT(*) FROM tasks WHERE project_id = p.id), 2)
              END as progress
       FROM projects p 
       LEFT JOIN users u ON u.id = p.owner_id 
       WHERE p.id = $1`,
      [projectId]
    );
    
    console.log('Query result:', rows);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /projects/:id/complete - mark project as completed (team_leader or admin only)
router.put('/:id/complete', authenticate, requireRole('team_leader', 'admin'), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });

    // Verify user is owner or admin
    const { rows: projectRows } = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectRows.length === 0) return res.status(404).json({ error: 'Project not found' });
    
    const project = projectRows[0];
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = roleRows[0].name;
    
    if (roleName !== 'admin' && project.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only owner or admin can complete project' });
    }

    // Check if all tasks are completed
    const { rows: undoneTasks } = await db.query(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE project_id = $1 AND status_id != (SELECT id FROM statuses WHERE name = 'done')`,
      [projectId]
    );

    const undoneTaskCount = parseInt(undoneTasks[0].count, 10);
    if (undoneTaskCount > 0) {
      return res.status(400).json({ 
        error: `Cannot complete project with ${undoneTaskCount} undone task${undoneTaskCount !== 1 ? 's' : ''}. All tasks must be completed first.` 
      });
    }

    const { rows } = await db.query(
      `UPDATE projects SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      ['completed', projectId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error completing project:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /projects/:id - delete project (team_leader or admin only)
router.delete('/:id', authenticate, requireRole('team_leader', 'admin'), async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });

    // Verify user is owner or admin
    const { rows: projectRows } = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projectRows.length === 0) return res.status(404).json({ error: 'Project not found' });
    
    const project = projectRows[0];
    const { rows: roleRows } = await db.query('SELECT name FROM roles WHERE id = $1', [req.user.role_id]);
    const roleName = roleRows[0].name;
    
    if (roleName !== 'admin' && project.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only owner or admin can delete project' });
    }

    // Delete the project (cascade will handle tasks, comments, status_logs)
    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;