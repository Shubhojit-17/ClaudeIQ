# ClauseIQ — Final Presentation Script
### **[PES University | Team DarkTrace | ClauseIQ | Final Deck]**
**Duration**: ~5 to 7 minutes total (~1 to 1.5 minutes per speaker)  
**Style**: Punchy, confident, professional, and strictly focused on features, architecture, and live workflow.

---

## 👥 Speaker Division Overview

| Speaker | Name | Focus Area | Slides Covered |
| :--- | :--- | :--- | :--- |
| **Speaker 1** | **Shubhojit Sarkar** | Title, Problem Statement & The ClauseIQ Solution | Slides 1 – 3 |
| **Speaker 2** | **Shaik Khadeeja Sayeed** | Architecture, Multi-Cloud AI & Live Ingestion Flow | Slides 4 – 6 |
| **Speaker 3** | **Shreeya Nagaraj** | Grounded Citations, Plain-English Summaries & Topic Matrix | Slides 7 – 8 |
| **Speaker 4** | **Sindhu S B** | Compliance Risk Radar, Obligations & Legal Signing Workflow | Slides 9 – 10 |
| **Speaker 5** | **Yalavarthi Gnana Deepika** | RBAC Audit Trail, Walkthrough Video, ROI & Conclusion | Slides 11 – 16 |

---

## 🎙️ Speaker 1: Shubhojit Sarkar
**Focus**: *Title, The Real-World Legal Crisis & ClauseIQ Value Proposition (Slides 1 – 3)*  
**Estimated Time**: ~1 minute

> **[Slide 1: Title Slide]**  
> "Good morning mentors and fellow peers. We are team **DarkTrace** from **PES University**, and today we are presenting **ClauseIQ** — an Autonomous Legal Intelligence and Enterprise Compliance Platform."

> **[Slide 2: Problem Statement]**  
> "Modern enterprises execute thousands of complex agreements every year — Master Services Agreements, NDAs, and Data Processing Agreements.  
> The core problem is threefold:  
> 1. Manual contract review takes days and leads to severe human blindspots — like buried auto-renewal traps or uncapped indemnification liabilities.  
> 2. Most critically, **generic AI tools like standard ChatGPT hallucinate**. In legal agreements, an AI hallucinating or misquoting a clause creates catastrophic liability.  
> 3. Organizations lack role-based data governance, allowing non-admin personnel unverified access with zero auditability."

> **[Slide 3: The ClauseIQ Solution]**  
> "To solve this, we built **ClauseIQ**.  
> ClauseIQ is designed with **Zero-Hallucination Assurance**: every single extracted clause and risk is tied directly to an exact, character-level verbatim quotation from the original contract.  
> Furthermore, it automatically translates complex legalese into **plain-English summaries**, performs **cross-clause topic comparison**, and enforces **admin-only legal contract signing** backed by an immutable cryptographic audit ledger.  
> I will now pass it to **Khadeeja** to walk through our technical architecture."

---

## 🎙️ Speaker 2: Shaik Khadeeja Sayeed
**Focus**: *System Architecture, Multi-Provider AI Engine & Document Ingestion (Slides 4 – 6)*  
**Estimated Time**: ~1 minute

> **[Slide 4: Architecture & Tech Stack]**  
> "Thank you, Shubhojit.  
> On the technical side, ClauseIQ is built with an enterprise-grade, decoupled stack:  
> - **Backend**: A high-concurrency **FastAPI** service with asynchronous request pipelines and strict Pydantic v2 schemas.  
> - **Database Layer**: **SQLAlchemy ORM** featuring custom cross-platform GUID type decorators and database-level Row-Level Security (RLS).  
> - **AI Engine**: A flexible multi-provider architecture supporting **Groq Cloud (Llama 3.3 70B)** for ultra-fast 500-tokens-per-second parsing, **Google Gemini 2.0 Flash**, **OpenAI GPT-4o**, and a deterministic fallback rule engine.  
> - **Frontend**: A minimal, futuristic dark dashboard built in **React 18 and Vite**, styled with a custom obsidian cyber-mesh design system."

> **[Slide 5 & 6: Ingestion Pipeline & Dashboard Command Center]**  
> "When a user uploads a contract — whether PDF, DOCX, or text:  
> 1. Our ingestion parser extracts and cleans raw tokens while preserving document layout.  
> 2. The AI boundary chunker identifies and isolates operative contractual clauses.  
> 3. Key dates and milestone obligations are scheduled, and potential compliance threats are classified.  
> 4. The **Command Center Dashboard** provides real-time telemetry: active repositories, compliance health indexes, and instant omni-search filtering across ingested agreements.  
> Now, **Shreeya** will demonstrate our grounded extraction and topic comparison capabilities."

---

## 🎙️ Speaker 3: Shreeya Nagaraj
**Focus**: *Grounded Clause Explorer, Plain-English Summaries & Multi-Clause Topic Matrix (Slides 7 – 8)*  
**Estimated Time**: ~1.2 minutes

> **[Slide 7: Grounded Clause Explorer & Plain-English Summaries]**  
> "Thank you, Khadeeja.  
> When a reviewer clicks 'Explore' on any contract, ClauseIQ opens our **Clause Explorer**:  
> - At the top, the system provides an **AI Contract Executive Synthesis** summarizing commitments and exposure areas.  
> - For every individual clause, ClauseIQ provides a dedicated **AI Plain-English Summary**. Non-legal business executives can immediately understand what a clause requires without reading pages of legalese.  
> - And crucially, every clause features an **Exact Verbatim Source Citation Grounding** box. You can see the exact, untouched words from the source agreement — ensuring 100% legal grounding with zero fabrication."

> **[Slide 8: Multi-Clause Topic Comparison Matrix]**  
> "In real-world contracts, obligations are often scattered across different sections.  
> With our **'Compare by Topic' Matrix**, ClauseIQ automatically groups interlocking clauses under common topics like *Confidentiality*, *Data Protection*, or *Termination*.  
> It performs an **AI Comparative Synthesis** to detect overlaps and resolve conflicting terms side-by-side.  
> I will now hand over to **Sindhu** to cover our Risk Radar and Legal Signing Workflow."

---

## 🎙️ Speaker 4: Sindhu S B
**Focus**: *Compliance Risk Radar, Obligations Milestone Tracker & Admin Contract Execution (Slides 9 – 10)*  
**Estimated Time**: ~1.2 minutes

> **[Slide 9: Risk Radar & Obligations Timeline]**  
> "Thank you, Shreeya.  
> In our **Compliance Risk Radar**, contracts are continuously evaluated for operational threats:  
> - Risks are categorized into **High**, **Medium**, and **Low** severities, targeting traps like missing liability caps, unilateral indemnification, or short termination notice periods.  
> - Each risk card quotes the exact contractual text that triggered the alert.  
> - In the **Obligations View**, milestone dates and renewal deadlines are mapped with responsible parties and countdown badges, eliminating late renewal penalties."

> **[Slide 10: Legal Contract Execution & Custom Cyber Alert Dialog]**  
> "Once a contract is fully vetted, it enters the **Execution Phase**:  
> - Only authorized **Administrators** possess the legal signing authority to mark an agreement as completed and signed.  
> - Instead of generic browser popups, we designed a custom **Frosted Glass Cyber Confirmation Modal**. It details the target document, signing impact, and administrative credentials.  
> - Upon signing, ClauseIQ generates an **'Executed & Sealed'** badge with a verifiable UTC completion timestamp and logs the event directly into the security ledger.  
> If a Reviewer or Viewer attempts to sign, a role-restricted security alert guides them back to authorized workflows.  
> I will now pass it to **Deepika** to conclude with security, the walkthrough, and business ROI."

---

## 🎙️ Speaker 5: Yalavarthi Gnana Deepika
**Focus**: *Role-Based Security, Cryptographic Audit Trail, Walkthrough Video & Wrap-Up (Slides 11 – 16)*  
**Estimated Time**: ~1.2 minutes

> **[Slide 11: Security & Cryptographic Audit Trail]**  
> "Thank you, Sindhu.  
> Enterprise compliance demands complete accountability.  
> In ClauseIQ's **Audit Trail**, every single action — ingestion, exploration, risk triage, and signing — is immutably logged with:  
> - The authenticated user identity and IP scope.  
> - Monospace UTC timestamps.  
> - **Hierarchical Role Visibility**: Administrators inspect organization-wide activities, while Reviewers and Viewers are strictly scoped to their assigned contracts via database Row-Level Security."

> **[Slide 12: Live Walkthrough Video]**  
> "On this slide, our recorded end-to-end product walkthrough demonstrates the complete pipeline in action: from uploading a raw Master Services Agreement, extracting grounded clauses with plain-English summaries, running cross-clause topic synthesis, switching RBAC personas, and executing the agreement as an Administrator."

> **[Slide 13 – 16: Business Impact, Roadmap & Conclusion]**  
> "To summarize our business impact:  
> - **90% Cycle Time Reduction**: Turns multi-day contract analysis into under 45 seconds.  
> - **100% Verbatim Grounding**: Zero risk of AI hallucinations in legal compliance.  
> - **Guaranteed Audit Readiness**: Complete oversight on renewals and milestone obligations.  
> Looking forward, our roadmap includes automated AI redlining and native DocuSign integrations.  
> Thank you for your time. Team **DarkTrace** is now open for any questions or a live interactive walkthrough!"

---

## 💡 Quick Tips for the Presentation
1. **Pacing**: Keep your delivery brisk and confident. Let the screenshots and live UI speak for themselves.
2. **Key Buzzwords to Emphasize**: *"100% Verbatim Source Grounding"*, *"Zero Hallucination"*, *"Plain-English Summaries"*, *"Multi-Clause Topic Synthesis"*, *"Admin Signing Authority"*, *"Row-Level Security Audit Trail"*.
3. **Smooth Transitions**: Each speaker cleanly passes the floor to the next speaker by name (e.g. *"I will now pass it to Khadeeja..."*).
