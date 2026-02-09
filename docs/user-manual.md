# TaskEr — User Manual

This manual describes how to use TaskEr for each role: Admin, Leader, and Member. It covers common flows, permissions, and troubleshooting.

**Audience:** All users of the Task and Project Tracker (TaskEr).

**Structure:**
- **Overview** — what TaskEr does
- **Common Steps** — authentication, navigation
- **Role Capabilities** — Admin, Leader, Member
- **Feature Guides** — Dashboard, Projects, Tasks, Members, Settings
- **Permissions matrix** — concise table of who can do what
- **Troubleshooting & FAQs**
- **Support & Contact**

---

**Overview**

- **What:** TaskEr helps teams plan, assign, and track projects and tasks with role-based access.
- **Core concepts:** Projects (containers of tasks), Tasks (units of work), Team Members (users), Statuses (To Do / In Progress / Review / Done / Blocked), Priorities (Low/Medium/High).

---

**Common Steps**

- **Sign in:** Use your organization credentials on the login page. Forgot password flows are in `Settings`.
- **Navigate:** Use the left sidebar to switch between Dashboard, Projects, Tasks, Members, and Settings.
- **Create / Edit forms:** Required fields are marked with an asterisk. Validation prevents invalid inputs (e.g., no past dates when creating time-bound items).

---

**Role Capabilities (summary)**

- **Admin (role_id = 1)** — Full access across the system.
  - Create, edit, delete projects and tasks.
  - Manage users and team membership (add/remove, change roles).
  - Access system settings.
  - View all data and audit actions.

- **Leader (role_id = 2)** — Project-level manager.
  - Create and edit projects and tasks for their teams.
  - Assign tasks to members.
  - Mark projects as completed.
  - Invite members (if allowed by org settings).

- **Member (role_id >= 3)** — Individual contributor.
  - View projects and tasks they are assigned to or that are public to the team.
  - Update task status and details if permitted.
  - Comment on tasks and update personal settings.

---

**Dashboard**

- **Purpose:** Quick overview of projects, tasks, and activity.
- **Common actions:**
  - Click a project card to open the project detail panel.
  - Use the quick filters to show overdue or priority tasks.
- **Notes:** Overdue projects/tasks are highlighted. Leaders and Admins can see team-wide stats.

---

**Projects**

- **Create a Project (Leader/Admin):**
  - Click `+ New Project` on the Projects page.
  - Required: Name. Optional: Description, Start Date, Due Date.
  - The UI prevents setting a Due Date in the past.
- **Project Status:** `Active` (default), `Completed`, `Overdue` (calculated).
- **Edit / Delete:** Use project actions (⋯) or open the project and use `Edit` / `Delete`. Deleting requires confirmation.
- **Project Detail:** Shows description, dates, progress bar (based on tasks), task list, and action buttons.

---

**Tasks**

- **Create a Task (Leader/Admin):**
  - Inside a project or from Tasks page, click `+ Add Task`.
  - Required: Title. Optional: Description, Assignee, Priority, Due Date.
  - The system validates titles (alphanumeric, spaces, -, _). Past due dates are blocked.
- **Status transitions:** `To Do` → `In Progress` → `Review` → `Done` (or mark `Blocked`).
- **Assignee:** Assign a team member at creation or edit. Members see tasks assigned to them on their Tasks page.
- **Editing / Deleting:** Use `Edit` on the task card (leaders/admins) or the task detail view.
- **Overdue:** Tasks with past due dates and not `Done` are marked `Overdue` visually.

---

**Members & Teams**

- **Viewing members:** Go to `Members` to see team list.
- **Adding members (Admin/Leader):** Use `Add Member` and choose from available users or invite via email (depends on setup).
- **Removing members:** Use `Remove` with confirmation.
- **Roles:** Change a user's role to grant or restrict access (Admin only).

---

**Settings (Profile & Account)**

- **Profile:** Update name, email, avatar (initials generated automatically if no upload).
- **Password:** Change password in `Settings` (current password required).
- **Notifications:** Configure email or in-app preferences (if enabled).

---

**Permissions Matrix**

- **Create Project:** Admin, Leader
- **Edit Project:** Admin, Leader
- **Delete Project:** Admin (Leaders may have delete if allowed)
- **Create Task:** Admin, Leader
- **Edit Task:** Admin, Leader (Members can edit if assigned and permitted)
- **Delete Task:** Admin, Leader
- **Add/Remove Members:** Admin (Leaders depending on org settings)
- **Change Roles:** Admin only

(For exact permission policies, see your org's configured settings.)

---

**Best Practices**

- Use clear, short task titles with a single actionable verb (e.g., "Design login form").
- Set realistic due dates and update status frequently.
- Assign a single owner for each task to avoid ambiguity.
- Use priorities sparingly — only when they change scheduling.

---

**Troubleshooting & FAQs**

- **I can't set a past due date.** The app prevents past dates to keep scheduling accurate — choose today or a future date.
- **I don't see a task assigned to me.** Check the project membership and open the project — tasks are visible when you're added to the team or explicitly assigned.
- **Buttons look wrong / colors inconsistent.** Clear browser cache and reload. If you still see old styling, a rebuild of the frontend may be required by the admin (`npm run build`).
- **I can't delete a project/task.** You likely don't have permission — contact an Admin.

---

**Support & Contact**

- For operational issues, contact your organization's TaskEr administrator.
- For product bugs or feature requests, open a ticket with the engineering team and include: steps to reproduce, expected behavior, screenshots, and your role.

---

**Appendix: Quick Cheat Sheet**

- **Where to create:** `Projects` → `+ New Project`; inside project → `+ Add Task`.
- **Where to assign:** Task creation or `Edit` task.
- **How to mark complete:** Project detail → `Mark Project as Completed` (Leader/Admin), Task → set status to `Done`.

---

File: [docs/user-manual.md](docs/user-manual.md)

