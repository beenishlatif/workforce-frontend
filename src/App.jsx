import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { io } from "socket.io-client";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { PrivacyProvider } from "./context/PrivacyContext";
import API from "./api/axios.js"; // ✅ single source of truth — Railway backend

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import HROverview from "./pages/HROverview";
import EmployeeManagement from "./pages/EmployeeManagement";
import LiveMonitor from "./pages/LiveMonitor";
import AllScreenshots from "./pages/AllScreenshots";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import AlertsRules from "./pages/AlertsRules";
import ReportsGenerator from "./pages/ReportsGenerator";
import AnalyticsTrends from "./pages/AnalyticsTrends";
import SystemSettings from "./pages/SystemSettings";
import AddEmployee from "./pages/AddEmployee";
import EmployeeList from "./pages/EmployeeList";
import TaskManagement from "./pages/TaskManagement";
import MyDashboard from "./pages/MyDashboard";
import ActivityLog from "./pages/ActivityLog";
import MyScreenshots from "./pages/MyScreenshots";
import WorkHours from "./pages/WorkHours";
import MyProfile from "./pages/MyProfile";
import EmployeeTasks from "./pages/EmployeeTasks";
import PrivacySettings from "./pages/PrivacySettings";
import AuthGuard from "./components/AuthGuard";
import Layout from "./components/Layout";

// ─────────────────────────────────────────────
// Socket URL — only Railway, never Vercel
// ─────────────────────────────────────────────
const SOCKET_URL = "https://workforce-backend-production-cc13.up.railway.app";

// ─────────────────────────────────────────────
// Blocked App Context
// ─────────────────────────────────────────────
const BlockedAppContext = createContext(null);
export const useBlockedApps = () => useContext(BlockedAppContext);

// ─────────────────────────────────────────────
// BlockedAppProvider
// ─────────────────────────────────────────────
function BlockedAppProvider({ children }) {
  const { token, role } = useAuth();

  const [blockedApps, setBlockedApps]   = useState([]);
  const blockedAppsRef                  = useRef([]);
  const [stats, setStats]               = useState({ total: 0, active: 0, websites: 0, internal: 0 });
  const [loading, setLoading]           = useState(true);

  const updateBlockedApps = useCallback((list) => {
    blockedAppsRef.current = list;
    setBlockedApps(list);
  }, []);

  const recalcStats = useCallback((list) => {
    const active   = list.filter((a) => a.isBlocked).length;
    const websites = list.filter((a) => a.isBlocked && a.type === "website").length;
    const internal = list.filter((a) => a.isBlocked && a.type === "internal").length;
    setStats({ total: list.length, active, websites, internal });
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchApps = useCallback(async () => {
    if (!token) return;
    try {
      // API baseURL is already .../api so path is just /blocked-apps
      const res = await API.get("/blocked-apps");
      const list = Array.isArray(res.data)
        ? res.data
        : res.data.data || res.data.apps || [];
      updateBlockedApps(list);
      recalcStats(list);
    } catch (err) {
      console.error("BlockedApps fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, updateBlockedApps, recalcStats]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/blocked-apps/stats");
      const data = res.data.data || res.data || {};
      setStats({
        total:    data.total    ?? 0,
        active:   data.active   ?? data.blocked ?? 0,
        websites: data.websites ?? 0,
        internal: data.internal ?? data.pages   ?? 0,
      });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchApps();
    fetchStats();
  }, [fetchApps, fetchStats, token]);

  // ── Socket — real-time updates ─────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join_room", role || "employee");
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket error:", err.message);
    });

    // Full list update from admin dashboard actions
    socket.on("blocked_apps_updated", (list) => {
      updateBlockedApps(list);
      recalcStats(list);
    });

    // Browser/mobile direct domain+route list
    socket.on("browser:blockedList", ({ domains, routes }) => {
      const updated = blockedAppsRef.current.map((app) => {
        if (app.type === "website") {
          return { ...app, isBlocked: domains.includes(app.identifier) };
        }
        if (app.type === "internal") {
          return { ...app, isBlocked: routes.includes(app.identifier) };
        }
        return app;
      });
      updateBlockedApps(updated);
      recalcStats(updated);
    });

    return () => socket.disconnect();
  }, [token, role, updateBlockedApps, recalcStats]);

  // ── CRUD — all through the shared API instance ─────────────────────────
  const addApp = async (data) => {
    const res = await API.post("/blocked-apps", data);
    const newApp = res.data.data || res.data;
    const updated = [...blockedAppsRef.current, newApp];
    updateBlockedApps(updated);
    recalcStats(updated);
    return newApp;
  };

  const toggleApp = async (id) => {
    const res = await API.patch(`/blocked-apps/${id}/toggle`);
    const toggled = res.data.data || res.data;
    const updated = blockedAppsRef.current.map((a) =>
      a._id === id ? { ...a, ...toggled } : a
    );
    updateBlockedApps(updated);
    recalcStats(updated);
    return toggled;
  };

  const editApp = async (id, data) => {
    const res = await API.put(`/blocked-apps/${id}`, data);
    const edited = res.data.data || res.data;
    const updated = blockedAppsRef.current.map((a) =>
      a._id === id ? { ...a, ...edited } : a
    );
    updateBlockedApps(updated);
    return edited;
  };

  const deleteApp = async (id) => {
    await API.delete(`/blocked-apps/${id}`);
    const updated = blockedAppsRef.current.filter((a) => a._id !== id);
    updateBlockedApps(updated);
    recalcStats(updated);
  };

  const checkIsBlocked = useCallback((pathOrIdentifier) => {
    return blockedAppsRef.current.some(
      (a) =>
        a.isBlocked &&
        pathOrIdentifier?.toLowerCase().includes(a.identifier.toLowerCase())
    );
  }, []);

  return (
    <BlockedAppContext.Provider
      value={{
        blockedApps,
        blockedAppsRef,
        stats,
        loading,
        addApp,
        toggleApp,
        editApp,
        deleteApp,
        isBlocked: checkIsBlocked,
        refetch: fetchApps,
      }}
    >
      {children}
    </BlockedAppContext.Provider>
  );
}

// ─────────────────────────────────────────────
// BlockScreen
// ─────────────────────────────────────────────
function BlockScreen({ app }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#080809",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        gap: 12,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "rgba(248,113,113,0.1)",
          border: "1px solid rgba(248,113,113,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <svg
          width="34" height="34" viewBox="0 0 24 24"
          fill="none" stroke="#f87171" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 style={{ color: "#f87171", fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
        Access Blocked
      </h2>
      <p style={{ color: "#6b6b78", fontSize: 13, margin: 0, textAlign: "center", maxWidth: 320 }}>
        <strong style={{ color: "#c4c4cc" }}>"{app.name}"</strong> ko administrator ne block kar diya hai.
        {app.reason && (
          <span style={{ display: "block", marginTop: 6, color: "#4a4a55" }}>
            Reason: {app.reason}
          </span>
        )}
      </p>
      <p style={{ color: "#3a3a42", fontSize: 11, marginTop: 16, textAlign: "center" }}>
        Agar galti lagti hai toh apne admin se contact karo.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// BlockGuard
// ─────────────────────────────────────────────
function BlockGuard({ children }) {
  const { role }                        = useAuth();
  const { blockedAppsRef, loading, blockedApps } = useBlockedApps();
  const location                        = useLocation();

  const getBlockedApp = useCallback(() => {
    if (role === "admin") return null;

    const currentPath = location.pathname;
    const list = blockedAppsRef.current;

    return (
      list.find((app) => {
        if (!app.isBlocked) return false;

        if (app.type === "internal") {
          return currentPath.startsWith(app.identifier);
        }

        if (app.type === "website") {
          const cleanId   = app.identifier.toLowerCase().replace(/^www\./, "");
          const hostname  = window.location.hostname.toLowerCase().replace(/^www\./, "");
          if (hostname === cleanId || hostname.endsWith(`.${cleanId}`)) return true;

          const keyword = cleanId.split(".")[0];
          if (keyword.length > 3 && currentPath.toLowerCase().includes(`/${keyword}`)) return true;

          if (window.location.href.toLowerCase().includes(cleanId)) return true;

          return false;
        }

        return false;
      }) || null
    );
  }, [role, location.pathname, blockedAppsRef]);

  const [blockedApp, setBlockedApp] = useState(null);

  useEffect(() => {
    if (loading) return;
    setBlockedApp(getBlockedApp());
  }, [location.pathname, blockedApps, loading, getBlockedApp]);

  if (loading)    return children;
  if (blockedApp) return <BlockScreen app={blockedApp} />;
  return children;
}

// ─────────────────────────────────────────────
function RoleRedirect() {
  const { role } = useAuth();
  if (role === "admin")    return <Navigate to="/hr-dashboard"       replace />;
  if (role === "employee") return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

// ─────────────────────────────────────────────
// AppRoutes
// ─────────────────────────────────────────────
function AppRoutes() {
  return (
    <BlockGuard>
      <Routes>
        {/* PUBLIC */}
        <Route path="/"                element={<Login />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/redirect"        element={<RoleRedirect />} />

        {/* ─── ADMIN ─── */}
        <Route path="/hr-dashboard"         element={<AuthGuard role="admin"><Layout><HROverview /></Layout></AuthGuard>} />
        <Route path="/admin/employees"      element={<AuthGuard role="admin"><Layout><EmployeeManagement /></Layout></AuthGuard>} />
        <Route path="/admin/employees/add"  element={<AuthGuard role="admin"><Layout><AddEmployee /></Layout></AuthGuard>} />
        <Route path="/admin/employees/list" element={<AuthGuard role="admin"><Layout><EmployeeList /></Layout></AuthGuard>} />
        <Route path="/admin/tasks"          element={<AuthGuard role="admin"><Layout><TaskManagement /></Layout></AuthGuard>} />
        <Route path="/admin/monitor"        element={<AuthGuard role="admin"><Layout><LiveMonitor /></Layout></AuthGuard>} />
        <Route path="/admin/screenshots"    element={<AuthGuard role="admin"><Layout><AllScreenshots /></Layout></AuthGuard>} />
        <Route path="/admin/activity"       element={<AuthGuard role="admin"><Layout><AdminActivityLogs /></Layout></AuthGuard>} />
        <Route path="/admin/alerts"         element={<AuthGuard role="admin"><Layout><AlertsRules /></Layout></AuthGuard>} />
        <Route path="/admin/reports"        element={<AuthGuard role="admin"><Layout><ReportsGenerator /></Layout></AuthGuard>} />
        <Route path="/admin/analytics"      element={<AuthGuard role="admin"><Layout><AnalyticsTrends /></Layout></AuthGuard>} />
        <Route path="/admin/settings"       element={<AuthGuard role="admin"><Layout><SystemSettings /></Layout></AuthGuard>} />

        {/* ─── EMPLOYEE ─── */}
        <Route path="/employee/dashboard"   element={<AuthGuard role="employee"><Layout><MyDashboard /></Layout></AuthGuard>} />
        <Route path="/employee/tasks"       element={<AuthGuard role="employee"><Layout><EmployeeTasks /></Layout></AuthGuard>} />
        <Route path="/employee/activity"    element={<AuthGuard role="employee"><Layout><ActivityLog /></Layout></AuthGuard>} />
        <Route path="/employee/screenshots" element={<AuthGuard role="employee"><Layout><MyScreenshots /></Layout></AuthGuard>} />
        <Route path="/employee/hours"       element={<AuthGuard role="employee"><Layout><WorkHours /></Layout></AuthGuard>} />
        <Route path="/employee/profile"     element={<AuthGuard role="employee"><Layout><MyProfile /></Layout></AuthGuard>} />
        <Route path="/employee/privacy"     element={<AuthGuard role="employee"><Layout><PrivacySettings /></Layout></AuthGuard>} />

        {/* LEGACY */}
        <Route path="/admin/dashboard" element={<Navigate to="/hr-dashboard"       replace />} />
        <Route path="/dashboard"       element={<Navigate to="/employee/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BlockGuard>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <PrivacyProvider>
        <BlockedAppProvider>
          <Router>
            <AppRoutes />
          </Router>
        </BlockedAppProvider>
      </PrivacyProvider>
    </AuthProvider>
  );
}

export default App;