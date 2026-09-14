SCRIPT - Frontend & UI Team

Speakers: Frontend team members
Duration: ~5 minutes
Tone: Visual, user-centric, polished

---

Thanks. We will walk you through the user interface, our live API integrations, and the interactive features we delivered across all four phases.

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


PHASE 4 - Audit Trail UI, Clause Filters & Integration Polish

In Phase 4, the frontend team delivered three major additions to complete the application:

First, the Audit Trail View:
We built a complete AuditTrailView component that provides a live, interactive audit event log. When a user navigates to the Audit Trail tab in the sidebar, the component calls fetchAuditLogs from our API client, which queries GET /api/audit-logs on the backend. The response is an array of audit event objects, each containing an action type, user email, detail text, and a server-side timestamp.

The view renders these events in a structured data table with four columns: Timestamp, Action, User, and Details. Each action type is color-coded using our design system:
- USER_LOGIN events display in blue, indicating authentication activity.
- CONTRACT_UPLOADED events display in green, indicating new documents entering the system.
- CONTRACT_ANALYZED events display in our brand indigo color, indicating AI processing completions.
- CONTRACT_DELETED events display in red, indicating document removal with cascading data cleanup.

The table header uses uppercase text styling consistent with our Dashboard contracts table. Row hover states use a subtle background transition for visual feedback. Timestamps are rendered in monospace font using the browser locale format for readability.

We also added a Refresh button in the header that re-fetches audit logs on demand, with a spinning animation on the RefreshCw icon while the request is in flight. A live event counter displays the total number of filtered events next to the button.

When the backend API is offline or unavailable, the component gracefully falls back to a set of demo audit events that demonstrate the full range of action types. This ensures the Audit Trail tab is always presentable during demonstrations regardless of backend availability.

At the bottom of the view, we added an informational card explaining the tamper-proof audit architecture. It describes how every system action is recorded as an immutable append-only log entry with a server-side timestamp, and how this supports SOC 2 Type II and ISO 27001 compliance reporting requirements.

Second, Audit Event Filter Controls:
Above the audit table, we added a row of filter buttons that allow users to narrow the displayed events by action type. The filter options are:
- All Events: Shows the complete unfiltered audit trail.
- USER LOGIN: Shows only authentication events.
- CONTRACT UPLOADED: Shows only document ingestion events.
- CONTRACT ANALYZED: Shows only AI analysis completion events.
- CONTRACT DELETED: Shows only document deletion events.

When a filter is active, the button adopts the color coding of its action type with a border highlight and subtle shadow. Inactive buttons use a muted surface styling. The event counter updates in real-time to reflect the filtered count. The filtering is performed client-side on the fetched data array, using a simple equality check on the action field, so switching filters is instant with no additional API calls.

Third, Clause Explorer Risk-Level Filter Controls:
We enhanced the ClauseExplorerModal with a new filter bar in the modal header. Previously, the modal displayed all extracted clauses in a flat list. Now, four filter buttons allow users to focus on specific risk categories:
- All Clauses: Displays every extracted clause regardless of risk status.
- Critical: Filters to show only clauses that have at least one risk flag with risk_level equal to critical. These are the most urgent compliance violations like GDPR cross-border data transfer issues.
- High: Filters to show only clauses with risk flags at the high severity level. These include issues like automatic renewal lock-in traps.
- Compliant: Filters to show only clauses that have zero risk flags, confirming they passed all compliance checks.

The filter bar includes a Filter icon from Lucide React on the left, the four filter buttons in the center, and a live counter on the right showing how many clauses match the active filter out of the total. For example, if a contract has 3 total clauses and the user selects Critical, the counter displays "1 of 3 clauses".

The filtering logic uses Array.filter on the contract clauses array. For the compliant filter, it checks that the risk_flags array is either undefined or has zero length. For critical and high filters, it uses Array.some to check if any risk flag in the clause matches the selected severity level.

We also moved the React useState hook for the risk filter state to the top of the ClauseExplorerModal component, before any conditional returns, to comply with React's rules of hooks. This prevents potential rendering errors when the component transitions between loading and loaded states.

Fourth, Header Update and Phase Marker:
We updated the main application header subtitle from "Phase 3 Operational" to "Phase 4 Operational" to reflect our completed development milestone.

Fifth, Production Build Verification:
Our Vite production bundle compiles cleanly in 1.81 seconds with zero errors and zero warnings. The final bundle sizes are:
- HTML: 0.45 KB
- CSS: 21.62 KB (5.10 KB gzipped)
- JavaScript: 286.50 KB (90.24 KB gzipped)

All frontend code is committed to our GitHub repository. Handing back to our team lead for closing remarks.


---

TECHNICAL QUESTIONS YOU MIGHT BE ASKED

Question: How does the UI handle large agreements with dozens of clauses?
Answer: The ClauseExplorerModal uses a virtualized scrollable viewport with sticky modal headers and isolated card components. The backend chunks documents into discreet clauses so the browser only renders structured clause cards rather than monolithic documents, keeping DOM performance fast and fluid. The new filter controls further reduce visible DOM elements by letting users focus on specific risk categories.

Question: What happens if the backend API is temporarily unreachable?
Answer: Our apiClient in src/api/client.js includes error interceptors and timeout protections. In our components, if an API call fails, the UI displays a clear error state and gracefully falls back to cached seeded contract records, ensuring the application remains interactive during presentations. The AuditTrailView follows the same pattern, falling back to demo audit events when the backend is offline.

Question: How do the clause filter controls work technically?
Answer: The filters operate entirely on the client side. When the ClauseExplorerModal receives the contract detail from the API, it stores the full clauses array in component state. The filter buttons update a riskFilter state variable, which triggers a re-render. The filteredClauses computed array applies Array.filter based on the selected category. For critical and high, it checks if any risk_flags entry has a matching risk_level. For compliant, it checks that the clause has no risk flags at all. This approach avoids additional API calls and provides instant filter switching.

Question: Why does the Audit Trail use client-side filtering instead of server-side?
Answer: For our current scale of audit events (up to 100 entries per query), client-side filtering provides instant responsiveness without network latency. The full dataset is already loaded in component state after the initial fetch. In a production environment with millions of audit records, we would implement server-side pagination and query parameters on the GET /api/audit-logs endpoint to filter by action type, date range, and user, returning paginated results.
