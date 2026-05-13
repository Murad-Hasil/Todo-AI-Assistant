# API Contracts: Task Search & Filter (015)

## No New Endpoints

This feature is entirely client-side. The existing task list endpoint is used unchanged.

## Existing Endpoint (reference)

```
GET /api/{user_id}/tasks
Authorization: Bearer <jwt>

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string|null",
      "completed": false,
      "priority": "high|medium|low",
      "tags": "work,home|null",
      "due_date": "2026-04-10T14:00:00Z|null",
      "created_at": "2026-04-07T10:00:00Z",
      "updated_at": "2026-04-07T10:00:00Z"
    }
  ]
}
```

All filtering, sorting, and searching happens in the browser on this response.
