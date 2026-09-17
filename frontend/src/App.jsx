import { useState, useEffect, useRef } from "react";
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
  Clock,
  Info,
  X,
  Trash2,
  Check,
  UserCheck,
  ExternalLink,
  Lock,
  History,
  Filter,
  Sparkles,
  Key,
  Cpu,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  checkHealth,
  fetchContracts,
  fetchContractDetail,
  uploadContractFile,
  deleteContractApi,
  clearAllContractsApi,
  fetchObligations,
  fetchAuditLogs,
  loginUser,
  fetchRisks,
  fetchAIStatus,
  saveAIConfig,
} from "./api/client";
import "./App.css";

/* ════════════════════════════════════════════════════════════
   ClauseIQ — Main Application Layout & Feature Views
   Phase 4 Core Integration & Polish (Live Data Mode)
   ════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload Contract", icon: FileUp },
  { id: "risks", label: "Risk Analysis", icon: ShieldCheck },
  { id: "obligations", label: "Obligations", icon: CalendarClock },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "audit", label: "Audit Trail", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

const DEMO_USERS = [
  { name: "Sarah Jenkins", email: "admin@clauseiq.com", password: "AdminSecure2027!", role: "admin", dept: "Legal Operations" },
  { name: "David Chen", email: "reviewer@clauseiq.com", password: "ReviewerPass2027!", role: "reviewer", dept: "Compliance & Regulatory" },
  { name: "Elena Rodriguez", email: "viewer@clauseiq.com", password: "ViewerRead2027!", role: "viewer", dept: "Procurement" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(DEMO_USERS[0]);
  const [healthStatus, setHealthStatus] = useState({
    loading: true,
    connected: false,
    status: "checking",
    dialect: "unknown",
    dbStatus: "checking",
    error: null,
  });

  const [contracts, setContracts] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [allRisks, setAllRisks] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Health probe
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

  // Load live contracts, obligations & risks for the active authenticated user
  const loadDataForUser = async (userToAuth = currentUser) => {
    setLoadingContracts(true);
    // 1. Authenticate with live backend
    await loginUser(userToAuth.email, userToAuth.password);

    // 2. Fetch live contracts
    const cResult = await fetchContracts();
    if (cResult.ok && Array.isArray(cResult.data)) {
      setContracts(cResult.data);
    } else {
      setContracts([]);
    }

    // 3. Fetch live obligations
    const oResult = await fetchObligations();
    if (oResult.ok && Array.isArray(oResult.data)) {
      setObligations(oResult.data);
    } else {
      setObligations([]);
    }

    // 4. Fetch live risks
    const rResult = await fetchRisks();
    if (rResult.ok && Array.isArray(rResult.data)) {
      setAllRisks(rResult.data);
    } else {
      setAllRisks([]);
    }

    setLoadingContracts(false);
  };

  const handleSwitchPersona = async (user) => {
    setCurrentUser(user);
    await loadDataForUser(user);
  };

  useEffect(() => {
    pollHealth();
    loadDataForUser(currentUser);
    const interval = setInterval(pollHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewClauses = async (contractId) => {
    setLoadingDetail(true);
    setExplorerOpen(true);
    const res = await fetchContractDetail(contractId);
    if (res.ok && res.data) {
      setSelectedContract(res.data);
    } else {
      setSelectedContract(null);
    }
    setLoadingDetail(false);
  };

  const handleDeleteContract = async (contractId) => {
    if (confirm("Are you sure you want to delete this contract? This will cascade delete all extracted clauses, risks, and dates.")) {
      await deleteContractApi(contractId);
      await loadDataForUser(currentUser);
    }
  };

  const handleClearAllContracts = async () => {
    if (
      confirm(
        "Are you sure you want to clear ALL contracts? This will permanently wipe all agreements, extracted clauses, risk flags, and milestone obligations to start from a 100% clean slate."
      )
    ) {
      await clearAllContractsApi();
      await loadDataForUser(currentUser);
    }
  };


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
              Deloitte Capstone
            </p>
          </div>
        </div>

        {/* User Persona Switcher */}
        <div className="px-5 py-3 border-b border-surface-700/60 bg-surface-950/40">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-surface-200">Active User:</span>
            <span className="badge bg-brand-500/20 text-brand-300 font-mono capitalize">
              {currentUser.role}
            </span>
          </div>
          <select
            value={currentUser.email}
            onChange={(e) => {
              const u = DEMO_USERS.find((x) => x.email === e.target.value);
              if (u) handleSwitchPersona(u);
            }}
            className="w-full bg-surface-800 border border-surface-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-500"
          >
            {DEMO_USERS.map((u) => (
              <option key={u.email} value={u.email}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
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
          <div className="card !p-3 bg-surface-800/80 border-surface-700">
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
              AI Contract Intelligence & Compliance Assistant — Phase 4 Operational
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200" />
              <input
                type="text"
                placeholder="Search contracts or clauses..."
                className="bg-surface-800 border border-surface-700 rounded-lg pl-10 pr-4 py-2 text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors w-64"
              />
            </div>

            <button className="relative p-2 rounded-lg bg-surface-800 border border-surface-700 hover:border-surface-200/30 transition-colors">
              <Bell className="w-4 h-4 text-surface-200" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface-900" />
            </button>
          </div>
        </header>

        {/* View Routing */}
        <div className="p-8 flex-1">
          {activeTab === "dashboard" && (
            <DashboardView
              contracts={contracts}
              allRisks={allRisks}
              onViewClauses={handleViewClauses}
              onDelete={handleDeleteContract}
              onClearAll={handleClearAllContracts}
              onNavigateUpload={() => setActiveTab("upload")}
            />
          )}
          {activeTab === "upload" && (
            <UploadView
              onUploadSuccess={async () => {
                await loadDataForUser(currentUser);
                setActiveTab("dashboard");
              }}
            />
          )}
          {activeTab === "risks" && (
            <RiskAnalysisView
              allRisks={allRisks}
              onViewClauses={handleViewClauses}
              onNavigateUpload={() => setActiveTab("upload")}
            />
          )}
          {activeTab === "obligations" && (
            <ObligationsView
              obligations={obligations}
              onNavigateUpload={() => setActiveTab("upload")}
            />
          )}
          {activeTab === "documents" && (
            <DocumentsView
              contracts={contracts}
              onViewClauses={handleViewClauses}
              onDelete={handleDeleteContract}
              onClearAll={handleClearAllContracts}
              onNavigateUpload={() => setActiveTab("upload")}
            />
          )}
          {activeTab === "audit" && <AuditTrailView currentUser={currentUser} />}
          {activeTab === "settings" && <SettingsView healthStatus={healthStatus} currentUser={currentUser} />}
        </div>
      </main>

      {/* ════════ CLAUSE EXPLORER MODAL (GROUNDED CITATION VIEWER) ════════ */}
      {explorerOpen && (
        <ClauseExplorerModal
          contract={selectedContract}
          loading={loadingDetail}
          onClose={() => {
            setExplorerOpen(false);
            setSelectedContract(null);
          }}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   VIEW COMPONENTS
   ════════════════════════════════════════════════════════════ */

function DashboardView({ contracts, allRisks, onViewClauses, onDelete, onClearAll, onNavigateUpload }) {
  const totalRisks = contracts.reduce((acc, c) => acc + (c.risk_count || 0), 0);
  const totalClauses = contracts.reduce((acc, c) => acc + (c.clause_count || 0), 0);
  const cleanContracts = contracts.filter((c) => (c.risk_count || 0) === 0).length;
  const complianceScore =
    contracts.length > 0
      ? `${Math.round((cleanContracts / contracts.length) * 100)}%`
      : "100%";

  const stats = [
    { label: "Contracts Ingested", value: contracts.length.toString(), icon: FileText, color: "text-brand-400", bg: "bg-brand-500/10" },
    { label: "Clauses Extracted", value: totalClauses.toString(), icon: ShieldCheck, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Grounded Risk Flags", value: totalRisks.toString(), icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Compliance Score", value: complianceScore, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  ];

  const criticalCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "critical").length;
  const highCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "high").length;
  const mediumCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "medium").length;
  const lowCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "low").length;
  const totalR = allRisks.length || 1;

  const severityData = [
    { level: "Critical", count: criticalCount, percent: allRisks.length ? Math.round((criticalCount / totalR) * 100) : 0, color: "bg-red-500" },
    { level: "High", count: highCount, percent: allRisks.length ? Math.round((highCount / totalR) * 100) : 0, color: "bg-amber-500" },
    { level: "Medium", count: mediumCount, percent: allRisks.length ? Math.round((mediumCount / totalR) * 100) : 0, color: "bg-yellow-500" },
    { level: "Low", count: lowCount, percent: allRisks.length ? Math.round((lowCount / totalR) * 100) : 0, color: "bg-green-500" },
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
        {/* Contracts Table */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Ingested Contracts Catalog</h3>
              <p className="text-xs text-surface-200">Protected by Row-Level Security (RLS)</p>
            </div>
            <div className="flex items-center gap-2">
              {contracts.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="Wipe all contracts to start fresh with live uploads"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
              <button
                onClick={onNavigateUpload}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors"
              >
                + Upload New
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {contracts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-surface-300 opacity-60" />
                <p className="text-sm font-medium text-white">No Contracts Uploaded</p>
                <p className="text-xs text-surface-200 max-w-sm mx-auto">
                  Upload a PDF, Word (DOCX), or Text contract to extract clauses and screen for compliance risks.
                </p>
                <button
                  onClick={onNavigateUpload}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors inline-block"
                >
                  Upload Contract
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-700 text-surface-200 text-xs uppercase">
                    <th className="py-2.5 font-medium">Contract</th>
                    <th className="py-2.5 font-medium">Clauses</th>
                    <th className="py-2.5 font-medium">Risks</th>
                    <th className="py-2.5 font-medium">Status</th>
                    <th className="py-2.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/50">
                  {contracts.map((c) => (
                    <tr key={c.contract_id} className="hover:bg-surface-750/30 transition-colors">
                      <td className="py-3 font-medium text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={c.file_name}>
                          {c.file_name}
                        </span>
                      </td>
                      <td className="py-3 text-surface-200 text-xs">{c.clause_count || 0}</td>
                      <td className="py-3">
                        {(c.risk_count || 0) > 0 ? (
                          <span className="badge bg-red-500/20 text-red-400 font-medium">
                            {c.risk_count} Flags
                          </span>
                        ) : (
                          <span className="badge bg-green-500/15 text-green-400">Clean</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="badge bg-green-500/15 text-green-400 capitalize">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onViewClauses(c.contract_id)}
                            className="text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline"
                          >
                            Explore Clauses
                          </button>
                          {onDelete && (
                            <button
                              onClick={() => onDelete(c.contract_id)}
                              className="p-1 text-surface-300 hover:text-red-400 transition-colors rounded hover:bg-surface-800"
                              title="Delete contract"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Grounding & Risk Distribution */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Risk Severity Spectrum</h3>
            <span className="badge bg-red-500/20 text-red-300">Live Grounding</span>
          </div>

          <div className="space-y-3">
            {severityData.map((r) => (
              <div key={r.level} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-surface-200">{r.level}</span>
                  <span className="text-white font-medium">{r.count}</span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color}`} style={{ width: `${r.percent}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-surface-900 rounded-lg border border-surface-700 text-xs text-surface-200 space-y-1.5">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              100% Citation Grounding
            </p>
            <p className="text-[11px] leading-relaxed">
              Every flagged risk strictly cites the contract&apos;s original clause text to eliminate AI
              hallucination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadView({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileProcess = async (file) => {
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = await uploadContractFile(file);
    setUploading(false);

    if (result.ok) {
      setSuccessMsg(`Successfully uploaded & analyzed "${file.name}"!`);
      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
    } else {
      setErrorMsg(result.error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) {
            handleFileProcess(e.dataTransfer.files[0]);
          }
        }}
        className={`card border-dashed border-2 p-12 text-center transition-all ${
          dragOver
            ? "border-brand-400 bg-brand-500/5"
            : "border-surface-700 hover:border-brand-500/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        <UploadCloud
          className={`w-12 h-12 mx-auto mb-4 ${
            uploading ? "text-brand-400 animate-bounce" : "text-brand-400"
          }`}
        />

        <h3 className="text-lg font-bold text-white mb-1">Upload Contract Agreement</h3>
        <p className="text-sm text-surface-200 mb-6">
          Drag and drop PDF or Word documents to initiate text extraction, semantic clause chunking,
          and grounded AI risk analysis.
        </p>

        {errorMsg && (
          <div className="p-3 mb-4 bg-red-500/15 border border-red-500/30 text-red-400 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg text-xs flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        <div className="flex justify-center gap-3 mb-6">
          <span className="badge bg-surface-700 text-surface-200">PDF (.pdf)</span>
          <span className="badge bg-surface-700 text-surface-200">Word (.docx)</span>
          <span className="badge bg-surface-700 text-surface-200">Text (.txt)</span>
        </div>

        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-brand-500/20 inline-flex items-center gap-2"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Extracting & Analyzing...
            </>
          ) : (
            "Select Document"
          )}
        </button>
      </div>

      {/* Pipeline Explanation */}
      <div className="card space-y-3">
        <h4 className="text-sm font-semibold text-white">Automated Processing Pipeline</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-surface-200">
          <div className="p-3 bg-surface-900/50 rounded-lg border border-surface-700">
            <p className="font-semibold text-white mb-1">1. Ingestion</p>
            Extracts raw text via PyPDF2 / python-docx with OCR fallback.
          </div>
          <div className="p-3 bg-surface-900/50 rounded-lg border border-surface-700">
            <p className="font-semibold text-white mb-1">2. Semantic Chunking</p>
            Splits text into logical section clauses while preserving document order.
          </div>
          <div className="p-3 bg-surface-900/50 rounded-lg border border-surface-700">
            <p className="font-semibold text-white mb-1">3. Grounded AI Screening</p>
            Screens against GDPR, auto-renewal, and liability policies, requiring exact text citations.
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskAnalysisView({ allRisks, onViewClauses, onNavigateUpload }) {
  const criticalCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "critical").length;
  const highCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "high").length;
  const mediumCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "medium").length;
  const lowCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "low").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white">Compliance Risk Flag Monitor</h3>
          <p className="text-xs text-surface-200">
            All risk flags are grounded against verbatim contract text to guarantee accuracy
          </p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="badge bg-red-500/20 text-red-300 font-semibold">{criticalCount} Critical</span>
          )}
          {highCount > 0 && (
            <span className="badge bg-amber-500/20 text-amber-300 font-semibold">{highCount} High</span>
          )}
          {mediumCount > 0 && (
            <span className="badge bg-yellow-500/20 text-yellow-300 font-semibold">{mediumCount} Medium</span>
          )}
          {lowCount > 0 && (
            <span className="badge bg-green-500/20 text-green-300 font-semibold">{lowCount} Low</span>
          )}
          {allRisks.length === 0 && (
            <span className="badge bg-green-500/15 text-green-400 font-semibold">All Clean</span>
          )}
        </div>
      </div>

      {allRisks.length === 0 ? (
        <div className="card text-center py-16 space-y-4">
          <ShieldCheck className="w-12 h-12 mx-auto text-green-400" />
          <h4 className="text-base font-bold text-white">No Compliance Risks Detected</h4>
          <p className="text-xs text-surface-200 max-w-md mx-auto">
            There are currently no risk flags for the agreements accessible to your account.
            Upload new contracts to run automated semantic screening.
          </p>
          <button
            onClick={onNavigateUpload}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors inline-block"
          >
            Upload Contract
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {allRisks.map((risk, idx) => {
            const level = risk.risk_level?.toLowerCase() || "low";
            const borderColors = {
              critical: "border-l-red-500",
              high: "border-l-amber-500",
              medium: "border-l-yellow-500",
              low: "border-l-green-500",
            };
            const badgeColors = {
              critical: "bg-red-500/20 text-red-400",
              high: "bg-amber-500/20 text-amber-400",
              medium: "bg-yellow-500/20 text-yellow-400",
              low: "bg-green-500/20 text-green-400",
            };

            return (
              <div
                key={risk.flag_id || idx}
                className={`card border-l-4 ${borderColors[level] || "border-l-brand-500"} space-y-3`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${badgeColors[level] || "bg-surface-700 text-white"} uppercase tracking-wide`}>
                      {risk.risk_level}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {risk.compliance_rule}
                    </h4>
                  </div>
                  {risk.file_name && (
                    <span className="text-xs text-surface-200 font-mono">{risk.file_name}</span>
                  )}
                </div>

                <p className="text-xs text-surface-200 leading-relaxed">
                  <strong className="text-surface-100">Analysis:</strong> {risk.explanation}
                </p>

                {risk.source_citation && (
                  <div className="p-3 bg-surface-900 rounded-lg border border-surface-700 text-xs font-mono text-brand-300">
                    <p className="text-[10px] uppercase font-bold text-surface-200 mb-1 font-sans">
                      Exact Source Citation (Grounding Evidence):
                    </p>
                    &ldquo;{risk.source_citation}&rdquo;
                  </div>
                )}

                {risk.contract_id && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onViewClauses(risk.contract_id)}
                      className="text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline flex items-center gap-1"
                    >
                      View in Contract Explorer &rarr;
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ObligationsView({ obligations, onNavigateUpload }) {
  const displayDates = Array.isArray(obligations) ? obligations : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Contract Obligations & Deadline Tracker</h3>
            <p className="text-xs text-surface-200">Real-time extracted milestone dates across accessible agreements</p>
          </div>
          <span className="badge bg-brand-500/20 text-brand-300">
            {displayDates.length} Milestone{displayDates.length !== 1 ? "s" : ""}
          </span>
        </div>

        {displayDates.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <CalendarClock className="w-10 h-10 mx-auto text-surface-300 opacity-60" />
            <p className="text-sm font-medium text-white">No Upcoming Obligations</p>
            <p className="text-xs text-surface-200 max-w-sm mx-auto">
              No milestones or renewal deadlines extracted yet. Upload agreements to track contract timelines.
            </p>
            {onNavigateUpload && (
              <button
                onClick={onNavigateUpload}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors inline-block"
              >
                Upload Contract
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayDates.map((d, i) => (
              <div
                key={d.date_id || i}
                className="flex items-center justify-between p-3.5 bg-surface-900/60 rounded-lg border border-surface-700/60 hover:border-surface-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-brand-400" />
                  <div>
                    <p className="text-sm font-semibold text-white capitalize">{d.event_type} Deadline</p>
                    <p className="text-xs text-surface-200">
                      Due: <span className="font-mono text-surface-100">{d.event_date}</span>
                      {d.file_name && <span> • {d.file_name}</span>}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  d.status === "overdue"
                    ? "bg-red-500/15 text-red-400"
                    : d.status === "completed"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-amber-500/15 text-amber-400"
                } capitalize`}>
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentsView({ contracts, onViewClauses, onDelete, onClearAll, onNavigateUpload }) {
  return (
    <div className="card space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Contract Documents Repository</h3>
          <p className="text-xs text-surface-200">Row-Level Security filtered view</p>
        </div>
        <div className="flex items-center gap-3">
          {contracts.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-medium transition-colors flex items-center gap-1.5"
              title="Clear all contracts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
          <span className="text-xs text-surface-200">{contracts.length} agreement{contracts.length !== 1 ? "s" : ""} on record</span>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <FileText className="w-10 h-10 mx-auto text-surface-300 opacity-60" />
          <p className="text-sm font-medium text-white">No Contracts Available</p>
          <p className="text-xs text-surface-200 max-w-sm mx-auto">
            No agreements match your permissions. Upload a document to start analyzing.
          </p>
          {onNavigateUpload && (
            <button
              onClick={onNavigateUpload}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium transition-colors inline-block"
            >
              Upload Contract
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {contracts.map((c) => (
            <div
              key={c.contract_id}
              className="flex items-center justify-between p-3.5 bg-surface-900/60 rounded-lg border border-surface-700 hover:border-surface-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-brand-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{c.file_name}</p>
                  <p className="text-xs text-surface-200">
                    UUID: {c.contract_id ? c.contract_id.substring(0, 8) : "..."}... • {c.clause_count || 0} Clauses •{" "}
                    {c.risk_count || 0} Flags
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onViewClauses(c.contract_id)}
                  className="px-3 py-1 bg-surface-800 hover:bg-surface-700 text-brand-300 border border-surface-700 text-xs rounded transition-colors"
                >
                  Explore Clauses
                </button>
                <button
                  onClick={() => onDelete(c.contract_id)}
                  className="p-1.5 text-surface-200 hover:text-red-400 transition-colors"
                  title="Delete contract"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AuditTrailView({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  const loadLogs = async () => {
    setLoading(true);
    const result = await fetchAuditLogs();
    if (result.ok && Array.isArray(result.data)) {
      setLogs(result.data);
    } else {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [currentUser]);

  const actionColors = {
    USER_LOGIN: { bg: "bg-blue-500/15", text: "text-blue-400" },
    CONTRACT_UPLOADED: { bg: "bg-green-500/15", text: "text-green-400" },
    CONTRACT_ANALYZED: { bg: "bg-brand-500/15", text: "text-brand-400" },
    CONTRACT_DELETED: { bg: "bg-red-500/15", text: "text-red-400" },
    ALL_CONTRACTS_CLEARED: { bg: "bg-red-500/20", text: "text-red-400" },
    AI_SETTINGS_UPDATED: { bg: "bg-purple-500/15", text: "text-purple-400" },
  };

  const actionTypes = [
    "all",
    "USER_LOGIN",
    "CONTRACT_UPLOADED",
    "CONTRACT_ANALYZED",
    "CONTRACT_DELETED",
    "ALL_CONTRACTS_CLEARED",
  ];

  const filteredLogs = filterAction === "all" ? logs : logs.filter((l) => l.action === filterAction);

  const formatAuditTimestamp = (raw) => {
    if (!raw) return "—";
    let str = String(raw);
    if (!str.endsWith("Z") && !str.includes("+") && !str.includes("-", 10)) {
      str += "Z";
    }
    const d = new Date(str);
    if (isNaN(d.getTime())) {
      const fallback = new Date(raw);
      if (!isNaN(fallback.getTime())) return fallback.toLocaleString();
      return String(raw);
    }
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            Audit Trail Log
          </h3>
          <p className="text-xs text-surface-200 mt-0.5">
            Immutable record of system actions governed by hierarchical Role-Based Access Control (RBAC)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-200">
            {filteredLogs.length} event{filteredLogs.length !== 1 ? "s" : ""} recorded
          </span>
          <button
            onClick={loadLogs}
            className="px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 rounded-lg text-xs font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Dynamic Role-Based Scope Banner */}
      <div className="p-3.5 bg-surface-800/80 rounded-lg border border-surface-700 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">Role-Based Audit Scope:</span>
              <span className="badge bg-brand-500/20 text-brand-300 font-mono text-[10px] uppercase">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-surface-200 mt-0.5">
              {currentUser.role === "admin" &&
                "Global Enterprise View — You have full visibility across all system events (Admin, Reviewer, Viewer, and System)."}
              {currentUser.role === "reviewer" &&
                "Hierarchical Scope — You can view your own activity and lower role (Viewer) events. Upper role (Admin) events are restricted."}
              {currentUser.role === "viewer" &&
                "Self-Activity Scope — You can strictly view your own audit trail events. Upper role (Reviewer, Admin) events are restricted."}
            </p>
          </div>
        </div>
        <span className="text-[11px] text-surface-300 font-mono shrink-0 hidden sm:inline">
          Strict RBAC Filter Active
        </span>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {actionTypes.map((action) => {
          const isActive = filterAction === action;
          const colors = action === "all" ? { bg: "bg-surface-700", text: "text-white" } : (actionColors[action] || { bg: "bg-surface-700", text: "text-surface-200" });
          return (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isActive
                  ? `${colors.bg} ${colors.text} border-current shadow-sm`
                  : "bg-surface-800/60 text-surface-200 border-surface-700 hover:border-surface-600"
              }`}
            >
              {action === "all" ? "All Events" : action.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      {/* Audit Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-5 h-5 text-brand-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-surface-200">Loading audit events...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-surface-200 text-xs uppercase bg-surface-950/50">
                  <th className="py-3 px-5 font-medium">Timestamp</th>
                  <th className="py-3 px-5 font-medium">Action</th>
                  <th className="py-3 px-5 font-medium">User</th>
                  <th className="py-3 px-5 font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => {
                    const colors = actionColors[log.action] || { bg: "bg-surface-700", text: "text-surface-200" };
                    return (
                      <tr key={log.log_id || log.id || idx} className="hover:bg-surface-800/40 transition-colors">
                        <td className="py-3 px-5 text-xs text-surface-200 font-mono whitespace-nowrap">
                          {formatAuditTimestamp(log.timestamp || log.created_at)}
                        </td>
                        <td className="py-3 px-5">
                          <span className={`badge ${colors.bg} ${colors.text} text-xs font-semibold`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-xs text-white font-mono">
                          {log.user_email || "system"}
                        </td>
                        <td className="py-3 px-5 text-xs text-surface-200 max-w-sm truncate" title={log.details || log.detail}>
                          {log.details || log.detail || "System event recorded"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-sm text-surface-200">
                      No audit events match your role permissions or the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card !p-4 bg-surface-800/60 border-surface-700 space-y-2">
        <p className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-brand-400" />
          Tamper-Proof Hierarchical Audit Architecture
        </p>
        <p className="text-[11px] text-surface-200 leading-relaxed">
          Every system action (login, upload, analysis, deletion, settings change) is recorded as an immutable
          audit log entry with a server-side timestamp. Row-Level Security and Role-Based Access Control ensure
          that higher-level actions are never leaked to lower-tier roles, satisfying SOC 2 Type II, ISO 27001,
          and enterprise compliance review requirements.
        </p>
      </div>
    </div>
  );
}

function SettingsView({ healthStatus, currentUser }) {
  const [aiStatus, setAiStatus] = useState(null);
  const [provider, setProvider] = useState("groq");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [baseUrl, setBaseUrl] = useState("https://api.groq.com/openai/v1");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    const res = await fetchAIStatus();
    if (res.ok && res.data) {
      setAiStatus(res.data);
      if (res.data.provider) setProvider(res.data.provider);
      if (res.data.model) setModel(res.data.model);
      if (res.data.base_url) setBaseUrl(res.data.base_url);
    }
  };

  const handleProviderSelect = (p) => {
    setProvider(p);
    if (p === "groq") {
      setModel("llama-3.3-70b-versatile");
      setBaseUrl("https://api.groq.com/openai/v1");
    } else if (p === "gemini") {
      setModel("gemini-2.0-flash");
      setBaseUrl("https://generativelanguage.googleapis.com/v1beta/openai/");
    } else if (p === "openai") {
      setModel("gpt-4o-mini");
      setBaseUrl("https://api.openai.com/v1");
    } else {
      setModel("");
      setBaseUrl("");
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!apiKey.trim() && !aiStatus?.api_key_configured) {
      setSaveMessage({ type: "error", text: "Please provide an API key to enable live cloud LLM screening." });
      return;
    }
    setLoading(true);
    setSaveMessage(null);
    const res = await saveAIConfig({
      provider,
      api_key: apiKey.trim() || undefined,
      model: model.trim() || undefined,
      base_url: baseUrl.trim() || undefined,
    });
    setLoading(false);
    if (res.ok) {
      setSaveMessage({
        type: "success",
        text: `AI Engine updated! Live LLM status: ${res.data?.live_llm_ready ? "ONLINE & READY" : "RULE-BASED (Awaiting Key)"}`,
      });
      await loadStatus();
      setApiKey("");
    } else {
      setSaveMessage({ type: "error", text: res.error || "Failed to update AI settings" });
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Live AI Engine Configuration Card */}
      <div className="card space-y-5 border-brand-500/30 bg-gradient-to-b from-surface-900 to-surface-950">
        <div className="flex items-center justify-between pb-3 border-b border-surface-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Cloud AI Engine Configuration
                {aiStatus?.live_llm_ready ? (
                  <span className="badge bg-green-500/20 text-green-300 font-mono text-[10px]">
                    ● LIVE LLM ACTIVE
                  </span>
                ) : (
                  <span className="badge bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                    VERBATIM RULE ENGINE
                  </span>
                )}
              </h3>
              <p className="text-xs text-surface-200">
                Direct Cloud LLM inference with zero-hallucination verbatim citation verification.
              </p>
            </div>
          </div>
        </div>

        {/* Free API Key Suggestions */}
        <div className="p-3 bg-surface-800/60 rounded-lg border border-surface-700 text-xs space-y-2">
          <p className="text-white font-medium flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-brand-400" /> Recommended Free & Fast LLM API Keys:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded bg-surface-900 hover:bg-surface-750 border border-surface-700 text-surface-200 hover:text-white flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold text-brand-300">Groq Cloud (Free)</span>
                <p className="text-[11px] text-surface-300">Llama 3.3 70B • ~500 tokens/sec</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
            </a>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded bg-surface-900 hover:bg-surface-750 border border-surface-700 text-surface-200 hover:text-white flex items-center justify-between transition-colors"
            >
              <div>
                <span className="font-semibold text-blue-300">Google AI Studio (Free)</span>
                <p className="text-[11px] text-surface-300">Gemini 2.0 Flash • High Speed</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
            </a>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-surface-200 font-medium mb-1.5">AI Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderSelect(e.target.value)}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-xs focus:border-brand-500 focus:outline-none"
              >
                <option value="groq">Groq Cloud (Free & Ultra Fast)</option>
                <option value="gemini">Google Gemini (Free Tier via OpenAI endpoint)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="custom">Custom OpenAI-Compatible Endpoint</option>
              </select>
            </div>

            <div>
              <label className="block text-surface-200 font-medium mb-1.5">Model Identifier</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama-3.3-70b-versatile, gemini-2.0-flash, gpt-4o-mini"
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-surface-200 font-medium mb-1.5">
              API Key {aiStatus?.api_key_configured && <span className="text-green-400">(Key Currently Set)</span>}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={aiStatus?.api_key_configured ? "Enter new key to change, or leave blank to keep" : "Paste your API key here (e.g. gsk_... or AIza...)"}
                className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-xs font-mono pr-10 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-2 text-surface-400 hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-surface-200 font-medium mb-1.5">API Base URL (Optional)</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.groq.com/openai/v1"
              className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:border-brand-500 focus:outline-none"
            />
          </div>

          {saveMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                saveMessage.type === "success"
                  ? "bg-green-500/15 border border-green-500/30 text-green-300"
                  : "bg-red-500/15 border border-red-500/30 text-red-300"
              }`}
            >
              {saveMessage.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{saveMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-surface-300">
              Active Provider: <strong className="text-white capitalize">{aiStatus?.provider || provider}</strong> • Model:{" "}
              <strong className="text-white">{aiStatus?.model || model}</strong>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Save & Test AI Engine
            </button>
          </div>
        </form>
      </div>

      {/* Architecture & RBAC Card */}
      <div className="card space-y-4">
        <h3 className="text-sm font-bold text-white">System Architecture & Capabilities</h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">Active User:</span>
            <span className="font-semibold text-white">
              {currentUser.name} ({currentUser.email})
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">Assigned RBAC Role:</span>
            <span className="badge bg-brand-500/20 text-brand-300 uppercase font-mono">
              {currentUser.role}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">Database Engine:</span>
            <span className="font-mono text-white">{healthStatus.dialect} (PostgreSQL + pgvector ready)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-700">
            <span className="text-surface-200">AI Grounding Protocol:</span>
            <span className="text-green-400 font-semibold">Strict Citation Verification (Zero Hallucination)</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-surface-200">API Endpoint:</span>
            <span className="font-mono text-surface-100">http://localhost:8000/api</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CLAUSE EXPLORER MODAL WITH HIGHLIGHTED CITATIONS
   ════════════════════════════════════════════════════════════ */

function ClauseExplorerModal({ contract, loading, onClose }) {
  const [riskFilter, setRiskFilter] = useState("all");

  if (!contract && loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="card p-6 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-brand-400 animate-spin" />
          <span className="text-sm text-white">Loading contract clauses & citations...</span>
        </div>
      </div>
    );
  }

  if (!contract) return null;


  const filterLabels = [
    { key: "all", label: "All Clauses", color: "bg-surface-700 text-white" },
    { key: "critical", label: "Critical", color: "bg-red-500/20 text-red-400" },
    { key: "high", label: "High", color: "bg-amber-500/20 text-amber-400" },
    { key: "compliant", label: "Compliant", color: "bg-green-500/15 text-green-400" },
  ];

  const filteredClauses = (contract.clauses || []).filter((clause) => {
    if (riskFilter === "all") return true;
    if (riskFilter === "compliant") return !clause.risk_flags || clause.risk_flags.length === 0;
    return clause.risk_flags?.some((r) => r.risk_level === riskFilter);
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in">
      <div className="card max-w-4xl w-full max-h-[85vh] flex flex-col p-0 overflow-hidden bg-surface-900 border-surface-700 shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-700 flex flex-col gap-3 bg-surface-950/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                {contract.file_name}
              </h3>
              <p className="text-xs text-surface-200">
                Contract Explorer • Grounded AI Citation View
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-surface-200 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-surface-200" />
            {filterLabels.map((f) => (
              <button
                key={f.key}
                onClick={() => setRiskFilter(f.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                  riskFilter === f.key
                    ? `${f.color} border-current shadow-sm`
                    : "bg-surface-800/60 text-surface-200 border-surface-700 hover:border-surface-600"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-surface-200">
              {filteredClauses.length} of {(contract.clauses || []).length} clause{(contract.clauses || []).length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {filteredClauses.length > 0 ? (
            filteredClauses.map((clause) => {
              const hasRisks = clause.risk_flags && clause.risk_flags.length > 0;
              return (
                <div
                  key={clause.clause_index}
                  className={`p-4 rounded-xl border ${
                    hasRisks ? "border-amber-500/40 bg-surface-800/60" : "border-surface-700 bg-surface-900/50"
                  } space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <span className="badge bg-surface-700 text-surface-200 text-xs">
                      Clause #{clause.clause_index}
                    </span>
                    {hasRisks ? (
                      <span className="badge bg-red-500/20 text-red-400 text-xs font-semibold">
                        {clause.risk_flags.length} Risk Flagged
                      </span>
                    ) : (
                      <span className="badge bg-green-500/15 text-green-400 text-xs">Compliant</span>
                    )}
                  </div>

                  {/* Clause Text */}
                  <p className="text-xs text-surface-100 leading-relaxed font-sans">
                    {clause.original_text}
                  </p>

                  {/* Grounded Risk Flags */}
                  {hasRisks && (
                    <div className="space-y-2.5 pt-2 border-t border-surface-700/60">
                      {clause.risk_flags.map((risk, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 rounded-lg bg-surface-900 border border-red-500/30 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-400 uppercase tracking-wide text-[11px]">
                              [{risk.risk_level}] {risk.compliance_rule}
                            </span>
                          </div>
                          <p className="text-surface-200 text-xs">{risk.explanation}</p>
                          <div className="p-2 bg-surface-950 rounded border border-brand-500/30 text-[11px] font-mono text-brand-300">
                            <span className="text-[10px] text-surface-200 block uppercase font-sans font-bold mb-0.5">
                              Exact Cited Text (Hallucination Grounding):
                            </span>
                            &ldquo;{risk.source_citation}&rdquo;
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-surface-200 text-sm">
              No clauses extracted for this contract yet.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-surface-700 flex justify-end bg-surface-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
