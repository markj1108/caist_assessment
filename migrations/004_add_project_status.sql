-- Add status column to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived'));

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
