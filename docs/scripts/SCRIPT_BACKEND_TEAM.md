SCRIPT - Backend & AI Team

Speakers: Backend team members
Duration: ~5 minutes
Tone: Technical, structured, authoritative

---

Thanks. I will walk you through the document ingestion pipeline, our grounded AI analysis engine, the RESTful API routes, and the Phase 4 audit integration and testing work.

In Phases 1 and 2, our focus was establishing the core FastAPI server foundation:
- Configuring CORS middleware for our Vite frontend dev server at port 5173.
- Implementing the live database connectivity health probe in GET /api/health which executes a live SELECT 1 query and reports healthy or degraded states.
- Developing the GET /api/system/info endpoint that reveals platform capabilities, supported formats (.pdf, .docx), and active compliance checklists.
- Establishing centralized exception handling to intercept unhandled errors and format clean JSON error payloads.


PHASE 3 - Ingestion Pipeline, Grounded AI Engine & REST APIs

In Phase 3, we built and verified the core processing and intelligence workflows:

First, Document Ingestion in ingestion.py:
We implemented the DocumentExtractor class supporting native PDF extraction via PyPDF2/PyMuPDF and Microsoft Word DOCX parsing via python-docx.
Once raw text is extracted, our ClauseChunker uses regex pattern matching against section headers, Roman numerals, and numbered clauses to chunk agreements into distinct, ordered legal sections. It normalizes whitespace and discards noise, ensuring every clause retains its logical context.

Second, Grounded AI Analysis Engine in ai_engine.py:
Our AI engine is engineered around one non-negotiable principle: Zero Hallucination via Citation Grounding.
Every AI finding must cite the exact source text from the agreement. We built:
1. LegalRuleScanner: An intelligent compliance screener detecting high-risk contract clauses:
   - Automatic Renewal Traps (detects renewal notice windows requiring > 30 days notice).
   - GDPR / Cross-Border Data Transfer (detects unapproved international personal data processing).
   - Uncapped Liability / Consequential Damages (detects clauses that omit bilateral liability caps).
   - Unilateral Indemnification and punitive termination fees.
2. CitationGrounder: For every flagged risk, it extracts and verifies that the candidate citation is a verbatim excerpt of the original contract clause text. If a citation cannot be grounded in the text, it is discarded.
3. Milestone Date Extractor: Scans clauses for term lengths and notice deadlines, extracting renewal and expiration dates for the obligation tracker.
4. Dual-Mode Architecture: When an OPENAI_API_KEY is present in the environment, the engine orchestrates OpenAI GPT-4o with structured Pydantic schemas. When operating offline or in local demo environments, it automatically falls back to our deterministic rule scanner, ensuring the system is always 100% functional.

Third, Full REST API Endpoints in main.py:
We implemented and tested the full suite of Phase 3 endpoints:
- POST /api/auth/register and POST /api/auth/login: Issues JWT bearer tokens verifying user roles.
- GET /api/contracts: Lists contracts with summaries (clause counts, risk counts, and upcoming dates) filtered by Row-Level Security.
- POST /api/contracts/upload: Accepts multipart PDF or Word files, triggers the ingestion pipeline, chunks clauses, executes grounded AI risk screening, and persists clauses, flags, and dates in a single transactional request.
- GET /api/contracts/{id}: Returns full contract details, clauses, and risk flags.
- POST /api/analyze/{id}: Re-screens existing clauses against updated compliance policies.
- GET /api/contracts/{id}/risks: Fetches all grounded risk flags with source citations.
- GET /api/obligations: Returns upcoming milestones across all accessible contracts.


PHASE 4 - Audit Logging API Integration & End-to-End Testing

In Phase 4, the backend team integrated the audit logging infrastructure into every critical API route and delivered comprehensive integration tests:

First, Audit Trigger Points in main.py:
We instrumented four key system operations with automatic audit log generation:

1. USER_LOGIN: When a user successfully authenticates through POST /api/auth/login, we call crud.create_audit_log with action USER_LOGIN and the detail field records the user email and role. This captures every authentication event for security monitoring.

2. CONTRACT_UPLOADED: After a contract file is successfully ingested through POST /api/contracts/upload, we log the event with the original filename in the detail field. This creates a chain-of-custody record showing exactly when each document entered the system and who uploaded it.

3. CONTRACT_ANALYZED: When the AI screening pipeline completes on POST /api/analyze/{id} or during the upload flow, we log the analysis results. The detail field records the number of clauses extracted and the number of risk flags detected, providing a quantitative summary of each analysis run.

4. CONTRACT_DELETED: When a contract is removed through DELETE /api/contracts/{id}, we log the deletion event before executing the cascade. The detail field records the contract ID being removed. This is critical because once a cascading delete executes, the contract data, clauses, risk flags, and dates are all permanently removed from the database. The audit log preserves the record that the deletion occurred.

Second, the Audit Logs API Endpoint:
We added GET /api/audit-logs which queries crud.get_audit_logs and returns the 100 most recent audit events as a JSON array. Each entry includes the timestamp, action type, user email, and descriptive detail. The frontend Audit Trail view consumes this endpoint directly.

Third, End-to-End Integration Testing in test_phase4_integration.py:
We created a comprehensive integration test suite that validates the complete Phase 4 workflow:
- Test 1: Register a test user and verify successful account creation.
- Test 2: Login with the registered credentials and verify JWT token issuance. Confirm that a USER_LOGIN audit event was recorded.
- Test 3: Upload a contract file and verify it passes through ingestion and analysis. Confirm that CONTRACT_UPLOADED and CONTRACT_ANALYZED audit events were created with correct detail fields.
- Test 4: Query the audit logs endpoint and verify that all events are returned in reverse chronological order with correct action types.
- Test 5: Delete the uploaded contract and verify cascading removal of clauses, risks, and dates. Confirm that a CONTRACT_DELETED audit event was recorded.
- Test 6: Final audit log verification ensuring all 4 action types appear in the complete trail.

All 6 tests passed with 100% success rate. The test uses an isolated SQLite database through FastAPI dependency overrides, ensuring it does not interfere with production PostgreSQL data.

All backend and API code is committed to GitHub. Handing over to our frontend team.


---

TECHNICAL QUESTIONS YOU MIGHT BE ASKED

Question: How do you mathematically guarantee that your AI does not hallucinate?
Answer: We enforce grounding at both the software and data layer. In ai_engine.py, CitationGrounder.validate_and_ground runs an exact substring match between the candidate citation and the cleaned clause text. If the citation is not present in the contract, it is rejected. In models.py, the risk_flags table requires a source_citation column. If an LLM returns a hallucinated rule without an exact quotation, the backend will not persist the flag.

Question: What happens if an uploaded PDF is scanned rather than native text?
Answer: DocumentExtractor attempts digital text extraction first. In our production architecture, if extracted text length is below a minimum threshold, it initiates an optical character recognition (OCR) fallback pipeline using Tesseract before handing the document over to the clause chunker.

Question: Can the audit logs be tampered with?
Answer: No. The audit log system is append-only at the application level. There are no update or delete endpoints for audit records. The created_at timestamp is generated server-side by the database, not by the client request. In a production deployment, we would further protect audit integrity with database-level write-only permissions for the application service account and separate read-only access for reporting queries.

Question: How do the integration tests avoid polluting the production database?
Answer: In test_phase4_integration.py, we use FastAPI dependency overrides to replace the production get_db dependency with a test-specific SQLite database. This means all test operations (user creation, contract uploads, audit logging) happen in an isolated test_phase4_integration.db file. The test suite includes a cleanup routine in the finally block that removes this temporary database after all assertions complete.
