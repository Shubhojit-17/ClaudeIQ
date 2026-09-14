"""
ClauseIQ — ORM Models
======================
SQLAlchemy ORM classes for the ClauseIQ database schema.

Tables:
    - User:             System users with RBAC roles
    - Contract:         Uploaded contract documents
    - ContractAccess:   Row-Level Security (RLS) access grants
    - ExtractedClause:  Individual clauses parsed from contracts
    - RiskFlag:         AI-generated risk flags with source citations
    - KeyDate:          Extracted dates (expiry, renewal, termination)
"""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship

from database import Base


# ═══════════════════════════════════════════════════════════════
# PLATFORM-INDEPENDENT GUID TYPE
# ═══════════════════════════════════════════════════════════════
class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL native UUID if available, falls back to CHAR(36) on SQLite.
    Ensures models run seamlessly in both production and local/test environments.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value) if not isinstance(value, uuid.UUID) else value
        return str(value) if isinstance(value, uuid.UUID) else str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


# ═══════════════════════════════════════════════════════════════
# USER
# ═══════════════════════════════════════════════════════════════
class User(Base):
    """
    Represents a system user.
    Roles: admin, reviewer, viewer — used for RBAC enforcement.
    Includes password hash and active status for authentication foundation.
    """

    __tablename__ = "users"

    user_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False, default="")
    role = Column(
        Enum("admin", "reviewer", "viewer", name="user_role_enum"),
        nullable=False,
        default="viewer",
    )
    department = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationships ────────────────────────────────────────
    contracts = relationship("Contract", back_populates="uploader")
    access_grants = relationship("ContractAccess", back_populates="user")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"


# ═══════════════════════════════════════════════════════════════
# CONTRACT
# ═══════════════════════════════════════════════════════════════
class Contract(Base):
    """
    Represents an uploaded contract document.
    Status tracks the processing pipeline stage.
    """

    __tablename__ = "contracts"

    contract_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    uploaded_by = Column(
        GUID(),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    file_name = Column(String(512), nullable=False)
    s3_url = Column(String(1024), nullable=True)
    status = Column(
        Enum(
            "uploaded", "processing", "analyzed", "error",
            name="contract_status_enum",
        ),
        nullable=False,
        default="uploaded",
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ── Relationships ────────────────────────────────────────
    uploader = relationship("User", back_populates="contracts")
    access_list = relationship(
        "ContractAccess", back_populates="contract", cascade="all, delete-orphan"
    )
    clauses = relationship(
        "ExtractedClause", back_populates="contract", cascade="all, delete-orphan"
    )
    key_dates = relationship(
        "KeyDate", back_populates="contract", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Contract {self.file_name} ({self.status})>"


# ═══════════════════════════════════════════════════════════════
# CONTRACT ACCESS (Row-Level Security)
# ═══════════════════════════════════════════════════════════════
class ContractAccess(Base):
    """
    Grants a specific user a permission level on a contract.
    Used to enforce Row-Level Security (RLS) — queries filter
    results based on the authenticated user's access grants.
    """

    __tablename__ = "contract_access"

    access_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    contract_id = Column(
        GUID(),
        ForeignKey("contracts.contract_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        GUID(),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    permission = Column(
        Enum("read", "write", "admin", name="access_permission_enum"),
        nullable=False,
        default="read",
    )

    # ── Relationships ────────────────────────────────────────
    contract = relationship("Contract", back_populates="access_list")
    user = relationship("User", back_populates="access_grants")

    def __repr__(self):
        return f"<ContractAccess user={self.user_id} → contract={self.contract_id} ({self.permission})>"


# ═══════════════════════════════════════════════════════════════
# EXTRACTED CLAUSE
# ═══════════════════════════════════════════════════════════════
class ExtractedClause(Base):
    """
    A single clause extracted from a contract during the ingestion pipeline.
    The original_text is the raw text; embeddings are stored via pgvector
    for RAG retrieval.
    """

    __tablename__ = "extracted_clauses"

    clause_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    contract_id = Column(
        GUID(),
        ForeignKey("contracts.contract_id", ondelete="CASCADE"),
        nullable=False,
    )
    clause_index = Column(Integer, nullable=False)
    original_text = Column(Text, nullable=False)
    # NOTE: The pgvector embedding column will be added when the
    # pgvector extension and embedding pipeline are wired up.
    # Example: embedding = Column(Vector(1536))

    # ── Relationships ────────────────────────────────────────
    contract = relationship("Contract", back_populates="clauses")
    risk_flags = relationship(
        "RiskFlag", back_populates="clause", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<ExtractedClause #{self.clause_index} of contract={self.contract_id}>"


# ═══════════════════════════════════════════════════════════════
# RISK FLAG
# ═══════════════════════════════════════════════════════════════
class RiskFlag(Base):
    """
    An AI-generated risk flag for a specific clause.
    Every flag MUST include a source_citation — the exact text
    from the contract that triggered the risk. This ensures
    grounded, hallucination-free AI output.
    """

    __tablename__ = "risk_flags"

    flag_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    clause_id = Column(
        GUID(),
        ForeignKey("extracted_clauses.clause_id", ondelete="CASCADE"),
        nullable=False,
    )
    risk_level = Column(
        Enum("low", "medium", "high", "critical", name="risk_level_enum"),
        nullable=False,
    )
    compliance_rule = Column(String(512), nullable=False)
    explanation = Column(Text, nullable=False)
    source_citation = Column(Text, nullable=True)  # Exact clause text cited

    # ── Relationships ────────────────────────────────────────
    clause = relationship("ExtractedClause", back_populates="risk_flags")

    def __repr__(self):
        return f"<RiskFlag {self.risk_level} — {self.compliance_rule}>"


# ═══════════════════════════════════════════════════════════════
# KEY DATE
# ═══════════════════════════════════════════════════════════════
class KeyDate(Base):
    """
    A key date extracted from a contract — expiry, renewal,
    termination, or review deadlines. Displayed on the
    obligation tracker dashboard.
    """

    __tablename__ = "key_dates"

    date_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    contract_id = Column(
        GUID(),
        ForeignKey("contracts.contract_id", ondelete="CASCADE"),
        nullable=False,
    )
    event_type = Column(
        Enum(
            "expiry", "renewal", "termination", "review",
            name="event_type_enum",
        ),
        nullable=False,
    )
    event_date = Column(Date, nullable=False)
    status = Column(
        Enum(
            "upcoming", "overdue", "completed",
            name="date_status_enum",
        ),
        nullable=False,
        default="upcoming",
    )

    # ── Relationships ────────────────────────────────────────
    contract = relationship("Contract", back_populates="key_dates")

    def __repr__(self):
        return f"<KeyDate {self.event_type} on {self.event_date} ({self.status})>"


# ═══════════════════════════════════════════════════════════════
# COMPLIANCE AUDIT LOG (Phase 4 Track 1)
# ═══════════════════════════════════════════════════════════════
class AuditLog(Base):
    """
    Enterprise Compliance Audit Log.
    Maintains an immutable legal audit trail of all contract operations:
    upload, analysis, access grant, deletion, and auth events.
    Essential for SOC 2 Type II and Deloitte enterprise audit readiness.
    """

    __tablename__ = "audit_logs"

    log_id = Column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    user_id = Column(
        GUID(),
        ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
    )
    user_email = Column(String(255), nullable=True)
    action = Column(String(128), nullable=False, index=True)
    target_contract_id = Column(GUID(), nullable=True, index=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_email} at {self.timestamp}>"
