import { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";

// Route → sidebar page id mapping
const routeToPage = {
  "/hr-dashboard":        "dashboard",
  "/admin/employees":     "employees",
  "/admin/monitor":       "monitor",
  "/admin/screenshots":   "screenshots",
  "/admin/activity":      "activity",
  "/admin/alerts":        "alerts",
  "/admin/reports":       "reports",
  "/admin/analytics":     "analytics",
  "/admin/settings":      "settings",
  "/employee/dashboard":  "dashboard",
  "/employee/activity":   "activity",
  "/employee/screenshots":"screenshots",
  "/employee/hours":      "hours",
  "/employee/profile":    "profile",
};

const Layout = ({ children }) => {
  const location = useLocation();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  // Active page derived from current URL
  const activePage = routeToPage[location.pathname] || "dashboard";

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .layout-root {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #0A0C10;
          font-family: 'DM Sans', sans-serif;
        }

        /* Sidebar stays fixed on left */
        .layout-sidebar {
          flex-shrink: 0;
          height: 100vh;
          position: sticky;
          top: 0;
        }

        /* Right side: navbar + scrollable content */
        .layout-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          overflow: hidden;
        }

        /* Scrollable page area */
        .layout-content {
          flex: 1;
          overflow-y: auto;
          padding: 28px;
          background: #0A0C10;
        }

        .layout-content::-webkit-scrollbar { width: 6px; }
        .layout-content::-webkit-scrollbar-track { background: transparent; }
        .layout-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

        @media (max-width: 768px) {
          .layout-sidebar { position: fixed; z-index: 100; }
          .layout-content { padding: 16px; }
        }
      `}</style>

      <div className="layout-root">

        {/* ── SIDEBAR (left) ── */}
        <div className="layout-sidebar">
          <Sidebar
            active={activePage}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="layout-main">

          {/* ── NAVBAR (top) ── */}
          <Navbar
            activePage={activePage}
            onMenuClick={() => setMobileOpen(true)}
          />

          {/* ── PAGE CONTENT (center) ── */}
          <main className="layout-content">
            {children}
          </main>

        </div>
      </div>
    </>
  );
};

export default Layout;