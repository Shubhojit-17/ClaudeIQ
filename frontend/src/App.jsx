import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileUp,
  ShieldCheck,
  CalendarClock,
  Search,
  Settings,
  Bell,
  ChevronRight,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  UploadCloud,
  FileCheck,
  Info,
  Clock,
  ExternalLink,
  Users,
  Database,
  Lock,
} from "lucide-react";
import { checkHealth } from "./api/client";
import "./App.css";

/* ════════════════════════════════════════════════════════════
   ClauseIQ — Main Application Layout & Foundation Views
   Phase 1 & Phase 2 Foundation
   ════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload Contract", icon: FileUp },
  { id: "risks", label: "Risk Analysis", icon: ShieldCheck },
  { id: "obligations", label: "Obligations", icon: CalendarClock },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    status: "checking",
    dialect: "unknown",
    error: null,
  });

  const pollHealth = async () => {
    setHealthStatus((prev) => ({ ...prev, loading: true }));
    const result = await checkHealth();
    if (result.ok) {
      setHealthStatus({
        loading: false,
        connected: true,
        status: result.data.status,
        dialect: result.data.database?.dialect || "postgresql",
        dbStatus: result.data.database?.status || "online",
        error: null,
      });
    } else {
      setHealthStatus({
        loading: false,
        connected: false,
        status: "offline",
        dialect: "unknown",
        dbStatus: "unreachable",
        error: result.error,
      });
    }
  };

  useEffect(() => {
    pollHealth();
    const interval = setInterval(pollHealth, 30000); // 30s probe
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen bg-surface-900 text-surface-50 font-sans">
      {/* ════════ SIDEBAR ════════ */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/25">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ClauseIQ</h1>
            <p className="text-[10px] text-surface-200 font-medium uppercase tracking-widest">
              Phase 1 & 2 Ready
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <p className="px-6 mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-200">
            Navigation
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-[calc(100%-1.5rem)] text-left sidebar-nav-item ${
                  isActive ? "active" : ""
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* Live System Health Widget */}
        <div className="p-4 border-t border-surface-700">
          <div className="card !p-3.5 bg-surface-800/80 border-surface-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity
                  className={`w-3.5 h-3.5 ${
                    healthStatus.connected ? "text-green-400" : "text-amber-400"
                  } ${healthStatus.loading ? "animate-spin" : ""}`}
                />
                <span className="text-xs font-semibold text-white">System Status</span>
              </div>
              <button
                onClick={pollHealth}
                title="Refresh API probe"
                className="text-surface-200 hover:text-white transition-colors p-1"
              >
                <RefreshCw className={`w-3 h-3 ${healthStatus.loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-surface-200">API Server:</span>
                <span
                  className={
                    healthStatus.connected ? "text-green-400 font-medium" : "text-red-400 font-medium"
                  }
                >
                  {healthStatus.connected ? "● Online" : "● Offline"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-surface-200">Database:</span>
                <span
                  className={
                    healthStatus.dbStatus === "online"
                      ? "text-green-400 font-medium"
                      : healthStatus.connected
                      ? "text-amber-400 font-medium"
                      : "text-red-400 font-medium"
                  }
                >
                  {healthStatus.dbStatus === "online"
                    ? `● ${healthStatus.dialect}`
                    : healthStatus.connected
                    ? "● Standby"
                    : "● Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="main-content flex-1 flex flex-col">
        {/* Header */}
        <header className="page-header flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </h2>
            <p className="text-xs text-surface-200 mt-0.5">
              Deloitte Capstone Project — AI Contract Intelligence & Compliance
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200" />
              <input
                type="text"
                placeholder="Search contracts or clauses..."
                className="bg-surface-800 border border-surface-700 rounded-lg pl-10 pr-4 py-2 text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg bg-surface-800 border border-surface-700 hover:border-surface-200/30 transition-colors">
              <Bell className="w-4 h-4 text-surface-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface-900" />
            </button>
          </div>
        </header>

        {/* View Routing */}
        <div className="p-8 flex-1">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "upload" && <UploadView />}
          {activeTab === "risks" && <RiskAnalysisView />}
          {activeTab === "obligations" && <ObligationsView />}
          {activeTab === "documents" && <DocumentsView />}
          {activeTab === "settings" && <SettingsView healthStatus={healthStatus} />}
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   VIEW COMPONENTS
   ════════════════════════════════════════════════════════════ */

function DashboardView() {
  const stats = [
    { label: "Contracts Analyzed", value: "2", icon: FileText, color: "text-brand-400", bg: "bg-brand-500/10" },
    { label: "Critical / High Risks", value: "2", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Upcoming Milestones", value: "4", icon: CalendarClock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Compliance Score", value: "88%", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card group hover:border-brand-500/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bg} p-2.5 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <ChevronRight className="w-4 h-4 text-surface-200 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-surface-200 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contracts Table */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Ingested Contracts</h3>
            <span className="badge bg-brand-500/20 text-brand-300">Database Seeded</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-surface-200 text-xs uppercase">
                  <th className="py-2.5 font-medium">Document Name</th>
                  <th className="py-2.5 font-medium">Uploader</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                <tr>
                  <td className="py-3 font-medium text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    Acme_Cloud_Services_Agreement_2026.pdf
                  </td>
                  <td className="py-3 text-surface-200 text-xs">Sarah Jenkins (Legal Ops)</td>
                  <td className="py-3">
                    <span className="badge bg-green-500/15 text-green-400">Analyzed</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-xs text-brand-400 hover:underline cursor-pointer">
                      View Clauses (3)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-400" />
                    Apex_Mutual_NDA_v2.docx
                  </td>
                  <td className="py-3 text-surface-200 text-xs">David Chen (Compliance)</td>
                  <td className="py-3">
                    <span className="badge bg-green-500/15 text-green-400">Analyzed</span>
                  </td>
                  <td className="py-3 text-right">
                    <span className="text-xs text-brand-400 hover:underline cursor-pointer">
                      View Clauses (2)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Risk Distribution</h3>
            <span className="badge bg-red-500/20 text-red-300">2 Active Flags</span>
          </div>

          <div className="space-y-4">
            {[
              { level: "Critical", count: 1, percent: 50, color: "bg-red-500" },
              { level: "High", count: 1, percent: 50, color: "bg-amber-500" },
              { level: "Medium", count: 0, percent: 0, color: "bg-yellow-500" },
              { level: "Low", count: 0, percent: 0, color: "bg-green-500" },
            ].map((r) => (
              <div key={r.level} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-surface-200">{r.level}</span>
                  <span className="text-white font-medium">{r.count} flag</span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color}`} style={{ width: `${r.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-surface-700 text-xs text-surface-200 flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-400 shrink-0" />
            <span>AI Citation Grounding is active on all flagged clauses.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadView() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="card border-dashed border-2 border-surface-700 hover:border-brand-500/50 p-12 text-center transition-colors">
        <UploadCloud className="w-12 h-12 text-brand-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-1">Upload Contract Document</h3>
        <p className="text-sm text-surface-200 mb-6">
          Drag and drop PDF or Word documents to initiate OCR and semantic clause chunking
        </p>

        <div className="flex justify-center gap-3 mb-6">
          <span className="badge bg-surface-700 text-surface-200">PDF (.pdf)</span>
          <span className="badge bg-surface-700 text-surface-200">Microsoft Word (.docx)</span>
          <span className="badge bg-surface-700 text-surface-200">Max 25 MB</span>
        </div>

        <button className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20">
          Select Document
        </button>
      </div>

      <div className="card space-y-3">
        <h4 className="text-sm font-semibold text-white">Ingestion Pipeline Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-surface-200">
          <div className="p-3 bg-surface-900/50 rounded-lg border border-surface-700">
            <p className="font-semibold text-white mb-1">1. OCR & PyMuPDF</p>
            Extracts raw text from both scanned image PDFs and digital agreements.
          </div>
          <div className="p-3 bg-surface-900/50 rounded-lg border border-surface-700">
            <p className="font-semibold text-white mb-1">2. Clause Chunking</p>
            Splits text into legal sections preserving document order and context.
          </div>
          <div className="p-3 bg-surface-900/50 rounded-lg border border-surface-700">
            <p className="font-semibold text-white mb-1">3. Vector Indexing</p>
            Generates 1536-dim embeddings for similarity search against compliance policies.
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskAnalysisView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Flagged Risks with Source Citations</h3>
          <p className="text-xs text-surface-200">
            Every risk flag strictly cites the original contract clause to eliminate hallucinations
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge bg-red-500/20 text-red-300 font-semibold">1 Critical</span>
          <span className="badge bg-amber-500/20 text-amber-300 font-semibold">1 High</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Risk Card 1 */}
        <div className="card border-l-4 border-l-red-500 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="badge bg-red-500/20 text-red-400 uppercase tracking-wide">Critical</span>
              <h4 className="text-sm font-bold text-white">
                GDPR / Cross-Border Data Transfer Non-Compliance
              </h4>
            </div>
            <span className="text-xs text-surface-200">Acme_Cloud_Services_Agreement_2026.pdf</span>
          </div>

          <p className="text-xs text-surface-200 leading-relaxed">
            <strong className="text-surface-100">Analysis:</strong> Unrestricted international transfer
            of personal data without standard contractual clauses violates EU GDPR Articles 44–49.
          </p>

          <div className="p-3 bg-surface-900 rounded-lg border border-surface-700 text-xs font-mono text-brand-300">
            <p className="text-[10px] uppercase font-bold text-surface-200 mb-1 font-sans">
              Exact Source Citation (Grounding Evidence):
            </p>
            &ldquo;personal data may be processed and stored in any jurisdiction where Supplier or its
            sub-processors maintain facilities, without requiring prior written approval or additional
            Standard Contractual Clauses.&rdquo;
          </div>
        </div>

        {/* Risk Card 2 */}
        <div className="card border-l-4 border-l-amber-500 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="badge bg-amber-500/20 text-amber-400 uppercase tracking-wide">High</span>
              <h4 className="text-sm font-bold text-white">
                Automatic Renewal Clause Lock-in Trap
              </h4>
            </div>
            <span className="text-xs text-surface-200">Acme_Cloud_Services_Agreement_2026.pdf</span>
          </div>

          <p className="text-xs text-surface-200 leading-relaxed">
            <strong className="text-surface-100">Analysis:</strong> Requires 90-day written non-renewal
            notice. Standard corporate procurement policy restricts non-renewal windows to a maximum of 30
            days.
          </p>

          <div className="p-3 bg-surface-900 rounded-lg border border-surface-700 text-xs font-mono text-brand-300">
            <p className="text-[10px] uppercase font-bold text-surface-200 mb-1 font-sans">
              Exact Source Citation (Grounding Evidence):
            </p>
            &ldquo;This Agreement shall automatically renew for successive twelve (12) month periods
            unless either party provides written notice of non-renewal at least ninety (90) days prior to the
            expiration...&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
}

function ObligationsView() {
  const dates = [
    { type: "Renewal Notice", doc: "Acme Cloud Services", days: "In 45 days", date: "Oct 29, 2026", status: "Upcoming", badge: "badge-warning" },
    { type: "Periodic Review", doc: "Apex Mutual NDA", days: "In 15 days", date: "Sep 29, 2026", status: "Action Required", badge: "badge-danger" },
    { type: "Contract Expiry", doc: "Acme Cloud Services", days: "In 135 days", date: "Jan 27, 2027", status: "Tracked", badge: "badge-info" },
    { type: "NDA Expiry", doc: "Apex Mutual NDA", days: "In 365 days", date: "Sep 14, 2027", status: "Tracked", badge: "badge-info" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <h3 className="text-sm font-bold text-white mb-4">Milestone Obligation Tracker</h3>
        <div className="space-y-3">
          {dates.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-surface-900/60 rounded-lg border border-surface-700/60">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-brand-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{d.type}</p>
                  <p className="text-xs text-surface-200">{d.doc} • Due: {d.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-surface-200">{d.days}</span>
                <span className={`badge ${d.badge}`}>{d.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentsView() {
  return (
    <div className="card space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">All Documents</h3>
        <span className="text-xs text-surface-200">2 files stored with Row-Level Security</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-surface-900/60 rounded-lg border border-surface-700">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-brand-400" />
            <div>
              <p className="text-sm font-semibold text-white">Acme_Cloud_Services_Agreement_2026.pdf</p>
              <p className="text-xs text-surface-200">UUID: c1001-4b2a • 3 Clauses Extracted • 2 Risk Flags</p>
            </div>
          </div>
          <span className="badge bg-green-500/15 text-green-400">Analyzed</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-surface-900/60 rounded-lg border border-surface-700">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-brand-400" />
            <div>
              <p className="text-sm font-semibold text-white">Apex_Mutual_NDA_v2.docx</p>
              <p className="text-xs text-surface-200">UUID: c2002-9a1f • 2 Clauses Extracted • 0 Risk Flags</p>
            </div>
          </div>
          <span className="badge bg-green-500/15 text-green-400">Analyzed</span>
        </div>
      </div>
    </div>
  );
}

function SettingsView({ healthStatus }) {
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="card space-y-4">
        <h3 className="text-sm font-bold text-white">Environment & Connectivity</h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">API Base URL:</span>
            <span className="font-mono text-white">http://localhost:8000</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">Database Engine:</span>
            <span className="font-mono text-white">{healthStatus.dialect}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">AI Grounding Policy:</span>
            <span className="text-green-400 font-semibold">Strict Citation Required (No Hallucination)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-surface-200">Active User Role (Simulated):</span>
            <span className="badge bg-brand-500/20 text-brand-300">Admin (Legal Operations)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
