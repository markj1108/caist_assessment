-- migrations/003_add_team_leader_id.sql
-- Adds team_leader_id to users so team members can be assigned to a leader

ALTER TABLE users ADD COLUMN IF NOT EXISTS team_leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_team_leader ON users(team_leader_id);
