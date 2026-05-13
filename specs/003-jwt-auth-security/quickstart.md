# Quickstart: Phase 2.2 — JWT Authentication & Security

**Feature**: `003-jwt-auth-security`
**Date**: 2026-03-03

## Prerequisites

- Phase 2.1 backend running (`uv run uvicorn app.main:app --reload --port 8000`)
- `BETTER_AUTH_SECRET` set in `/todo-web-app/backend/.env`
- `PyJWT` installed (`uv sync` after adding to `pyproject.toml`)

## Generating a Test JWT

Use this Python snippet to generate a valid test token signed with your `BETTER_AUTH_SECRET`:

```python
import jwt, datetime, os
secret = os.getenv("BETTER_AUTH_SECRET", "your-test-secret-at-least-32-chars!!")
token = jwt.encode(
    {
        "sub": "test-user-001",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
        "iat": datetime.datetime.utcnow(),
    },
    secret,
    algorithm="HS256",
)
print(token)
```

---

## Test Scenario 1: Valid Token Grants Access

```bash
TOKEN="<paste token from above>"

# List tasks
curl -X GET "http://localhost:8000/api/test-user-001/tasks" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with task list
```

---

## Test Scenario 2: Missing Token Returns 401

```bash
curl -X GET "http://localhost:8000/api/test-user-001/tasks"
# Expected: 401 {"detail": "Not authenticated"}
```

---

## Test Scenario 3: Invalid Signature Returns 401

```bash
curl -X GET "http://localhost:8000/api/test-user-001/tasks" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.BADSIG"
# Expected: 401 {"detail": "Invalid token"}
```

---

## Test Scenario 4: Expired Token Returns 401

```python
# Generate an already-expired token
import jwt, datetime, os
secret = os.getenv("BETTER_AUTH_SECRET", "your-test-secret-at-least-32-chars!!")
expired = jwt.encode(
    {"sub": "test-user-001", "exp": datetime.datetime.utcnow() - datetime.timedelta(hours=1)},
    secret, algorithm="HS256",
)
print(expired)
```

```bash
curl -X GET "http://localhost:8000/api/test-user-001/tasks" \
  -H "Authorization: Bearer $EXPIRED_TOKEN"
# Expected: 401 {"detail": "Token expired"}
```

---

## Test Scenario 5: Cross-User Access Returns 403

```bash
# TOKEN is for "test-user-001", but URL uses "another-user"
curl -X GET "http://localhost:8000/api/another-user/tasks" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 403 {"detail": "You do not have permission to access this resource."}
```

---

## Test Scenario 6: Health Check Requires No Token

```bash
curl -X GET "http://localhost:8000/health"
# Expected: 200 {"status": "ok"} — no Authorization header needed
```

---

## Test Scenario 7: Missing BETTER_AUTH_SECRET Crashes Startup

```bash
# Temporarily unset the variable
BETTER_AUTH_SECRET="" uv run uvicorn app.main:app --port 8000
# Expected: Process exits immediately with ValueError/startup error
```

---

## Audit Log Verification

After running Scenario 2, 3, or 4, check server logs for entries like:
```json
{"event": "auth_failure", "reason": "missing_header", "endpoint": "GET /api/.../tasks", "ts": "2026-03-03T..."}
```
