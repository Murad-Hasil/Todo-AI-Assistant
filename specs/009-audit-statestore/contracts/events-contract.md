# Event Contracts: Phase 5.2 — Audit Logs

**Branch**: `009-audit-statestore` | **Date**: 2026-03-09

---

## Dapr Publish Call (Internal — backend sidecar)

### Endpoint
```
POST http://localhost:3500/v1.0/publish/todoai-pubsub/task-events
```

### Headers
```
Content-Type: application/json
```

### Request Body (AuditEvent payload)
```json
{
  "action": "created",
  "task_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "user_id": "user_2abc123def456",
  "timestamp": "2026-03-09T12:00:00.000000+00:00"
}
```

### Success Response
```
HTTP 204 No Content
```

### Error Responses
```
HTTP 500 — Dapr internal error (broker unreachable, component misconfigured)
```

### Publish Triggers

| Task Operation | Action Field | Called From |
|----------------|-------------|-------------|
| `op_create_task()` succeeds | `"created"` | `routes/tasks.py` (BackgroundTask) + `mcp/server.py` (direct) |
| `op_update_task()` succeeds | `"updated"` | `routes/tasks.py` (BackgroundTask) + `mcp/server.py` (direct) |
| `op_complete_task()` succeeds | `"updated"` | `routes/tasks.py` (BackgroundTask) + `mcp/server.py` (direct) |
| `toggle_task_completion` succeeds | `"updated"` | `routes/tasks.py` (BackgroundTask) |
| `op_delete_task()` succeeds | `"deleted"` | `routes/tasks.py` (BackgroundTask) + `mcp/server.py` (direct) |

---

## Retry Contract (Constitution XV)

| Parameter | Value |
|-----------|-------|
| Max attempts | 3 |
| Initial backoff | 200 ms |
| Backoff multiplier | 2× |
| Max backoff | 5 s |
| On exhaustion | Log ERROR (no HTTP 503 — background task) |
| On missing fields | Log WARNING, skip publish |

---

## events.py Public Interface

```python
# app/logic/events.py

def publish_task_event(
    action: str,           # "created" | "updated" | "deleted"
    task_id: str,          # str(uuid.UUID)
    user_id: str,          # user identity string
) -> None:
    """
    Fire-and-forget publish to Dapr sidecar with retry backoff.
    NEVER raises. Logs ERROR on exhaustion. Logs WARNING on invalid inputs.
    """
    ...
```

---

## Dapr Statestore — Direct Connection Secret

### dapr-secrets Kubernetes Secret update

| Key | Value |
|-----|-------|
| `DIRECT_DATABASE_URL` | `postgresql://neondb_owner:<pass>@ep-silent-poetry-aimkz6vv.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require` |

### statestore.yaml connectionString reference
```yaml
- name: connectionString
  secretKeyRef:
    name: dapr-secrets
    key: DIRECT_DATABASE_URL
```

**Note**: No `channel_binding` parameter. No `disableEntityManagement` (Dapr manages tables). If direct endpoint unreachable from Minikube → revert to `disableEntityManagement: "true"` + `STATESTORE_URL` (pooler, tables pre-created).
