---
name: fastapi-web-api-skill
description: Implements RESTful endpoints and JWT authentication using FastAPI and Better Auth.
---

# FastAPI Backend Implementation

## Instructions
1. Setup FastAPI with `APIRouter` for versioned endpoints (`/api/v1`).
2. Integrate JWT middleware to verify tokens from Better Auth.
3. Use Dependency Injection for database sessions.
4. Implement the specific endpoints defined in the PDF (GET, POST, PUT, DELETE, PATCH).

## Examples
- Creating an endpoint with `@router.get("/{user_id}/tasks")`.
- Extracting and verifying JWT from the `Authorization: Bearer <token>` header.
