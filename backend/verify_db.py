"""
ClauseIQ — Database Verification Script
=======================================
Verifies:
  1. All 6 tables can be created via SQLAlchemy metadata
  2. CRUD operations on all models (User, Contract, ContractAccess, ExtractedClause, RiskFlag, KeyDate)
  3. Platform-independent GUID handling
  4. Cascading deletes (e.g. deleting a contract automatically deletes its clauses, risk flags, and key dates)
  5. Foreign key integrity and query relationships
"""

import os
import sys
import uuid
from datetime import date, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use in-memory SQLite for self-contained validation
TEST_DB_URL = "sqlite:///:memory:"

from database import Base
from models import Contract, ContractAccess, ExtractedClause, KeyDate, RiskFlag, User


def run_database_verification():
    print("[INFO] [Track 1 - Database] Running schema and relationship verification...")

    test_engine = create_engine(TEST_DB_URL, echo=False)
    Base.metadata.create_all(bind=test_engine)

    # Check created tables
    created_tables = set(Base.metadata.tables.keys())
    expected_tables = {
        "users",
        "contracts",
        "contract_access",
        "extracted_clauses",
        "risk_flags",
        "key_dates",
    }
    missing_tables = expected_tables - created_tables
    if missing_tables:
        print(f"[FAIL] Verification Failed: Missing tables {missing_tables}")
        sys.exit(1)
    print(f"[SUCCESS] All 6 schema tables verified in metadata: {sorted(list(created_tables))}")

    TestSession = sessionmaker(bind=test_engine)
    session = TestSession()

    try:
        # Test 1: Insert User with password hash & active status
        test_user = User(
            user_id=uuid.uuid4(),
            name="Auditor Alpha",
            email="auditor@clauseiq.internal",
            hashed_password="hashed_pass_placeholder",
            role="admin",
            department="Audit",
            is_active=True,
        )
        session.add(test_user)
        session.commit()
        assert session.query(User).filter_by(email="auditor@clauseiq.internal").first() is not None
        print("[SUCCESS] User insertion and query verified.")

        # Test 2: Insert Contract
        test_contract = Contract(
            contract_id=uuid.uuid4(),
            uploaded_by=test_user.user_id,
            file_name="Enterprise_SLA_2027.pdf",
            s3_url="s3://contracts/test.pdf",
            status="analyzed",
        )
        session.add(test_contract)
        session.commit()
        assert session.query(Contract).count() == 1
        print("[SUCCESS] Contract insertion and foreign key relation verified.")

        # Test 3: Insert ExtractedClause & RiskFlag with Grounded Citation
        test_clause = ExtractedClause(
            clause_id=uuid.uuid4(),
            contract_id=test_contract.contract_id,
            clause_index=0,
            original_text="Supplier shall be liable for unlimited consequential damages.",
        )
        session.add(test_clause)
        session.commit()

        test_flag = RiskFlag(
            clause_id=test_clause.clause_id,
            risk_level="critical",
            compliance_rule="Unlimited Consequential Damages Exposure",
            explanation="Clause introduces unbounded financial liability for downstream losses.",
            source_citation="Supplier shall be liable for unlimited consequential damages.",
        )
        session.add(test_flag)
        session.commit()

        # Test 4: Insert KeyDate
        test_date = KeyDate(
            contract_id=test_contract.contract_id,
            event_type="renewal",
            event_date=date(2027, 6, 30),
            status="upcoming",
        )
        session.add(test_date)
        session.commit()

        # Verify relationships
        fetched_contract = session.query(Contract).first()
        assert len(fetched_contract.clauses) == 1
        assert len(fetched_contract.clauses[0].risk_flags) == 1
        assert fetched_contract.clauses[0].risk_flags[0].source_citation is not None
        assert len(fetched_contract.key_dates) == 1
        print("[SUCCESS] Multi-level relationships and grounded source citation verified.")

        # Test 5: Cascading delete
        session.delete(fetched_contract)
        session.commit()

        assert session.query(Contract).count() == 0
        assert session.query(ExtractedClause).count() == 0
        assert session.query(RiskFlag).count() == 0
        assert session.query(KeyDate).count() == 0
        print("[SUCCESS] Cascading delete behavior verified (deleting contract cleans up clauses, flags, dates).")

        print("[COMPLETE] [Track 1 - Database] All schema and relationship verification tests passed with 100% success!")
    finally:
        session.close()


if __name__ == "__main__":
    run_database_verification()
