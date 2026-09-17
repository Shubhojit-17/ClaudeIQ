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


from typing import List, Optional
import uuid

from fastapi import Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
import crud
from database import Base, check_db_connection, engine, get_db
from ingestion import process_document
from ai_engine import ai_engine
from models import Contract, ExtractedClause, KeyDate, RiskFlag, User
from schemas import (
    AuditLogResponse,
    ContractResponse,
    ContractSummary,
    HealthCheckResponse,
    KeyDateResponse,
    LoginRequest,
    RiskFlagResponse,
    SystemInfoResponse,
    TokenResponse,
    UserCreate,
    UserResponse,
)


# ═══════════════════════════════════════════════════════════════
# AUTHENTICATION ROUTES
# ═══════════════════════════════════════════════════════════════

@app.post("/api/auth/register", response_model=UserResponse, tags=["Authentication"])
async def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new system user."""
    existing = crud.get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    hashed_pw = hash_password(user_in.password)
    new_user = crud.create_user(db, user_in, hashed_pw)
    return new_user


@app.post("/api/auth/login", response_model=TokenResponse, tags=["Authentication"])
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token."""
    user = crud.get_user_by_email(db, credentials.email)
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    token = create_access_token({"sub": user.email, "role": user.role, "user_id": str(user.user_id)})
    crud.create_audit_log(
        db,
        action="USER_LOGIN",
        user_id=user.user_id,
        user_email=user.email,
        details="User authenticated via password credentials",
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the profile of the authenticated user."""
    return current_user


# ═══════════════════════════════════════════════════════════════
# CONTRACTS & INGESTION ROUTES (Row-Level Security)
# ═══════════════════════════════════════════════════════════════

@app.get("/api/contracts", response_model=List[ContractSummary], tags=["Contracts"])
async def list_contracts(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists contracts accessible to the authenticated user.
    Admins see all contracts; Reviewers/Viewers only see contracts granted via RLS.
    """
    contracts = crud.get_contracts_for_user(db, user=current_user, skip=skip, limit=limit)
    summaries = []
    for c in contracts:
        clause_count = len(c.clauses)
        risk_count = sum(len(clause.risk_flags) for clause in c.clauses)
        dates_count = len(c.key_dates)
        summaries.append(
            ContractSummary(
                contract_id=c.contract_id,
                file_name=c.file_name,
                s3_url=c.s3_url,
                status=c.status,
                uploaded_by=c.uploaded_by,
                created_at=c.created_at,
                clause_count=clause_count,
                risk_count=risk_count,
                upcoming_dates_count=dates_count,
            )
        )
    return summaries


@app.post("/api/contracts/upload", response_model=ContractResponse, tags=["Contracts"])
async def upload_contract(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Uploads a contract (PDF or DOCX), extracts text, chunks into semantic clauses,
    runs automated compliance screening, and persists grounded risk flags & key dates.
    """
    file_name = file.filename
    if not (file_name.lower().endswith(".pdf") or file_name.lower().endswith(".docx") or file_name.lower().endswith(".txt")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload .pdf, .docx, or .txt agreements.",
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # 1. Create Contract in DB
    contract = crud.create_contract(
        db,
        file_name=file_name,
        uploader_id=current_user.user_id,
        s3_url=f"local://uploads/{file_name}",
    )

    try:
        # 2. Ingestion: Extract text & Chunk clauses
        raw_text, clause_texts = process_document(file_name, file_bytes)
        clauses = crud.create_clauses_bulk(db, contract.contract_id, clause_texts)

        # 3. AI Intelligence: Screen clauses for risks & dates
        ai_analysis = ai_engine.analyze_clauses(clause_texts)

        # 4. Persist Grounded Risk Flags & Dates
        for clause_obj, res in zip(clauses, ai_analysis["clause_results"]):
            for risk in res["risk_flags"]:
                crud.create_risk_flag(
                    db,
                    clause_id=clause_obj.clause_id,
                    risk_level=risk["risk_level"],
                    compliance_rule=risk["compliance_rule"],
                    explanation=risk["explanation"],
                    source_citation=risk["source_citation"],
                )
            for kd in res["key_dates"]:
                crud.create_key_date(
                    db,
                    contract_id=contract.contract_id,
                    event_type=kd["event_type"],
                    event_date=kd["event_date"],
                    status=kd["status"],
                )

        # 5. Update Status & Audit Log
        crud.update_contract_status(db, contract.contract_id, "analyzed")
        crud.create_audit_log(
            db,
            action="CONTRACT_UPLOADED",
            user_id=current_user.user_id,
            user_email=current_user.email,
            target_contract_id=contract.contract_id,
            details=f"Uploaded {file_name}: extracted {len(clauses)} clauses, detected {ai_analysis['summary']['total_risks']} risks",
        )
        db.refresh(contract)
        return contract

    except Exception as exc:
        crud.update_contract_status(db, contract.contract_id, "error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing contract document: {str(exc)}",
        )


@app.get("/api/contracts/{contract_id}", response_model=ContractResponse, tags=["Contracts"])
async def get_contract_detail(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetches complete contract details, clauses, risk flags, and key dates."""
    contract = crud.get_contract_by_id(db, contract_id, user=current_user)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or access denied.",
        )
    return contract


@app.delete("/api/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Contracts"])
async def delete_contract(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes a contract and cascades cleanup to all clauses, risks, and dates."""
    contract = crud.get_contract_by_id(db, contract_id, user=current_user)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or access denied.",
        )
    crud.delete_contract(db, contract_id)
    crud.create_audit_log(
        db,
        action="CONTRACT_DELETED",
        user_id=current_user.user_id,
        user_email=current_user.email,
        target_contract_id=contract_id,
        details=f"Contract {contract.file_name} deleted with cascading cleanup",
    )
    return None


@app.post("/api/analyze/{contract_id}", tags=["Analysis"])
async def trigger_analysis(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-analyzes all clauses in an existing contract and refreshes risk assessments."""
    contract = crud.get_contract_by_id(db, contract_id, user=current_user)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or access denied.",
        )

    clause_texts = [c.original_text for c in contract.clauses]
    ai_analysis = ai_engine.analyze_clauses(clause_texts)

    # Clean old flags and re-create
    for clause_obj, res in zip(contract.clauses, ai_analysis["clause_results"]):
        for old_flag in list(clause_obj.risk_flags):
            db.delete(old_flag)
        for risk in res["risk_flags"]:
            crud.create_risk_flag(
                db,
                clause_id=clause_obj.clause_id,
                risk_level=risk["risk_level"],
                compliance_rule=risk["compliance_rule"],
                explanation=risk["explanation"],
                source_citation=risk["source_citation"],
            )

    crud.update_contract_status(db, contract.contract_id, "analyzed")
    crud.create_audit_log(
        db,
        action="CONTRACT_ANALYZED",
        user_id=current_user.user_id,
        user_email=current_user.email,
        target_contract_id=contract_id,
        details=f"Re-analyzed agreement: {ai_analysis['summary']['total_risks']} compliance flags identified",
    )
    return {
        "status": "success",
        "contract_id": str(contract_id),
        "summary": ai_analysis["summary"],
    }


@app.get("/api/contracts/{contract_id}/risks", response_model=List[RiskFlagResponse], tags=["Analysis"])
async def get_contract_risks(
    contract_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all grounded risk flags for a specific contract."""
    contract = crud.get_contract_by_id(db, contract_id, user=current_user)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found or access denied.",
        )
    return crud.get_risks_for_contract(db, contract_id)


@app.get("/api/risks", response_model=List[RiskFlagResponse], tags=["Analysis"])
async def get_all_accessible_risks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all grounded risk flags across contracts accessible to current user."""
    return crud.get_all_risks_for_user(db, current_user)


@app.get("/api/obligations", response_model=List[KeyDateResponse], tags=["Obligations"])
async def get_obligations(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns upcoming milestone dates and renewal alerts across all tracked contracts."""
    return crud.get_all_upcoming_dates(db, user=current_user, limit=limit)


@app.get("/api/audit-logs", response_model=List[AuditLogResponse], tags=["Audit"])
async def list_audit_logs(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the compliance audit trail.
    Available to admin and reviewer users for SOC 2 / compliance review.
    """
    if current_user.role not in ["admin", "reviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Audit logs require compliance or administrator privileges.",
        )
    return crud.get_audit_logs(db, skip=skip, limit=limit)



