SCRIPT - Backend & AI Team

Speakers: Backend team members
Duration: 3-4 minutes
Tone: Technical, structured, authoritative

---

Thanks. I will walk through the API architecture, our backend foundation, and how we have prepared for the AI intelligence pipeline.

In Phase 1, we designed the backend around FastAPI. We selected FastAPI because it is native asynchronous Python, delivers near-C performance, generates interactive OpenAPI documentation automatically, and uses Pydantic v2 for strict type validation. This validation is critical for our system because we handle unstructured document uploads and complex structured JSON outputs from LLMs.

In Phase 2, we completed the core API server foundation in main.py:

First, Live Database Connectivity Health Probe:
Many starter templates have a health check that just returns a static string. In our system, the GET /api/health endpoint executes a real database connectivity probe using check_db_connection() in database.py. It executes a test query (SELECT 1), measures connectivity, detects the active SQL dialect, and returns:
- Status 'healthy' when the database is actively connected.
- Status 'degraded' when the API server is up but the database is currently offline or reconnecting.
This gives both the frontend and automated monitoring tools real-time visibility into infrastructure health.

Second, System Capability Metadata Endpoint:
We added a GET /api/system/info endpoint that returns platform metadata, supported file types (.pdf and .docx), and active compliance checklists (such as GDPR cross-border transfer rules, auto-renewal traps, and uncapped liability limits). This allows the frontend to dynamically discover system capabilities.

Third, Centralized Exception Handling & CORS:
We configured CORS middleware to allow cross-origin requests from our Vite frontend dev server at localhost port 5173. We also implemented a global exception handler that intercepts unhandled server exceptions and returns structured JSON error responses containing the HTTP status code, error type, request path, and UTC timestamp, preventing uncaught tracebacks from leaking to clients.

Fourth, Automated API Test Suite:
We created an automated test suite in test_api.py using FastAPI TestClient and HTTPX. The suite tests:
1. The health check endpoint with database probe validation.
2. The system info endpoint and compliance rules metadata.
3. CORS headers on preflight OPTIONS requests.
4. Graceful 404 handling for undefined routes.
All tests run and pass with 100% success.

Fifth, Preparation for AI & Ingestion Modules:
We architected the interfaces for the two core Phase 3 modules:
- ingestion.py: Outlines the document extraction flow using PyMuPDF for digital PDFs, Tesseract OCR for scanned agreements, and semantic clause chunking to preserve legal section hierarchy.
- ai_engine.py: Outlines our four-stage AI pipeline: EmbeddingService (1536-dim vectors), RAGRetriever (vector similarity lookup), RiskScreener (LLM compliance analysis), and CitationGrounder (validates that every risk flag quotes the exact source text).

All backend changes are committed to GitHub under feat(backend).

That concludes our backend update - handing over to the frontend team.


---

TECHNICAL QUESTIONS YOU MIGHT BE ASKED

How does your health check handle a database outage?
Instead of throwing an unhandled 500 error, check_db_connection catches connection exceptions safely and reports connected=false with dialect info. The health endpoint returns HTTP 200 with status='degraded' and database status='offline', allowing downstream services to gracefully handle reconnection.

How do you validate structured AI outputs from the LLM?
We will use Pydantic schemas (defined in schemas.py) such as RiskFlagCreate. When the LLM outputs JSON, Pydantic validates that all required fields are present, that risk_level matches our enum (critical, high, medium, low), and that the source_citation is non-empty. If validation fails, our CitationGrounder rejects the output and triggers a retry.
