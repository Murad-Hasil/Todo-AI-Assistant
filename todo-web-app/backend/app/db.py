# [Task]: T-2.1.2, T-2.2.2
"""Database engine, session factory, and FastAPI dependency for Neon PostgreSQL."""
import os
from collections.abc import Generator

from dotenv import load_dotenv
from pydantic import model_validator
from pydantic_settings import BaseSettings
from sqlalchemy.pool import NullPool
from sqlmodel import Session, SQLModel, create_engine

load_dotenv()


class Settings(BaseSettings):
    database_url: str = ""
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"
    better_auth_secret: str = ""  # [Task]: T-2.2.2 — shared HS256 signing secret

    model_config = {"env_file": ".env", "extra": "ignore"}

    # [Task]: T-3.2.2 — Phase 3.2 AI Agent settings
    groq_api_key: str = ""
    openai_base_url: str = "https://api.groq.com/openai/v1"
    groq_model: str = "llama-3.3-70b-versatile"
    max_history_messages: int = 10

    @model_validator(mode="after")
    def _require_auth_secret(self) -> "Settings":
        """[Task]: T-2.2.2 — refuse to start if BETTER_AUTH_SECRET is absent."""
        if not self.better_auth_secret:
            raise ValueError(
                "BETTER_AUTH_SECRET must be set. "
                "Add it to your .env file (minimum 32 random characters)."
            )
        return self

    @model_validator(mode="after")
    def _require_groq_key(self) -> "Settings":
        if not self.groq_api_key:
            raise ValueError(
                "GROQ_API_KEY must be set. Add it to your .env file."
            )
        return self

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()

engine = create_engine(
    settings.database_url,
    poolclass=NullPool,
    pool_pre_ping=True,
)


def init_db() -> None:
    """Create all tables (dev only — production uses Alembic)."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a database session and closes it on exit."""
    with Session(engine) as session:
        yield session
