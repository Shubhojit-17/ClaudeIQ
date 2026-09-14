# ClauseIQ — Mentor Meeting Scripts
## Deloitte Capstone Progress Review | Phases 1, 2 & 3 Completed

---

## Meeting Context

- **Project:** ClauseIQ — AI Contract Intelligence & Compliance Assistant
- **Mentor:** Deloitte Capstone Mentor
- **Team Size:** 5 members across 3 tracks (Database & Infra, Backend & AI, Frontend & UI)
- **Current Status:** Phases 1, 2, and 3 fully completed, tested, and committed to git
- **Repository:** [github.com/Shubhojit-17/ClaudeIQ](https://github.com/Shubhojit-17/ClaudeIQ)

### Phase Roadmap Overview

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Research, Architecture Design & Specification | Completed |
| **Phase 2** | Foundation Scaffolding, DB Schema, API Probes & UI Layout | Completed |
| **Phase 3** | Core Features: Document Ingestion, Grounded AI Engine, Auth & UI | Completed |
| **Phase 4** | Integration, End-to-End Testing, Audit Logging & Polish | Upcoming |
| **Phase 5** | Production Deployment, Security Hardening & Final Presentation | Upcoming |

---

## Individual Team Presentation Scripts

Each track has a dedicated, plain-text script detailing the technical work done, architecture decisions, and answers to common mentor questions:

1. **Database & Infrastructure Team (Your Script - Lead)**:
   - File: [scripts/SCRIPT_DATABASE_TEAM.md](scripts/SCRIPT_DATABASE_TEAM.md)
   - Duration: ~5 minutes
   - Topics: Problem context, 4-layer architecture, PostgreSQL + pgvector rationale, 6 ORM tables, platform-independent GUID type decorator, Pydantic schemas, PBKDF2 password hashing, JWT auth, and Row-Level Security CRUD operations.

2. **Backend & AI Team**:
   - File: [scripts/SCRIPT_BACKEND_TEAM.md](scripts/SCRIPT_BACKEND_TEAM.md)
   - Duration: ~4 minutes
   - Topics: Document extraction via PyPDF2 / python-docx, semantic clause chunking, LegalRuleScanner compliance rules (GDPR, Auto-Renewal, Liability caps), CitationGrounder (verbatim substring validation), dual-mode AI engine (OpenAI + deterministic fallback), RESTful APIs, and test verification with 100% pass rate.

3. **Frontend & UI Team**:
   - File: [scripts/SCRIPT_FRONTEND_TEAM.md](scripts/SCRIPT_FRONTEND_TEAM.md)
   - Duration: ~3-4 minutes
   - Topics: React 18 + Vite 8 dashboard, real file upload with drag-and-drop, interactive Clause Explorer modal showcasing exact grounded citations, active user persona switcher (demonstrating RLS), live system status widget, and clean 1.74s production build.

---

## Suggested Meeting Flow

1. **0:00 - 0:05 (5 min)**: Team Lead — Project intro, core business pain points, 4-layer architecture, database schema, PBKDF2 auth, and Row-Level Security.
2. **0:05 - 0:09 (4 min)**: Backend Team — Ingestion pipeline, semantic clause chunking, grounded AI compliance screener, CitationGrounder validation, and REST APIs.
3. **0:09 - 0:13 (4 min)**: Frontend Team — Interactive demonstration: uploading an agreement, opening the Clause Explorer modal to show highlighted source citations, and switching user personas.
4. **0:13 - 0:15 (2 min)**: Team Lead — Wrap-up, Phase 4 preview (end-to-end integration tests, query optimization, audit trail logging), and open questions.
5. **0:15+**: Mentor Q&A and Feedback.
