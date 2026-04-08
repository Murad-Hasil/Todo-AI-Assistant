# Contract: GET /api/{user_id}/notifications

## Purpose
Returns all unread notifications for the authenticated user. Called by the frontend NotificationPoller every 10 seconds.

## Request

```
GET /api/{user_id}/notifications
Authorization: Bearer <jwt>
```

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| user_id | path | string | yes | Must match JWT sub claim |

## Response 200

```json
[
  {
    "id": "3f7e1234-ab12-4c56-d789-ef0123456789",
    "task_title": "remind me to buy milk",
    "message": "Your task \"remind me to buy milk\" is due now!",
    "created_at": "2026-04-08T12:00:00+00:00"
  }
]
```

Returns empty array `[]` if no unread notifications.

## Response 401
JWT missing or invalid.

## Response 403
`user_id` in path does not match JWT `sub` claim.

## Notes
- Only returns `is_read = false` records.
- Records are ordered by `created_at` ascending (oldest first).
