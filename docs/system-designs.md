## Task & Project Tracker System Designs
# 1. High-Level Architecture
- Frontend
 - React using Vite
- Backend
 - Node + Express
- Database
 - Postgres

# 2. Database Design 
 - roles
 - users
 - projects
 - tasks
 - comments
 - statuses
 
# 3. API List:
- Authentication
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/logout

- Users & Roles
    - GET /api/users
    - GET /api/users/:userId
    - PUT /api/users/:userId
    - DELETE /api/users/:userId
    - GET /api/roles

- Projects
    - GET /api/projects
    - POST /api/projects
    - GET /api/projects/:projectId
    - PUT /api/projects/:projectId
    - DELETE /api/projects/:projectId
    - GET /api/projects/:projectId/members
    - POST /api/projects/:projectId/members

- Tasks
    - GET /api/projects/:projectId/tasks
    - POST /api/projects/:projectId/tasks
    - GET /api/tasks/:taskId
    - PUT /api/tasks/:taskId
    - PATCH /api/tasks/:taskId
    - PATCH /api/tasks/:taskId/status
    - DELETE /api/tasks/:taskId

- Comments
    - GET /api/tasks/:taskId/comments
    - POST /api/tasks/:taskId/comments
    - GET /api/comments/:commentId
    - PUT /api/comments/:commentId
    - DELETE /api/comments/:commentId

- Status Logs
    - GET /api/status_logs
    - GET /api/tasks/:taskId/status_logs