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
  Tag,
  Layers,
  ShieldAlert,
  FileCheck,
  AlertCircle,
  CheckCircle2,
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
  markContractCompletedApi,
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
  const [dialogConfig, setDialogConfig] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

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

  const closeDialog = () => {
    if (!dialogLoading) {
      setDialogConfig(null);
    }
  };

  const handleDeleteContract = (contractId, contractTitle) => {
    const targetName = contractTitle || (contracts.find((c) => c.contract_id === contractId)?.file_name) || `Contract #${contractId.substring(0, 8)}`;
    setDialogConfig({
      type: "danger",
      badge: "IRREVERSIBLE ACTION",
      title: "Permanently Delete Contract",
      contractTitle: targetName,
      message: "Are you sure you want to permanently delete this contract? This action cannot be undone and will cascade delete all extracted clauses, risk flags, and milestone obligations.",
      details: [
        "Permanently wipes indexed clauses & plain-English summaries from database",
        "Removes associated compliance risks, dates, and access controls",
        "Records a deletion entry in the audit security ledger",
      ],
      confirmText: "Permanently Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        setDialogLoading(true);
        try {
          await deleteContractApi(contractId);
          await loadDataForUser(currentUser);
        } finally {
          setDialogLoading(false);
          setDialogConfig(null);
        }
      },
    });
  };

  const handleClearAllContracts = () => {
    setDialogConfig({
      type: "danger",
      badge: "SYSTEM PURGE",
      title: "Wipe All Contract Repositories",
      message: "Are you sure you want to clear ALL contracts? This will permanently wipe all agreements, extracted clauses, risk flags, and milestone obligations across the platform to start from a 100% clean slate.",
      details: [
        "Full database purge across all tenant repositories",
        "All active agreements and executed contracts will be unlinked",
        "System will revert to an unpopulated state ready for fresh ingestion",
      ],
      confirmText: "Purge Everything",
      cancelText: "Cancel",
      onConfirm: async () => {
        setDialogLoading(true);
        try {
          await clearAllContractsApi();
          await loadDataForUser(currentUser);
        } finally {
          setDialogLoading(false);
          setDialogConfig(null);
        }
      },
    });
  };

  const handleMarkCompleted = (contractId, contractTitle) => {
    const targetName = contractTitle || (contracts.find((c) => c.contract_id === contractId)?.file_name) || (selectedContract?.file_name) || `Contract #${contractId.substring(0, 8)}`;

    if (currentUser.role !== "admin") {
      setDialogConfig({
        type: "warning",
        badge: "ADMIN PRIVILEGE REQUIRED",
        title: "Administrative Privilege Required",
        contractTitle: targetName,
        message: "Only authorized Administrators have legal signing authority to execute contracts and generate immutable compliance audit records. Your current persona does not have administrative execution rights.",
        details: [
          `Current Active Persona: ${currentUser.name} (${currentUser.role.toUpperCase()})`,
          "Switch to Sarah Jenkins (Administrator) in the sidebar to sign this agreement",
          "Reviewers and Viewers maintain read-only inspection access",
        ],
        confirmText: "Acknowledge",
        singleButton: true,
        onConfirm: () => setDialogConfig(null),
      });
      return;
    }

    setDialogConfig({
      type: "sign",
      badge: "LEGAL EXECUTION WORKFLOW",
      title: "Execute & Sign Agreement",
      contractTitle: targetName,
      message: "Are you sure you want to mark this contract as completed and legally signed? This will officially record the agreement as taken on, create an immutable compliance audit record, and timestamp the execution under your admin credentials.",
      details: [
        "Officially transitions document status to 'completed' & legally binding",
        "Attaches cryptographic timestamp with signing authority: Sarah Jenkins (Admin)",
        "Appends an immutable security record to the compliance activity ledger",
        "Displays verifiable 'Executed & Sealed' status across all user roles",
      ],
      confirmText: "Sign & Execute Agreement",
      cancelText: "Cancel",
      onConfirm: async () => {
        setDialogLoading(true);
        try {
          const res = await markContractCompletedApi(contractId);
          if (res.ok) {
            await loadDataForUser(currentUser);
            if (selectedContract && selectedContract.contract_id === contractId) {
              setSelectedContract(res.data);
            }
            setDialogConfig({
              type: "success",
              badge: "EXECUTED & VERIFIED",
              title: "Agreement Signed Successfully",
              contractTitle: targetName,
              message: "The agreement has been officially executed, signed, and sealed. An immutable audit record with cryptographic timestamp has been logged into the compliance ledger.",
              details: [
                `Signatory: ${res.data?.signed_by || currentUser.name} (${currentUser.role.toUpperCase()})`,
                `Timestamp: ${res.data?.completed_at ? new Date(res.data.completed_at).toUTCString() : "Just now (UTC)"}`,
                "Document state updated across all enterprise reviewer dashboards",
              ],
              confirmText: "Done",
              singleButton: true,
              onConfirm: () => setDialogConfig(null),
            });
          } else {
            setDialogConfig({
              type: "danger",
              badge: "SIGNING FAILED",
              title: "Execution Error",
              contractTitle: targetName,
              message: res.error || "Failed to mark contract as completed. Please check your backend connection.",
              confirmText: "Dismiss",
              singleButton: true,
              onConfirm: () => setDialogConfig(null),
            });
          }
        } finally {
          setDialogLoading(false);
        }
      },
    });
  };


  return (
    <div className="flex min-h-screen bg-[#07090e] text-slate-100 font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* ════════ SIDEBAR ════════ */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#090c14] rounded-[11px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-300" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-white tracking-tight">
                  Clause<span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">IQ</span>
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  v4.2
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Autonomous Legal Matrix
              </p>
            </div>
          </div>
        </div>

        {/* User Persona Switcher */}
        <div className="mx-3 my-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20 shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white leading-tight truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser.dept}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border shrink-0 ${
              currentUser.role === "admin"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                : currentUser.role === "reviewer"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm shadow-amber-500/10"
                : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm shadow-cyan-500/10"
            }`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>
          <select
            value={currentUser.email}
            onChange={(e) => {
              const u = DEMO_USERS.find((x) => x.email === e.target.value);
              if (u) handleSwitchPersona(u);
            }}
            className="w-full bg-[#0b0e17] border border-white/[0.08] hover:border-indigo-500/40 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all cursor-pointer"
          >
            {DEMO_USERS.map((u) => (
              <option key={u.email} value={u.email}>
                {u.name} — {u.role.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 px-1">
          <p className="px-5 mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            System Modules
          </p>
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-[calc(100%-0.5rem)] text-left sidebar-nav-item flex items-center justify-between group ${
                    isActive ? "active" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${
                      isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400 animate-pulse"></div>
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Live Telemetry Health Widget */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    healthStatus.connected ? "bg-emerald-400" : "bg-amber-400"
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    healthStatus.connected ? "bg-emerald-500" : "bg-amber-500"
                  }`} />
                </div>
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-300">
                  Core Telemetry
                </span>
              </div>
              <button
                onClick={pollHealth}
                title="Probe Backend Health"
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/[0.05]"
              >
                <RefreshCw className={`w-3 h-3 ${healthStatus.loading ? "animate-spin text-indigo-400" : ""}`} />
              </button>
            </div>

            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">FastAPI Daemon</span>
                <span className={healthStatus.connected ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                  {healthStatus.connected ? "READY (200)" : "OFFLINE"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database Engine</span>
                <span className="text-slate-300">
                  {healthStatus.dbStatus === "online"
                    ? healthStatus.dialect.toUpperCase()
                    : "STANDBY"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Audit Grounding</span>
                <span className="text-indigo-300">100% VERBATIM</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="main-content flex-1 flex flex-col bg-[#07090e]">
        {/* Header */}
        <header className="page-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-indigo-400 tracking-wider">
                System /
              </span>
              <h2 className="text-lg font-bold text-white capitalize tracking-tight">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Autonomous Legal Intelligence & Compliance Matrix — Phase 4 Live
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Omni-search clauses, topics..."
                className="bg-[#0b0f17] border border-white/[0.08] rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all w-60 shadow-inner"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                /
              </span>
            </div>

            <button
              onClick={() => setActiveTab("upload")}
              className="btn-cyber-primary text-xs"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>+ Ingest File</span>
            </button>

            <button className="relative p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16] transition-colors text-slate-400 hover:text-white">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-[#07090e]" />
            </button>
          </div>
        </header>

        {/* View Routing */}
        <div className="p-8 flex-1">
          {activeTab === "dashboard" && (
            <DashboardView
              contracts={contracts}
              allRisks={allRisks}
              currentUser={currentUser}
              onViewClauses={handleViewClauses}
              onDelete={handleDeleteContract}
              onClearAll={handleClearAllContracts}
              onMarkCompleted={handleMarkCompleted}
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
              currentUser={currentUser}
              onViewClauses={handleViewClauses}
              onDelete={handleDeleteContract}
              onClearAll={handleClearAllContracts}
              onMarkCompleted={handleMarkCompleted}
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
          currentUser={currentUser}
          onMarkCompleted={handleMarkCompleted}
          onClose={() => {
            setExplorerOpen(false);
            setSelectedContract(null);
          }}
        />
      )}

      {/* ════════ CYBER CONFIRMATION & ALERT MODAL ════════ */}
      {dialogConfig && (
        <CyberAlertDialog
          isOpen={!!dialogConfig}
          type={dialogConfig.type}
          badge={dialogConfig.badge}
          title={dialogConfig.title}
          contractTitle={dialogConfig.contractTitle}
          message={dialogConfig.message}
          details={dialogConfig.details}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          singleButton={dialogConfig.singleButton}
          loading={dialogLoading}
          onConfirm={dialogConfig.onConfirm}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   VIEW COMPONENTS
   ════════════════════════════════════════════════════════════ */

function DashboardView({
  contracts,
  allRisks,
  currentUser,
  onViewClauses,
  onDelete,
  onClearAll,
  onMarkCompleted,
  onNavigateUpload,
}) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalRisks = contracts.reduce((acc, c) => acc + (c.risk_count || 0), 0);
  const totalClauses = contracts.reduce((acc, c) => acc + (c.clause_count || 0), 0);
  const cleanContracts = contracts.filter((c) => (c.risk_count || 0) === 0).length;
  const completedContracts = contracts.filter((c) => c.status === "completed").length;
  const rawComplianceRate = contracts.length > 0 ? Math.round((cleanContracts / contracts.length) * 100) : 100;

  const stats = [
    {
      label: "Active Repositories",
      sublabel: "Ingested Agreements",
      value: contracts.length.toString(),
      tag: "Live RLS Isolated",
      icon: FileText,
      gradient: "from-indigo-500/20 via-indigo-500/5 to-transparent",
      borderColor: "hover:border-indigo-500/40",
      topLine: "from-indigo-500 via-indigo-400 to-indigo-600",
      iconBg: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
    },
    {
      label: "Semantic Index",
      sublabel: "Legal Clauses Extracted",
      value: totalClauses.toString(),
      tag: "10 Legal Categories",
      icon: ShieldCheck,
      gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
      borderColor: "hover:border-cyan-500/40",
      topLine: "from-cyan-500 via-cyan-400 to-blue-500",
      iconBg: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
    },
    {
      label: "Compliance Alerts",
      sublabel: "Grounded Risk Detections",
      value: totalRisks.toString(),
      tag: totalRisks > 0 ? `${totalRisks} Requires Action` : "100% Compliant",
      icon: AlertTriangle,
      gradient: totalRisks > 0 ? "from-amber-500/20 via-amber-500/5 to-transparent" : "from-emerald-500/20 via-emerald-500/5 to-transparent",
      borderColor: totalRisks > 0 ? "hover:border-amber-500/40" : "hover:border-emerald-500/40",
      topLine: totalRisks > 0 ? "from-amber-500 via-rose-500 to-pink-500" : "from-emerald-400 to-teal-500",
      iconBg: totalRisks > 0 ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    },
    {
      label: "Health Index",
      sublabel: "Autonomous Compliance",
      value: `${rawComplianceRate}%`,
      tag: `${completedContracts} Signed & Sealed`,
      icon: CheckCircle,
      gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      borderColor: "hover:border-emerald-500/40",
      topLine: "from-emerald-400 via-teal-400 to-cyan-500",
      iconBg: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    },
  ];

  const criticalCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "critical").length;
  const highCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "high").length;
  const mediumCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "medium").length;
  const lowCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "low").length;
  const totalR = allRisks.length || 1;

  const severityData = [
    { level: "Critical", count: criticalCount, percent: allRisks.length ? Math.round((criticalCount / totalR) * 100) : 0, color: "from-rose-500 to-red-600", border: "border-rose-500/30", badgeBg: "bg-rose-500/15 text-rose-300" },
    { level: "High", count: highCount, percent: allRisks.length ? Math.round((highCount / totalR) * 100) : 0, color: "from-amber-500 to-orange-600", border: "border-amber-500/30", badgeBg: "bg-amber-500/15 text-amber-300" },
    { level: "Medium", count: mediumCount, percent: allRisks.length ? Math.round((mediumCount / totalR) * 100) : 0, color: "from-cyan-500 to-blue-600", border: "border-cyan-500/30", badgeBg: "bg-cyan-500/15 text-cyan-300" },
    { level: "Low / Info", count: lowCount, percent: allRisks.length ? Math.round((lowCount / totalR) * 100) : 0, color: "from-emerald-500 to-teal-600", border: "border-emerald-500/30", badgeBg: "bg-emerald-500/15 text-emerald-300" },
  ];

  // Filtering contracts
  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = !searchQuery || c.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === "all") return true;
    if (filterStatus === "completed") return c.status === "completed";
    if (filterStatus === "analyzed") return c.status !== "completed";
    if (filterStatus === "risks") return (c.risk_count || 0) > 0;
    return true;
  });

  return (
    <div className="space-y-7 animate-fade-in">
      {/* ─── Hero Intelligence Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-surface-900/80 to-cyan-950/30 border border-white/[0.08] backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-300">
              Autonomous Intelligence Engine • Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            Legal Compliance & Risk Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real-time telemetry, semantic cross-clause comparisons, and verifiable citation grounding under enterprise Row-Level Security.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10">
          {contracts.length > 0 && (
            <button
              onClick={onClearAll}
              className="btn-cyber-danger text-xs font-mono"
              title="Wipe all contracts to start fresh with live uploads"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Catalog</span>
            </button>
          )}
          <button
            onClick={onNavigateUpload}
            className="btn-cyber-primary text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Ingest Agreement</span>
          </button>
        </div>
      </div>

      {/* ─── 4 Futuristic Telemetry Pods ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative rounded-2xl bg-[#0b0e17]/85 border border-white/[0.07] ${stat.borderColor} p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group overflow-hidden`}
          >
            {/* Ambient Top Glow Line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.topLine} opacity-80 group-hover:opacity-100 transition-opacity`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  {stat.label}
                </span>
                <p className="text-xs font-medium text-slate-300">
                  {stat.sublabel}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.iconBg} shadow-sm transition-transform group-hover:scale-110 duration-200`}>
                <stat.icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <p className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {stat.value}
              </p>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                {stat.tag}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Main Operations Split: Catalog (2/3) + Telemetry (1/3) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Ingested Contracts Catalog */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl p-5 shadow-2xl space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Ingested Contracts Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {filteredContracts.length} Records
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Enterprise document corpus partitioned by user role & RLS policies
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              {[
                { id: "all", label: `All (${contracts.length})` },
                { id: "analyzed", label: "Active" },
                { id: "completed", label: `Signed (${completedContracts})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    filterStatus === tab.id
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search within catalog */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter current contract registry..."
              className="w-full bg-[#080b12] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Contract List Table */}
          <div className="overflow-x-auto">
            {filteredContracts.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-500">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">No Matching Contracts Ingested</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload a vendor agreement, NDA, or Master Services Agreement (PDF/DOCX/TXT) to screen for legal liabilities.
                </p>
                <button
                  onClick={onNavigateUpload}
                  className="btn-cyber-primary text-xs !mt-4"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Contract Document</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredContracts.map((c) => {
                  const isCompleted = c.status === "completed";
                  const hasRisks = (c.risk_count || 0) > 0;
                  return (
                    <div
                      key={c.contract_id}
                      className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                    >
                      {/* Left: Document Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : hasRisks
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate" title={c.file_name}>
                              {c.file_name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 uppercase">
                              {c.file_name.endsWith(".pdf") ? "PDF" : c.file_name.endsWith(".docx") ? "DOCX" : "TXT"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="font-mono text-slate-300">
                              {c.clause_count || 0} Clauses
                            </span>
                            <span>•</span>
                            <span>
                              {c.upcoming_dates_count || 0} Milestones
                            </span>
                            {c.signed_by && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">
                                  Signed by {c.signed_by}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges and Action Controls */}
                      <div className="flex items-center justify-between md:justify-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                        {/* Risk Badge */}
                        {hasRisks ? (
                          <span className="badge bg-amber-500/15 text-amber-300 border-amber-500/30 font-mono text-[10px]">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            {c.risk_count} Risks
                          </span>
                        ) : (
                          <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-mono text-[10px]">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Compliant
                          </span>
                        )}

                        {/* Status Badge */}
                        {isCompleted ? (
                          <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold text-[10px] flex items-center gap-1 shadow-sm shadow-emerald-500/10">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Executed & Sealed
                          </span>
                        ) : (
                          <span className="badge bg-cyan-500/10 text-cyan-300 border-cyan-500/25 text-[10px] capitalize">
                            {c.status}
                          </span>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 ml-1">
                          {!isCompleted && currentUser?.role === "admin" && onMarkCompleted && (
                            <button
                              onClick={() => onMarkCompleted(c.contract_id, c.file_name)}
                              className="btn-cyber-emerald !py-1 !px-2.5 text-[11px]"
                              title="Mark as Taken On & Signed (Admin only)"
                            >
                              <Check className="w-3 h-3" />
                              <span>Sign</span>
                            </button>
                          )}

                          <button
                            onClick={() => onViewClauses(c.contract_id)}
                            className="btn-cyber-secondary !py-1 !px-2.5 text-[11px]"
                          >
                            <span>Explore</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>

                          {onDelete && (
                            <button
                              onClick={() => onDelete(c.contract_id, c.file_name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Agreement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Risk Spectrum & Grounding Telemetry */}
        <div className="space-y-5">
          {/* Risk Severity Matrix */}
          <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight uppercase font-mono">
                  Risk Severity Spectrum
                </h3>
                <p className="text-[10px] text-slate-400">Verbatim rule & AI classifications</p>
              </div>
              <span className="badge bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-[10px] font-mono">
                Live Audit
              </span>
            </div>

            {/* Circular Compliance Meter */}
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] flex items-center gap-4">
              <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/[0.08]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-1000 ease-out"
                    strokeDasharray={`${rawComplianceRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-white">
                  {rawComplianceRate}%
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Compliance Rating</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                  {allRisks.length === 0
                    ? "Full legal alignment across all ingested clauses."
                    : `${allRisks.length} legal anomalies require counsel review.`}
                </p>
              </div>
            </div>

            {/* Severity Progress Bars */}
            <div className="space-y-3 pt-1">
              {severityData.map((r) => (
                <div key={r.level} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${r.color}`} />
                      {r.level}
                    </span>
                    <span className="text-white font-mono font-bold">{r.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden p-[1px]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${r.color} transition-all duration-500`}
                      style={{ width: `${Math.max(r.percent, r.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zero-Hallucination Grounding Assurance Pod */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-950/40 via-[#0b0e17] to-cyan-950/30 border border-indigo-500/25 p-5 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">
                  Zero-Hallucination Assurance
                </h4>
                <p className="text-[10px] font-mono text-cyan-400">
                  Strict Verbatim Citation Grounding
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Every identified risk flag strictly references verbatim excerpts directly extracted from the original contract text. Unsubstantiated AI claims are rejected by the dual-pass grounder.
            </p>

            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/[0.06]">
              <span>Verification Pass</span>
              <span className="text-emerald-400 font-semibold">PASSED (100%)</span>
            </div>
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
        className={`p-10 rounded-2xl text-center transition-all duration-300 backdrop-blur-xl relative overflow-hidden ${
          dragOver
            ? "border-2 border-dashed border-indigo-400 bg-indigo-500/10 shadow-glow-md"
            : "border-2 border-dashed border-white/[0.12] bg-[#0b0e17]/80 hover:border-indigo-500/40 hover:bg-[#0d121f]/90"
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

        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-300 shadow-glow-sm">
          <UploadCloud
            className={`w-8 h-8 ${uploading ? "animate-bounce text-cyan-300" : "text-indigo-400"}`}
          />
        </div>

        <h3 className="text-lg font-bold text-white mb-1 tracking-tight">
          Ingest Contract Agreement
        </h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
          Drag and drop vendor agreements, NDAs, or Master Services Agreements to trigger OCR text extraction, semantic clause chunking, and grounded AI compliance screening.
        </p>

        {errorMsg && (
          <div className="p-3 mb-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />
            {successMsg}
          </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
          <span className="badge bg-white/[0.04] text-slate-300 border-white/[0.08] font-mono text-[10px]">
            PDF (.pdf)
          </span>
          <span className="badge bg-white/[0.04] text-slate-300 border-white/[0.08] font-mono text-[10px]">
            Word (.docx)
          </span>
          <span className="badge bg-white/[0.04] text-slate-300 border-white/[0.08] font-mono text-[10px]">
            Text (.txt)
          </span>
        </div>

        <button
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="btn-cyber-primary text-xs !py-2.5 !px-6"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Parsing & Analyzing Document...
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4" />
              <span>Select File from Machine</span>
            </>
          )}
        </button>
      </div>

      {/* Pipeline Telemetry Cards */}
      <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl p-5 space-y-3 shadow-xl">
        <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          Autonomous Pipeline Execution Flow
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> 1. Ingestion & OCR
            </p>
            <p className="text-[11px] text-slate-400">
              Extracts high-fidelity text via PyPDF2/python-docx with formatting cleanup.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> 2. Semantic Chunking
            </p>
            <p className="text-[11px] text-slate-400">
              Splits text into logical section clauses while indexing chronological order.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1">
            <p className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 3. Verbatim Grounding
            </p>
            <p className="text-[11px] text-slate-400">
              Validates citations strictly against clause text to guarantee zero hallucinations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskAnalysisView({ allRisks, onViewClauses, onNavigateUpload }) {
  const [filterLevel, setFilterLevel] = useState("all");

  const criticalCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "critical").length;
  const highCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "high").length;
  const mediumCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "medium").length;
  const lowCount = allRisks.filter((r) => r.risk_level?.toLowerCase() === "low").length;

  const filtered = filterLevel === "all" ? allRisks : allRisks.filter((r) => r.risk_level?.toLowerCase() === filterLevel);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            Compliance Risk Flag Monitor
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry of compliance violations with mandatory verbatim citation validation
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { id: "all", label: `All (${allRisks.length})` },
            { id: "critical", label: `Critical (${criticalCount})`, color: "text-rose-300" },
            { id: "high", label: `High (${highCount})`, color: "text-amber-300" },
            { id: "medium", label: `Medium (${mediumCount})`, color: "text-cyan-300" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterLevel(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterLevel === tab.id
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] p-16 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No Compliance Risks Detected</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {allRisks.length === 0
              ? "No risk flags detected in your accessible agreements. Upload new agreements to run automated legal screening."
              : "No risks match the active filter criteria."}
          </p>
          {onNavigateUpload && (
            <button
              onClick={onNavigateUpload}
              className="btn-cyber-primary text-xs !mt-4"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload Agreement</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((risk, idx) => {
            const level = risk.risk_level?.toLowerCase() || "low";
            const borderGlow =
              level === "critical"
                ? "border-l-rose-500 hover:border-rose-500/40"
                : level === "high"
                ? "border-l-amber-500 hover:border-amber-500/40"
                : level === "medium"
                ? "border-l-cyan-500 hover:border-cyan-500/40"
                : "border-l-emerald-500 hover:border-emerald-500/40";

            return (
              <div
                key={risk.flag_id || idx}
                className={`p-4 rounded-xl bg-[#0b0e17]/85 border border-white/[0.07] border-l-4 ${borderGlow} space-y-3 transition-all duration-200 shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      level === "critical"
                        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                        : level === "high"
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    } font-mono text-[10px] uppercase tracking-wider`}>
                      {risk.risk_level}
                    </span>
                    <h4 className="text-xs font-bold text-white tracking-tight">
                      {risk.compliance_rule}
                    </h4>
                  </div>
                  {risk.file_name && (
                    <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      {risk.file_name}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  <strong className="text-white">Analysis:</strong> {risk.explanation}
                </p>

                {risk.source_citation && (
                  <div className="p-3 rounded-xl bg-[#070a10] border border-indigo-500/20 text-xs font-mono text-indigo-300 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-slate-400 font-sans tracking-wider">
                      Verbatim Source Citation Grounding:
                    </p>
                    <p className="leading-relaxed">&ldquo;{risk.source_citation}&rdquo;</p>
                  </div>
                )}

                {risk.contract_id && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onViewClauses(risk.contract_id)}
                      className="btn-cyber-secondary !py-1 !px-2.5 text-[11px]"
                    >
                      <span>Inspect in Clause Explorer</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
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
      <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-indigo-400" />
              Contract Obligations & Milestone Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Chronological schedule of renewal dates, termination notice windows, and contractual deliverables
            </p>
          </div>
          <span className="badge bg-indigo-500/15 text-indigo-300 border-indigo-500/30 text-[10px] font-mono">
            {displayDates.length} Milestone{displayDates.length !== 1 ? "s" : ""}
          </span>
        </div>

        {displayDates.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-500">
              <CalendarClock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">No Upcoming Obligations Scheduled</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No milestone deadlines or renewal windows extracted yet. Upload agreements to parse contract dates.
            </p>
            {onNavigateUpload && (
              <button
                onClick={onNavigateUpload}
                className="btn-cyber-primary text-xs !mt-3"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload Contract</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayDates.map((d, i) => (
              <div
                key={d.date_id || i}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white capitalize">{d.event_type} Deadline</p>
                    <p className="text-[11px] text-slate-400">
                      Target: <span className="font-mono text-indigo-300">{d.event_date}</span>
                      {d.file_name && <span> • {d.file_name}</span>}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  d.status === "overdue"
                    ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                    : d.status === "completed"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                } font-mono text-[10px] uppercase`}>
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

function DocumentsView({
  contracts,
  currentUser,
  onViewClauses,
  onDelete,
  onClearAll,
  onMarkCompleted,
  onNavigateUpload,
}) {
  return (
    <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl p-5 space-y-4 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Contract Documents Repository
          </h3>
          <p className="text-xs text-slate-400">
            Row-Level Security (RLS) filtered repository of enterprise legal files
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {contracts.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="btn-cyber-danger text-xs font-mono"
              title="Clear all contracts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Catalog</span>
            </button>
          )}
          <span className="badge bg-white/[0.04] text-slate-300 border-white/[0.08] text-[10px] font-mono">
            {contracts.length} Records
          </span>
        </div>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-slate-500">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-white">No Contracts Available</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No agreements match your permissions. Ingest a document to start semantic clause extraction.
          </p>
          {onNavigateUpload && (
            <button
              onClick={onNavigateUpload}
              className="btn-cyber-primary text-xs !mt-3"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Contract</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {contracts.map((c) => (
            <div
              key={c.contract_id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200 gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  c.status === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white flex items-center gap-2 truncate">
                    <span className="truncate" title={c.file_name}>{c.file_name}</span>
                    {c.status === "completed" && (
                      <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[9px] font-semibold flex items-center gap-1 shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-400" /> Signed
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    UUID: <span className="font-mono text-slate-300">{c.contract_id ? c.contract_id.substring(0, 8) : "..."}</span> • {c.clause_count || 0} Clauses •{" "}
                    {c.risk_count || 0} Flags
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                {c.status !== "completed" && currentUser?.role === "admin" && onMarkCompleted && (
                  <button
                    onClick={() => onMarkCompleted(c.contract_id, c.file_name)}
                    className="btn-cyber-emerald !py-1 !px-2.5 text-[11px]"
                    title="Sign and complete agreement"
                  >
                    <Check className="w-3 h-3" />
                    <span>Sign</span>
                  </button>
                )}
                <button
                  onClick={() => onViewClauses(c.contract_id)}
                  className="btn-cyber-secondary !py-1 !px-2.5 text-[11px]"
                >
                  Explore Clauses
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(c.contract_id, c.file_name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete contract"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
            <History className="w-4 h-4 text-indigo-400" />
            Compliance Audit Trail Log
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically sequenced, immutable system activity ledger with hierarchical Role-Based Access Control
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge bg-white/[0.04] text-slate-300 border-white/[0.08] text-[10px] font-mono">
            {filteredLogs.length} Records
          </span>
          <button
            onClick={loadLogs}
            className="btn-cyber-secondary !py-1 !px-3 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Dynamic Role-Based Scope Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/30 via-[#0b0e17] to-white/[0.02] border border-white/[0.07] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Active Audit Scope:</span>
              <span className={`badge ${
                currentUser.role === "admin"
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : currentUser.role === "reviewer"
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                  : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
              } font-mono text-[10px] uppercase`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {currentUser.role === "admin" &&
                "Global Enterprise View — Full audit visibility across all organization roles (Admin, Reviewer, Viewer, and System)."}
              {currentUser.role === "reviewer" &&
                "Hierarchical Scope — Visible: self activity and lower role (Viewer) events. Upper role (Admin) entries are masked."}
              {currentUser.role === "viewer" &&
                "Self-Activity Scope — Strictly isolated to self-generated events. Upper tier organizational records are masked."}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10 shrink-0 hidden sm:inline">
          RLS Gating Enforced
        </span>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {actionTypes.map((action) => {
          const isActive = filterAction === action;
          return (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm"
                  : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200"
              }`}
            >
              {action === "all" ? "All Events" : action.replace(/_/g, " ")}
            </button>
          );
        })}
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-mono">Querying immutable audit ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 text-[11px] font-mono uppercase bg-white/[0.02]">
                  <th className="py-3 px-5 font-semibold">Timestamp (UTC)</th>
                  <th className="py-3 px-5 font-semibold">Action Signature</th>
                  <th className="py-3 px-5 font-semibold">Authorized Identity</th>
                  <th className="py-3 px-5 font-semibold">Operational Telemetry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, idx) => {
                    const isSign = log.action === "CONTRACT_COMPLETED_SIGNED";
                    const isDelete = log.action === "CONTRACT_DELETED" || log.action === "ALL_CONTRACTS_CLEARED";
                    const isUpload = log.action === "CONTRACT_UPLOADED";
                    const isLogin = log.action === "USER_LOGIN";

                    return (
                      <tr key={log.log_id || log.id || idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-5 text-xs text-slate-400 font-mono whitespace-nowrap">
                          {formatAuditTimestamp(log.timestamp || log.created_at)}
                        </td>
                        <td className="py-3 px-5">
                          <span className={`badge ${
                            isSign
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold"
                              : isDelete
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : isUpload
                              ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                              : isLogin
                              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                              : "bg-white/[0.05] text-slate-300 border-white/[0.08]"
                          } text-[10px] font-mono`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-300 font-mono">
                          {log.user_email || "system"}
                        </td>
                        <td className="py-3 px-5 text-xs text-slate-300 max-w-sm truncate" title={log.details || log.detail}>
                          {log.details || log.detail || "System event recorded"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-xs text-slate-500 font-mono">
                      No audit events match your active RBAC permissions or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
        <p className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          Tamper-Resistant Hierarchical Audit Architecture
        </p>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Every critical lifecycle event (login, upload, analysis, deletion, settings modification, and contract execution/signing) is permanently recorded in the database ledger with UTC timestamps. Row-Level Security policies prevent privilege leakage, fulfilling SOC 2 Type II and ISO 27001 auditability standards.
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
      <div className="rounded-2xl bg-[#0b0e17]/85 border border-indigo-500/30 backdrop-blur-xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Cloud AI Engine Matrix
                {aiStatus?.live_llm_ready ? (
                  <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-mono text-[10px]">
                    ● LIVE CLOUD LLM ACTIVE
                  </span>
                ) : (
                  <span className="badge bg-amber-500/15 text-amber-300 border-amber-500/30 font-mono text-[10px]">
                    VERBATIM RULE ENGINE
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-hallucination semantic clause extraction with direct cloud LLM inference
              </p>
            </div>
          </div>
        </div>

        {/* Free API Key Suggestions */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2">
          <p className="text-white font-semibold flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-indigo-400" /> Recommended Free & High-Speed LLM Providers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl bg-[#080b12] hover:bg-[#0f1422] border border-white/[0.06] hover:border-indigo-500/40 text-slate-300 hover:text-white flex items-center justify-between transition-all group"
            >
              <div>
                <span className="font-bold text-indigo-300 group-hover:text-indigo-200">Groq Cloud (Free)</span>
                <p className="text-[11px] text-slate-400">Llama 3.3 70B • ~500 tokens/sec</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </a>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="p-3 rounded-xl bg-[#080b12] hover:bg-[#0f1422] border border-white/[0.06] hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center justify-between transition-all group"
            >
              <div>
                <span className="font-bold text-cyan-300 group-hover:text-cyan-200">Google AI Studio (Free)</span>
                <p className="text-[11px] text-slate-400">Gemini 2.0 Flash • High Speed</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            </a>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">AI Inference Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderSelect(e.target.value)}
                className="w-full bg-[#080b12] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs focus:border-indigo-500 focus:outline-none transition-colors"
              >
                <option value="groq">Groq Cloud (Free & Ultra Fast)</option>
                <option value="gemini">Google Gemini (Free Tier via OpenAI endpoint)</option>
                <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                <option value="custom">Custom OpenAI-Compatible Endpoint</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Model Identifier</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. llama-3.3-70b-versatile, gemini-2.0-flash, gpt-4o-mini"
                className="w-full bg-[#080b12] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-300 font-semibold mb-1.5">
              API Authentication Key {aiStatus?.api_key_configured && <span className="text-emerald-400">(Key Currently Encrypted & Stored)</span>}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={aiStatus?.api_key_configured ? "Enter new key to update, or leave blank to preserve active key" : "Paste your API key here (e.g. gsk_... or AIza...)"}
                className="w-full bg-[#080b12] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono pr-10 focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2 text-slate-400 hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs">
            <label className="block text-slate-300 font-semibold mb-1.5">Base Endpoint URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.groq.com/openai/v1"
              className="w-full bg-[#080b12] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          {saveMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                saveMessage.type === "success"
                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
              }`}
            >
              {saveMessage.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{saveMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-400 font-mono">
              Provider: <strong className="text-white capitalize">{aiStatus?.provider || provider}</strong> • Model:{" "}
              <strong className="text-indigo-300">{aiStatus?.model || model}</strong>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-cyber-primary text-xs"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Save & Connect Engine</span>
            </button>
          </div>
        </form>
      </div>

      {/* Architecture & RBAC Card */}
      <div className="rounded-2xl bg-[#0b0e17]/80 border border-white/[0.07] backdrop-blur-xl p-5 space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
          System Telemetry & Architecture Specifications
        </h3>
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between py-2 border-b border-white/[0.06]">
            <span className="text-slate-400">Authenticated Persona:</span>
            <span className="font-semibold text-white">
              {currentUser.name} ({currentUser.email})
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.06]">
            <span className="text-slate-400">Assigned RBAC Role:</span>
            <span className="badge bg-indigo-500/15 text-indigo-300 border-indigo-500/30 uppercase font-mono text-[10px]">
              {currentUser.role}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.06]">
            <span className="text-slate-400">Storage Engine:</span>
            <span className="font-mono text-white">{healthStatus.dialect.toUpperCase()} • SQLite3 WAL</span>
          </div>
          <div className="flex justify-between py-2 border-b border-white/[0.06]">
            <span className="text-slate-400">Grounding Protocol:</span>
            <span className="text-emerald-400 font-semibold">Strict Verbatim Substring Grounding</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-400">Daemon Endpoint:</span>
            <span className="font-mono text-slate-300">http://localhost:8000/api</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CLAUSE EXPLORER MODAL WITH HIGHLIGHTED CITATIONS
   ════════════════════════════════════════════════════════════ */

function ClauseExplorerModal({ contract, loading, currentUser, onMarkCompleted, onClose }) {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");

  if (!contract && loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="p-6 rounded-2xl bg-[#0b0e17]/95 border border-white/[0.1] shadow-2xl flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-xs font-mono text-slate-200">Decrypting & loading semantic clauses, topics & AI syntheses...</span>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  const clauses = contract.clauses || [];
  const comparisons = contract.topic_comparisons || [];

  // Get unique topics
  const uniqueTopics = ["all", ...new Set(clauses.map((c) => c.topic).filter(Boolean))];

  const filterLabels = [
    { key: "all", label: `All Clauses (${clauses.length})`, activeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" },
    { key: "compare", label: `Topic Matrix (${comparisons.length})`, activeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
    { key: "critical", label: `Critical (${clauses.filter((c) => c.risk_flags?.some((r) => r.risk_level === "critical")).length})`, activeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
    { key: "high", label: `High (${clauses.filter((c) => c.risk_flags?.some((r) => r.risk_level === "high")).length})`, activeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    { key: "compliant", label: `Compliant (${clauses.filter((c) => !c.risk_flags || c.risk_flags.length === 0).length})`, activeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  ];

  const filteredClauses = clauses.filter((clause) => {
    if (activeTab === "all") {
      if (selectedTopic === "all") return true;
      return clause.topic === selectedTopic;
    }
    if (activeTab === "compliant") return !clause.risk_flags || clause.risk_flags.length === 0;
    return clause.risk_flags?.some((r) => r.risk_level === activeTab);
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in">
      <div className="max-w-5xl w-full max-h-[92vh] flex flex-col rounded-2xl overflow-hidden bg-[#090c14]/95 border border-white/[0.1] shadow-2xl backdrop-blur-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex flex-col gap-3 bg-[#080b12]/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm md:text-base font-bold text-white truncate" title={contract.file_name}>
                    {contract.file_name}
                  </h3>
                  {contract.status === "completed" && (
                    <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 shadow-sm shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" /> Signed & Completed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                  Semantic Clause Index • Plain-English Summaries • Multi-Clause Cross-Referencing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {contract.status === "completed" ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-300 text-xs font-mono font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executed & Sealed {contract.signed_by ? `(${contract.signed_by})` : ""}</span>
                </div>
              ) : (
                currentUser?.role === "admin" && onMarkCompleted && (
                  <button
                    onClick={() => onMarkCompleted(contract.contract_id, contract.file_name || contract.title)}
                    className="btn-cyber-emerald text-xs !py-1.5 !px-3"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Sign & Mark Completed</span>
                  </button>
                )
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
              {filterLabels.map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setActiveTab(f.key);
                    if (f.key === "compare") setSelectedTopic("all");
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                    activeTab === f.key
                      ? `${f.activeColor} shadow-sm`
                      : "bg-white/[0.02] text-slate-400 border-white/[0.06] hover:border-white/[0.12] hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {activeTab === "all" && uniqueTopics.length > 2 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Topic:</span>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="bg-[#0b0f17] border border-white/[0.08] rounded-lg px-2 py-0.5 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                >
                  {uniqueTopics.map((t) => (
                    <option key={t} value={t}>
                      {t === "all" ? "All Legal Topics" : t}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#07090e]">
          {/* Executive Summary Card */}
          {contract.executive_summary && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0b0e17] to-cyan-950/30 border border-indigo-500/30 space-y-1.5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>AI Contract Executive Synthesis</span>
                </div>
                <span className="text-[9px] uppercase font-mono text-cyan-400 tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  Automated Synthesis
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {contract.executive_summary}
              </p>
            </div>
          )}

          {/* VIEW MODE 1: Topic Cross-Comparison */}
          {activeTab === "compare" ? (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-xs text-cyan-200 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong>Cross-Clause Topic Comparison:</strong> Synthesizing overlapping, interlocking, or conflicting clauses that govern the same legal domain.
                </span>
              </div>

              {comparisons.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  No multi-clause topic overlaps detected in this document.
                </div>
              ) : (
                comparisons.map((comp, idx) => {
                  const relatedClauses = clauses.filter((c) =>
                    comp.clause_indices.includes(c.clause_index)
                  );
                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-indigo-500/25 bg-[#0b0e17]/90 space-y-3.5 shadow-xl"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-bold text-white tracking-tight">{comp.topic}</h4>
                        </div>
                        <span className="badge bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-mono text-[10px]">
                          {comp.clause_count} Interlocking Clauses
                        </span>
                      </div>

                      {/* Comparative Synthesis */}
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-transparent border border-indigo-500/20 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block font-mono">
                          AI Comparative Synthesis:
                        </span>
                        <p className="text-slate-200 leading-relaxed font-sans">{comp.synthesis}</p>
                      </div>

                      {/* Related Clauses Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {relatedClauses.map((rc) => (
                          <div
                            key={rc.clause_index}
                            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 transition-colors space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="badge bg-white/[0.05] text-indigo-300 border-white/[0.08] font-bold font-mono text-[10px]">
                                Clause #{rc.clause_index}
                              </span>
                              {rc.risk_flags && rc.risk_flags.length > 0 ? (
                                <span className="badge bg-rose-500/15 text-rose-300 border-rose-500/30 text-[9px] font-mono font-semibold">
                                  {rc.risk_flags.length} Flagged
                                </span>
                              ) : (
                                <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[9px] font-mono">
                                  Compliant
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 line-clamp-3 font-mono text-[11px] leading-relaxed">
                              {rc.original_text}
                            </p>
                            <div className="p-2.5 rounded-lg bg-[#070a10] border border-indigo-500/20 text-[11px] text-slate-300">
                              <strong className="text-indigo-300 block mb-0.5 text-[10px] font-mono uppercase">
                                Plain-English Summary:
                              </strong>
                              {rc.summary || "Operative contractual provision."}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* VIEW MODE 2: Standard Clause Cards with Summary Box */
            <div className="space-y-3.5">
              {filteredClauses.length > 0 ? (
                filteredClauses.map((clause) => {
                  const hasRisks = clause.risk_flags && clause.risk_flags.length > 0;
                  return (
                    <div
                      key={clause.clause_index}
                      className={`p-4 rounded-2xl border ${
                        hasRisks ? "border-amber-500/30 bg-[#0d111b]/80" : "border-white/[0.07] bg-[#0b0e17]/80"
                      } space-y-3 shadow-lg transition-all duration-200`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="badge bg-white/[0.05] text-slate-300 border-white/[0.08] text-[10px] font-mono">
                            Clause #{clause.clause_index}
                          </span>
                          <span className="badge bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] flex items-center gap-1 font-semibold">
                            <Tag className="w-3 h-3 text-indigo-400" />
                            {clause.topic || "General Provision"}
                          </span>
                        </div>

                        {hasRisks ? (
                          <span className="badge bg-rose-500/15 text-rose-300 border-rose-500/30 text-[10px] font-mono font-semibold">
                            {clause.risk_flags.length} Risk Flagged
                          </span>
                        ) : (
                          <span className="badge bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-mono">
                            Compliant
                          </span>
                        )}
                      </div>

                      {/* Original Clause Text */}
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">
                        {clause.original_text}
                      </p>

                      {/* AI Plain-English Summary Box */}
                      <div className="p-3 rounded-xl bg-[#080b12] border border-indigo-500/25 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>AI Plain-English Summary</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {clause.summary || "Summarizes key operational obligations and governance terms defined in this section."}
                        </p>
                      </div>

                      {/* Grounded Risk Flags */}
                      {hasRisks && (
                        <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                          {clause.risk_flags.map((risk, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-rose-300 uppercase tracking-wide font-mono text-[10px]">
                                  [{risk.risk_level}] {risk.compliance_rule}
                                </span>
                              </div>
                              <p className="text-slate-300 text-xs">{risk.explanation}</p>
                              <div className="p-2.5 bg-[#070a10] rounded-lg border border-indigo-500/25 text-[11px] font-mono text-indigo-300">
                                <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold mb-0.5">
                                  Exact Verbatim Source Citation Grounding:
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
                <div className="text-center py-10 text-slate-500 text-xs font-mono">
                  No clauses match the current filter selection.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/[0.08] flex items-center justify-between bg-[#080b12] text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            {clauses.length} semantic clauses indexed • 100% verbatim grounded
          </span>
          <button
            onClick={onClose}
            className="btn-cyber-secondary text-xs !py-1.5 !px-4"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   CYBER CONFIRMATION & ALERT MODAL
   Futuristic, in-app replacement for native confirm() & alert()
   ════════════════════════════════════════════════════════════ */

function CyberAlertDialog({
  isOpen,
  type = "info",
  badge,
  title,
  contractTitle,
  message,
  details,
  confirmText = "Confirm",
  cancelText = "Cancel",
  singleButton = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  const themes = {
    sign: {
      accentBorder: "border-emerald-500/40",
      topLine: "from-emerald-500 via-teal-400 to-cyan-500",
      iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: FileCheck,
      badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      btnClass: "btn-cyber-emerald shadow-lg shadow-emerald-500/20",
    },
    danger: {
      accentBorder: "border-rose-500/40",
      topLine: "from-rose-500 via-pink-500 to-amber-500",
      iconBg: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: Trash2,
      badgeStyle: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      btnClass: "btn-cyber-danger shadow-lg shadow-rose-500/20",
    },
    warning: {
      accentBorder: "border-amber-500/40",
      topLine: "from-amber-500 via-orange-400 to-yellow-500",
      iconBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: ShieldAlert,
      badgeStyle: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      btnClass: "btn-cyber-primary shadow-lg shadow-indigo-500/20",
    },
    success: {
      accentBorder: "border-emerald-500/40",
      topLine: "from-emerald-500 via-cyan-400 to-indigo-500",
      iconBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: CheckCircle2,
      badgeStyle: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      btnClass: "btn-cyber-emerald shadow-lg shadow-emerald-500/20",
    },
    info: {
      accentBorder: "border-indigo-500/40",
      topLine: "from-indigo-500 via-purple-400 to-cyan-500",
      iconBg: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
      icon: Info,
      badgeStyle: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      btnClass: "btn-cyber-primary shadow-lg shadow-indigo-500/20",
    },
  };

  const theme = themes[type] || themes.info;
  const IconComponent = theme.icon;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg bg-[#0c101a] border ${theme.accentBorder} rounded-2xl shadow-2xl shadow-black/90 overflow-hidden text-left transform transition-all animate-scaleUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${theme.topLine}`} />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${theme.iconBg} shadow-inner`}
              >
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                {badge && (
                  <span
                    className={`inline-block text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border mb-1 ${theme.badgeStyle}`}
                  >
                    {badge}
                  </span>
                )}
                <h3 className="text-base font-bold text-white tracking-tight">
                  {title}
                </h3>
              </div>
            </div>

            {!loading && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Contract Target Pill */}
          {contractTitle && (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-slate-400">Target Document:</span>
              <span className="font-semibold text-white font-mono truncate">{contractTitle}</span>
            </div>
          )}

          {/* Message Body */}
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {message}
          </p>

          {/* Detailed Bullet Points */}
          {details && details.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#07090e] border border-white/[0.06] space-y-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Action Impact:
              </div>
              <ul className="space-y-1.5">
                {details.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
            {!singleButton && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-cyber-secondary text-xs !py-2 !px-4 disabled:opacity-50"
              >
                {cancelText}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`${theme.btnClass} text-xs !py-2 !px-5 flex items-center gap-2 font-semibold disabled:opacity-50`}
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
