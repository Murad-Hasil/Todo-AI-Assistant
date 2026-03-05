FROM python:3.13-slim AS builder

WORKDIR /app

# Install uv (required for MCP subprocess in agent/runner.py)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy backend dependency files
COPY todo-web-app/backend/pyproject.toml todo-web-app/backend/uv.lock ./

# Install production dependencies
RUN uv sync --frozen --no-dev

# Copy backend app source
COPY todo-web-app/backend/app ./app

# ── Runner ─────────────────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# uv needed at runtime for MCP subprocess
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/app ./app
COPY --from=builder /app/pyproject.toml ./pyproject.toml
COPY --from=builder /app/uv.lock ./uv.lock

ENV PATH="/app/.venv/bin:$PATH"
ENV HOSTNAME="0.0.0.0"
ENV PORT=7860

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
