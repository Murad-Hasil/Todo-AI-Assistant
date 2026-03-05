# Feature Specification: Frontend Development & Integration

**Feature Branch**: `004-nextjs-frontend`
**Created**: 2026-03-03
**Status**: Draft
**Phase**: 2.3 — Frontend Development & Integration

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Creation & Sign-In (Priority: P1)

As a new visitor, I want to create an account and sign in so that my tasks are saved privately under my identity and no one else can see or modify them.

**Why this priority**: Without authentication, no other feature has value. This is the gate that makes the entire application usable by real people.

**Independent Test**: Open the app in an incognito browser. Register with a new email. Sign in. Confirm the dashboard appears with an empty task list scoped to the new account.

**Acceptance Scenarios**:

1. **Given** I am a new visitor with no account, **When** I fill out the sign-up form with a valid email and password and submit, **Then** an account is created and I am automatically signed in to the dashboard.
2. **Given** I have an existing account, **When** I enter my credentials on the sign-in page and submit, **Then** I am taken to my personal task dashboard.
3. **Given** I am not signed in, **When** I try to navigate directly to the dashboard URL, **Then** I am redirected to the sign-in page.
4. **Given** I am signed in, **When** I sign out, **Then** I am redirected to the sign-in page and cannot access the dashboard without signing in again.
5. **Given** I submit the sign-in form with wrong credentials, **When** the server rejects the attempt, **Then** an error message is displayed without clearing my email field.

---

### User Story 2 - Create, View, and Manage Tasks (Priority: P1)

As a signed-in user, I want to create tasks, see all my tasks in a list, mark them complete, and delete ones I no longer need, so that I can manage my todo list efficiently.

**Why this priority**: This is the core value proposition of the application. Without task management, there is no product.

**Independent Test**: Sign in, create three tasks. Mark one complete. Delete another. Verify the list updates immediately to reflect each change without requiring a page refresh.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I type a task title and submit the add-task form, **Then** the new task appears in the list immediately.
2. **Given** I see a task in the list, **When** I click the checkbox next to it, **Then** the task is visually marked as completed (e.g., strikethrough) and the change is saved.
3. **Given** I see a completed task, **When** I click its checkbox again, **Then** the task is restored to pending state.
4. **Given** I see a task in the list, **When** I click the delete button, **Then** the task is removed from the list immediately.
5. **Given** I see a task in the list, **When** I edit the title or description and save, **Then** the task shows the updated content.
6. **Given** I have no tasks, **When** I view the dashboard, **Then** a helpful empty-state message is shown (e.g., "No tasks yet. Add one above.").

---

### User Story 3 - Filter Tasks by Status (Priority: P2)

As a signed-in user, I want to filter my task list by "all", "pending", or "completed" so that I can focus on the subset of tasks most relevant to what I am working on.

**Why this priority**: Filtering improves usability at scale. An empty new account does not need filtering, but it becomes essential once tasks accumulate. Delivers independently after task list is working.

**Independent Test**: Create five tasks, complete two of them. Click "Completed" filter — verify only 2 tasks are shown. Click "Pending" — verify 3 tasks shown. Click "All" — verify all 5 shown.

**Acceptance Scenarios**:

1. **Given** I have a mix of completed and pending tasks, **When** I select the "Completed" filter, **Then** only completed tasks are shown.
2. **Given** I have a mix of tasks, **When** I select the "Pending" filter, **Then** only incomplete tasks are shown.
3. **Given** any filter is active, **When** I select "All", **Then** all tasks are shown regardless of status.
4. **Given** a filter is active and I add a new task, **When** the task is created, **Then** it appears in the list if it matches the active filter (pending tasks appear under "All" and "Pending"; not under "Completed").

---

### User Story 4 - Responsive Layout (Priority: P2)

As a user on a mobile device, I want the dashboard and auth pages to be usable on my phone screen, so that I can manage tasks on the go without needing a desktop browser.

**Why this priority**: A significant share of web traffic is mobile. Responsive design is a baseline quality requirement, not an afterthought.

**Independent Test**: Open the app on a phone (or browser dev tools at 375px width). Confirm all elements are readable and interactive — form inputs, buttons, task list items — without horizontal scrolling.

**Acceptance Scenarios**:

1. **Given** a viewport width of 375px (iPhone SE), **When** I view the sign-in page, **Then** the form is fully visible and usable without horizontal scrolling.
2. **Given** a mobile viewport, **When** I view the task dashboard, **Then** task items, buttons, and filter controls are all touch-friendly (adequate tap target size) and fully visible.
3. **Given** a desktop viewport (≥1024px), **When** I view the dashboard, **Then** the layout makes good use of available space with readable line widths.

---

### Edge Cases

- What happens when the backend is unreachable? → Show a user-friendly error banner; do not show a blank page or raw error object.
- What happens when the JWT expires mid-session? → The next API call returns 401; redirect the user to sign-in with a session-expired message.
- What happens when a task title is empty? → The add-task form MUST prevent submission and display a validation message.
- What happens when the task title exceeds 200 characters? → The form MUST enforce the character limit (matching the backend constraint).
- What happens when two browser tabs are open and a task is deleted in one? → No real-time sync required in Phase 2.3; the other tab reflects the change on next interaction or page focus.
- What happens during slow network? → Buttons should show a loading indicator to prevent double-submission.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST provide dedicated pages for user sign-up and sign-in.
- **FR-002**: The sign-up page MUST collect at minimum an email address and password; both fields are required.
- **FR-003**: Any page that requires authentication MUST redirect unauthenticated users to the sign-in page automatically.
- **FR-004**: After a successful sign-in, the user MUST be redirected to the task dashboard.
- **FR-005**: The task dashboard MUST display all tasks belonging to the authenticated user, showing title, completion status, and creation date for each item.
- **FR-006**: The dashboard MUST include a form to create a new task with a required title field and an optional description field.
- **FR-007**: Each task item MUST provide a toggle control to mark it complete or restore it to pending.
- **FR-008**: Each task item MUST provide a delete action that permanently removes the task.
- **FR-009**: Each task item MUST provide an edit action allowing the user to update the title and/or description.
- **FR-010**: The dashboard MUST include filter controls ("All", "Pending", "Completed") that update the displayed task list.
- **FR-011**: All task API requests MUST include the user's session token in the Authorization header; the application MUST not require the user to supply the token manually.
- **FR-012**: All backend communication MUST be routed through a single centralised API client module.
- **FR-013**: The user interface MUST reflect task state changes (create, update, delete, toggle) without requiring a full page reload.
- **FR-014**: The user interface MUST be fully usable on screens from 375px wide (mobile) to 1440px wide (desktop) without horizontal scrolling.
- **FR-015**: The sign-out action MUST be accessible from the dashboard and MUST end the session immediately.

### Key Entities

- **User Session**: The authenticated identity — represented as a secure token issued by the authentication provider on login. Determines which tasks are displayed and scopes all API calls.
- **Task**: A user-owned item with a title (required, max 200 characters), optional description, completion status (pending/completed), and creation timestamp.
- **API Client**: A centralized module that attaches the user's session token to every outbound backend request. Handles token expiry by redirecting to sign-in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can register, sign in, and create their first task in under 2 minutes from arriving at the application.
- **SC-002**: Task list changes (create, delete, toggle) are visible to the user in under 500ms from action completion on a standard broadband connection.
- **SC-003**: 100% of routes that require authentication redirect unauthenticated users to sign-in — zero protected pages are accessible without a valid session.
- **SC-004**: The dashboard is fully functional on screen widths from 375px to 1440px — zero features are hidden or unusable on mobile.
- **SC-005**: All 6 backend task endpoints continue to pass their Phase 2.2 tests after the frontend is connected — zero regressions introduced in the backend.
- **SC-006**: Session token is attached to 100% of outbound API requests — zero backend calls succeed without the Authorization header under normal operation.

## Assumptions

- Better Auth is configured to issue HS256 JWTs with a `sub` claim (user ID); the `BETTER_AUTH_SECRET` used by the frontend matches the backend's value exactly.
- The backend base URL is configurable via an environment variable (e.g., `NEXT_PUBLIC_API_URL`) so the frontend can point to local or production backend without code changes.
- Email/password is the only authentication method in Phase 2.3; social login (Google, GitHub) is out of scope.
- Real-time task synchronization across multiple browser tabs or devices is out of scope; manual refresh or next-action revalidation is sufficient.
- The application does not need to support offline mode in Phase 2.3.
- Password reset and email verification flows are out of scope for Phase 2.3.
