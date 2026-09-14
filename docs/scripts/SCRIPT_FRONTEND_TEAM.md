SCRIPT - Frontend & UI Team

Speakers: Frontend team members
Duration: 3 minutes
Tone: Visual, user-centric, polished

---

Thanks. We will walk you through the frontend architecture, our design system, and the interactive views we built in Phase 2.

We built our frontend using React 18 with Vite as our build engine, styled with Tailwind CSS v3, and powered by Lucide React for consistent icons and Axios for API communications. We chose Vite over older build tools because its native ES module hot-reloading allows near-instant iteration during development.

In Phase 2, we moved beyond static mockups to build a fully structured, interactive application layout with real backend connectivity:

First, Live API Health Probe & Monitoring Widget:
We built an API service module in src/api/client.js that connects to our backend at http://localhost:8000/api/health. On application load, the frontend sends an asynchronous probe to verify the backend state, and sets up a background poll every 30 seconds.
In the bottom of our sidebar, we built a Live System Status Widget that displays real-time connection status:
- Green indicator when the API server and database are both online.
- Amber indicator if the backend is reachable but the database is in standby/degraded mode.
- Red indicator if the backend is unreachable, with an interactive manual refresh button.
This gives anyone using the system immediate visual feedback on infrastructure connectivity.

Second, Dynamic View Routing & Navigation:
We implemented active tab state management in App.jsx so users can switch seamlessly between all six core application modules:
1. Dashboard: Displays 4 high-level stat cards (Contracts Analyzed, Active Critical/High Risks, Upcoming Milestones, Compliance Score), an Ingested Contracts table, and a visual Risk Distribution severity bar chart.
2. Upload Contract: An interactive drag-and-drop zone with MIME-type validation for PDF and DOCX documents (up to 25 MB), complete with a 3-step pipeline preview showing OCR, Clause Chunking, and Vector Indexing.
3. Risk Analysis: A dedicated compliance risk view showcasing our grounded risk cards. Each card clearly displays the risk severity, compliance rule violated, detailed legal analysis, and an exact Source Citation box demonstrating how citation grounding eliminates AI hallucinations.
4. Obligations: A milestone timeline tracking auto-renewal windows, periodic review dates, and contract expiries with visual warning badges.
5. Documents: A file catalog listing ingested contracts with their database UUIDs, extracted clause counts, and status badges.
6. Settings: Shows active API base URL, detected database engine, AI grounding policy status, and active user role (Admin, Reviewer, Viewer).

Third, Design System & Production Performance:
We configured a custom Tailwind theme featuring an indigo brand accent against a slate dark-mode palette, Inter typography, JetBrains Mono for clause citations, and reusable component classes (.card, .badge, .sidebar-nav-item).
The production application compiles cleanly via Vite with zero warnings and zero errors, generating optimized bundles in just 2.1 seconds.

All frontend changes are committed to GitHub under feat(frontend).

In Phase 3, we will connect the Upload component to the backend multipart file upload endpoint and wire live contract data into the dashboard.
