SCRIPT - Backend & AI Team

Speakers: Backend team members
Duration: ~4 minutes
Tone: Technical, structured, authoritative

---

Thanks. I will walk you through the document ingestion pipeline, our grounded AI analysis engine, and the RESTful API routes we developed in Phase 3.

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

Fourth, Automated Verification:
We created test_phase3.py which tests the entire lifecycle: registration, JWT login, contract upload, 4-clause semantic splitting, grounded risk detection, citation verification, and cascading deletion. All tests passed with 100% success.

All backend and AI code is committed to GitHub. Handing over to our frontend team.


---

TECHNICAL QUESTIONS YOU MIGHT BE ASKED

Question: How do you mathematically guarantee that your AI does not hallucinate?
Answer: We enforce grounding at both the software and data layer. In ai_engine.py, CitationGrounder.validate_and_ground runs an exact substring match between the candidate citation and the cleaned clause text. If the citation is not present in the contract, it is rejected. In models.py, the risk_flags table requires a source_citation column. If an LLM returns a hallucinated rule without an exact quotation, the backend will not persist the flag.

Question: What happens if an uploaded PDF is scanned rather than native text?
Answer: DocumentExtractor attempts digital text extraction first. In our production architecture, if extracted text length is below a minimum threshold, it initiates an optical character recognition (OCR) fallback pipeline using Tesseract before handing the document over to the clause chunker.
