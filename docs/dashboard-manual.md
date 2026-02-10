# TaskEr — Dashboard & Key Pages User Manual

This manual explains the Dashboard and primary pages (Projects, Tasks, Members, Settings) for TaskEr users (Admin, Leader, Member).

Overview
- **Dashboard**: at-a-glance stats and quick access to projects and tasks.
- **Projects**: create/manage projects and view project details.
- **Tasks**: list, filter, create, and update tasks; access task details and history.
- **Members**: view and manage team members (permissions vary by role).
- **Settings**: update your profile, password, and personal preferences.

Roles & Capabilities (summary)
- **Admin**: full access (create/edit/delete projects & tasks, manage users, change roles).
- **Leader**: create/edit projects and tasks, assign tasks, mark projects complete.
- **Member**: view assigned tasks, update task status and comments (as allowed).

Dashboard — What you see
- **Top stats**: Total Projects, Completed, Overdue — quick indicators for team health.
- **Projects Overview**: Cards or list of active projects; click a card to open Project Detail.
- **Quick actions**: Buttons to create a new project or navigate to Tasks/Members.

Dashboard — Common Tasks
- Open a project: click the project card or project name to open the detail panel.
- View overdue items: use the Overdue stat or the Tasks page filter.
- Create new project (Leader/Admin): `+ New Project` → fill name, description, start/due date → Create.

Projects — Guide
- Page: `Projects`
- Create: `+ New Project` (Name required). Client prevents past due dates.
- Project card: shows title, status (Active/Overdue/Completed), progress bar (based on tasks).
- Actions:
  - View Details: opens the project panel with description, dates, progress, and task list.
  - Add Task: `+ Add Task` in project detail. Required: Title. Optionals: assignee, priority, due date.
  - Edit Project: edit metadata and dates. Deleting requires confirmation.

Tasks — Guide
- Page: `Tasks` (My Tasks)
- Filters: Active, To Do, In Progress, Completed — use the pills at top to filter and see counts.
- Task Card: title, project, status badge, priority, due date, and `View` button.
- Create Task:
  - From Projects: open project → `+ Add Task`.
  - From Tasks page: if permitted, `+ Add Task` or top-level create.
- Edit Task: open detail or click `Edit` (Leader/Admin) — change title, description, status, assignee, priority.
- Status transitions: To Do → In Progress → Review → Done; blocked tasks can be marked `Blocked`.
- Overdue: shown when due date < today and status != Done.

Task Detail — Key Areas
- Title, description, project reference.
- Current status and the status-change control (pick a new status, optional note).
- Comments: add comments; author displays immediately after posting.
- Status history: chronological log showing who changed status, when, and old → new.

Members — Guide
- Page: `Members`
- View list of users with role and status.
- Add Member (Admin/Leader depending on org): `Add Member` → choose user or invite by email.
- Remove Member: `Remove` action with confirmation.
- Change Role: Admin only (edit user to change role).

Settings — Guide
- Page: `Settings`
- Profile: update name and email (email changes may require confirmation).
- Password: change password — provide current and new password.
- Notifications & preferences: update if available.

Accessibility & Visual Notes
- Primary color: app uses a single `--primary` token for consistent buttons and accents.
- Auth pages use a white surface background for neutral presentation.
- Buttons and focus rings include clear hover/focus states for keyboard users.

Troubleshooting & Tips
- If a change (comment, status) shows an ID or `user_id` instead of a name: reload or verify network; recent fixes now augment comments and history in the UI without refresh.
- If styles look outdated, rebuild the client or clear cache (`npm run build` then redeploy build artifacts).
- For permission issues (cannot delete project, missing actions), check your role or contact an Admin.

Support
- Report bugs with steps to reproduce, expected vs actual behavior, screenshots, and your role.
- For account problems (disabled accounts, lockouts), contact an Admin.

Files
- [docs/dashboard-manual.md](docs/dashboard-manual.md)

