# TaskEr — Projects Manual (Leader & Member)

This guide covers everything related to Projects in TaskEr, with clear instructions for the two primary project-facing roles: Leader and Member.

Audience
- Leaders (project managers / team leads)
- Members (individual contributors assigned to projects/tasks)

Overview
- A Project groups related tasks, owners, dates, and progress.
- Leaders create and manage projects and tasks; Members work on tasks assigned to them and provide status updates and comments.

Key Concepts
- Project: container for tasks with metadata (name, description, start/due dates, status).
- Task: a unit of work under a project with status, priority, assignee, and due date.
- Status: `To Do`, `In Progress`, `Review`, `Done`, `Blocked`.
- Progress: calculated as completed tasks / total tasks and shown as a progress bar on the project card.
- Overdue: a project or task becomes "Overdue" when its due date is in the past and it is not completed.

Role Capabilities (Leader vs Member)
- Leader:
  - Create, edit, and delete projects (depending on org policy).
  - Add and assign tasks to team members.
  - Set project start/due dates (UI prevents past due dates).
  - Mark project as completed.
  - View project progress and team status.
- Member:
  - View projects they are a member of or assigned tasks in.
  - Update task status and add comments on tasks they are assigned to.
  - View project details and progress.

Projects Page (How to use)
- Location: click `Projects` in the left sidebar.
- Layout: list or grid of project cards showing project name, short description, progress, and status badge.
- Create a project (Leader): click `+ New Project`, fill the form (Name required, Description optional, Start & Due Dates optional). The UI disallows selecting a past due date.
- Open a project: click a project card to open the Project Detail panel.

Project Detail (Leader & Member)
- Header: project name, key metadata, and action buttons (Edit, Delete, + Add Task).
- Description: full project description.
- Dates: Start Date, Due Date — Leaders can edit; Members can view.
- Progress: visual progress bar and counts of completed vs total tasks.
- Tasks list: in-project tasks with quick actions (Edit, Delete, View).
- Task creation (Leader): `+ Add Task` inside a project. Required: Title. Optional: assignee, priority, due date, description.
- Mark project complete (Leader): click `Mark Project as Completed` to set project status to `Completed`.

Tasks in Project Context
- Task Card: title, short description, progress/status badges, and action buttons.
- Add Task: use the project `+ Add Task` modal; validate title and prevent invalid characters.
- Edit Task: Leaders can edit any task; Members may edit tasks if assigned and permitted.
- Assigning: choose a team member from the project/team list in the assign field.
- Priority & Due Dates: set priority (Low/Medium/High) and a due date to indicate scheduling urgency.

Status & History
- Change status: pick from the status dropdown in Task Detail, optionally add a note.
- Status history: each change is recorded with who changed it, timestamp, and old → new values. The UI shows readable names immediately.

Comments & Collaboration
- Comments: available in each Task Detail view. Add text and click `Post comment`.
- Immediate display: comments posted by the current user show the user's display name immediately without needing a page refresh.
- Use comments for clarifying requirements, asking questions, and recording decisions.

Permissions and Best Practices
- Leaders should assign a single owner per task to avoid ambiguity.
- Use due dates and update task status regularly to keep progress accurate.
- Avoid deleting projects unless you are certain; deletions are destructive (confirm prompt).

Overdue & Alerts
- Overdue indicator: a project or task whose due date is past and status is not `Done` will show an `Overdue` badge.
- Dashboard: the `Overdue` count in Dashboard highlights projects/tasks needing attention.

Troubleshooting (Projects)
- "Can't select past due date": by design; choose today or a future date.
- "Assigned user not visible": ensure the user is a Member of the team or the organization; Leaders may need to add them as a member first.
- "Progress not updating": ensure tasks have accurate status values; progress updates when tasks are marked `Done`.

Examples (Quick Workflows)
- Leader: Create a Project → Add 5 Tasks → Assign tasks to team members → Track progress on Dashboard.
- Member: Open assigned Project → Open a Task → Update status to `In Progress` → Add a comment with blockers.

Appendix — Quick Links
- Register/Login guide: [docs/register-login.md](docs/register-login.md)
- Dashboard manual: [docs/dashboard-manual.md](docs/dashboard-manual.md)

File: [docs/projects-manual.md](docs/projects-manual.md)
