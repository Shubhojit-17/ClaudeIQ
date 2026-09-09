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
} from "lucide-react";
import "./App.css";

/* ════════════════════════════════════════════════════════════
   ClauseIQ — Root Application Layout
   Sidebar navigation + Main content area
   ════════════════════════════════════════════════════════════ */

// ─── Sidebar Navigation Items ─────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: FileUp, label: "Upload Contract", active: false },
  { icon: ShieldCheck, label: "Risk Analysis", active: false },
  { icon: CalendarClock, label: "Obligations", active: false },
  { icon: FileText, label: "Documents", active: false },
  { icon: Settings, label: "Settings", active: false },
];

// ─── Placeholder Stat Cards ───────────────────────────────
const stats = [
  {
    label: "Contracts Analyzed",
    value: "—",
    icon: FileText,
    color: "text-brand-400",
    bg: "bg-brand-500/10",
  },
  {
    label: "Risk Flags",
    value: "—",
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    label: "Upcoming Deadlines",
    value: "—",
    icon: CalendarClock,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    label: "Compliance Score",
    value: "—",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

function App() {
  return (
    <div className="flex min-h-screen bg-surface-900">
      {/* ════════ SIDEBAR ════════ */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/25">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              ClauseIQ
            </h1>
            <p className="text-[10px] text-surface-200 font-medium uppercase tracking-widest">
              MVP
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          <p className="px-6 mb-2 text-[10px] font-semibold uppercase tracking-widest text-surface-200">
            Navigation
          </p>
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`sidebar-nav-item ${item.active ? "active" : ""}`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.active && (
                <ChevronRight className="w-3 h-3 ml-auto opacity-50" />
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-surface-700">
          <div className="card !p-3 bg-gradient-to-br from-brand-600/10 to-brand-800/10 border-brand-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-brand-400 animate-pulse-subtle" />
              <span className="text-xs font-semibold text-brand-300">
                System Status
              </span>
            </div>
            <p className="text-[11px] text-surface-200">
              API: <span className="text-green-400">● Connected</span>
            </p>
          </div>
        </div>
      </aside>

      {/* ════════ MAIN CONTENT ════════ */}
      <main className="main-content">
        {/* Header */}
        <header className="page-header flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-surface-200 mt-0.5">
              Dashboard Development Branch
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-200" />
              <input
                type="text"
                placeholder="Search contracts..."
                className="bg-surface-800 border border-surface-700 rounded-lg pl-10 pr-4 py-2 text-sm text-surface-50 placeholder-surface-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors w-64"
              />
            </div>
            {/* Notifications */}
            <button className="relative p-2 rounded-lg bg-surface-800 border border-surface-700 hover:border-surface-200/30 transition-colors">
              <Bell className="w-4 h-4 text-surface-200" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-surface-900" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 animate-fade-in">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="card group cursor-pointer hover:shadow-lg hover:shadow-brand-500/5">
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

          {/* Placeholder Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Recent Contracts */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Recent Contracts
                </h3>
                <span className="badge badge-info">Coming Soon</span>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-surface-200">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No contracts uploaded yet</p>
                <p className="text-xs mt-1 opacity-60">
                  Upload a PDF or Word document to get started
                </p>
              </div>
            </div>

            {/* Risk Overview */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Risk Overview
                </h3>
                <span className="badge badge-warning">Pending</span>
              </div>
              <div className="space-y-3">
                {["Critical", "High", "Medium", "Low"].map((level, i) => {
                  const colors = [
                    "bg-red-500",
                    "bg-orange-500",
                    "bg-yellow-500",
                    "bg-green-500",
                  ];
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="text-xs text-surface-200 w-14">
                        {level}
                      </span>
                      <div className="flex-1 bg-surface-700 rounded-full h-2">
                        <div
                          className={`${colors[i]} h-2 rounded-full opacity-30`}
                          style={{ width: "0%" }}
                        />
                      </div>
                      <span className="text-xs text-surface-200 w-6 text-right">
                        0
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
