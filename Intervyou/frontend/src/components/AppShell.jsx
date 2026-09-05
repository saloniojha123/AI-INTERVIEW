import { useEffect, useState, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  PlusCircle,
  History,
  LogOut,
  ChevronRight,
  TrendingUp,
  Clock,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppShell() {
  const { user, logout, authFetch } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await authFetch("/api/interview/history");
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.items || []);
      }
    } catch {
      setHistoryItems([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const isHome = location.pathname === "/";

  return (
    <div className="flex h-screen w-full bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside
        className={`relative flex flex-col border-r border-slate-800 bg-slate-950/70 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? "w-72" : "w-20"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800/80">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/25">
              <Sparkles size={16} />
            </div>
            {sidebarOpen && (
              <span className="text-base font-bold tracking-tight text-slate-100 truncate">
                Interviewly <span className="text-blue-400">AI</span>
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-900 transition"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        {/* Action Button */}
        <div className="p-3">
          <Link
            to="/"
            className={`flex items-center gap-2.5 rounded-xl py-2.5 text-xs font-semibold transition ${
              isHome
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100"
            } ${sidebarOpen ? "px-3.5" : "justify-center px-0"}`}
          >
            <PlusCircle size={16} className="shrink-0" />
            {sidebarOpen && <span>New Interview</span>}
          </Link>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {sidebarOpen && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <History size={13} />
              <span>Past Sessions</span>
            </div>
          )}

          {loadingHistory ? (
            <div className="p-3 text-xs text-slate-500 text-center">Loading sessions...</div>
          ) : historyItems.length === 0 ? (
            sidebarOpen && (
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-3 text-center">
                <p className="text-xs text-slate-400 font-medium">No sessions yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Your completed interviews will appear here.</p>
              </div>
            )
          ) : (
            historyItems.map((item) => {
              const active = location.pathname.includes(item.sessionId || item._id);
              return (
                <Link
                  key={item.sessionId || item._id}
                  to={`/report/${item.sessionId || item._id}`}
                  className={`group flex items-center justify-between rounded-xl p-2.5 text-xs transition border ${
                    active
                      ? "bg-slate-900 border-blue-500/40 text-blue-400"
                      : "border-transparent text-slate-400 hover:bg-slate-900/70 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp size={14} className="shrink-0 text-slate-500 group-hover:text-blue-400" />
                    {sidebarOpen && (
                      <div className="truncate">
                        <p className="font-medium text-slate-300 truncate">
                          {item.role || "Mock Interview"}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock size={10} />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                        </p>
                      </div>
                    )}
                  </div>
                  {sidebarOpen && (
                    <div className="flex items-center gap-1">
                      {item.score !== undefined && (
                        <span className="text-[11px] font-semibold text-emerald-400">
                          {item.score}%
                        </span>
                      )}
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* User Account & Logout Footer */}
        <div className="border-t border-slate-800/80 p-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-2 border border-slate-800/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <User size={15} />
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || "Candidate"}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email || ""}</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="text-slate-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Primary Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#0f172a] relative">
        <Outlet />
      </main>
    </div>
  );
}