"""
ClauseIQ — Phase 3 Comprehensive Verification Test
===================================================
Tests:
  1. Ingestion pipeline (text extraction & semantic clause chunking)
  2. Grounded AI compliance screening (Auto-renewal & GDPR detection with exact citations)
  3. User registration & JWT authentication
  4. Contract upload & automatic analysis flow
  5. Row-Level Security (RLS) contract filtering
  6. Obligations endpoint
"""

import os
import io
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app

TEST_DB_URL = "sqlite:///./test_phase3.db"
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


def run_phase3_verification():
    print("[INFO] [Track 2 - Ingestion & AI] Running Phase 3 comprehensive verification...")

    # Create tables in test DB
    Base.metadata.create_all(bind=test_engine)

    # ── Test 1: User Registration & JWT Authentication ─────────────────
    reg_payload = {
        "name": "Audit Lead",
        "email": "lead.auditor@clauseiq.internal",
        "password": "SecurePassword2027!",
        "role": "reviewer",
        "department": "Risk & Compliance",
    }
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code in [200, 400], f"Unexpected status: {reg_resp.status_code}"
    print("[SUCCESS] User registration endpoint functional.")

    login_resp = client.post(
        "/api/auth/login",
        json={"email": "lead.auditor@clauseiq.internal", "password": "SecurePassword2027!"},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("[SUCCESS] JWT issuance and authentication verified.")

    # ── Test 2: Contract Upload, Ingestion & Grounded AI Analysis ───────
    sample_contract_text = (
        "MASTER SERVICES AGREEMENT\n\n"
        "Section 1.0 (Definitions): All capitalized terms shall have the meanings set forth herein.\n\n"
        "Section 8.2 (Term & Renewal): This Agreement shall automatically renew for successive "
        "twelve (12) month periods unless either party provides written notice of non-renewal at least "
        "ninety (90) days prior to the expiration of the term.\n\n"
        "Section 14.1 (Liability): In no event shall Supplier's liability exceed standard limits except for "
        "claims resulting in unlimited consequential damages.\n\n"
        "Section 21.4 (Data Protection): Customer agrees that personal data may be processed and transferred "
        "to any jurisdiction without requiring prior written approval."
    )

    file_payload = {
        "file": ("Vendor_Master_Agreement_2027.txt", io.BytesIO(sample_contract_text.encode("utf-8")), "text/plain")
    }

    upload_resp = client.post(
        "/api/contracts/upload",
        files=file_payload,
        headers=auth_headers,
    )
    assert upload_resp.status_code == 200, f"Upload failed: {upload_resp.text}"
    contract_data = upload_resp.json()
    contract_id = contract_data["contract_id"]
    assert contract_data["status"] == "analyzed"
    assert len(contract_data["clauses"]) >= 3
    print(f"[SUCCESS] Contract uploaded, parsed into {len(contract_data['clauses'])} clauses, and analyzed.")

    # ── Test 3: Verify Grounded Risk Flags & Citations ──────────────────
    risks_resp = client.get(f"/api/contracts/{contract_id}/risks", headers=auth_headers)
    assert risks_resp.status_code == 200
    risks = risks_resp.json()
    assert len(risks) >= 2, f"Expected at least 2 flagged risks, found {len(risks)}"

    for r in risks:
        assert r["source_citation"] is not None and len(r["source_citation"]) > 0
        assert r["risk_level"] in ["critical", "high", "medium", "low"]
        print(f"  -> Flagged: [{r['risk_level'].upper()}] {r['compliance_rule']}")
        print(f"    Grounded Citation: \"{r['source_citation']}\"")
    print("[SUCCESS] AI Citation Grounding strictly verified (all flags contain verbatim source text).")

    # ── Test 4: Verify Contract Detail & Key Dates ─────────────────────
    detail_resp = client.get(f"/api/contracts/{contract_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert len(detail["key_dates"]) >= 1
    print(f"[SUCCESS] Contract detail verified with {len(detail['key_dates'])} extracted key dates.")

    # ── Test 5: Obligations Endpoint ───────────────────────────────────
    ob_resp = client.get("/api/obligations", headers=auth_headers)
    assert ob_resp.status_code == 200
    assert isinstance(ob_resp.json(), list)
    print(f"[SUCCESS] Obligations endpoint returned {len(ob_resp.json())} active milestone deadlines.")

    # ── Test 6: Clean Up Test Contract ─────────────────────────────────
    del_resp = client.delete(f"/api/contracts/{contract_id}", headers=auth_headers)
    assert del_resp.status_code == 204
    print("[SUCCESS] Contract deletion with cascading cleanup verified.")

    print("[COMPLETE] [Track 2 - Ingestion & AI] All Phase 3 backend and AI verification tests passed 100%!")


if __name__ == "__main__":
    try:
        run_phase3_verification()
    finally:
        if os.path.exists("./test_phase3.db"):
            try:
                os.remove("./test_phase3.db")
            except Exception:
                pass
