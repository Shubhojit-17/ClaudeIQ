"""
ClauseIQ — Backend API Verification Tests
==========================================
Tests:
  1. GET /api/health returns 200 with service name, version, and database connectivity probe
  2. GET /api/system/info returns 200 with platform capabilities and compliance checklists
  3. CORS middleware returns appropriate allow-origin headers for localhost:5173
  4. 404 handler for invalid routes
"""

import sys
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def run_api_verification():
    print("[INFO] [Track 2 - Backend] Running API foundation tests...")

    # Test 1: Health Check Endpoint
    response = client.get("/api/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["service"] == "ClauseIQ API"
    assert data["version"] == "0.1.0"
    assert "status" in data
    assert "database" in data
    assert "dialect" in data["database"]
    print(f"[SUCCESS] Health check responded with status='{data['status']}' and database status='{data['database']['status']}'")

    # Test 2: System Info Endpoint
    info_resp = client.get("/api/system/info")
    assert info_resp.status_code == 200
    info_data = info_resp.json()
    assert len(info_data["features"]) >= 4
    assert ".pdf" in info_data["supported_file_types"]
    assert any("GDPR" in f for f in info_data["compliance_frameworks"])
    print(f"[SUCCESS] System info endpoint verified: {len(info_data['features'])} core features, {len(info_data['compliance_frameworks'])} compliance frameworks.")

    # Test 3: CORS Headers
    cors_resp = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert cors_resp.status_code == 200
    assert cors_resp.headers.get("access-control-allow-origin") == "http://localhost:5173"
    print("[SUCCESS] CORS configuration verified for frontend Vite dev server (http://localhost:5173).")

    # Test 4: 404 Route handling
    not_found_resp = client.get("/api/nonexistent")
    assert not_found_resp.status_code == 404
    print("[SUCCESS] Not-found routes handled gracefully.")

    print("[COMPLETE] [Track 2 - Backend] All API foundation tests passed with 100% success!")


if __name__ == "__main__":
    run_api_verification()
