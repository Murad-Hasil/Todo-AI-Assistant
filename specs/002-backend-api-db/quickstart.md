# Developer Quickstart: Phase 2.1 — Backend API

**Feature**: `002-backend-api-db`
**Target**: `todo-web-app/backend/`
**Date**: 2026-03-03

---

## Prerequisites

- Python 3.13 (`python --version`)
- `uv` package manager (`uv --version`)
- Neon account with a PostgreSQL database created
- WSL2 (Ubuntu 22.04) or compatible Linux environment

---

## 1. Environment Setup

```bash
cd todo-web-app/backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt  # or: uv sync if using pyproject.toml

# Copy environment template
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
```

**Never commit `.env` to version control.**

---

## 2. Run Database Migrations

```bash
# Apply all migrations (creates tasks table)
alembic upgrade head

# Verify schema
alembic current
```

**Note**: The `users` table is created by Better Auth. Ensure Better Auth has
initialised the database before running migrations if you need FK validation.
For Phase 2.1 (stub auth), this is not required.

---

## 3. Start the Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`.

Interactive docs: `http://localhost:8000/docs`

---

## 4. Verify Endpoints (Phase 2.1 Stub Auth)

In Phase 2.1, all requests use the stub `user_id = "dev-user-id"`. The
path parameter must match this value.

```bash
# Create a task
curl -X POST http://localhost:8000/api/dev-user-id/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My first task"}'

# List tasks
curl http://localhost:8000/api/dev-user-id/tasks

# List pending tasks only
curl "http://localhost:8000/api/dev-user-id/tasks?status=pending"

# List sorted by title
curl "http://localhost:8000/api/dev-user-id/tasks?sort=title"

# Toggle completion (replace <id> with UUID from create response)
curl -X PATCH http://localhost:8000/api/dev-user-id/tasks/<id>/complete

# Update task
curl -X PUT http://localhost:8000/api/dev-user-id/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated title", "description": "New description"}'

# Delete task
curl -X DELETE http://localhost:8000/api/dev-user-id/tasks/<id>
```

---

## 5. Run Tests

```bash
# All tests
pytest

# Contract tests only
pytest tests/contract/

# Integration tests only
pytest tests/integration/

# With verbose output
pytest -v

# With coverage
pytest --cov=app
```

---

## 6. Create a New Migration (when schema changes)

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "description_of_change"

# Review generated file in migrations/versions/
# Then apply:
alembic upgrade head
```

---

## 7. Common Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `connection timeout` from Neon | Idle connection dropped | `NullPool` is configured; restart server |
| `422 Unprocessable Entity` | Request body validation failed | Check `title` length (1–200), `description` length (≤1000) |
| `403 Forbidden` | Path `user_id` ≠ stub `"dev-user-id"` | Use `dev-user-id` in the URL path during Phase 2.1 |
| `404 Not Found` | Task ID not found or wrong user | Verify UUID and that task was created with same `user_id` |
| Migration fails on FK | `users` table missing | Run Better Auth init first, or comment out FK in migration |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Neon PostgreSQL connection string (with `?sslmode=require`) |
| `CORS_ORIGINS` | No | `http://localhost:3000` | Comma-separated allowed origins |
| `ENVIRONMENT` | No | `development` | Set to `production` to enforce real JWT (Phase 2.2) |

---

## Phase 2.2 Migration Notes

When Phase 2.2 (JWT auth) is ready:

1. Replace `app/auth.py` stub body with real JWT verification
2. Set `ENVIRONMENT=production` in deployment env
3. No changes needed in `routes/tasks.py` or any other file
4. Re-run integration tests against a real Better Auth token
