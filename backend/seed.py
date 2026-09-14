"""
ClauseIQ — Database Seed Script
===============================
Seeds initial demonstration data into the ClauseIQ database:
  - 3 Users with distinct RBAC roles (admin, reviewer, viewer)
  - 2 Realistic enterprise contracts (SaaS Master Services Agreement, Vendor NDA)
  - Contract access permissions enforcing Row-Level Security (RLS)
  - Extracted contract clauses
  - Grounded AI risk flags with precise source text citations
  - Key milestone dates (expiry, renewal, review)

Run with:
    python seed.py
"""

import hashlib
import uuid
from datetime import date, datetime, timedelta

from database import Base, SessionLocal, engine
from models import Contract, ContractAccess, ExtractedClause, KeyDate, RiskFlag, User


def hash_password(password: str) -> str:
    """Simple SHA-256 password hash for foundational seeding."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def seed_database():
    print("[INFO] Starting ClauseIQ database seeding...")

    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()

    try:
        # Check if users already exist
        existing_user = session.query(User).first()
        if existing_user:
            print("[INFO] Database already contains data. Skipping duplicate seed.")
            return

        # ── 1. Create Users (RBAC) ──────────────────────────────
        admin_user = User(
            user_id=uuid.uuid4(),
            name="Sarah Jenkins",
            email="admin@clauseiq.com",
            hashed_password=hash_password("AdminSecure2027!"),
            role="admin",
            department="Legal Operations",
            is_active=True,
        )

        reviewer_user = User(
            user_id=uuid.uuid4(),
            name="David Chen",
            email="reviewer@clauseiq.com",
            hashed_password=hash_password("ReviewerPass2027!"),
            role="reviewer",
            department="Compliance & Regulatory",
            is_active=True,
        )

        viewer_user = User(
            user_id=uuid.uuid4(),
            name="Elena Rodriguez",
            email="viewer@clauseiq.com",
            hashed_password=hash_password("ViewerRead2027!"),
            role="viewer",
            department="Procurement",
            is_active=True,
        )

        session.add_all([admin_user, reviewer_user, viewer_user])
        session.commit()
        print("[SUCCESS] Users seeded (admin, reviewer, viewer).")

        # ── 2. Create Contract 1: Cloud Services Agreement ──────
        contract_1 = Contract(
            contract_id=uuid.uuid4(),
            uploaded_by=admin_user.user_id,
            file_name="Acme_Cloud_Services_Agreement_2026.pdf",
            s3_url="s3://clauseiq-contracts/prod/acme_cloud_2026.pdf",
            status="analyzed",
            created_at=datetime.utcnow() - timedelta(days=5),
        )

        # ── 3. Create Contract 2: Mutual Non-Disclosure Agreement
        contract_2 = Contract(
            contract_id=uuid.uuid4(),
            uploaded_by=reviewer_user.user_id,
            file_name="Apex_Mutual_NDA_v2.docx",
            s3_url="s3://clauseiq-contracts/prod/apex_nda_v2.docx",
            status="analyzed",
            created_at=datetime.utcnow() - timedelta(days=2),
        )

        session.add_all([contract_1, contract_2])
        session.commit()
        print("[SUCCESS] Contracts seeded.")

        # ── 4. Create Contract Access (Row-Level Security) ──────
        access_records = [
            ContractAccess(
                contract_id=contract_1.contract_id,
                user_id=admin_user.user_id,
                permission="admin",
            ),
            ContractAccess(
                contract_id=contract_1.contract_id,
                user_id=reviewer_user.user_id,
                permission="write",
            ),
            ContractAccess(
                contract_id=contract_2.contract_id,
                user_id=reviewer_user.user_id,
                permission="admin",
            ),
            ContractAccess(
                contract_id=contract_2.contract_id,
                user_id=viewer_user.user_id,
                permission="read",
            ),
        ]
        session.add_all(access_records)
        session.commit()
        print("[SUCCESS] Contract access grants seeded (Row-Level Security).")

        # ── 5. Extracted Clauses & Grounded Risk Flags (Contract 1) ─
        c1_clause_1 = ExtractedClause(
            clause_id=uuid.uuid4(),
            contract_id=contract_1.contract_id,
            clause_index=1,
            original_text=(
                "Section 8.2 (Term and Auto-Renewal): This Agreement shall automatically "
                "renew for successive twelve (12) month periods unless either party provides "
                "written notice of non-renewal at least ninety (90) days prior to the expiration "
                "of the then-current term."
            ),
        )

        c1_clause_2 = ExtractedClause(
            clause_id=uuid.uuid4(),
            contract_id=contract_1.contract_id,
            clause_index=2,
            original_text=(
                "Section 14.1 (Indemnification & Liability Cap): In no event shall Supplier's "
                "aggregate liability exceed three (3) times the total fees paid in the twelve (12) "
                "months preceding the claim, except for breaches of confidentiality and IP infringement "
                "which shall have an uncapped liability limit."
            ),
        )

        c1_clause_3 = ExtractedClause(
            clause_id=uuid.uuid4(),
            contract_id=contract_1.contract_id,
            clause_index=3,
            original_text=(
                "Section 21.4 (Data Processing & Cross-Border Transfer): Customer agrees that personal data "
                "may be processed and stored in any jurisdiction where Supplier or its sub-processors maintain "
                "facilities, without requiring prior written approval or additional Standard Contractual Clauses."
            ),
        )

        session.add_all([c1_clause_1, c1_clause_2, c1_clause_3])
        session.commit()

        # Risk flags citing exact source text
        flag_1 = RiskFlag(
            clause_id=c1_clause_1.clause_id,
            risk_level="high",
            compliance_rule="Automatic Renewal Clause Lock-in",
            explanation="Requires 90-day non-renewal notice. Standard corporate policy mandates maximum 30-day notice to prevent unintended renewals.",
            source_citation="unless either party provides written notice of non-renewal at least ninety (90) days prior to the expiration",
        )

        flag_2 = RiskFlag(
            clause_id=c1_clause_3.clause_id,
            risk_level="critical",
            compliance_rule="GDPR / Cross-Border Data Transfer Non-Compliance",
            explanation="Unrestricted international transfer of personal data without standard contractual clauses violates EU GDPR Article 44-49.",
            source_citation="personal data may be processed and stored in any jurisdiction... without requiring prior written approval",
        )

        session.add_all([flag_1, flag_2])
        session.commit()
        print("[SUCCESS] Extracted clauses & grounded risk flags seeded for Contract 1.")

        # ── 6. Key Milestone Dates ──────────────────────────────
        today = date.today()
        dates = [
            KeyDate(
                contract_id=contract_1.contract_id,
                event_type="renewal",
                event_date=today + timedelta(days=45),
                status="upcoming",
            ),
            KeyDate(
                contract_id=contract_1.contract_id,
                event_type="expiry",
                event_date=today + timedelta(days=135),
                status="upcoming",
            ),
            KeyDate(
                contract_id=contract_2.contract_id,
                event_type="review",
                event_date=today + timedelta(days=15),
                status="upcoming",
            ),
            KeyDate(
                contract_id=contract_2.contract_id,
                event_type="expiry",
                event_date=today + timedelta(days=365),
                status="upcoming",
            ),
        ]
        session.add_all(dates)
        session.commit()
        print("[SUCCESS] Key dates seeded.")

        print("[COMPLETE] Database seeding successfully completed!")

    except Exception as exc:
        session.rollback()
        print(f"[ERROR] Error during seeding: {exc}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
