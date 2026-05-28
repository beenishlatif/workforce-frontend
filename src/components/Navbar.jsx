import { useState, useRef, useEffect } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {Array.isArray(d)
      ? d.map((p, i) => <path key={i} d={p} />)
      : <path d={d} />}
  </svg>
);

const I = {
  menu: ["M4 6h16", "M4 12h10", "M4 18h16"],
  search: [
    "M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15z",
    "M21 21l-4.35-4.35",
  ],
  logout: ["M17 16l4-4m0 0l-4-4m4 4H7", "M3 21V3"],
  chevron: "M6 9l6 6 6-6",
};

const pageTitles = {
  dashboard: "HR Overview",
  employees: "Employee Management",
  "task-management": "Task Management",
  monitor: "Live Monitor",
  screenshots: "All Screenshots",
  activity: "Activity Logs",
  alerts: "Alerts & Rules",
  reports: "Report Generator",
  analytics: "Analytics & Trends",
  settings: "System Settings",
  tasks: "My Tasks",
  hours: "Work Hours",
  profile: "My Profile",
};

function getUser() {
  try {
    const r = localStorage.getItem("user");
    if (r) return JSON.parse(r);
  } catch {}

  try {
    const t = localStorage.getItem("token");
    if (t) return JSON.parse(atob(t.split(".")[1]));
  } catch {}

  return null;
}

function userName(u) {
  if (!u) return "User";
  return (
    u.name ||
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    u.email?.split("@")[0] ||
    "User"
  );
}

function userInit(n) {
  if (!n) return "U";
  return n
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function userRole(u) {
  if (!u) return "";
  const r = u.role || localStorage.getItem("role") || "";
  return r === "admin"
    ? "Super Admin"
    : r === "employee"
    ? "Employee"
    : r;
}

function rolePrefix(u) {
  return (u?.role || localStorage.getItem("role") || "admin") ===
    "employee"
    ? "Employee"
    : "Admin";
}

// ── Navbar ──────────────────────────────────────────────────────────────────
export default function Navbar({
  activePage = "dashboard",
  onMenuClick,
}) {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());

  const pRef = useRef(null);

  useEffect(() => {
    setUser(getUser());

    const f = () => setUser(getUser());

    window.addEventListener("storage", f);

    return () => window.removeEventListener("storage", f);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (pRef.current && !pRef.current.contains(e.target)) {
        setPOpen(false);
      }
    };

    document.addEventListener("mousedown", h);

    return () => document.removeEventListener("mousedown", h);
  }, []);

  const name = userName(user);
  const initials = userInit(name);
  const role = userRole(user);
  const prefix = rolePrefix(user);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .nb {
          --bg: #06080D;
          --s1: #0A0D14;
          --s2: #0F1320;
          --bd: rgba(255,255,255,0.055);
          --bd2: rgba(255,255,255,0.10);
          --txt: #EEF2FF;
          --sub: #94A3B8;
          --mut: #4B5675;
          --dim: #252D3D;
          --blue: #4F8EF7;
          --violet: #8B5CF6;
          --green: #10B981;
          --gdim: rgba(16,185,129,0.1);
          --gb: rgba(16,185,129,0.22);
          --red: #F43F5E;
          --rdim: rgba(244,63,94,0.1);
          --rb: rgba(244,63,94,0.25);
          --bb: rgba(79,142,247,0.28);

          width: 100%;
          min-height: 64px;
          background: var(--bg);
          border-bottom: 1px solid var(--bd);

          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;

          padding: 10px 18px;

          font-family: 'Outfit', sans-serif;

          position: sticky;
          top: 0;
          z-index: 999;
          flex-wrap: wrap;
        }

        .nb::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;

          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(79,142,247,0.6) 35%,
            rgba(139,92,246,0.7) 55%,
            rgba(79,142,247,0.5) 75%,
            transparent 100%
          );
        }

        .nb-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex-shrink: 1;
        }

        .nb-ham {
          background: none;
          border: none;
          color: var(--mut);
          cursor: pointer;

          width: 38px;
          height: 38px;
          border-radius: 10px;

          display: none;
          align-items: center;
          justify-content: center;

          transition: 0.2s ease;
          flex-shrink: 0;
        }

        .nb-ham:hover {
          background: var(--s2);
          color: var(--txt);
        }

        .nb-crumb {
          display: flex;
          align-items: center;
          gap: 6px;

          padding: 8px 12px;

          background: var(--s1);
          border: 1px solid var(--bd);
          border-radius: 10px;

          min-width: 0;
        }

        .nb-crumb-pre {
          font-size: 11px;
          color: var(--mut);
          white-space: nowrap;
        }

        .nb-crumb-sep {
          color: var(--dim);
        }

        .nb-crumb-page {
          font-size: 13px;
          font-weight: 600;
          color: var(--txt);

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }

        .nb-search {
          flex: 1;
          max-width: 420px;
          min-width: 180px;

          position: relative;
          display: flex;
          align-items: center;
        }

        .nb-s-ico {
          position: absolute;
          left: 12px;
          color: var(--mut);
          display: flex;
          align-items: center;
        }

        .nb-search.on .nb-s-ico {
          color: var(--blue);
        }

        .nb-s-inp {
          width: 100%;

          background: var(--s1);
          border: 1px solid var(--bd);

          border-radius: 12px;

          padding: 10px 42px 10px 38px;

          color: var(--txt);
          font-size: 13px;

          outline: none;

          transition: 0.2s ease;
        }

        .nb-s-inp::placeholder {
          color: var(--mut);
        }

        .nb-s-inp:focus {
          border-color: var(--bb);
          background: var(--s2);
        }

        .nb-s-kbd {
          position: absolute;
          right: 10px;

          display: flex;
          align-items: center;
          gap: 3px;

          pointer-events: none;
        }

        .nb-s-kbd span {
          font-size: 9px;

          color: var(--mut);

          background: var(--s2);
          border: 1px solid var(--bd2);

          padding: 2px 5px;
          border-radius: 4px;

          font-family: 'JetBrains Mono', monospace;
        }

        .nb-right {
          display: flex;
          align-items: center;
          gap: 10px;

          margin-left: auto;
          flex-shrink: 0;
        }

        .nb-clock {
          display: flex;
          flex-direction: column;
          align-items: flex-end;

          padding-right: 12px;
          border-right: 1px solid var(--bd2);
        }

        .nb-clock-t {
          font-size: 12px;
          color: var(--txt);
          font-family: 'JetBrains Mono', monospace;
        }

        .nb-clock-d {
          font-size: 10px;
          color: var(--mut);
        }

        .nb-live {
          display: flex;
          align-items: center;
          gap: 5px;

          padding: 6px 10px;

          border-radius: 999px;

          background: var(--gdim);
          border: 1px solid var(--gb);

          color: var(--green);

          font-size: 10px;
          font-weight: 700;

          text-transform: uppercase;
        }

        .nb-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;

          background: var(--green);

          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,100% {
            opacity: 1;
            transform: scale(1);
          }

          50% {
            opacity: .4;
            transform: scale(.7);
          }
        }

        .nb-pw {
          position: relative;
        }

        .nb-pbtn {
          display: flex;
          align-items: center;
          gap: 10px;

          background: var(--s1);
          border: 1px solid var(--bd);

          padding: 5px 10px 5px 5px;

          border-radius: 12px;

          cursor: pointer;

          transition: 0.2s ease;
        }

        .nb-pbtn:hover {
          background: var(--s2);
        }

        .nb-av {
          width: 34px;
          height: 34px;

          border-radius: 10px;

          background: linear-gradient(135deg,#1D4ED8,#7C3AED);

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;
          font-size: 12px;
          font-weight: 700;

          flex-shrink: 0;
        }

        .nb-pinfo {
          text-align: left;
          min-width: 0;
        }

        .nb-pname {
          display: block;

          color: var(--txt);

          font-size: 13px;
          font-weight: 600;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          max-width: 130px;
        }

        .nb-prole {
          display: block;

          color: var(--mut);
          font-size: 10px;
        }

        .nb-chev {
          color: var(--mut);
          transition: transform .2s ease;
          flex-shrink: 0;
        }

        .nb-chev.on {
          transform: rotate(180deg);
        }

        .nb-drop {
          position: absolute;
          right: 0;
          top: calc(100% + 10px);

          width: 280px;
          max-width: calc(100vw - 20px);

          background: var(--s1);

          border: 1px solid var(--bd2);
          border-radius: 16px;

          overflow: hidden;

          box-shadow: 0 20px 60px rgba(0,0,0,.55);

          z-index: 999;
        }

        .nb-hero {
          padding: 18px;

          background: linear-gradient(
            145deg,
            #0D1526 0%,
            #111830 50%,
            #0D1526 100%
          );
        }

        .nb-hero-top {
          display: flex;
          gap: 12px;
          align-items: center;

          margin-bottom: 14px;
        }

        .nb-hero-av {
          width: 48px;
          height: 48px;

          border-radius: 12px;

          background: linear-gradient(135deg,#1D4ED8,#7C3AED);

          display: flex;
          align-items: center;
          justify-content: center;

          color: white;
          font-weight: 800;

          flex-shrink: 0;
        }

        .nb-hero-name {
          color: var(--txt);
          font-size: 14px;
          font-weight: 700;
        }

        .nb-hero-role {
          color: #818CF8;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .nb-hero-email {
          color: var(--mut);
          font-size: 11px;

          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nb-stats {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 10px;
        }

        .nb-stat {
          padding: 10px;
          border-radius: 10px;

          background: rgba(255,255,255,.04);
          border: 1px solid var(--bd);
          text-align: center;
        }

        .nb-stat-v {
          color: var(--txt);
          font-size: 13px;
          font-weight: 700;
        }

        .nb-stat-l {
          color: var(--mut);
          font-size: 9px;
          margin-top: 3px;
        }

        .nb-status {
          display: flex;
          align-items: center;
          gap: 8px;

          padding: 10px 16px;

          border-top: 1px solid var(--bd);
          border-bottom: 1px solid var(--bd);
        }

        .nb-status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;
          background: var(--green);
        }

        .nb-status-txt {
          color: var(--green);
          font-size: 11px;
          font-weight: 600;
        }

        .nb-status-t {
          margin-left: auto;
          color: var(--mut);
          font-size: 10px;
        }

        .nb-logout-wrap {
          padding: 8px;
        }

        .nb-logout-btn {
          width: 100%;

          display: flex;
          align-items: center;
          gap: 10px;

          background: transparent;
          border: 1px solid transparent;

          padding: 10px;
          border-radius: 10px;

          cursor: pointer;

          color: var(--sub);

          transition: 0.2s ease;
        }

        .nb-logout-btn:hover {
          background: var(--rdim);
          border-color: var(--rb);
        }

        .nb-logout-icon {
          width: 34px;
          height: 34px;

          border-radius: 10px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: rgba(244,63,94,0.1);
          color: var(--red);

          flex-shrink: 0;
        }

        .nb-logout-sub {
          display: block;
          font-size: 10px;
          color: var(--mut);
          margin-top: 2px;
        }

        .nb-footer {
          padding: 10px;

          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;

          border-top: 1px solid var(--bd);

          color: var(--mut);
          font-size: 10px;
        }

        .nb-footer-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;

          background: var(--mut);
        }

        /* ───────── TABLET ───────── */

        @media (max-width: 1024px) {
          .nb {
            gap: 10px;
          }

          .nb-search {
            max-width: 300px;
          }
        }

        /* ───────── MOBILE ───────── */

        @media (max-width: 768px) {
          .nb {
            padding: 10px 12px;
          }

          .nb-ham {
            display: flex;
          }

          .nb-crumb {
            max-width: 180px;
          }

          .nb-search {
            order: 3;
            width: 100%;
            max-width: 100%;
            flex-basis: 100%;
          }

          .nb-clock {
            display: none;
          }

          .nb-live {
            display: none;
          }
        }

        @media (max-width: 560px) {
          .nb {
            min-height: auto;
          }

          .nb-crumb {
            display: none;
          }

          .nb-right {
            gap: 6px;
          }

          .nb-pinfo {
            display: none;
          }

          .nb-chev {
            display: none;
          }

          .nb-drop {
            right: -6px;
            width: min(92vw, 280px);
          }

          .nb-search {
            min-width: 100%;
          }

          .nb-s-kbd {
            display: none;
          }
        }

        @media (max-width: 380px) {
          .nb {
            padding: 8px 10px;
          }

          .nb-av {
            width: 30px;
            height: 30px;
            font-size: 11px;
          }

          .nb-pbtn {
            padding: 4px;
          }

          .nb-drop {
            width: calc(100vw - 16px);
            right: -4px;
          }
        }
      `}</style>

      <nav className="nb">
        {/* Left */}
        <div className="nb-left">
          <button
            className="nb-ham"
            onClick={onMenuClick}
            title="Toggle menu"
          >
            <Icon d={I.menu} size={18} />
          </button>

          <div className="nb-crumb">
            <span className="nb-crumb-pre">{prefix}</span>
            <span className="nb-crumb-sep">/</span>
            <span className="nb-crumb-page">
              {pageTitles[activePage] || "Dashboard"}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className={`nb-search ${focused ? "on" : ""}`}>
          <span className="nb-s-ico">
            <Icon d={I.search} size={14} />
          </span>

          <input
            className="nb-s-inp"
            placeholder="Search employees, reports, logs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />

          <div className="nb-s-kbd">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>

        {/* Right */}
        <div className="nb-right">
          {/* Clock */}
          <div className="nb-clock">
            <span className="nb-clock-t">{timeStr}</span>
            <span className="nb-clock-d">{dateStr}</span>
          </div>

          {/* Live */}
          <div className="nb-live">
            <span className="nb-live-dot" />
            Live
          </div>

          {/* Profile */}
          <div className="nb-pw" ref={pRef}>
            <button
              className={`nb-pbtn ${pOpen ? "on" : ""}`}
              onClick={() => setPOpen((o) => !o)}
            >
              <div className="nb-av">{initials}</div>

              <div className="nb-pinfo">
                <span className="nb-pname">{name}</span>
                <span className="nb-prole">{role}</span>
              </div>

              <span className={`nb-chev ${pOpen ? "on" : ""}`}>
                <Icon d={I.chevron} size={13} />
              </span>
            </button>

            {pOpen && (
              <div className="nb-drop">
                {/* Hero */}
                <div className="nb-hero">
                  <div className="nb-hero-top">
                    <div className="nb-hero-av">{initials}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nb-hero-name">{name}</div>

                      <div className="nb-hero-role">{role}</div>

                      {user?.email && (
                        <div className="nb-hero-email">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="nb-stats">
                    <div className="nb-stat">
                      <div
                        className="nb-stat-v"
                        style={{ color: "#10B981" }}
                      >
                        Active
                      </div>

                      <div className="nb-stat-l">Status</div>
                    </div>

                    <div className="nb-stat">
                      <div className="nb-stat-v">{timeStr}</div>

                      <div className="nb-stat-l">Session</div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="nb-status">
                  <span className="nb-status-dot" />

                  <span className="nb-status-txt">
                    Online now
                  </span>

                  <span className="nb-status-t">
                    {timeStr}
                  </span>
                </div>

                {/* Logout */}
                <div className="nb-logout-wrap">
                  <button
                    className="nb-logout-btn"
                    onClick={() => {
                      setPOpen(false);
                      localStorage.clear();
                      window.location.href = "/login";
                    }}
                  >
                    <div className="nb-logout-icon">
                      <Icon d={I.logout} size={14} />
                    </div>

                    <div>
                      <span>Sign Out</span>

                      <span className="nb-logout-sub">
                        Clear session & logout
                      </span>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="nb-footer">
                  <span>WorkTrack Pro</span>

                  <span className="nb-footer-dot" />

                  <span>v2.4.0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}