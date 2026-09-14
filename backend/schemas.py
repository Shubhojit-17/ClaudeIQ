"""
ClauseIQ — Pydantic Schemas
===========================
Pydantic v2 models for request validation and response serialization.
Provides type safety across all API routes and data transfer objects.
"""

from datetime import date, datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ═══════════════════════════════════════════════════════════════
# SYSTEM SCHEMAS
# ═══════════════════════════════════════════════════════════════
class DatabaseStatus(BaseModel):
    connected: bool
    dialect: str
    status: str
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    service: str
    version: str
    timestamp: str
    database: DatabaseStatus


class SystemInfoResponse(BaseModel):
    service: str
    version: str
    environment: str
    features: List[str]
    supported_file_types: List[str]
    compliance_frameworks: List[str]


# ═══════════════════════════════════════════════════════════════
# USER SCHEMAS
# ═══════════════════════════════════════════════════════════════
UserRole = Literal["admin", "reviewer", "viewer"]


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    role: UserRole = "viewer"
    department: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Raw password to be hashed")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(UserBase):
    user_id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════
# CONTRACT ACCESS SCHEMAS
# ═══════════════════════════════════════════════════════════════
AccessPermission = Literal["read", "write", "admin"]


class ContractAccessBase(BaseModel):
    user_id: UUID
    permission: AccessPermission = "read"


class ContractAccessCreate(ContractAccessBase):
    contract_id: UUID


class ContractAccessResponse(ContractAccessBase):
    access_id: UUID
    contract_id: UUID

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════
# RISK FLAG SCHEMAS
# ═══════════════════════════════════════════════════════════════
RiskLevel = Literal["low", "medium", "high", "critical"]


class RiskFlagBase(BaseModel):
    risk_level: RiskLevel
    compliance_rule: str = Field(..., max_length=512)
    explanation: str
    source_citation: Optional[str] = Field(
        None, description="Exact contract text cited to ensure grounded AI output"
    )


class RiskFlagCreate(RiskFlagBase):
    clause_id: UUID


class RiskFlagResponse(RiskFlagBase):
    flag_id: UUID
    clause_id: UUID

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════
# EXTRACTED CLAUSE SCHEMAS
# ═══════════════════════════════════════════════════════════════
class ExtractedClauseBase(BaseModel):
    clause_index: int = Field(..., ge=0)
    original_text: str


class ExtractedClauseCreate(ExtractedClauseBase):
    contract_id: UUID


class ExtractedClauseResponse(ExtractedClauseBase):
    clause_id: UUID
    contract_id: UUID
    risk_flags: List[RiskFlagResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════
# KEY DATE SCHEMAS
# ═══════════════════════════════════════════════════════════════
EventType = Literal["expiry", "renewal", "termination", "review"]
DateStatus = Literal["upcoming", "overdue", "completed"]


class KeyDateBase(BaseModel):
    event_type: EventType
    event_date: date
    status: DateStatus = "upcoming"


class KeyDateCreate(KeyDateBase):
    contract_id: UUID


class KeyDateResponse(KeyDateBase):
    date_id: UUID
    contract_id: UUID

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════
# CONTRACT SCHEMAS
# ═══════════════════════════════════════════════════════════════
ContractStatus = Literal["uploaded", "processing", "analyzed", "error"]


class ContractBase(BaseModel):
    file_name: str = Field(..., min_length=1, max_length=512)
    s3_url: Optional[str] = None


class ContractCreate(ContractBase):
    uploaded_by: Optional[UUID] = None


class ContractResponse(ContractBase):
    contract_id: UUID
    uploaded_by: Optional[UUID] = None
    status: ContractStatus
    created_at: datetime
    clauses: List[ExtractedClauseResponse] = []
    key_dates: List[KeyDateResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ContractSummary(ContractBase):
    contract_id: UUID
    uploaded_by: Optional[UUID] = None
    status: ContractStatus
    created_at: datetime
    clause_count: int = 0
    risk_count: int = 0
    upcoming_dates_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════
# AUDIT LOG SCHEMAS (Phase 4 Track 1)
# ═══════════════════════════════════════════════════════════════
class AuditLogResponse(BaseModel):
    log_id: UUID
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    action: str
    target_contract_id: Optional[UUID] = None
    details: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

