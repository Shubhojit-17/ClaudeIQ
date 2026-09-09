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
# ---------------------------------------------------------------------------
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
