SCRIPT - Database & Infrastructure Team (Your Script)

Speaker: You (Team Lead / Infra & DB Owner)
Duration: ~5 minutes
Tone: Confident, structured, project-lead perspective

---

OPENING - Project Introduction & Business Problem

Good [morning/afternoon]. Thank you for joining us today for our progress review. I will open with an overview of our project and how we have structured our architecture, and then our backend and frontend engineers will dive into their tracks.

Our project is ClauseIQ - an AI-powered contract intelligence and compliance assistant developed for enterprise legal and procurement operations. 

The core pain point we are addressing is critical: enterprise contract review is overwhelmingly manual and slow, taking between 4 to 6 hours for a single agreement. Missing auto-renewal deadlines or failing to spot non-standard liability clauses costs companies approximately 9% of their annual revenue, while procurement and compliance teams have zero centralized visibility across their portfolio obligations.

ClauseIQ solves this by ingesting PDF and Word contracts, extracting text through OCR, segmenting the text into logical legal clauses, and running them through an AI compliance screener. Most importantly, we have implemented strict Citation Grounding: every risk flagged by the AI must cite the exact verbatim text from the contract clause. This eliminates AI hallucinations and gives legal counsel complete auditability.


PHASE 1 & 2 - Foundations & Database Schema

In Phases 1 and 2, we finalized our four-layer architecture (Interface, API, Processing/Intelligence, and Data Layer) and deployed the core PostgreSQL and schema foundations:
1. Dockerized PostgreSQL 15 with the pgvector extension on port 5432 with persistent volumes and health checks.
2. We designed 6 core relational tables using SQLAlchemy ORM:
   - users: With RBAC roles (admin, reviewer, viewer) and secure password hashes.
   - contracts: Storing S3 document paths and pipeline status (uploaded, processing, analyzed, error).
   - contract_access: Implementing Row-Level Security (RLS) to ensure users only query agreements they have explicit authorization to view.
   - extracted_clauses: Storing segmented clauses with indices, ready for 1536-dimensional vector embeddings.
   - risk_flags: Recording compliance risks with a dedicated source_citation column that stores the exact contract text quoted.
   - key_dates: Extracting renewal, expiry, and review deadlines with status tracking.
3. Platform-Independent GUID Handling: We built a custom GUID TypeDecorator in models.py that automatically uses native PostgreSQL UUIDs in production while mapping transparently to CHAR(36) in SQLite during local and unit testing.
4. Database Seeding & Schema Verification: We wrote seed.py to populate demo users, contracts, clauses, and citations, and verify_db.py to validate table creation, cascading deletes, and queries with 100% test success.


PHASE 3 - Authentication & Row-Level Security CRUD Operations

In Phase 3, my team completed the core security and data access layer:

First, Authentication & Password Hashing in auth.py:
We implemented cryptographic password hashing using PBKDF2-HMAC-SHA256 with 100,000 iterations and unique random salts, along with legacy support for seeded test accounts. We built JWT token generation and verification routines using PyJWT, issuing 24-hour access tokens that encode the user's ID, email, and role. We created the get_current_user dependency for FastAPI, which extracts and validates the bearer token on incoming requests.

Second, Row-Level Security CRUD Queries in crud.py:
We engineered database queries that strictly enforce multi-tenant Row-Level Security:
- When an admin queries contracts, they see the full enterprise portfolio.
- When a reviewer or viewer queries contracts, crud.get_contracts_for_user joins the contracts table with contract_access, filtering exclusively by the authenticated user's ID. A user in procurement never sees unauthorized executive agreements.
- We also built transactional functions for bulk clause creation, grounded risk flag persistence with mandatory source_citation validation, and cascading contract deletion.

All database and security work has been committed to our GitHub repository.

Now I will pass the floor to our backend team to explain our document ingestion and AI intelligence pipeline.


---

TECHNICAL QUESTIONS YOU MIGHT BE ASKED

Question: How do you enforce multi-tenant isolation and data privacy?
Answer: Through our contract_access table and JWT dependency. Every contract query inspects the authenticated user ID from the verified JWT token and applies an inner or outer join against contract_access. If a user does not have an explicit access grant or is not the document uploader, the database query returns empty, guaranteeing that unauthorized users cannot view sensitive agreements.

Question: Why did you choose PBKDF2-HMAC-SHA256?
Answer: PBKDF2 with 100,000 iterations of SHA-256 and salt is a NIST-approved standard that provides high resistance to rainbow-table and GPU brute-force attacks while being completely reliable across Windows and Linux environments without external C-compiler dependencies.

Question: What is next for the database track in Phase 4?
Answer: In Phase 4, we will focus on query optimization, index tuning on clause vector lookups, and audit logging for legal compliance trails.
