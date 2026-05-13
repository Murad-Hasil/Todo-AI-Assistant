# REST API Endpoint Contract

**Feature**: `002-backend-api-db`
**Source**: Project PDF Page 7
**Status**: Draft
**Last Updated**: 2026-03-03

## Global Rules

- **Base path**: All endpoints are prefixed with `/api`.
- **Authentication**: Every endpoint requires `Authorization: Bearer <token>` header.
  Requests without a valid token receive `401 Unauthorized`.
- **Authorization**: The `{user_id}` path parameter MUST match the subject (`sub`)
  claim in the verified JWT. A mismatch returns `403 Forbidden`.
- **Content-Type**: All request bodies MUST be `application/json`.
  All responses are `application/json`.
- **Error shape**: All error responses follow the structure:
  ```json
  { "detail": "<human-readable message>" }
  ```
- **Success shape**: All success responses wrap data in a consistent envelope:
  ```json
  { "data": <payload>, "meta": { ... } }
  ```
  For single-item responses, `data` is an object. For list responses, `data` is
  an array and `meta` includes `total` count.

---

## Endpoints

### 1. List Tasks

```
GET /api/{user_id}/tasks
```

Returns all tasks belonging to the authenticated user, with optional filtering
and sorting.

**Path Parameters**

| Parameter  | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `user_id`  | string | Yes      | Must match the JWT subject claim       |

**Query Parameters**

| Parameter | Type   | Required | Default   | Valid Values                    | Description                         |
|-----------|--------|----------|-----------|---------------------------------|-------------------------------------|
| `status`  | string | No       | `all`     | `all`, `pending`, `completed`   | Filter by completion status          |
| `sort`    | string | No       | `created` | `created`, `title`, `due_date`  | Sort order (`due_date` = `created`)  |

**Responses**

| Status | Condition                         | Body                                   |
|--------|-----------------------------------|----------------------------------------|
| 200    | Success                           | `{ "data": [Task], "meta": { "total": N } }` |
| 400    | Invalid query parameter value     | `{ "detail": "..." }`                  |
| 401    | Missing or invalid token          | `{ "detail": "..." }`                  |
| 403    | `user_id` does not match token    | `{ "detail": "..." }`                  |

**Task Object Schema**

```json
{
  "id": "uuid",
  "user_id": "string",
  "title": "string",
  "description": "string | null",
  "completed": false,
  "created_at": "2026-03-03T00:00:00Z",
  "updated_at": "2026-03-03T00:00:00Z"
}
```

---

### 2. Create Task

```
POST /api/{user_id}/tasks
```

Creates a new task for the authenticated user.

**Path Parameters**

| Parameter  | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `user_id`  | string | Yes      | Must match the JWT subject claim       |

**Request Body**

```json
{
  "title": "string (1–200 chars, required)",
  "description": "string (max 1000 chars, optional)"
}
```

**Responses**

| Status | Condition                         | Body                        |
|--------|-----------------------------------|-----------------------------|
| 201    | Task created successfully         | `{ "data": Task }`          |
| 400    | Validation failure                | `{ "detail": "..." }`       |
| 401    | Missing or invalid token          | `{ "detail": "..." }`       |
| 403    | `user_id` does not match token    | `{ "detail": "..." }`       |

---

### 3. Get Task

```
GET /api/{user_id}/tasks/{id}
```

Returns a single task by ID, scoped to the authenticated user.

**Path Parameters**

| Parameter  | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `user_id`  | string | Yes      | Must match the JWT subject claim       |
| `id`       | uuid   | Yes      | Task UUID                              |

**Responses**

| Status | Condition                         | Body                        |
|--------|-----------------------------------|-----------------------------|
| 200    | Task found                        | `{ "data": Task }`          |
| 401    | Missing or invalid token          | `{ "detail": "..." }`       |
| 403    | `user_id` does not match token    | `{ "detail": "..." }`       |
| 404    | Task not found (or wrong user)    | `{ "detail": "..." }`       |

---

### 4. Update Task

```
PUT /api/{user_id}/tasks/{id}
```

Replaces the title and/or description of an existing task. Completion status
is NOT modified by this endpoint (use PATCH `/complete` instead).

**Path Parameters**

| Parameter  | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `user_id`  | string | Yes      | Must match the JWT subject claim       |
| `id`       | uuid   | Yes      | Task UUID                              |

**Request Body**

```json
{
  "title": "string (1–200 chars, required)",
  "description": "string (max 1000 chars, optional)"
}
```

**Responses**

| Status | Condition                         | Body                        |
|--------|-----------------------------------|-----------------------------|
| 200    | Task updated successfully         | `{ "data": Task }`          |
| 400    | Validation failure                | `{ "detail": "..." }`       |
| 401    | Missing or invalid token          | `{ "detail": "..." }`       |
| 403    | `user_id` does not match token    | `{ "detail": "..." }`       |
| 404    | Task not found (or wrong user)    | `{ "detail": "..." }`       |

---

### 5. Delete Task

```
DELETE /api/{user_id}/tasks/{id}
```

Permanently removes a task owned by the authenticated user.

**Path Parameters**

| Parameter  | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `user_id`  | string | Yes      | Must match the JWT subject claim       |
| `id`       | uuid   | Yes      | Task UUID                              |

**Responses**

| Status | Condition                         | Body                        |
|--------|-----------------------------------|-----------------------------|
| 204    | Task deleted (no content)         | *(empty)*                   |
| 401    | Missing or invalid token          | `{ "detail": "..." }`       |
| 403    | `user_id` does not match token    | `{ "detail": "..." }`       |
| 404    | Task not found (or wrong user)    | `{ "detail": "..." }`       |

---

### 6. Toggle Task Completion

```
PATCH /api/{user_id}/tasks/{id}/complete
```

Flips the `completed` boolean of a task. If `completed` is `false`, it becomes
`true`; if `true`, it becomes `false`. No request body is required.

**Path Parameters**

| Parameter  | Type   | Required | Description                            |
|------------|--------|----------|----------------------------------------|
| `user_id`  | string | Yes      | Must match the JWT subject claim       |
| `id`       | uuid   | Yes      | Task UUID                              |

**Request Body**: None required.

**Responses**

| Status | Condition                         | Body                        |
|--------|-----------------------------------|-----------------------------|
| 200    | Completion toggled successfully   | `{ "data": Task }`          |
| 401    | Missing or invalid token          | `{ "detail": "..." }`       |
| 403    | `user_id` does not match token    | `{ "detail": "..." }`       |
| 404    | Task not found (or wrong user)    | `{ "detail": "..." }`       |

---

## Error Taxonomy

| HTTP Status | Meaning                          | Trigger Conditions                                      |
|-------------|----------------------------------|---------------------------------------------------------|
| 400         | Bad Request (validation)         | Invalid field values, out-of-range lengths, bad params  |
| 401         | Unauthorized                     | Missing token, expired token, malformed token           |
| 403         | Forbidden                        | Token valid but `user_id` path param mismatch           |
| 404         | Not Found                        | Task ID not found, or belongs to a different user       |
| 422         | Unprocessable Entity             | Structurally malformed JSON body (FastAPI default)      |
| 500         | Internal Server Error            | Unexpected server-side failure                          |

**Security note**: 404 is intentionally returned (not 403) when a task belongs
to a different user to prevent user enumeration via ID probing.

---

## Endpoint Summary

| Method   | Path                                      | Description              | Auth |
|----------|-------------------------------------------|--------------------------|------|
| `GET`    | `/api/{user_id}/tasks`                    | List tasks               | ✅   |
| `POST`   | `/api/{user_id}/tasks`                    | Create task              | ✅   |
| `GET`    | `/api/{user_id}/tasks/{id}`               | Get single task          | ✅   |
| `PUT`    | `/api/{user_id}/tasks/{id}`               | Update task              | ✅   |
| `DELETE` | `/api/{user_id}/tasks/{id}`               | Delete task              | ✅   |
| `PATCH`  | `/api/{user_id}/tasks/{id}/complete`      | Toggle completion        | ✅   |
