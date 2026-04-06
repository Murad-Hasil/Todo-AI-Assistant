---
id: "0030"
title: Task Priority Tags Due Date UI
stage: green
date: 2026-04-07
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 013-dapr-jobs-scheduling
user: Murad Hasil
command: Update the Next.js frontend to display and allow setting priority, tags, and due_date on tasks
labels: ["frontend","tasks","priority","tags","due_date","tailwind","next.js"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/api.ts
  - src/components/tasks/TaskPriorityBadge.tsx
  - src/components/tasks/TaskCardGrid.tsx
  - src/components/AddTaskForm.tsx
  - src/app/dashboard/actions.ts
tests:
  - npx tsc --noEmit (PASS — 0 errors)
---

## Prompt

Update the Next.js frontend to display and allow setting `priority`, `tags`, and `due_date` on tasks.

**Context:**
- Frontend: `/home/brownie/projects/hackathon-II/todo-web-app/frontend/`
- Backend API adds 3 new fields to Task: `priority` (low/medium/high, default "medium"), `tags` (comma-separated string, optional), `due_date` (ISO datetime string, optional)
- The frontend uses Next.js 14+ App Router, TypeScript, Tailwind CSS
- Auth: Better Auth

**What to do:**
Steps 1–5 covering: reading existing files, updating API types, updating task display, updating task creation form, passing new fields in API call.

## Response snapshot

Read 5 key files (api.ts, actions.ts, AddTaskForm.tsx, TaskItem.tsx, TaskCardGrid.tsx, TaskPriorityBadge.tsx) before making any changes.

**Changes made:**

1. `src/lib/api.ts` — Added `TaskPriority` type alias; added `priority`, `tags`, `due_date` to `Task`, `TaskCreateInput`, `TaskUpdateInput` interfaces.

2. `src/components/tasks/TaskPriorityBadge.tsx` — Added `apiToDisplay` map to handle backend values (`low/medium/high`) alongside existing display values (`Low/Normal/High/Urgent`). No visual breaking change.

3. `src/components/tasks/TaskCardGrid.tsx` — View mode: `TaskPriorityBadge` now receives `task.priority` (real value). Added `TagPills` sub-component (comma-split, white/5 pills). Added `DueDateLabel` sub-component (red when overdue, gray otherwise). Edit mode: added priority `<select>`, tags `<input>`, `datetime-local` input; all passed through `FormData` to `updateTaskAction`.

4. `src/components/AddTaskForm.tsx` — Added priority select (low/medium/high, default medium), tags text input (placeholder "work, home, shopping"), due date `datetime-local` input with label. All fields appended to FormData on submit and cleared on success.

5. `src/app/dashboard/actions.ts` — `createTaskAction`: reads `priority`, `tags`, `due_date` from FormData and passes to backend JSON body. `updateTaskAction`: same pattern with null-coalescing for optional fields.

TypeScript check: `npx tsc --noEmit` — 0 errors.

## Outcome

- Impact: Frontend now surfaces all three new backend fields across creation, display, and edit flows. Priority badge correctly maps API values. Tags render as dismissible pills. Due dates show relative formatting with overdue coloring.
- Tests: tsc --noEmit PASS
- Files: 5 files modified, 0 created
- Next prompts: Deploy to Vercel production; verify against live backend; add sort-by-due_date to FilterBar
- Reflection: Existing `TaskPriorityBadge` used "Low/Normal/High/Urgent" naming; mapped backend "low/medium/high" without changing the display component's visual contract. Edit mode state initialized from `task.due_date.slice(0, 16)` to strip seconds for `datetime-local` input compatibility.

## Evaluation notes (flywheel)

- Failure modes observed: None — tsc clean on first pass
- Graders run and results (PASS/FAIL): tsc --noEmit PASS
- Prompt variant (if applicable): null
- Next experiment: Add FilterBar `sort=due_date` option to complement the new field
