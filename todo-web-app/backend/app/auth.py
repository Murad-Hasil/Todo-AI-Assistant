# [Task]: T-2.2.3
"""
JWT authentication dependency.

Phase 2.2: Real HS256 JWT verification using PyJWT and BETTER_AUTH_SECRET.
The function signature is IDENTICAL to Phase 2.1 — zero route changes required.

Phase 2.1 → 2.2 transition: only this file's body changed.
routes/tasks.py is untouched.
"""
import logging
from datetime import datetime, timezone

import jwt
from fastapi import Header, HTTPException, status

from app.db import settings

_audit = logging.getLogger("auth.audit")


async def get_current_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Extract and verify the authenticated user ID from the JWT.

    Returns the `sub` claim as the user_id string.
    Raises HTTP 401 on any verification failure and writes an audit log entry.
    """
    if not authorization or not authorization.startswith("Bearer "):
        _audit.warning(
            '{"event": "auth_failure", "reason": "missing_header", "ts": "%s"}',
            datetime.now(timezone.utc).isoformat(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.removeprefix("Bearer ")

    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
        user_id: str = payload["sub"]
        if not user_id:
            raise jwt.InvalidTokenError("Empty sub claim")
        return user_id

    except jwt.ExpiredSignatureError:
        _audit.warning(
            '{"event": "auth_failure", "reason": "expired_token", "ts": "%s"}',
            datetime.now(timezone.utc).isoformat(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (jwt.DecodeError, jwt.InvalidTokenError):
        _audit.warning(
            '{"event": "auth_failure", "reason": "invalid_token", "ts": "%s"}',
            datetime.now(timezone.utc).isoformat(),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
