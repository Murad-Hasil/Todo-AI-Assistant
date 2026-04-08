# Contract: POST /api/{user_id}/notifications/read-all

## Purpose
Marks all unread notifications as read for the authenticated user. Called immediately after the frontend displays the notifications.

## Request

```
POST /api/{user_id}/notifications/read-all
Authorization: Bearer <jwt>
Content-Type: application/json
Body: {} (empty)
```

| Parameter | Location | Type | Required | Description |
|-----------|----------|------|----------|-------------|
| user_id | path | string | yes | Must match JWT sub claim |

## Response 200

```json
{
  "marked_read": 2
}
```

`marked_read` is the count of notifications updated. Returns `0` if none were unread.

## Response 401
JWT missing or invalid.

## Response 403
`user_id` in path does not match JWT `sub` claim.
