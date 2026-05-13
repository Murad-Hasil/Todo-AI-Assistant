# Quickstart & Integration Scenarios: Phase 2.3 — Frontend Development & Integration

**Feature**: `004-nextjs-frontend`
**Date**: 2026-03-03

---

## Prerequisites

Before running these scenarios, ensure:

1. **Backend running**: `cd todo-web-app/backend && uv run uvicorn app.main:app --reload`
   - Backend available at `http://localhost:8000`
   - `BETTER_AUTH_SECRET` is set in `backend/.env`

2. **Frontend dependencies installed**: `cd todo-web-app/frontend && npm install`

3. **Frontend `.env.local` configured**:
   ```
   BETTER_AUTH_SECRET=<same value as backend BETTER_AUTH_SECRET>
   BETTER_AUTH_URL=http://localhost:3000
   DATABASE_URL=<neon postgresql connection string>
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Frontend running**: `npm run dev` → available at `http://localhost:3000`

---

## Scenario 1: Sign-Up Flow (US1)

**Goal**: A new visitor creates an account and lands on the dashboard.

**Steps**:
1. Navigate to `http://localhost:3000` → should redirect to `/sign-in`
2. Click "Don't have an account? Sign up"
3. Enter email: `test@example.com`, password: `password123`
4. Submit → should redirect to `/dashboard`
5. Dashboard shows "No tasks yet. Add one above."

**What to verify**:
- `document.cookie` or session storage contains a Better Auth session cookie
- Network tab: POST `/api/auth/sign-up/email` returns 200
- Middleware redirect: direct GET `/dashboard` works (session present)

---

## Scenario 2: Sign-In and Route Protection (US1)

**Goal**: Existing user signs in; unauthenticated access is blocked.

**Steps**:
1. Open incognito tab → navigate to `http://localhost:3000/dashboard`
2. Verify redirect to `/sign-in`
3. Sign in with valid credentials
4. Verify redirect to `/dashboard`
5. Sign out
6. Navigate to `/dashboard` again → verify redirect to `/sign-in`

**What to verify**:
- Middleware intercepts `/dashboard` with no session → 307 to `/sign-in`
- After sign-in, `/dashboard` renders without redirect
- After sign-out, session cookie is cleared

---

## Scenario 3: Create Task (US2)

**Goal**: Create a task and see it appear in the list.

**Steps**:
1. Sign in and land on `/dashboard`
2. Fill "Add Task" form: Title = "Buy groceries", Description = "Milk, eggs, bread"
3. Submit form
4. Task appears in the list with title, pending status (unchecked), and today's date

**What to verify**:
- Network: POST `http://localhost:8000/api/{userId}/tasks` with `Authorization: Bearer <token>`
- Response body: `{ data: { id, user_id, title, completed: false, ... } }`
- Task list refreshes without full page reload

---

## Scenario 4: Toggle Task Complete (US2)

**Goal**: Mark a task complete, then restore it.

**Steps**:
1. Click the checkbox on "Buy groceries"
2. Task title shows strikethrough; checkbox is checked
3. Click checkbox again
4. Strikethrough removed; checkbox unchecked

**What to verify**:
- Network: PATCH `http://localhost:8000/api/{userId}/tasks/{taskId}/complete`
- Response: `{ data: { completed: true } }` → then `{ data: { completed: false } }`
- UI updates optimistically or within 500ms

---

## Scenario 5: Delete Task (US2)

**Goal**: Delete a task and verify it is removed from the list.

**Steps**:
1. Click the delete button on a task
2. Task disappears from the list immediately

**What to verify**:
- Network: DELETE `http://localhost:8000/api/{userId}/tasks/{taskId}` → 204
- Task no longer appears in the list after deletion

---

## Scenario 6: Filter Tasks (US3)

**Goal**: Filter the task list by status.

**Steps**:
1. Create 3 tasks; mark 1 as complete
2. Click "Completed" filter → only the 1 completed task is shown
3. Click "Pending" filter → only the 2 pending tasks are shown
4. Click "All" filter → all 3 tasks are shown

**What to verify**:
- No API call on filter change (client-side filtering)
- Task count matches expected values for each filter

---

## Scenario 7: JWT Expiry Handling (US1 — Edge Case)

**Goal**: When the JWT expires mid-session, the user is redirected to sign-in with context.

**Steps** (manual simulation):
1. Sign in and note the session
2. Modify `BETTER_AUTH_SECRET` temporarily to a different value (or wait for token expiry in a test environment)
3. Attempt any task API call
4. Verify redirect to `/sign-in?reason=session_expired`

**What to verify**:
- `src/lib/api.ts` catches 401 response and redirects with `reason=session_expired` query param
- Sign-in page shows "Your session expired. Please sign in again." banner

---

## Scenario 8: API Client Authorization Header (All Stories)

**Goal**: Every outbound API request includes the Bearer token.

**Steps** (browser DevTools):
1. Sign in and open Network tab
2. Perform any task action (create, toggle, delete)
3. Inspect the request headers

**What to verify**:
- `Authorization: Bearer <jwt-string>` header is present on every request to `NEXT_PUBLIC_API_URL`
- Token matches what `authClient.token()` returns

---

## Scenario 9: Validation — Empty Title (US2 — Edge Case)

**Goal**: Form prevents submission with an empty task title.

**Steps**:
1. Click in the task title field, leave it empty, click "Add Task"
2. Form does NOT submit; error message appears

**What to verify**:
- No network request sent
- Error message: "Title is required" (or equivalent)

---

## Scenario 10: Responsive Layout (US4)

**Goal**: Dashboard is usable at 375px width.

**Steps**:
1. Open DevTools → set viewport to 375px (iPhone SE)
2. Navigate to `/dashboard`
3. Verify task list, add-task form, and filter controls are all visible without horizontal scroll

**What to verify**:
- No horizontal scrollbar at 375px
- Buttons and inputs meet minimum 44px touch target size (visual check)
- Task item text wraps rather than overflows
