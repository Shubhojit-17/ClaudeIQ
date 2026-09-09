"""
ClauseIQ — FastAPI Application Entry Point
============================================
Initializes the FastAPI app with:
  - CORS middleware (allows frontend dev server at localhost:5173)
  - Health check endpoint at /api/health
  - Database table creation on startup

Run with:
    uvicorn main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine


# ─── Lifespan: Create DB tables on startup ───────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Creates all database tables on startup if they don't exist.
    """
    # Startup
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created / verified.")
    yield
    # Shutdown
    print("🛑 Application shutting down.")


# ─── FastAPI App ─────────────────────────────────────────────
app = FastAPI(
    title="ClauseIQ API",
    description=(
        "AI Contract Intelligence & Compliance Assistant — "
        "Ingest, analyze, and track contract obligations."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ─── CORS Middleware ─────────────────────────────────────────
# Allow the Vite dev server (localhost:5173) and common dev ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════


@app.get("/api/health", tags=["System"])
async def health_check():
    """
    Health check endpoint.
    Returns the API status, version, and server timestamp.
    Used by monitoring tools and the frontend to verify connectivity.
    """
    return {
        "status": "healthy",
        "service": "ClauseIQ API",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════
# PLACEHOLDER ROUTE GROUPS (to be implemented by Track 2 team)
# ═══════════════════════════════════════════════════════════════

# TODO: POST /api/auth/login          → JWT issuance
# TODO: GET  /api/contracts            → List contracts (RLS-filtered)
# TODO: POST /api/contracts/upload     → Upload + trigger ingestion
# TODO: GET  /api/contracts/{id}       → Contract detail + clauses
# TODO: GET  /api/contracts/{id}/risks → Risk flags for contract
# TODO: GET  /api/obligations          → Upcoming key dates
# TODO: POST /api/analyze/{id}         → Trigger AI analysis
