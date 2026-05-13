# [Task]: T-5.3.1, T-5.3.3
"""Notification Service — Phase 5.3 — stateless Dapr subscriber."""
import logging
from fastapi import FastAPI, Request

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="todo-notification-service", version="1.0.0")

_VALID_ACTION = "reminder"


@app.post("/on-reminder", status_code=200)
async def on_reminder(request: Request) -> dict:
    """Dapr-invoked endpoint. Always returns 200 to ack delivery (prevents retry storm)."""
    try:
        body = await request.json()
        payload = body.get("data", body)  # unwrap CloudEvents envelope (research R-003)
        task_title = payload.get("task_title", "").strip()
        user_id = payload.get("user_id", "").strip()
        if not task_title or not user_id:
            logger.warning(
                "on_reminder: missing task_title=%r or user_id=%r — skipping",
                task_title, user_id,
            )
            return {}
        logger.info(
            '[REMINDER]: Hey User %s, your task "%s" is due now!',
            user_id, task_title,
        )
        # Placeholder: future Email/Push integration
        # await send_email_notification(user_id, task_title)
    except Exception as exc:
        logger.error("on_reminder: unhandled error: %s", exc)
    return {}


@app.get("/healthz")
def health() -> dict:
    return {"status": "ok"}
