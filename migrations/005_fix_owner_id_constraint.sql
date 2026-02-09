-- migrations/005_fix_owner_id_constraint.sql
-- Fix: projects.owner_id was NOT NULL with ON DELETE SET NULL, which would
-- violate the constraint when a user is deleted. Change to ON DELETE RESTRICT
-- so that a user cannot be deleted while they own projects.

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_owner_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;
