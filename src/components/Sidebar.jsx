import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ── Icons ────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const icons = {
  dashboard:   "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  employees:   ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2","M23 21v-2a4 4 0 0 0-3-3.87","M16 3.13a4 4 0 0 1 0 7.75","M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"],
  tasks:       ["M9 11l3 3L22 4","M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
  screenshots: ["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 13m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0"],
  activity:    ["M22 12h-4l-3 9L9 3l-3 9H2"],
  alerts:      ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],
  reports:     ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z","M14 2v6h6","M16 13H8","M16 17H8","M10 9H8"],
  settings:    ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  // ✅ Shield icon for Privacy
  shield:      "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  logout:      ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4","M16 17l5-5-5-5","M21 12H9"],
  chevronRight:"M9 18l6-6-6-6",
  hours:       ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z","M12 6v6l4 2"],
};

// Role-based nav groups
const adminNavGroups = [
  {
    label: "Overview",
    items: [
      { id: "dashboard",       label: "HR Overview",         icon: "dashboard",   badge: null, path: "/hr-dashboard"    },
      { id: "employees",       label: "Employee Management", icon: "employees",   badge: null, path: "/admin/employees" },
      { id: "task-management", label: "Task Management",     icon: "tasks",       badge: null, path: "/admin/tasks"     },
    ],
  },
  {
    label: "Tracking",
    items: [
      { id: "screenshots", label: "All Screenshots", icon: "screenshots", badge: null, path: "/admin/screenshots" },
      { id: "activity",    label: "Activity Logs",   icon: "activity",    badge: null, path: "/admin/activity"    },
      { id: "alerts",      label: "Alerts & Rules",  icon: "alerts",      badge: 3,    path: "/admin/alerts"      },
    ],
  },
  {
    label: "Reports",
    items: [
      { id: "reports",  label: "Report Generator", icon: "reports",  badge: null, path: "/admin/reports"  },
      { id: "settings", label: "System Settings",  icon: "settings", badge: null, path: "/admin/settings" },
    ],
  },
];

const employeeNavGroups = [
  {
    label: "My Workspace",
    items: [
      { id: "dashboard",   label: "My Dashboard",   icon: "dashboard",   badge: null, path: "/employee/dashboard"   },
      { id: "tasks",       label: "My Tasks",        icon: "tasks",       badge: null, path: "/employee/tasks"       },
      { id: "activity",    label: "Activity Log",    icon: "activity",    badge: null, path: "/employee/activity"    },
      { id: "screenshots", label: "My Screenshots",  icon: "screenshots", badge: null, path: "/employee/screenshots" },
      { id: "hours",       label: "Work Hours",      icon: "hours",       badge: null, path: "/employee/hours"       },
      { id: "profile",     label: "My Profile",      icon: "employees",   badge: null, path: "/employee/profile"     },
    ],
  },
  // ✅ NEW: Privacy group
  {
    label: "Privacy",
    items: [
      { id: "privacy", label: "Privacy Settings", icon: "shield", badge: null, path: "/employee/privacy" },
    ],
  },
];

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const role      = localStorage.getItem("role") || "employee";
  const user      = (() => { try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; } })();
  const navGroups = role === "admin" ? adminNavGroups : employeeNavGroups;

  const allItems   = navGroups.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.path === location.pathname);
  const active     = activeItem?.id || "dashboard";

  const initials = (user.name || "SA").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

        .sb-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.6);
          z-index: 99;
          backdrop-filter: blur(2px);
        }

        .sidebar {
          width: 240px; height: 100vh;
          background: #0F1218;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          transition: width 0.25s cubic-bezier(.4,0,.2,1);
          flex-shrink: 0;
          position: relative;
          z-index: 100;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }
        .sidebar.sb-collapsed { width: 68px; }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed; top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.25s ease, width 0.25s ease;
            width: 240px !important;
          }
          .sidebar.sb-mobile-open { transform: translateX(0); }
        }

        .sb-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 0 14px; height: 60px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0;
        }
        .sb-logo-box {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #185FA5, #2B85D8);
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; flex-shrink: 0;
        }
        .sb-brand-info { flex: 1; min-width: 0; overflow: hidden; }
        .sb-brand-name {
          display: block; font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #F0F4FF; letter-spacing: -0.3px; white-space: nowrap;
        }
        .sb-brand-sub {
          display: block; font-size: 10px; color: #63B3ED;
          letter-spacing: 1.4px; text-transform: uppercase; font-weight: 500;
        }
        .sb-toggle {
          background: none; border: none; color: #4A5270;
          cursor: pointer; padding: 6px; border-radius: 6px;
          display: flex; align-items: center;
          transition: color 0.15s, background 0.15s; flex-shrink: 0;
        }
        .sb-toggle:hover { color: #F0F4FF; background: #141820; }
        .sidebar.sb-collapsed .sb-toggle { transform: scaleX(-1); }

        .sb-nav {
          flex: 1; overflow-y: auto; overflow-x: hidden; padding: 10px 8px;
        }
        .sb-nav::-webkit-scrollbar { width: 3px; }
        .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .sb-group { margin-bottom: 6px; }
        .sb-group-label {
          font-size: 10px; font-weight: 600; color: #3D4460;
          letter-spacing: 1.4px; text-transform: uppercase;
          padding: 10px 10px 5px; white-space: nowrap; overflow: hidden;
        }

        .sb-item {
          width: 100%; display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border: none; background: none;
          border-radius: 8px; color: #7A8299; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 13.5px;
          font-weight: 400; text-align: left;
          transition: all 0.15s; position: relative;
          white-space: nowrap; overflow: hidden; margin-bottom: 1px;
        }
        .sb-item:hover { background: #141820; color: #F0F4FF; }
        .sb-item.sb-active {
          background: rgba(43,133,216,0.12); color: #63B3ED; font-weight: 500;
        }
        /* ✅ Privacy item gets purple accent when active */
        .sb-item.sb-privacy-active {
          background: rgba(139,92,246,0.12) !important; color: #a78bfa !important; font-weight: 500;
        }
        .sb-item.sb-privacy-active::before {
          content: ''; position: absolute;
          left: 0; top: 22%; bottom: 22%;
          width: 3px; background: #8b5cf6; border-radius: 0 3px 3px 0;
        }
        .sb-item.sb-active::before {
          content: ''; position: absolute;
          left: 0; top: 22%; bottom: 22%;
          width: 3px; background: #2B85D8; border-radius: 0 3px 3px 0;
        }
        .sb-item-icon { display: flex; align-items: center; flex-shrink: 0; }
        .sb-item-label { flex: 1; }

        .sb-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600;
          padding: 2px 7px; border-radius: 20px; flex-shrink: 0;
        }
        .sb-badge-live { background: rgba(16,185,129,0.12); color: #34D399; letter-spacing: 0.5px; }
        .sb-badge-count { background: rgba(226,75,74,0.15); color: #F09595; min-width: 20px; justify-content: center; }
        .sb-live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #34D399;
          animation: sbPulse 1.5s ease-in-out infinite;
        }
        @keyframes sbPulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.75); }
        }
        .sb-dot-badge {
          position: absolute; top: 5px; right: 5px;
          min-width: 16px; height: 16px; background: #E24B4A;
          border-radius: 8px; font-size: 9px; font-weight: 700; color: #fff;
          display: flex; align-items: center; justify-content: center; padding: 0 3px;
        }

        /* ✅ Privacy separator line */
        .sb-privacy-divider {
          height: 1px; background: rgba(139,92,246,0.15);
          margin: 6px 10px;
        }

        .sb-footer {
          padding: 10px 8px;
          border-top: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }
        .sb-user-row {
          flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; overflow: hidden;
        }
        .sb-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, #185FA5, #2B85D8);
          color: #fff; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; letter-spacing: 0.5px;
        }
        .sb-user-name {
          display: block; font-size: 13px; font-weight: 500; color: #F0F4FF;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sb-user-role { display: block; font-size: 11px; color: #3D4460; }
        .sb-logout-btn {
          background: none; border: none; color: #3D4460;
          cursor: pointer; padding: 7px; border-radius: 7px;
          display: flex; align-items: center; transition: all 0.15s; flex-shrink: 0;
        }
        .sb-logout-btn:hover { color: #F09595; background: rgba(226,75,74,0.1); }
      `}</style>

      {mobileOpen && (
        <div className="sb-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? "sb-collapsed" : ""} ${mobileOpen ? "sb-mobile-open" : ""}`}>

        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-logo-box">
            <Icon d={icons.shield} size={20} />
          </div>
          {!collapsed && (
            <div className="sb-brand-info">
              <span className="sb-brand-name">WorkTrack</span>
              <span className="sb-brand-sub">{role === "admin" ? "Admin Panel" : "Employee"}</span>
            </div>
          )}
          <button className="sb-toggle" onClick={() => setCollapsed(!collapsed)} title="Toggle sidebar">
            <Icon d={icons.chevronRight} size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="sb-group">
              {/* ✅ Privacy group gets a subtle divider */}
              {group.label === "Privacy" && !collapsed && (
                <div className="sb-privacy-divider" />
              )}
              {!collapsed && <div className="sb-group-label">{group.label}</div>}
              {group.items.map((item) => {
                const isPrivacy  = item.id === "privacy";
                const isActive   = active === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sb-item ${isActive ? (isPrivacy ? "sb-privacy-active" : "sb-active") : ""}`}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    title={collapsed ? item.label : ""}
                  >
                    <span className="sb-item-icon" style={isPrivacy ? { color: isActive ? "#a78bfa" : "#6d5ba3" } : {}}>
                      <Icon d={icons[item.icon]} size={17} />
                    </span>
                    {!collapsed && (
                      <>
                        <span className="sb-item-label">{item.label}</span>
                        {item.badge === "LIVE" && (
                          <span className="sb-badge sb-badge-live">
                            <span className="sb-live-dot" /> LIVE
                          </span>
                        )}
                        {typeof item.badge === "number" && (
                          <span className="sb-badge sb-badge-count">{item.badge}</span>
                        )}
                      </>
                    )}
                    {collapsed && typeof item.badge === "number" && (
                      <span className="sb-dot-badge">{item.badge}</span>
                    )}
                    {collapsed && item.badge === "LIVE" && (
                      <span className="sb-dot-badge" style={{ background:"#10B981",minWidth:8,height:8,top:8,right:8,padding:0,borderRadius:"50%" }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-user-row">
            <div className="sb-avatar">{initials}</div>
            {!collapsed && (
              <div>
                <span className="sb-user-name">{user.name || "Admin"}</span>
                <span className="sb-user-role">{role === "admin" ? "Super Admin" : "Employee"}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              className="sb-logout-btn"
              title="Logout"
              onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
            >
              <Icon d={icons.logout} size={16} />
            </button>
          )}
        </div>

      </aside>
    </>
  );
};

export default Sidebar;