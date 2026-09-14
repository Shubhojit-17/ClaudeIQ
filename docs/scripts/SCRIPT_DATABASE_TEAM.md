SCRIPT - Database & Infrastructure Team (Your Script)

Speaker: You (Team Lead / Infra & DB Owner)
Duration: 4-5 minutes
Tone: Confident, structured, project-lead perspective

---

OPENING - Project Introduction & Problem Context

Good [morning/afternoon]. Thank you for taking the time to meet with us today. I'll start with a quick overview of our project, and then our backend and frontend teammates will walk you through their specific areas.

Our project is ClauseIQ - an AI-powered contract intelligence and compliance assistant. The business problem we are solving is severe: enterprise contract review is overwhelmingly manual, taking legal teams between 4 to 6 hours for a single agreement. Missing auto-renewal deadlines or accepting non-standard liability clauses costs organizations approximately 9% of their annual revenue, and teams lack a centralized dashboard to track obligations.

ClauseIQ solves this by ingesting PDF and Word contracts, extracting text via OCR, segmenting documents into logical clauses, and analyzing them with an LLM paired with Retrieval-Augmented Generation (RAG). A foundational requirement of our system is Citation Grounding: every risk flagged by the AI must cite the verbatim source text from the contract. This eliminates hallucinations and provides complete auditability.


PHASE 1 - Architecture & Design Decisions

In Phase 1, we finalized our four-layer architecture:
1. Interface Layer: A responsive React 18 dashboard styled with Tailwind CSS.
2. API Layer: FastAPI handling REST endpoints, auth, and validation.
3. Processing and Intelligence Layer: Document ingestion via PyMuPDF/OCR and RAG screening via LLM.
4. Data Layer: PostgreSQL 15 with the pgvector extension for unified relational and vector storage.

A critical architectural decision we made was using pgvector inside PostgreSQL rather than a separate vector database like Pinecone or Milvus. This keeps our relational data, role permissions, and vector embeddings in a single ACID-compliant database, drastically reducing infrastructure operational complexity and eliminating sync failures.


PHASE 2 - Infrastructure, Schema & Foundation Implementation

In Phase 2, we completed the full database and infrastructure foundation:

First, Docker and Environment Setup:
We configured docker-compose.yml to launch PostgreSQL 15 with pgvector on port 5432, with automated health checks and persistent volume storage. We also created a comprehensive .env.example template and configured git ignore rules across all stacks.

Second, SQLAlchemy ORM Schema Design (6 Core Tables):
1. users: Stores system users with RBAC roles (admin, reviewer, viewer), hashed passwords for secure authentication, and active status flags.
2. contracts: Tracks uploaded contracts with S3 storage paths, timestamps, and pipeline processing status (uploaded, processing, analyzed, error).
3. contract_access: Implements Row-Level Security (RLS). Contracts are queried through this access control table so reviewers and viewers only see documents they have explicit permissions to view.
4. extracted_clauses: Holds individual clauses chunked from contracts, ordered by clause_index, and prepared for 1536-dimensional vector embeddings.
5. risk_flags: Records AI-detected compliance risks. Critically, this table includes a dedicated source_citation column that stores the exact excerpt from the contract clause that triggered the flag.
6. key_dates: Extracts critical milestones (renewals, expiries, terminations, reviews) with status tracking (upcoming, overdue, completed).

All primary keys use UUIDs to prevent enumeration attacks and support distributed ID generation. We configured cascading delete constraints so deleting a contract cleanly removes its clauses, risk flags, and key dates.

Third, Platform-Independent GUID Type:
To ensure our code can run in both production PostgreSQL and isolated test environments, I engineered a custom GUID TypeDecorator in models.py. When connected to PostgreSQL, it uses native postgresql.UUID; when running unit tests or local development against SQLite, it transparently handles 36-character strings. This means our test suite runs anywhere without external dependencies.

Fourth, Pydantic v2 Schema Layer:
In schemas.py, we created complete Pydantic models for request validation and response serialization across all six entities, plus health check probes and system capability metadata.

Fifth, Database Seeding & Verification:
We created seed.py which populates 3 test users across distinct roles, 2 realistic contracts (a Cloud Services Agreement and a Mutual NDA), 3 extracted clauses, grounded risk flags citing exact contract text, and 4 milestone dates.
We also built verify_db.py, which runs automated schema verification, testing table creation, CRUD operations, relationships, and cascading deletes. It passed with 100% success.

All database work has been committed to our GitHub repository under feat(database).

Now I'll pass it over to our backend team to discuss the API layer.


---

KEY TALKING POINTS & QUESTIONS YOU MIGHT BE ASKED

How do you prevent AI hallucinations?
Explain our Grounded AI architecture: The risk_flags table contains a dedicated source_citation column. In our prompt pipeline, the LLM is constrained to only flag risks if it can quote the verbatim excerpt from the extracted clause text. Our backend validates that the citation exists in the original clause before writing to the database. No citation means no risk flag.

Why pgvector instead of a standalone vector database?
A standalone vector DB requires running two separate database clusters, writing two-phase commits to keep them in sync, and reconciling permissions separately. With pgvector in PostgreSQL, vector similarity queries can be joined directly with our contract_access Row-Level Security table in a single SQL query.

What is your Row-Level Security strategy?
We use the contract_access table to map user IDs to contract IDs with permissions (read, write, admin). Every API query that lists or fetches contracts joins against contract_access using the authenticated user's ID, ensuring multi-tenant data isolation.

Phase 3 Preview (Wrap-up):
In Phase 3, we will implement the document ingestion pipeline with PyMuPDF and OCR, wire up the AI analysis engine with RAG screening, and implement JWT authentication routes.
