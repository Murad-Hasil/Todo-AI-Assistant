# Tasks: Advanced Task Features (014)

**Plan:** `specs/014-advanced-task-features/plan.md`
**Branch:** `014-advanced-task-features`

---

## Phase 1 — Database Migration

- [x] T-6.1.1 [P] Create `migrations/versions/003_add_priority_tags_due_date.py`
  - `upgrade()`: ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium', tags VARCHAR(500) NULL, due_date TIMESTAMPTZ NULL to tasks table
  - `downgrade()`: DROP COLUMN all three
  - **Test:** `alembic upgrade head` runs without error

- [x] T-6.1.2 [P] Run migration on Neon PostgreSQL production
  - **Test:** `SELECT priority, tags, due_date FROM tasks LIMIT 1` returns columns

---

## Phase 2 — Backend Core

- [x] T-6.2.1 [P] Update `app/models.py` — add `priority`, `tags`, `due_date` to `Task`
  - `priority: str = Field(default="medium", nullable=False, max_length=10)`
  - `tags: Optional[str] = Field(default=None, nullable=True, max_length=500)`
  - `due_date: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True), nullable=True))`
  - **Test:** Python import of models.py succeeds without error

- [x] T-6.2.2 [P] Update `app/schemas.py` — add fields to `TaskCreate`, `TaskUpdate`, `TaskRead`
  - `TaskCreate`: priority (default "medium"), tags (optional), due_date (optional)
  - `TaskUpdate`: all three optional (patch semantics)
  - `TaskRead`: exposes all three
  - **Test:** `TaskCreate(title="test")` creates with priority="medium"

- [x] T-6.2.3 [P] Update `app/logic/task_ops.py`
  - `op_create_task`: add priority, tags, due_date params → pass to Task constructor
  - `op_update_task`: add priority, tags, due_date params → conditional update guards
  - **Test:** Function signatures include new params

- [x] T-6.2.4 [P] Update `app/routes/tasks.py`
  - `create_task` route: pass `body.priority`, `body.tags`, `body.due_date` to `op_create_task`
  - `update_task` route: pass same to `op_update_task`
  - **Test:** `POST /api/{user_id}/tasks` with priority="high" returns priority="high" in response

---

## Phase 3 — AI Agent

- [x] T-6.3.1 [P] Update `app/mcp/server.py` — add_task and update_task tools
  - `add_task`: new params `priority="medium"`, `tags=None`, `due_date=None` (ISO string)
  - Parse `due_date` string → datetime before calling `op_create_task`
  - `update_task`: same new params + pass to `op_update_task`
  - **Test:** MCP tool call with priority="high" creates task with priority="high"

- [x] T-6.3.2 [P] Update `app/agent/prompts.py` SYSTEM_PROMPT
  - Update AVAILABLE TOOLS signatures
  - Add PRIORITY RULE: urgent/critical → high; normal → medium; someday/low → low
  - Add TAGS RULE: extract category mentions → comma-separated tags
  - Add DUE DATE RULE: parse date mentions → ISO string
  - **Test:** Agent correctly interprets "urgent task for work due tomorrow"

---

## Phase 4 — Frontend

- [x] T-6.4.1 [P] Update `src/lib/api.ts` — Task, TaskCreateInput, TaskUpdateInput interfaces
  - Add `priority: 'low' | 'medium' | 'high'`
  - Add `tags?: string`
  - Add `due_date?: string`
  - **Test:** TypeScript compiles with `tsc --noEmit` (0 errors)

- [x] T-6.4.2 [P] Update `src/components/tasks/TaskCardGrid.tsx` — display new fields
  - Priority badge: colored pill (high=red, medium=yellow, low=green)
  - Tag pills: split `task.tags` by comma → gray pills
  - Due date label: "Due: Apr 10", red if overdue and not completed
  - Edit mode: priority select, tags input, due date datetime-local
  - **Test:** Task with priority="high" shows red badge; overdue task shows red due date

- [x] T-6.4.3 [P] Update `src/components/AddTaskForm.tsx`
  - Add priority select (default "medium")
  - Add tags text input (placeholder "work, home")
  - Add due date datetime-local input (optional)
  - **Test:** Creating a task with high priority saves correctly

- [x] T-6.4.4 [P] Update `src/app/dashboard/actions.ts`
  - `createTaskAction`: pass priority, tags, due_date from FormData
  - `updateTaskAction`: pass priority, tags, due_date from FormData
  - **Test:** Server action passes new fields to API

---

## Phase 5 — Deploy & Verify

- [ ] T-6.5.1 [P] Run Alembic migration on Neon PostgreSQL
  - `cd backend && .venv/bin/python -m alembic upgrade head`
  - **Test:** Migration output shows `Running upgrade 002 -> 003`

- [ ] T-6.5.2 [P] Deploy backend to Hugging Face Space
  - `./deploy-backend.sh "feat(014): priority, tags, due_date on tasks"`
  - **Test:** `GET /api/{user_id}/tasks` returns `priority`, `tags`, `due_date` fields

- [ ] T-6.5.3 [P] Deploy frontend to Vercel
  - `cd frontend && npx vercel deploy --prod`
  - **Test:** Dashboard shows priority badge, tag pills, due date on tasks

- [ ] T-6.5.4 [P] E2E smoke test
  - Create task via UI with priority=high, tags="work", due_date=tomorrow
  - Verify: red badge, "work" pill, due date label visible
  - Create task via chat: "Add urgent work task due tomorrow"
  - Verify: agent creates with priority=high, tags="work"

---

## Checkpoint ✅

All 4 phases complete when:
- Migration applied to Neon ✅
- `GET /api/{user_id}/tasks` returns all 3 new fields ✅
- Dashboard shows priority/tags/due_date visually ✅
- AI agent correctly sets priority/tags/due_date from natural language ✅
