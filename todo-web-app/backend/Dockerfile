# [Task]: T-4.1 | Updated for Hugging Face Spaces deployment
# Multi-stage build for FastAPI backend — python:3.13-slim

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# Install uv from official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Cache dependency installation by copying lockfiles first
COPY pyproject.toml uv.lock ./

# Install production dependencies into /app/.venv
RUN uv sync --frozen --no-dev

# Copy application source
COPY app/ ./app/

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM python:3.13-slim AS runner

# Non-root user for security
RUN adduser --system --no-create-home --uid 1001 appuser

WORKDIR /app

# Copy virtual environment and application source from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/app /app/app

# Fix permissions for Hugging Face Spaces (runs as user 1000)
RUN chown -R 1000:1000 /app

# Add venv to PATH
ENV PATH="/app/.venv/bin:$PATH"

# Hugging Face Spaces requires port 7860
ENV HOSTNAME="0.0.0.0"
ENV PORT=7860

USER 1001

EXPOSE 7860

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
