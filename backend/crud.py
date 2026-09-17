"""
ClauseIQ — Database CRUD Operations
====================================
Reusable database access layer enforcing:
  - Row-Level Security (RLS) via ContractAccess table
  - Cascade relationship handling
  - Citation-backed risk flag storage
"""

import uuid
from typing import List, Optional
from datetime import datetime, date

from sqlalchemy.orm import Session
from sqlalchemy import or_

from models import AuditLog, Contract, ContractAccess, ExtractedClause, KeyDate, RiskFlag, User
from schemas import ContractCreate, UserCreate


# ═══════════════════════════════════════════════════════════════
# USER CRUD
# ═══════════════════════════════════════════════════════════════

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    return db.query(User).filter(User.user_id == user_id).first()


def create_user(db: Session, user_in: UserCreate, hashed_pw: str) -> User:
    db_user = User(
        user_id=uuid.uuid4(),
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed_pw,
        role=user_in.role,
        department=user_in.department,
        is_active=True,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ═══════════════════════════════════════════════════════════════
# CONTRACT CRUD WITH ROW-LEVEL SECURITY (RLS)
# ═══════════════════════════════════════════════════════════════

def get_contracts_for_user(db: Session, user: User, skip: int = 0, limit: int = 50) -> List[Contract]:
    """
    Enforces Row-Level Security (RLS).
    - If user is 'admin', returns all contracts.
    - Otherwise, returns contracts that the user uploaded OR was granted access to via ContractAccess.
    """
    if user.role == "admin":
        return db.query(Contract).offset(skip).limit(limit).all()

    return (
        db.query(Contract)
        .outerjoin(ContractAccess, Contract.contract_id == ContractAccess.contract_id)
        .filter(
            or_(
                Contract.uploaded_by == user.user_id,
                ContractAccess.user_id == user.user_id,
            )
        )
        .distinct()
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_contract_by_id(db: Session, contract_id: uuid.UUID, user: Optional[User] = None) -> Optional[Contract]:
    """
    Fetches a contract by ID, verifying user has access if user is provided.
    """
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if not contract:
        return None

    if user and user.role != "admin":
        # Check upload or access grant
        has_access = (
            contract.uploaded_by == user.user_id
            or db.query(ContractAccess)
            .filter_by(contract_id=contract_id, user_id=user.user_id)
            .first()
            is not None
        )
        if not has_access:
            return None

    return contract


def create_contract(db: Session, file_name: str, uploader_id: Optional[uuid.UUID] = None, s3_url: Optional[str] = None) -> Contract:
    contract = Contract(
        contract_id=uuid.uuid4(),
        uploaded_by=uploader_id,
        file_name=file_name,
        s3_url=s3_url or f"local://uploads/{file_name}",
        status="uploaded",
    )
    db.add(contract)
    db.commit()

    # Automatically grant admin permission to the uploader in ContractAccess
    if uploader_id:
        access = ContractAccess(
            access_id=uuid.uuid4(),
            contract_id=contract.contract_id,
            user_id=uploader_id,
            permission="admin",
        )
        db.add(access)
        db.commit()

    db.refresh(contract)
    return contract


def update_contract_status(db: Session, contract_id: uuid.UUID, status: str) -> Optional[Contract]:
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if contract:
        contract.status = status
        db.commit()
        db.refresh(contract)
    return contract


def delete_contract(db: Session, contract_id: uuid.UUID) -> bool:
    contract = db.query(Contract).filter(Contract.contract_id == contract_id).first()
    if contract:
        db.delete(contract)
        db.commit()
        return True
    return False


# ═══════════════════════════════════════════════════════════════
# CLAUSES & GROUNDED RISK FLAGS CRUD
# ═══════════════════════════════════════════════════════════════

def create_clauses_bulk(db: Session, contract_id: uuid.UUID, clause_texts: List[str]) -> List[ExtractedClause]:
    clauses = []
    for idx, text in enumerate(clause_texts, start=1):
        clause = ExtractedClause(
            clause_id=uuid.uuid4(),
            contract_id=contract_id,
            clause_index=idx,
            original_text=text,
        )
        clauses.append(clause)
    db.add_all(clauses)
    db.commit()
    return clauses


def create_risk_flag(
    db: Session,
    clause_id: uuid.UUID,
    risk_level: str,
    compliance_rule: str,
    explanation: str,
    source_citation: str,
) -> RiskFlag:
    flag = RiskFlag(
        flag_id=uuid.uuid4(),
        clause_id=clause_id,
        risk_level=risk_level,
        compliance_rule=compliance_rule,
        explanation=explanation,
        source_citation=source_citation,
    )
    db.add(flag)
    db.commit()
    db.refresh(flag)
    return flag


def get_risks_for_contract(db: Session, contract_id: uuid.UUID) -> List[RiskFlag]:
    return (
        db.query(RiskFlag)
        .join(ExtractedClause, RiskFlag.clause_id == ExtractedClause.clause_id)
        .filter(ExtractedClause.contract_id == contract_id)
        .all()
    )


# ═══════════════════════════════════════════════════════════════
# KEY DATES CRUD
# ═══════════════════════════════════════════════════════════════

def create_key_date(
    db: Session,
    contract_id: uuid.UUID,
    event_type: str,
    event_date: date,
    status: str = "upcoming",
) -> KeyDate:
    kd = KeyDate(
        date_id=uuid.uuid4(),
        contract_id=contract_id,
        event_type=event_type,
        event_date=event_date,
        status=status,
    )
    db.add(kd)
    db.commit()
    db.refresh(kd)
    return kd


def get_all_upcoming_dates(db: Session, user: User, limit: int = 20) -> List[dict]:
    contracts = get_contracts_for_user(db, user)
    contract_ids = [c.contract_id for c in contracts]
    if not contract_ids:
        return []

    rows = (
        db.query(KeyDate, Contract.file_name)
        .join(Contract, KeyDate.contract_id == Contract.contract_id)
        .filter(KeyDate.contract_id.in_(contract_ids))
        .order_by(KeyDate.event_date.asc())
        .limit(limit)
        .all()
    )

    results = []
    for kd, file_name in rows:
        results.append({
            "date_id": kd.date_id,
            "contract_id": kd.contract_id,
            "event_type": kd.event_type,
            "event_date": kd.event_date,
            "status": kd.status,
            "file_name": file_name,
        })
    return results


def get_all_risks_for_user(db: Session, user: User) -> List[dict]:
    contracts = get_contracts_for_user(db, user)
    contract_ids = [c.contract_id for c in contracts]
    if not contract_ids:
        return []

    rows = (
        db.query(RiskFlag, Contract.file_name, Contract.contract_id)
        .join(ExtractedClause, RiskFlag.clause_id == ExtractedClause.clause_id)
        .join(Contract, ExtractedClause.contract_id == Contract.contract_id)
        .filter(Contract.contract_id.in_(contract_ids))
        .all()
    )

    results = []
    for flag, file_name, contract_id in rows:
        results.append({
            "flag_id": flag.flag_id,
            "clause_id": flag.clause_id,
            "risk_level": flag.risk_level,
            "compliance_rule": flag.compliance_rule,
            "explanation": flag.explanation,
            "source_citation": flag.source_citation,
            "file_name": file_name,
            "contract_id": contract_id,
        })
    return results


# ═══════════════════════════════════════════════════════════════
# AUDIT LOGS CRUD (Phase 4 Track 1)
# ═══════════════════════════════════════════════════════════════

def create_audit_log(
    db: Session,
    action: str,
    user_id: Optional[uuid.UUID] = None,
    user_email: Optional[str] = None,
    target_contract_id: Optional[uuid.UUID] = None,
    details: Optional[str] = None,
) -> AuditLog:
    entry = AuditLog(
        log_id=uuid.uuid4(),
        user_id=user_id,
        user_email=user_email,
        action=action,
        target_contract_id=target_contract_id,
        details=details,
        timestamp=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_audit_logs(db: Session, skip: int = 0, limit: int = 50) -> List[AuditLog]:
    return (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

