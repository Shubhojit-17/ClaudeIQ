# ClauseIQ — Mentor Meeting Scripts
## Deloitte Capstone Progress Review | Phases 1 & 2 Completed

---

## Meeting Context

- **Project:** ClauseIQ — AI Contract Intelligence & Compliance Assistant
- **Mentor:** Deloitte Capstone Mentor
- **Team Size:** 5 members across 3 tracks (Database & Infra, Backend & AI, Frontend & UI)
- **Status:** Phases 1 & 2 completed, verified, and committed
- **Repository:** [github.com/Shubhojit-17/ClaudeIQ](https://github.com/Shubhojit-17/ClaudeIQ)

### Phase Roadmap Overview

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Research, Architecture Design & Specification | Completed |
| **Phase 2** | Foundation Scaffolding, DB Schema, API Probes & UI Layout | Completed |
| **Phase 3** | Core Feature Development (OCR Ingestion, AI Engine & Auth) | Upcoming |
| **Phase 4** | Integration, End-to-End Testing & Polish | Upcoming |
| **Phase 5** | Deployment, Security Hardening & Final Presentation | Upcoming |

---

## Individual Team Presentation Scripts

Each track has its own plain-text script detailing the technical work done, architecture decisions, and answers to common mentor questions:

1. **Database & Infrastructure Team (Your Script - Lead)**:
   - File: [scripts/SCRIPT_DATABASE_TEAM.md](scripts/SCRIPT_DATABASE_TEAM.md)
   - Duration: ~4-5 minutes
   - Topics: Problem context, 4-layer architecture, PostgreSQL + pgvector design decision, 6 ORM tables, platform-independent GUID type decorator, Pydantic v2 schemas, database seeding (`seed.py`), and automated schema verification (`verify_db.py`).

2. **Backend & AI Team**:
   - File: [scripts/SCRIPT_BACKEND_TEAM.md](scripts/SCRIPT_BACKEND_TEAM.md)
   - Duration: ~3-4 minutes
   - Topics: FastAPI setup, live database connectivity health probe (`/api/health`), system metadata discovery (`/api/system/info`), global exception handling, CORS middleware, automated API test suite (`test_api.py`), and Phase 3 module specifications (`ingestion.py` & `ai_engine.py`).

3. **Frontend & UI Team**:
   - File: [scripts/SCRIPT_FRONTEND_TEAM.md](scripts/SCRIPT_FRONTEND_TEAM.md)
   - Duration: ~3 minutes
   - Topics: React 18 + Vite 8 setup, live API health polling service (`src/api/client.js`), dynamic sidebar system status widget, view switching between 6 core views (Dashboard, Upload, Risk Analysis, Obligations, Documents, Settings), grounded source citation cards, and clean production build verification.

---

## Suggested Meeting Flow

1. **0:00 - 0:05 (5 min)**: Team Lead — Project intro, core business pain points, architecture, database schema, platform-independent GUIDs, and seeding.
2. **0:05 - 0:08 (3 min)**: Backend Team — FastAPI foundation, live DB health probe, system info, exception handling, and automated API tests.
3. **0:08 - 0:11 (3 min)**: Frontend Team — React dashboard, live API status widget, view routing, grounded citation demonstration, and production build performance.
4. **0:11 - 0:13 (2 min)**: Team Lead — Wrap-up, Phase 3 implementation roadmap (OCR ingestion pipeline, RAG risk analysis, JWT auth), and open questions.
5. **0:13+**: Mentor Q&A and Feedback.
