"""
ClauseIQ — Database Configuration
==================================
SQLAlchemy engine and session factory for PostgreSQL.
Uses the DATABASE_URL from environment variables.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# ---------------------------------------------------------------------------
# Load environment variables from .env file
# ---------------------------------------------------------------------------
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://clauseiq:clauseiq_secret@localhost:5432/clauseiq_db",
)

# ---------------------------------------------------------------------------
# SQLAlchemy Engine
# Supports both PostgreSQL and SQLite (useful for local development/testing)
# ---------------------------------------------------------------------------
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
else:
    engine = create_engine(
        DATABASE_URL,
        echo=False,          # Set to True for SQL query logging during development
        pool_size=10,        # Connection pool size
        max_overflow=20,     # Max connections beyond pool_size
        pool_pre_ping=True,  # Verify connections before use
    )

# ---------------------------------------------------------------------------
# Session Factory
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ---------------------------------------------------------------------------
# Declarative Base for ORM Models
# ---------------------------------------------------------------------------
Base = declarative_base()


def check_db_connection() -> dict:
    """
    Checks if the database is reachable and returns status info.
    Used by the health check endpoint.
    """
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        dialect = engine.dialect.name
        return {
            "connected": True,
            "dialect": dialect,
            "status": "online",
        }
    except Exception as exc:
        return {
            "connected": False,
            "dialect": engine.dialect.name,
            "status": "offline",
            "error": str(exc),
        }


# ---------------------------------------------------------------------------
# Dependency: get_db()
# Used as a FastAPI dependency to inject DB sessions into route handlers.
# Ensures the session is properly closed after each request.
# ---------------------------------------------------------------------------
def get_db():
    """
    FastAPI dependency that yields a database session.

    Usage:
        @app.get("/example")
        def example_route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
