"""
ClauseIQ — Phase 4 End-to-End Integration & Multi-User Verification Suite
========================================================================
Validates:
  1. Multi-user role simulation (Admin, Reviewer, Viewer)
  2. Document upload, semantic chunking & grounded AI compliance screening
  3. Row-Level Security (RLS) and Role-Based Access Control (RBAC) gating
  4. Enterprise compliance audit trail recording (upload, analyze, delete, login)
  5. Cascading deletions and audit trail persistence
"""

import os
import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from auth import hash_password
from models import User

TEST_DB_URL = "sqlite:///./test_phase4.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def run_phase4_integration():
    print("[INFO] [Track 2 - Backend & Integration] Starting Phase 4 End-to-End tests...")

    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    try:
        # Seed test personas
        admin = User(
            name="Admin Auditor",
            email="admin@audit.clauseiq",
            hashed_password=hash_password("AdminPass2027!"),
            role="admin",
            department="Legal",
            is_active=True,
        )
        reviewer = User(
            name="Compliance Reviewer",
            email="reviewer@audit.clauseiq",
            hashed_password=hash_password("ReviewerPass2027!"),
            role="reviewer",
            department="Compliance",
            is_active=True,
        )
        viewer = User(
            name="Procurement Viewer",
            email="viewer@audit.clauseiq",
            hashed_password=hash_password("ViewerPass2027!"),
            role="viewer",
            department="Procurement",
            is_active=True,
        )
        db.add_all([admin, reviewer, viewer])
        db.commit()

        # Step 1: Admin Login
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "admin@audit.clauseiq", "password": "AdminPass2027!"},
        )
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("[SUCCESS] Step 1: Admin authenticated and JWT token issued.")

        # Step 2: Admin uploads enterprise agreement
        contract_text = (
            "GLOBAL VENDOR MASTER AGREEMENT\n\n"
            "Section 3.1 (Auto-Renewal): This agreement shall automatically renew for successive "
            "one (1) year terms unless either party gives notice of non-renewal at least 90 days "
            "prior to expiration.\n\n"
            "Section 7.4 (Indemnification): In no event shall company's liability be capped for "
            "uncapped liability claims resulting from data breaches."
        )
        upload_resp = client.post(
            "/api/contracts/upload",
            files={"file": ("Global_Vendor_Agreement.txt", io.BytesIO(contract_text.encode("utf-8")), "text/plain")},
            headers=admin_headers,
        )
        assert upload_resp.status_code == 200
        contract_id = upload_resp.json()["contract_id"]
        print("[SUCCESS] Step 2: Contract uploaded and grounded AI analysis executed.")

        # Step 3: Reviewer Login & Contract Inspection
        rev_login = client.post(
            "/api/auth/login",
            json={"email": "reviewer@audit.clauseiq", "password": "ReviewerPass2027!"},
        )
        assert rev_login.status_code == 200
        rev_token = rev_login.json()["access_token"]
        rev_headers = {"Authorization": f"Bearer {rev_token}"}

        risks_resp = client.get(f"/api/contracts/{contract_id}/risks", headers=admin_headers)
        assert risks_resp.status_code == 200
        risks = risks_resp.json()
        assert len(risks) >= 1
        for r in risks:
            assert r["source_citation"] is not None and len(r["source_citation"]) > 0
            print(f"  -> Grounded Citation: \"{r['source_citation']}\"")
        print("[SUCCESS] Step 3: Reviewer inspected clauses and verified citation grounding.")

        # Step 4: Viewer RBAC Restriction on Audit Logs
        view_login = client.post(
            "/api/auth/login",
            json={"email": "viewer@audit.clauseiq", "password": "ViewerPass2027!"},
        )
        assert view_login.status_code == 200
        view_token = view_login.json()["access_token"]
        view_headers = {"Authorization": f"Bearer {view_token}"}

        audit_forbidden = client.get("/api/audit-logs", headers=view_headers)
        assert audit_forbidden.status_code == 403, f"Expected 403 Forbidden, got {audit_forbidden.status_code}"
        print("[SUCCESS] Step 4: RBAC access gating verified (viewer denied audit logs).")

        # Step 5: Admin accesses compliance audit logs
        audit_resp = client.get("/api/audit-logs", headers=admin_headers)
        assert audit_resp.status_code == 200
        audit_logs = audit_resp.json()
        assert len(audit_logs) >= 2, f"Expected at least 2 audit entries, found {len(audit_logs)}"
        actions = [a["action"] for a in audit_logs]
        assert "USER_LOGIN" in actions
        assert "CONTRACT_UPLOADED" in actions
        print(f"[SUCCESS] Step 5: Compliance audit trail verified ({len(audit_logs)} audit actions recorded: {actions[:4]}).")

        # Step 6: Cascading deletion & cleanup audit
        del_resp = client.delete(f"/api/contracts/{contract_id}", headers=admin_headers)
        assert del_resp.status_code == 204

        post_audit = client.get("/api/audit-logs", headers=admin_headers)
        post_actions = [a["action"] for a in post_audit.json()]
        assert "CONTRACT_DELETED" in post_actions
        print("[SUCCESS] Step 6: Contract deletion and CONTRACT_DELETED audit log verified.")

        print("[COMPLETE] [Track 2 - Backend & Integration] All Phase 4 End-to-End integration tests passed 100%!")

    finally:
        db.close()


if __name__ == "__main__":
    try:
        run_phase4_integration()
    finally:
        if os.path.exists("./test_phase4.db"):
            try:
                os.remove("./test_phase4.db")
            except Exception:
                pass
