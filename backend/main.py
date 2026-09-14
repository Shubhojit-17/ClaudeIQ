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
from datetime import datetime, timezone
import os

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import Base, check_db_connection, engine
from schemas import HealthCheckResponse, SystemInfoResponse


# ─── Lifespan: Create DB tables on startup ───────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Creates all database tables on startup if they don't exist.
    """
    # Startup
    try:
        Base.metadata.create_all(bind=engine)
        print("[INFO] Database tables verified / created.")
    except Exception as exc:
        print(f"[WARN] Database table verification skipped or failed: {exc}")
    yield
    # Shutdown
    print("[INFO] Application shutting down.")


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


# ─── Centralized Exception Handler ───────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": str(exc),
            "path": request.url.path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# ═══════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════


@app.get(
    "/api/health",
    response_model=HealthCheckResponse,
    tags=["System"],
    summary="Health check with database connectivity probe",
)
async def health_check():
    """
    Health check endpoint.
    Checks API process health and probes active database connectivity.
    Returns healthy when database is reachable, degraded if database is offline.
    """
    db_status = check_db_connection()
    overall_status = "healthy" if db_status.get("connected") else "degraded"

    return {
        "status": overall_status,
        "service": "ClauseIQ API",
        "version": "0.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
    }


@app.get(
    "/api/system/info",
    response_model=SystemInfoResponse,
    tags=["System"],
    summary="System capabilities and metadata",
)
async def system_info():
    """
    Returns platform metadata, supported document formats, and compliance checklists.
    """
    return {
        "service": "ClauseIQ AI Contract Intelligence",
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "features": [
            "Document Ingestion (PDF, Word)",
            "Semantic Clause Chunking",
            "Grounded AI Risk Screening with Citations",
            "Milestone Obligation Tracking",
            "Row-Level Security (RLS) & RBAC",
        ],
        "supported_file_types": [".pdf", ".docx"],
        "compliance_frameworks": [
            "GDPR Cross-Border Data Transfer",
            "Auto-Renewal Lock-in Protection",
            "Uncapped Liability & Indemnification Review",
            "IP & Confidentiality Safeguards",
        ],
    }


# ═══════════════════════════════════════════════════════════════
# PLACEHOLDER ROUTE GROUPS (Core Implementation in Phase 3)
# ═══════════════════════════════════════════════════════════════

# POST /api/auth/login          → JWT issuance & credential verification
# GET  /api/contracts            → List contracts (RLS-filtered)
# POST /api/contracts/upload     → Upload + trigger ingestion pipeline
# GET  /api/contracts/{id}       → Contract detail + clauses
# GET  /api/contracts/{id}/risks → Risk flags with grounded citations
# GET  /api/obligations          → Upcoming key dates
# POST /api/analyze/{id}         → Trigger AI analysis

