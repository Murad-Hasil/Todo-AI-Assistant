# Feature Specification: Browser-Visible Reminder Notifications

**Feature Branch**: `016-browser-notifications`  
**Created**: 2026-04-08  
**Status**: Draft  

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Native Browser Popup on Reminder (Priority: P1)

When a reminder fires through the backend pipeline, the logged-in user sees a native OS-level browser notification popup (like WhatsApp or Gmail alerts) showing the task title — without any user action required.

**Why this priority**: This is the core visible deliverable. Without it, the reminder feature is invisible and cannot be demonstrated in a demo video or portfolio.

**Independent Test**: Open the dashboard, add a task titled "remind me to buy milk", wait for the reminder to fire, and a native browser popup appears.

**Acceptance Scenarios**:

1. **Given** a user is on the dashboard and has granted notification permission, **When** a reminder fires for their task, **Then** a native OS browser notification appears with the task title within 15 seconds of the reminder firing.
2. **Given** a user has NOT granted notification permission, **When** they open the dashboard, **Then** the browser prompts them to allow notifications.
3. **Given** a user denies notification permission, **When** a reminder fires, **Then** only the in-app toast is shown (no crash or error).

---

### User Story 2 — In-App Toast on Dashboard (Priority: P2)

When a reminder fires, the user sees a dismissible toast strip at the top of the dashboard even if they are already looking at the app.

**Why this priority**: Browser popups may be missed if the user is on a different tab. The in-app toast ensures visibility when the user is actively on the dashboard.

**Independent Test**: While the dashboard is open and visible, trigger a reminder — a toast strip appears at the top of the page showing the task name and a dismiss button.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** a reminder fires, **Then** a toast notification appears at the top showing the task title within 15 seconds.
2. **Given** a toast is visible, **When** the user clicks dismiss, **Then** the toast disappears immediately.
3. **Given** multiple reminders fire close together, **When** toasts appear, **Then** each toast is shown separately and dismissible.

---

### User Story 3 — Persistent Notifications on Return (Priority: P3)

When the user was away from the dashboard and a reminder fired, on returning they still see the missed reminder as a toast.

**Why this priority**: Ensures no reminder is silently lost if the user was temporarily away.

**Independent Test**: Trigger a reminder, navigate away from dashboard, return — toast appears for the missed reminder.

**Acceptance Scenarios**:

1. **Given** a reminder fired while user was on another page, **When** user returns to dashboard, **Then** the unread notification is shown as a toast.

---

### Edge Cases

- What happens if the reminder fires but the user's browser tab is closed? → Notification is stored in DB; shown as toast on next dashboard visit.
- What if notifications are blocked by the browser/OS? → In-app toast is the fallback; no error thrown.
- What if multiple reminders fire at the same time? → Each shown as a separate notification and toast.
- What if the polling request fails (network issue)? → Silently retry on next poll interval; no UI disruption.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store each fired reminder as a notification record linked to the user, with task title, message, and read status.
- **FR-002**: System MUST expose an authenticated endpoint to retrieve unread notifications for the current user.
- **FR-003**: System MUST expose an authenticated endpoint to mark all notifications as read for the current user.
- **FR-004**: System MUST save a notification record whenever a reminder event is published through the reminder pipeline.
- **FR-005**: Frontend MUST request browser notification permission from the user upon dashboard load.
- **FR-006**: Frontend MUST poll for pending notifications every 10 seconds while the dashboard is open.
- **FR-007**: Frontend MUST display a native OS browser notification popup for each unread reminder received.
- **FR-008**: Frontend MUST display an in-app toast strip for each unread reminder when the dashboard is active.
- **FR-009**: Frontend MUST mark notifications as read after displaying them.
- **FR-010**: System MUST NOT show the same notification twice (deduplication via mark-as-read).

### Key Entities

- **UserNotification**: Represents a fired reminder delivered to a user. Attributes: id (UUID), user_id (string), task_title (string), message (string), is_read (bool), created_at (datetime).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A native browser popup appears within 15 seconds of a reminder firing when the user has granted permission.
- **SC-002**: An in-app toast appears within 15 seconds of a reminder firing regardless of browser notification permission.
- **SC-003**: A notification is never shown twice to the same user for the same reminder.
- **SC-004**: The feature works end-to-end in a 90-second demo video: task added → reminder fires → popup visible on screen.
- **SC-005**: Notification permission prompt appears automatically on first dashboard visit with no manual configuration.

## Assumptions

- Better Auth JWT is used to identify the user in polling requests (existing auth pattern).
- The same Neon PostgreSQL DB is used for the notifications table — no new database needed.
- Browser Notification API is available in modern browsers (Chrome, Edge, Firefox) — no polyfill needed.
- Notification polling runs only while the dashboard page is mounted — no background service worker required.
- The reminder pipeline (Dapr Jobs → publish_reminder_event → Kafka → notification service) already works end-to-end.

## Out of Scope

- Email or SMS delivery of reminders.
- Push notifications when browser is completely closed (requires service workers + VAPID keys).
- Notification history/inbox page.
- Per-notification granular dismiss tracking (bulk mark-as-read is sufficient).
