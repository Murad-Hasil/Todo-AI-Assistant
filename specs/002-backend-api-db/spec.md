# Feature Specification: Phase 2.1 — Backend API & Database

**Feature Branch**: `002-backend-api-db`
**Created**: 2026-03-03
**Status**: Draft
**Input**: Phase 2.1 Backend API and Database — derived from Project PDF Pages 7, 12, 14

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Authenticated Task Management (Priority: P1)

An authenticated user can create, retrieve, update, and delete their own tasks
through a secured API. No task data from another user is ever visible or
modifiable. Every operation requires the user to be signed in.

**Why this priority**: This is the core value of the application. Without the
ability to manage tasks, no other feature has utility. It is the foundational
user journey that all other stories build upon.

**Independent Test**: An authenticated user can send a request to create a task,
retrieve it, update its title, and then delete it — all without any frontend UI —
and receive correct confirmation at each step.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they submit a new task with a title,
   **Then** the task is saved and returned with a unique ID, the user's ID,
   creation timestamp, and a `completed: false` status.
2. **Given** a signed-in user with existing tasks, **When** they request their
   task list, **Then** only their own tasks are returned — never another user's.
3. **Given** a signed-in user, **When** they update a task they own,
   **Then** the task reflects the new values and the update timestamp changes.
4. **Given** a signed-in user, **When** they delete a task they own,
   **Then** the task is permanently removed and subsequent retrieval returns
   a not-found response.
5. **Given** a request without valid authentication, **When** any task endpoint
   is called, **Then** the request is rejected with an authentication error.

---

### User Story 2 — Task Completion Toggle (Priority: P2)

An authenticated user can mark a task as complete or revert it to pending.
The completion state persists and is accurately reflected in subsequent queries.

**Why this priority**: Tracking completion is the primary workflow value of a
todo app. Users need to mark work done. Without this, the app has no way to
distinguish finished from unfinished items.

**Independent Test**: A user creates a task, marks it complete via the dedicated
toggle endpoint, retrieves it and confirms `completed: true`, toggles again and
confirms `completed: false`.

**Acceptance Scenarios**:

1. **Given** a signed-in user with a pending task, **When** they toggle completion
   on that task, **Then** the task status flips to completed and the updated
   timestamp reflects the change.
2. **Given** a signed-in user with a completed task, **When** they toggle completion
   again, **Then** the task status reverts to pending.
3. **Given** a signed-in user, **When** they attempt to toggle a task owned by
   another user, **Then** the request is rejected with a not-found response.

---

### User Story 3 — Task Filtering and Sorting (Priority: P3)

An authenticated user can filter their task list by completion status and sort
results by creation date or title. This helps users navigate large task lists
efficiently.

**Why this priority**: Filtering and sorting improve usability at scale but are
non-blocking for MVP delivery. A user can still manage tasks without filtering;
this enhances the experience once core CRUD is working.

**Independent Test**: A user with mixed completed/pending tasks queries with
`status=pending` and confirms only pending tasks are returned; then queries with
`sort=title` and confirms alphabetical ordering.

**Acceptance Scenarios**:

1. **Given** a user with pending and completed tasks, **When** they filter by
   `status=pending`, **Then** only tasks with `completed: false` are returned.
2. **Given** a user with pending and completed tasks, **When** they filter by
   `status=completed`, **Then** only tasks with `completed: true` are returned.
3. **Given** a user with multiple tasks, **When** they request `sort=title`,
   **Then** tasks are returned in alphabetical order by title.
4. **Given** a user with multiple tasks, **When** they request `sort=created`,
   **Then** tasks are returned in chronological order by creation date.

---

### Edge Cases

- What happens when a user submits a task with a title exceeding 200 characters?
  → The request is rejected with a clear validation error; no partial data is saved.
- What happens when a user submits a task with a description exceeding 1000 characters?
  → The request is rejected with a clear validation error.
- What happens when a user requests a task ID that does not exist?
  → A not-found response is returned; no error details that leak internal state.
- What happens when a user submits a task with a blank or whitespace-only title?
  → The request is rejected; title is required and must contain meaningful content.
- What happens when the `status` query parameter receives an unrecognised value?
  → The request is rejected with a validation error listing valid values.
- What happens when sorting is requested by an unsupported field?
  → The request is rejected with a validation error listing valid sort fields.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose all task operations as RESTful endpoints
  under the `/api/{user_id}/tasks` path prefix.
- **FR-002**: The system MUST reject any request to a task endpoint that does not
  carry a valid authentication credential.
- **FR-003**: The system MUST scope all data reads and writes to the
  authenticated user; cross-user access MUST be prevented at the data layer.
- **FR-004**: The system MUST validate task titles to be between 1 and 200
  characters; requests outside this range MUST be rejected.
- **FR-005**: The system MUST validate task descriptions to be at most 1000
  characters when provided; the field is optional.
- **FR-006**: The system MUST return all responses in JSON format with consistent
  structure (data payload + error details where applicable).
- **FR-007**: The system MUST support filtering the task list by completion status
  using the values `all`, `pending`, and `completed`.
- **FR-008**: The system MUST support sorting the task list by `created` (creation
  date) and `title` (alphabetical).
- **FR-009**: The system MUST persist all task data reliably across server
  restarts; no in-memory-only storage is permitted.
- **FR-010**: The system MUST record `created_at` automatically on task creation
  and update `updated_at` on every modification.
- **FR-011**: The system MUST provide a dedicated endpoint to toggle task
  completion status without requiring a full task update payload.
- **FR-012**: The user data store MUST be managed exclusively by the
  authentication provider; the task service MUST NOT create or modify user records.

### Key Entities

- **User**: Represents an authenticated account. Owned by the authentication
  provider. Referenced by tasks via a foreign key. Attributes: unique identifier,
  email address, display name, account creation timestamp.
- **Task**: Represents a single unit of work belonging to one user. Attributes:
  unique identifier, owning user reference, title (required, 1–200 chars),
  description (optional, max 1000 chars), completion status (default: pending),
  creation timestamp, last-updated timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six task endpoints respond correctly for an authenticated user
  within 500ms under normal operating conditions.
- **SC-002**: A request carrying no authentication credential is rejected 100%
  of the time before any data access occurs.
- **SC-003**: A request attempting to access or modify another user's task is
  rejected 100% of the time with a not-found response (not an auth error, to
  avoid user enumeration).
- **SC-004**: Input validation rejects 100% of requests with out-of-range title
  or description lengths before data is written.
- **SC-005**: Filtered and sorted queries return correct, consistent results
  across 100% of test cases covering all valid parameter combinations.
- **SC-006**: Task data persists correctly across service restarts in 100% of
  validated scenarios.

## Assumptions

- The authentication provider (Better Auth) manages user registration, login,
  session management, and token issuance. This spec covers only the task API
  and its consumption of already-issued tokens.
- The `sort=due_date` parameter is defined in the PDF but no `due_date` field
  exists in the schema spec (Pages 12/14). It is included in the API contract
  for forward compatibility but will return results sorted by `created_at` until
  a `due_date` column is added in a future phase.
- User IDs in the URL path (`/api/{user_id}/tasks`) are validated against the
  JWT-authenticated user; requests where path `user_id` does not match the
  token's subject are rejected with 403 Forbidden.

## References

- Database Schema: `specs/002-backend-api-db/database/schema.md`
- API Contract: `specs/002-backend-api-db/api/rest-endpoints.md`
- Constitution: `.specify/memory/constitution.md` (v2.0.0, Principles IV, V, VI)
- PDF Source: Pages 7, 12, 14
