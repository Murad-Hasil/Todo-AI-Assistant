# [Task]: T-2.1.6
"""
FastAPI application entry point.

Mounts the tasks router under /api, configures CORS, and provides
a /health endpoint. Calls init_db() on startup for development convenience
(production uses Alembic migrations via `alembic upgrade head`).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db, settings
from app.routes.chat import router as chat_router  # [Task]: T-3.2.8
from app.routes.tasks import router as tasks_router

app = FastAPI(
    title="Todo API",
    version="3.2.0",
    description="Phase 3.2 Backend — AI Chat endpoint + Task CRUD with JWT auth",
)

# ---------------------------------------------------------------------------
# CORS — origins from environment (constitution Principle VII monorepo pattern)
# Production: set CORS_ORIGINS=https://frontend-murad-hasils-projects.vercel.app
# ---------------------------------------------------------------------------
_vercel_origin = "https://frontend-murad-hasils-projects.vercel.app"
_allowed_origins = list({*settings.cors_origins_list, _vercel_origin})

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(tasks_router, prefix="/api")
# [Task]: T-3.2.8 — mount chat router
app.include_router(chat_router, prefix="/api")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health")
def health() -> dict[str, str]:
    """Liveness probe endpoint."""
    return {"status": "ok", "version": "3.2.0"}


# ---------------------------------------------------------------------------
# Startup: create tables for development (Alembic handles production)
# ---------------------------------------------------------------------------
@app.on_event("startup")
def on_startup() -> None:
    if settings.environment == "development":
        init_db()
