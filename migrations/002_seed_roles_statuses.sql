-- migrations/002_seed_roles_statuses.sql
-- Run after the init migration

INSERT INTO roles (name, description)
VALUES
  ('admin', 'Full access'),
  ('team_leader', 'Can create projects and tasks, assign tasks'),
  ('team_member', 'Can view and update tasks assigned to them')
ON CONFLICT (name) DO NOTHING;

INSERT INTO statuses (name, order_index)
VALUES
  ('todo', 10),
  ('in_progress', 20),
  ('review', 30),
  ('blocked', 5),
  ('done', 40)
ON CONFLICT (name) DO NOTHING;