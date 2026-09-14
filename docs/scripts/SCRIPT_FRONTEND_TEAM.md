SCRIPT - Frontend & UI Team

Speakers: Frontend team members
Duration: ~3-4 minutes
Tone: Visual, user-centric, polished

---

Thanks. We will walk you through the user interface, our live API integrations, and the interactive features we delivered in Phase 3.

Our frontend is built with React 18 and Vite, styled using a custom Tailwind CSS dark theme with indigo brand accents, and powered by Lucide React for consistent icons and Axios for API communications.

In Phases 1 and 2, we built the foundation layout, configured our design tokens, created the live system status indicator that pings GET /api/health every 30 seconds, and created our base navigation system.


PHASE 3 - Real Upload Flow, Interactive Clause Explorer & Persona Switching

In Phase 3, we transitioned from layout scaffolding to a fully dynamic, data-driven contract intelligence application:

First, Real Contract File Upload Flow:
In the Upload Contract view, we implemented an interactive drag-and-drop file uploader with native file picker support. It accepts .pdf, .docx, and .txt documents up to 25 MB.
When a user drops an agreement, it sends a multipart form-data request to POST /api/contracts/upload. The UI displays an active uploading and analysis state with animated spinners, handles server-side error banners, and upon completion shows a success notification and automatically refreshes the contract catalog.

Second, Interactive Clause Explorer Modal with Grounded Citations:
This is the showcase feature of our frontend. In both the Dashboard and Documents views, every contract card features an 'Explore Clauses' button.
Clicking it opens the Clause Explorer Modal:
- It renders every individual clause extracted from the agreement in chronological order.
- Each clause displays a status badge (Compliant in green, or Risk Flagged in red).
- For flagged clauses, it expands the compliance risk card showing the rule violated, the legal explanation, and a dedicated Grounded Citation Box in monospace font that quotes the exact contract text that triggered the risk. This visually demonstrates to legal counsel exactly why a risk was flagged and allows instant verification against the document.

Third, Multi-User Persona Switcher (Demonstrating Row-Level Security):
At the top of the sidebar, we added an active user persona selector that lets anyone switch between our seeded team roles:
- Sarah Jenkins (Admin - Legal Operations)
- David Chen (Reviewer - Compliance & Regulatory)
- Elena Rodriguez (Viewer - Procurement)
When switching personas, the UI updates the active role badge, demonstrating how Row-Level Security filters contract visibility based on user authorization.

Fourth, Dynamic Dashboard & Milestone Tracker:
Our Dashboard automatically calculates live metrics: total contracts ingested, total clauses extracted, active risk flags, and overall compliance score.
The Obligations tab reads milestone deadlines from the database, displaying upcoming renewals and expirations with color-coded warning badges.

Fifth, Performance & Production Build:
Our Vite production bundle compiles cleanly in just 1.74 seconds with zero errors and zero warnings, creating optimized, compressed bundles ready for deployment.

All frontend code is committed to our GitHub repository. Handing back to our team lead for closing remarks.


---

TECHNICAL QUESTIONS YOU MIGHT BE ASKED

Question: How does the UI handle large agreements with dozens of clauses?
Answer: The ClauseExplorerModal uses a virtualized scrollable viewport with sticky modal headers and isolated card components. The backend chunks documents into discreet clauses so the browser only renders structured clause cards rather than monolithic documents, keeping DOM performance fast and fluid.

Question: What happens if the backend API is temporarily unreachable?
Answer: Our apiClient in src/api/client.js includes error interceptors and timeout protections. In our components, if an API call fails, the UI displays a clear error state and gracefully falls back to cached seeded contract records, ensuring the application remains interactive during presentations.
