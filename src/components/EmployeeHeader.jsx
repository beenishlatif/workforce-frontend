// EmployeeHeader.jsx
// Font: Add this in your index.html <head>:
// <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">

import { useNavigate, useLocation } from "react-router-dom";
import { UserPlus, Users, ClipboardList } from "lucide-react";

const navItems = [
  {
    label: "Add Employee",
    path: "/employee-management",
    icon: UserPlus,
  },
  {
    label: "Employee List",
    path: "/employee-management/list",
    icon: Users,
    badge: "24",
  },
  {
    label: "Task Management",
    path: "/employee-management/tasks",
    icon: ClipboardList,
    badge: "3",
  },
];

export default function EmployeeHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className="w-full bg-[#0c0e14] border-b border-white/[0.06]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Top Brand Bar */}
        <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            {/* Logo mark */}
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-900/40">
              <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <span
              className="text-white/80 text-sm font-semibold tracking-wide"
            >
              Employee Management
            </span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span
              className="text-white/25 text-[10px] tracking-widest uppercase"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              Live
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 py-2">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 ease-out outline-none
                  ${
                    active
                      ? "text-sky-300 bg-sky-500/10 border border-sky-500/20"
                      : "text-white/35 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"
                  }
                `}
              >
                {/* Active glow line at bottom */}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
                )}

                <Icon
                  size={14}
                  className={`transition-all duration-200 ${
                    active
                      ? "text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                      : "group-hover:text-white/60"
                  }`}
                />

                <span className="tracking-wide">{item.label}</span>

                {item.badge && (
                  <span
                    className={`
                      text-[9px] font-semibold px-1.5 py-0.5 rounded
                      ${
                        active
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/25"
                          : "bg-white/[0.06] text-white/30 border border-white/[0.08]"
                      }
                    `}
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}