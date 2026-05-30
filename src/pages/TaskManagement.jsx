import { useState, useEffect, useCallback } from "react";
import { io as socketIO } from "socket.io-client";
import {
  Pencil, Trash2, Loader2,
  GitBranch, Zap, BarChart2, List, Clock,
  ChevronDown, X, Menu,
} from "lucide-react";
import API from "../api/axios.js";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
// const SOCKET_URL = "http://localhost:5000";
const SOCKET_URL = "https://workforce-backend-production-cc13.up.railway.app";

// ─────────────────────────────────────────────
// RESPONSIVE HOOK  (same as EmployeeList)
// ─────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return width;
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function getTaskId(t) {
  const raw = t?._id ?? t?.id ?? null;
  if (!raw) return null;
  return typeof raw === "object" ? raw.toString() : String(raw);
}

function normalizeTask(t) {
  const id = getTaskId(t);
  const empName =
    t.employee_name ||
    (t.assigned_to && typeof t.assigned_to === "object"
      ? `${t.assigned_to.firstName || ""} ${t.assigned_to.lastName || ""}`.trim() ||
        t.assigned_to.name || t.assigned_to.email || ""
      : "") || "";
  return { ...t, _id: id, employee_name: empName };
}

function resolveEmpName(task, employees) {
  if (task.employee_name) return task.employee_name;
  const aid = String(task.assigned_to?._id ?? task.assigned_to ?? "").trim();
  if (!aid) return "Unassigned";
  const emp = employees.find(e => String(e._id ?? e.id ?? "").trim() === aid);
  return emp
    ? emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email || ""
    : "Unassigned";
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "2-digit" });
}

function isOverdue(due, status) {
  if (!due || status === "completed") return false;
  return new Date(due) < new Date();
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const STATUS_CFG = {
  pending:     { label: "Pending",     color: "#94a3b8", dot: "#64748b" },
  in_progress: { label: "In Progress", color: "#60a5fa", dot: "#3b82f6" },
  in_review:   { label: "In Review",   color: "#c084fc", dot: "#a855f7" },
  completed:   { label: "Completed",   color: "#34d399", dot: "#10b981" },
  blocked:     { label: "Blocked",     color: "#f87171", dot: "#ef4444" },
};

const PRIORITY_CFG = {
  low:    { color: "#34d399", label: "Low"    },
  medium: { color: "#fbbf24", label: "Medium" },
  high:   { color: "#fb923c", label: "High"   },
  urgent: { color: "#f87171", label: "Urgent" },
};

// ─────────────────────────────────────────────
// GLOBAL CSS
// ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0c1017;
    --surface:  #111722;
    --card:     #161d28;
    --border:   #1a2235;
    --border2:  #222d40;
    --text1:    #e2e8f0;
    --text2:    #7a8fa8;
    --text3:    #3a4f68;
    --blue:     #3b82f6;
    --green:    #10b981;
    --amber:    #f59e0b;
    --red:      #ef4444;
    --purple:   #8b5cf6;
    --orange:   #f97316;
    --mono:     'DM Mono', monospace;
    --sans:     'DM Sans', sans-serif;
    --t-xs:  10px;
    --t-sm:  11px;
    --t-md:  13px;
    --t-lg:  15px;
    --t-xl:  20px;
    --t-2xl: 24px;
  }

  html, body { height: 100%; }
  body { font-family: var(--sans); background: var(--bg); color: var(--text1); font-size: var(--t-md); line-height: 1.5; }

  * { scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes fadeIn    { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
  @keyframes slideIn   { from { opacity: 0; transform: translateY(-10px) scale(.98); } to { opacity: 1; transform: none; } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  @keyframes flashPulse {
    0%   { background: rgba(59,130,246,.1); }
    60%  { background: rgba(59,130,246,.05); }
    100% { background: var(--surface); }
  }

  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(.5); cursor: pointer; }
  input[type="number"]::-webkit-inner-spin-button { opacity: .3; }

  .tm-btn-ghost {
    background: none; border: none; cursor: pointer; padding: 5px 7px;
    border-radius: 6px; color: var(--text3);
    transition: color .15s, background .15s;
    display: flex; align-items: center; justify-content: center;
  }
  .tm-btn-ghost:hover { color: var(--text1); background: var(--border); }
  .tm-btn-ghost.danger:hover { color: #f87171; background: rgba(239,68,68,.08); }
  .tm-btn-ghost:disabled { opacity: .4; cursor: not-allowed; }

  .tm-tab {
    background: none; border: none; border-bottom: 2px solid transparent;
    color: var(--text3); font-family: var(--sans); font-size: var(--t-sm);
    font-weight: 400; padding: 10px 12px; cursor: pointer;
    transition: color .12s, border-color .12s; white-space: nowrap;
    display: flex; align-items: center; gap: 5px; margin-bottom: -1px;
    flex-shrink: 0;
  }
  .tm-tab.active { color: var(--text1); border-bottom-color: var(--blue); font-weight: 500; }
  .tm-tab:hover:not(.active) { color: var(--text2); }

  .tm-view-btn {
    background: transparent; border: none;
    color: var(--text3); font-family: var(--sans); font-size: var(--t-sm);
    font-weight: 500; padding: 5px 10px; cursor: pointer; transition: all .12s;
    display: flex; align-items: center; gap: 5px;
  }
  .tm-view-btn.active { background: var(--border2); color: var(--text1); }
  .tm-view-btn:hover:not(.active) { color: var(--text2); }

  .tm-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 2px solid transparent;
    border-radius: 8px; padding: 12px 14px;
    display: flex; align-items: flex-start; gap: 12px;
    transition: border-color .15s, background .15s;
    animation: fadeIn .2s ease both;
  }
  .tm-card:hover { background: var(--card); border-color: var(--border2); }
  .tm-card.critical { border-left-color: rgba(249,115,22,.4); }
  .tm-card.flashing { animation: flashPulse .9s ease both; }

  /* Mobile task card */
  .tm-mobile-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 2px solid transparent;
    border-radius: 10px; padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
    animation: fadeIn .2s ease both;
    transition: border-color .15s;
  }
  .tm-mobile-card.critical { border-left-color: rgba(249,115,22,.4); }
  .tm-mobile-card:active { border-color: var(--border2); }

  .tm-input {
    width: 100%; background: var(--bg); border: 1px solid var(--border2);
    border-radius: 6px; color: var(--text1); font-family: var(--sans);
    font-size: var(--t-md); padding: 8px 11px; outline: none;
    transition: border-color .15s;
  }
  .tm-input:focus { border-color: var(--blue); }
  .tm-input::placeholder { color: var(--text3); }

  .tm-select {
    background: var(--bg); border: 1px solid var(--border2);
    border-radius: 6px; color: var(--text1); font-family: var(--sans);
    font-size: var(--t-md); padding: 8px 30px 8px 11px; outline: none;
    appearance: none; -webkit-appearance: none; cursor: pointer;
    transition: border-color .15s; width: 100%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%233a4f68' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
  }
  .tm-select:focus { border-color: var(--blue); }
  .tm-select option { background: #111722; }

  .tm-mini-select {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 5px; color: var(--text2); font-family: var(--sans);
    font-size: var(--t-xs); padding: 5px 22px 5px 8px; outline: none;
    appearance: none; -webkit-appearance: none; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%233a4f68' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 6px center;
    transition: border-color .15s;
  }
  .tm-mini-select:focus { border-color: var(--blue); }
  .tm-mini-select option { background: #111722; }

  /* Mobile drawer overlay */
  .tm-drawer-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.6);
    backdrop-filter: blur(3px); z-index: 200;
    animation: fadeIn .15s ease both;
  }
  .tm-drawer {
    position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
    background: var(--surface); border-right: 1px solid var(--border2);
    z-index: 201; overflow-y: auto;
    animation: slideIn .2s ease both;
  }
`;

// ─────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────
const Spinner = ({ size = 12 }) => (
  <span style={{
    width: size, height: size,
    border: "1.5px solid rgba(255,255,255,.2)",
    borderTopColor: "#fff", borderRadius: "50%",
    display: "inline-block",
    animation: "spin .65s linear infinite",
    flexShrink: 0,
  }} />
);

function Label({ children, required, hint }) {
  return (
    <label style={{
      fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)",
      letterSpacing: ".08em", textTransform: "uppercase",
      display: "flex", alignItems: "center", gap: 5, marginBottom: 5,
    }}>
      {children}
      {required && <span style={{ color: "var(--red)", fontSize: 9 }}>*</span>}
      {hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--text3)", fontSize: "var(--t-xs)" }}>— {hint}</span>}
    </label>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Label required={required} hint={hint}>{label}</Label>
      {children}
    </div>
  );
}

function Toast({ message, type, visible }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: "var(--card)", border: "1px solid var(--border2)",
      borderLeft: `2px solid ${type === "error" ? "var(--red)" : "var(--green)"}`,
      color: "var(--text1)", fontSize: "var(--t-sm)", padding: "10px 16px", borderRadius: 8,
      boxShadow: "0 8px 32px rgba(0,0,0,.5)", zIndex: 9999, maxWidth: 300,
      display: "flex", alignItems: "center", gap: 8,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      opacity: visible ? 1 : 0, transition: "all .25s ease", pointerEvents: "none",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: type === "error" ? "var(--red)" : "var(--green)" }} />
      {message}
    </div>
  );
}

// Priority / Status inline badges
function PriBadge({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium;
  return (
    <span style={{
      fontSize: "var(--t-xs)", color: cfg.color,
      background: `${cfg.color}14`, border: `1px solid ${cfg.color}30`,
      padding: "1px 7px", borderRadius: 3, fontFamily: "var(--mono)",
    }}>{cfg.label}</span>
  );
}

function StatBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{
      fontSize: "var(--t-xs)", color: cfg.color,
      background: `${cfg.dot}18`, border: `1px solid ${cfg.dot}30`,
      padding: "1px 7px", borderRadius: 3, fontFamily: "var(--mono)",
    }}>{cfg.label}</span>
  );
}

// ─────────────────────────────────────────────
// PERT / CPM BADGES
// ─────────────────────────────────────────────
function PertBadge({ task }) {
  const [show, setShow] = useState(false);
  if (!task.pertTime && !task.pertOptimistic) return null;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{
        fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--purple)",
        background: "rgba(139,92,246,.08)", border: "1px solid rgba(139,92,246,.2)",
        padding: "2px 7px", borderRadius: 3, cursor: "default",
        fontFamily: "var(--mono)", letterSpacing: ".03em",
      }}>PERT {task.pertTime}d</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 200,
          background: "var(--card)", border: "1px solid var(--border2)", borderRadius: 8,
          padding: "12px 14px", width: 186, boxShadow: "0 12px 32px rgba(0,0,0,.6)",
          animation: "fadeIn .12s ease both",
        }}>
          <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--purple)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".1em" }}>PERT Analysis</div>
          {[
            { l: "Optimistic",  v: `${task.pertOptimistic  ?? "—"}d`, c: "var(--green)"  },
            { l: "Most Likely", v: `${task.pertMostLikely  ?? "—"}d`, c: "var(--amber)"  },
            { l: "Pessimistic", v: `${task.pertPessimistic ?? "—"}d`, c: "var(--red)"    },
            { l: "Expected te", v: `${task.pertTime        ?? "—"}d`, c: "var(--purple)" },
            { l: "Std Dev ±",   v: `${task.pertSD          ?? "—"}d`, c: "var(--text2)"  },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "var(--t-sm)" }}>
              <span style={{ color: "var(--text2)" }}>{r.l}</span>
              <span style={{ color: r.c, fontFamily: "var(--mono)" }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

function CpmBadge({ task }) {
  const [show, setShow] = useState(false);
  if (task.isCritical === undefined && task.float === undefined) return null;
  const isCrit = task.isCritical;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{
        fontSize: "var(--t-xs)", fontWeight: 600,
        color: isCrit ? "var(--orange)" : "var(--text3)",
        background: isCrit ? "rgba(249,115,22,.08)" : "transparent",
        border: `1px solid ${isCrit ? "rgba(249,115,22,.25)" : "var(--border)"}`,
        padding: "2px 7px", borderRadius: 3, cursor: "default", fontFamily: "var(--mono)",
      }}>{isCrit ? "CRITICAL" : `float ${task.float ?? "?"}d`}</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 0, zIndex: 200,
          background: "var(--card)", border: "1px solid var(--border2)", borderRadius: 8,
          padding: "12px 14px", width: 192, boxShadow: "0 12px 32px rgba(0,0,0,.6)",
          animation: "fadeIn .12s ease both",
        }}>
          <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: isCrit ? "var(--orange)" : "var(--green)", marginBottom: 8, textTransform: "uppercase", letterSpacing: ".1em" }}>
            CPM · {isCrit ? "Critical Path" : "Slack Available"}
          </div>
          {[
            { l: "Early Start",  v: `Day ${task.earlyStart  ?? "—"}` },
            { l: "Early Finish", v: `Day ${task.earlyFinish ?? "—"}` },
            { l: "Late Start",   v: `Day ${task.lateStart   ?? "—"}` },
            { l: "Late Finish",  v: `Day ${task.lateFinish  ?? "—"}` },
            { l: "Float",        v: `${task.float ?? "—"} days`      },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "var(--t-sm)" }}>
              <span style={{ color: "var(--text2)" }}>{r.l}</span>
              <span style={{ color: "var(--text1)", fontFamily: "var(--mono)" }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR CONTENT (shared between desktop panel + mobile drawer)
// ─────────────────────────────────────────────
function SidebarContent({ tasks, employees, fEmp, setFEmp, fPri, setFPri, projectDuration, pertStats, onClose }) {
  const cnt = s => tasks.filter(t => t.status === s).length;
  const pct = tasks.length ? Math.round((cnt("completed") / tasks.length) * 100) : 0;
  const critCount = tasks.filter(t => t.isCritical).length;

  return (
    <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Mobile close button */}
      {onClose && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: "var(--t-sm)", fontWeight: 600, color: "var(--text2)" }}>Stats & Filters</span>
          <button onClick={onClose} className="tm-btn-ghost"><X size={14} /></button>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { l: "Total",    v: tasks.length,     c: undefined },
          { l: "Done",     v: cnt("completed"), c: "var(--green)"  },
          { l: "Active",   v: cnt("in_progress"), c: "var(--blue)" },
          { l: "Critical", v: critCount,        c: critCount ? "var(--orange)" : undefined },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: "var(--t-xl)", fontWeight: 600, color: s.c || "var(--text1)" }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Progress</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "var(--t-xs)", color: "var(--green)" }}>{pct}%</span>
        </div>
        <div style={{ height: 2, background: "var(--border2)", borderRadius: 2 }}>
          <div style={{ height: "100%", background: "var(--green)", borderRadius: 2, width: `${pct}%`, transition: "width .5s" }} />
        </div>
      </div>

      {/* CPM results */}
      {projectDuration > 0 && (
        <div style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>CPM</div>
          {[
            { l: "Duration",      v: `${projectDuration}d`, c: "var(--blue)" },
            { l: "PERT Expected", v: pertStats ? `${pertStats.expectedDuration}d` : "—", c: "var(--purple)" },
            { l: "95% Range",     v: pertStats ? `${pertStats.prob95Range.min}–${pertStats.prob95Range.max}d` : "—", c: "var(--amber)" },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid var(--border)", fontSize: "var(--t-xs)" }}>
              <span style={{ color: "var(--text3)" }}>{r.l}</span>
              <span style={{ color: r.c, fontFamily: "var(--mono)" }}>{r.v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* Filters */}
      <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em" }}>Filter</div>
      <select className="tm-select" style={{ fontSize: "var(--t-sm)", padding: "6px 28px 6px 9px" }} value={fEmp} onChange={e => setFEmp(e.target.value)}>
        <option value="">All employees</option>
        {employees.map(e => { const k = String(e._id ?? e.id ?? ""); return <option key={k} value={k}>{e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim()}</option>; })}
      </select>
      <select className="tm-select" style={{ fontSize: "var(--t-sm)", padding: "6px 28px 6px 9px" }} value={fPri} onChange={e => setFPri(e.target.value)}>
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* Workflow */}
      <div>
        <div style={{ fontSize: "var(--t-sm)", fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Workflow</div>
        {["Add tasks + PERT estimates", "Set task dependencies", "Compute CPM", "View Gantt / CPM analysis"].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 5 }}>
            <span style={{ fontSize: "var(--t-xs)", color: "var(--blue)", fontFamily: "var(--mono)", marginTop: 1, flexShrink: 0 }}>{i + 1}.</span>
            <span style={{ fontSize: "var(--t-sm)", color: "var(--text3)", lineHeight: 1.5 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// VIEWS
// ─────────────────────────────────────────────
function GanttView({ tasks, projectDuration }) {
  if (!tasks.length || !projectDuration)
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 8, color: "var(--text3)" }}>
        <BarChart2 size={28} style={{ opacity: 0.2 }} />
        <span style={{ fontSize: "var(--t-md)" }}>Run "Compute CPM" to generate the Gantt chart</span>
      </div>
    );
  const totalDays = Math.max(projectDuration, 1);
  return (
    <div style={{ padding: "16px 20px", overflowX: "auto" }}>
      <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 14 }}>
        Gantt · {totalDays} day project
      </div>
      <div style={{ display: "flex", marginBottom: 8, paddingLeft: 140 }}>
        {Array.from({ length: totalDays + 1 }, (_, i) => (
          <div key={i} style={{ flex: 1, minWidth: 18, fontSize: 9, color: "var(--text3)", textAlign: "center", fontFamily: "var(--mono)" }}>{i}</div>
        ))}
      </div>
      {tasks.filter(t => t.earlyStart != null).map(task => {
        const es = task.earlyStart ?? 0;
        const ef = task.earlyFinish ?? es + (task.duration || 1);
        const lPct = (es / totalDays) * 100;
        const wPct = ((ef - es) / totalDays) * 100;
        const isCrit = task.isCritical;
        return (
          <div key={getTaskId(task)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, animation: "fadeIn .2s ease both" }}>
            <div style={{ width: 132, flexShrink: 0, fontSize: "var(--t-sm)", color: isCrit ? "var(--orange)" : "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: isCrit ? 500 : 400 }}>
              {isCrit && <span style={{ marginRight: 5, fontSize: 9 }}>●</span>}{task.title}
            </div>
            <div style={{ flex: 1, height: 20, background: "var(--bg)", borderRadius: 3, position: "relative", border: "1px solid var(--border)", minWidth: 120 }}>
              {task.float > 0 && (
                <div style={{ position: "absolute", left: `${(task.lateStart / totalDays) * 100}%`, width: `${(task.float / totalDays) * 100}%`, height: "100%", background: "rgba(255,255,255,.02)", borderRight: "1px dashed var(--border2)" }} />
              )}
              <div style={{ position: "absolute", left: `${lPct}%`, width: `${Math.max(wPct, 0.5)}%`, height: "100%", background: isCrit ? "var(--orange)" : "var(--blue)", opacity: isCrit ? 0.8 : 0.6, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {ef - es >= 2 && <span style={{ fontSize: 8, color: "#fff", fontFamily: "var(--mono)", fontWeight: 600, opacity: 0.9 }}>{ef - es}d</span>}
              </div>
            </div>
            <div style={{ width: 44, flexShrink: 0, fontSize: 9, textAlign: "right", color: isCrit ? "var(--orange)" : "var(--text3)", fontFamily: "var(--mono)" }}>
              {isCrit ? "crit" : `f:${task.float}d`}
            </div>
          </div>
        );
      })}
      <div style={{ fontSize: "var(--t-xs)", color: "var(--text3)", marginTop: 12, display: "flex", gap: 16 }}>
        <span>● critical path</span><span style={{ opacity: 0.5 }}>dashed = float</span>
      </div>
    </div>
  );
}

function PertView({ tasks }) {
  const withPert = tasks.filter(t => t.pertTime);
  if (!withPert.length)
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 8, color: "var(--text3)" }}>
        <GitBranch size={28} style={{ opacity: 0.2 }} />
        <span style={{ fontSize: "var(--t-md)" }}>Add O/M/P estimates to tasks to see PERT analysis</span>
      </div>
    );
  return (
    <div style={{ padding: "16px 20px", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--t-md)" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border2)" }}>
            {["Task","O","M","P","te","Variance","±SD","Status","Critical?"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {withPert.map(t => {
            const isCrit = t.isCritical;
            const st = STATUS_CFG[t.status] || STATUS_CFG.pending;
            return (
              <tr key={getTaskId(t)} style={{ borderBottom: "1px solid var(--border)", background: isCrit ? "rgba(249,115,22,.03)" : "transparent" }}>
                <td style={{ padding: "10px 12px", fontWeight: 500, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isCrit ? "var(--orange)" : "var(--text1)" }}>{t.title}</td>
                <td style={{ padding: "10px 12px", color: "var(--green)",  fontFamily: "var(--mono)", fontSize: "var(--t-sm)" }}>{t.pertOptimistic  ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--amber)",  fontFamily: "var(--mono)", fontSize: "var(--t-sm)" }}>{t.pertMostLikely  ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--red)",    fontFamily: "var(--mono)", fontSize: "var(--t-sm)" }}>{t.pertPessimistic ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--purple)", fontFamily: "var(--mono)", fontSize: "var(--t-sm)", fontWeight: 600 }}>{t.pertTime}</td>
                <td style={{ padding: "10px 12px", color: "var(--text2)",  fontFamily: "var(--mono)", fontSize: "var(--t-sm)" }}>{t.pertVariance ?? "—"}</td>
                <td style={{ padding: "10px 12px", color: "var(--text2)",  fontFamily: "var(--mono)", fontSize: "var(--t-sm)" }}>±{t.pertSD ?? "—"}</td>
                <td style={{ padding: "10px 12px" }}><span style={{ fontSize: "var(--t-sm)", color: st.color, fontFamily: "var(--mono)" }}>{st.label}</span></td>
                <td style={{ padding: "10px 12px" }}>
                  {isCrit ? <span style={{ color: "var(--orange)", fontSize: "var(--t-sm)", fontFamily: "var(--mono)" }}>yes</span>
                          : <span style={{ color: "var(--text3)",  fontSize: "var(--t-sm)", fontFamily: "var(--mono)" }}>no</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 14, fontSize: "var(--t-xs)", color: "var(--text3)", fontFamily: "var(--mono)" }}>
        te = (O + 4M + P) / 6 · variance = ((P−O)/6)²
      </div>
    </div>
  );
}

function CpmSummaryView({ tasks, projectDuration, pertStats, isMobile }) {
  const critTasks = tasks.filter(t => t.isCritical);
  return (
    <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
        {[
          { l: "Duration",       v: `${projectDuration}d`,                    c: "var(--blue)"   },
          { l: "Critical Tasks", v: critTasks.length,                          c: "var(--orange)" },
          { l: "PERT Expected",  v: `${pertStats?.expectedDuration ?? "—"}d`, c: "var(--purple)" },
          { l: "±SD",            v: pertStats ? `${pertStats.sd}d` : "—",     c: "var(--amber)"  },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{s.l}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: isMobile ? "var(--t-xl)" : "var(--t-2xl)", fontWeight: 600, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      {pertStats && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>95% Confidence Range</div>
          <div style={{ fontSize: "var(--t-md)", color: "var(--text1)" }}>
            Project completion between&nbsp;
            <span style={{ color: "var(--purple)", fontFamily: "var(--mono)", fontWeight: 600 }}>{pertStats.prob95Range.min}d</span>
            &nbsp;and&nbsp;
            <span style={{ color: "var(--purple)", fontFamily: "var(--mono)", fontWeight: 600 }}>{pertStats.prob95Range.max}d</span>
          </div>
        </div>
      )}
      {critTasks.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--orange)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>
            Critical Path · {critTasks.length} tasks
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
            {critTasks.map((t, i) => (
              <span key={getTaskId(t)} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ background: "rgba(249,115,22,.1)", border: "1px solid rgba(249,115,22,.2)", borderRadius: 4, padding: "3px 9px", fontSize: "var(--t-sm)", color: "var(--orange)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>
                  {t.title}
                </span>
                {i < critTasks.length - 1 && <span style={{ color: "var(--border2)", fontSize: "var(--t-xs)" }}>→</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--t-md)", minWidth: 500 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border2)", background: "rgba(255,255,255,.02)" }}>
              {["Task","Duration","ES","EF","LS","LF","Float","Critical"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "9px 14px", fontSize: "var(--t-xs)", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: ".08em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.filter(t => t.earlyStart != null).map(t => {
              const isCrit = t.isCritical;
              return (
                <tr key={getTaskId(t)} style={{ borderBottom: "1px solid var(--border)", background: isCrit ? "rgba(249,115,22,.02)" : "transparent" }}>
                  <td style={{ padding: "9px 14px", fontWeight: 500, color: isCrit ? "var(--orange)" : "var(--text1)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</td>
                  {[t.duration, t.earlyStart, t.earlyFinish, t.lateStart, t.lateFinish, t.float].map((v, i) => (
                    <td key={i} style={{ padding: "9px 14px", fontFamily: "var(--mono)", fontSize: "var(--t-sm)", color: "var(--text2)" }}>{v ?? "—"}</td>
                  ))}
                  <td style={{ padding: "9px 14px", fontFamily: "var(--mono)", fontSize: "var(--t-xs)" }}>
                    {isCrit ? <span style={{ color: "var(--orange)" }}>yes</span> : <span style={{ color: "var(--text3)" }}>no</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TASK MODAL
// ─────────────────────────────────────────────
function TaskModal({ task, employees, allTasks, onClose, onSave, isMobile }) {
  const isEdit = !!task;
  const [title,    setTitle]    = useState(task?.title || "");
  const [desc,     setDesc]     = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [due,      setDue]      = useState(task?.due_date ? String(task.due_date).slice(0, 10) : "");
  const [emp,      setEmp]      = useState(String(task?.assigned_to?._id ?? task?.assigned_to ?? ""));
  const [dur,      setDur]      = useState(task?.duration || 1);
  const [pertO,    setPertO]    = useState(task?.pertOptimistic  || "");
  const [pertM,    setPertM]    = useState(task?.pertMostLikely  || "");
  const [pertP,    setPertP]    = useState(task?.pertPessimistic || "");
  const [deps,     setDeps]     = useState((task?.dependencies || []).map(d => String(d?._id || d)));
  const [saving,   setSaving]   = useState(false);
  const id = getTaskId(task);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const o = parseFloat(pertO) || 0;
  const m = parseFloat(pertM) || 0;
  const p = parseFloat(pertP) || 0;
  const te = o && m && p ? +((o + 4 * m + p) / 6).toFixed(2) : null;
  const otherTasks = allTasks.filter(t => getTaskId(t) !== id);
  const toggleDep = depId => setDeps(prev => prev.includes(depId) ? prev.filter(d => d !== depId) : [...prev, depId]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(id, {
      assigned_to: emp || null, title: title.trim(), description: desc.trim(),
      priority, due_date: due || null,
      duration: te || parseFloat(dur) || 1,
      pertOptimistic: o || null, pertMostLikely: m || null, pertPessimistic: p || null,
      dependencies: deps,
    });
    setSaving(false);
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 500, padding: isMobile ? 0 : 20 }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border2)",
        borderRadius: isMobile ? "16px 16px 0 0" : 12,
        width: "100%", maxWidth: isMobile ? "100%" : 480, padding: 24,
        display: "flex", flexDirection: "column", gap: 14,
        maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto",
        animation: "slideIn .18s ease both", boxShadow: "0 24px 64px rgba(0,0,0,.7)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--t-md)", fontWeight: 600, color: "var(--text1)" }}>{isEdit ? "Edit Task" : "New Task"}</span>
          <button onClick={onClose} className="tm-btn-ghost" style={{ fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ height: 1, background: "var(--border)" }} />

        <Field label="Title" required>
          <input className="tm-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" autoFocus />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Assigned to">
            <select className="tm-select" value={emp} onChange={e => setEmp(e.target.value)}>
              <option value="">Unassigned</option>
              {employees.map(e => <option key={String(e._id ?? e.id)} value={String(e._id ?? e.id)}>{e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim()}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className="tm-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option>
              <option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea className="tm-input" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional description" style={{ resize: "vertical", minHeight: 60, lineHeight: 1.5 }} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Duration (days)" hint="auto from PERT">
            <input type="number" min={0.5} step={0.5} className="tm-input" value={te || dur} onChange={e => setDur(e.target.value)} />
          </Field>
          <Field label="Due Date">
            <input type="date" className="tm-input" value={due} onChange={e => setDue(e.target.value)} />
          </Field>
        </div>

        <div style={{ height: 1, background: "var(--border)" }} />

        <div>
          <Label hint="optional">PERT Estimates (days)</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { l: "Optimistic",  v: pertO, fn: setPertO, ph: "2" },
              { l: "Most Likely", v: pertM, fn: setPertM, ph: "4" },
              { l: "Pessimistic", v: pertP, fn: setPertP, ph: "8" },
            ].map(f => (
              <div key={f.l}>
                <div style={{ fontSize: "var(--t-xs)", color: "var(--text3)", marginBottom: 4 }}>{f.l}</div>
                <input type="number" min={0} step={0.5} className="tm-input" value={f.v} onChange={e => f.fn(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
          </div>
          {te && (
            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              {[
                { l: "Expected te", v: `${te}d`, c: "var(--purple)" },
                { l: "±SD", v: `${+Math.sqrt((((p - o) / 6) ** 2)).toFixed(2)}d`, c: "var(--amber)" },
              ].map(r => (
                <div key={r.l} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 10px" }}>
                  <div style={{ fontSize: "var(--t-xs)", color: "var(--text3)", marginBottom: 2 }}>{r.l}</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "var(--t-md)", fontWeight: 600, color: r.c }}>{r.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {otherTasks.length > 0 && (
          <div>
            <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />
            <Label>Dependencies</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 100, overflowY: "auto", marginTop: 6 }}>
              {otherTasks.map(t => {
                const tid = getTaskId(t);
                const checked = deps.includes(tid);
                return (
                  <label key={tid} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 5, cursor: "pointer", background: checked ? "rgba(59,130,246,.06)" : "transparent", border: `1px solid ${checked ? "rgba(59,130,246,.2)" : "transparent"}`, transition: "all .1s" }}>
                    <input type="checkbox" checked={checked} onChange={() => toggleDep(tid)} style={{ accentColor: "var(--blue)", width: 12, height: 12, cursor: "pointer" }} />
                    <span style={{ fontSize: "var(--t-md)", color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    {t.pertTime && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "var(--mono)" }}>{t.pertTime}d</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "transparent", color: "var(--text2)", border: "1px solid var(--border2)", borderRadius: 7, fontFamily: "var(--sans)", fontSize: "var(--t-sm)", fontWeight: 500, padding: "9px", cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || !title.trim()}
            style={{ flex: 2, background: "var(--blue)", color: "#fff", border: "none", borderRadius: 7, fontFamily: "var(--sans)", fontSize: "var(--t-sm)", fontWeight: 500, padding: "9px", cursor: saving || !title.trim() ? "not-allowed" : "pointer", opacity: saving || !title.trim() ? 0.55 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {saving ? <><Spinner />&nbsp;Saving…</> : isEdit ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TASK CARD — desktop list row
// ─────────────────────────────────────────────
function TaskCard({ task, employees, onDelete, onEdit, deleting, flash }) {
  const empName = resolveEmpName(task, employees);
  const st      = STATUS_CFG[task.status]     || STATUS_CFG.pending;
  const pr      = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
  const over    = isOverdue(task.due_date, task.status);
  const isCrit  = task.isCritical;
  const cls = ["tm-card", isCrit ? "critical" : "", flash ? "flashing" : ""].filter(Boolean).join(" ");

  return (
    <div className={cls} style={{ opacity: deleting ? 0.45 : 1 }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%", background: pr.color, flexShrink: 0, marginTop: 7 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
          <span style={{ fontSize: "var(--t-md)", fontWeight: 500, color: "var(--text1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }}>{task.title}</span>
          <CpmBadge task={task} />
          <PertBadge task={task} />
        </div>
        {task.description && (
          <div style={{ fontSize: "var(--t-sm)", color: "var(--text3)", lineHeight: 1.5, marginBottom: 7, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{task.description}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {empName && empName !== "Unassigned" && <span style={{ fontSize: "var(--t-sm)", color: "var(--text3)" }}>{empName}</span>}
          <StatBadge status={task.status} />
          <PriBadge priority={task.priority} />
          {task.duration && <span style={{ fontSize: "var(--t-xs)", color: "var(--text3)", fontFamily: "var(--mono)", display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} style={{ opacity: 0.5 }} />{task.duration}d</span>}
          {task.due_date && <span style={{ fontSize: "var(--t-xs)", color: over ? "var(--red)" : "var(--text3)" }}>{fmtDate(task.due_date)}{over ? " · overdue" : ""}</span>}
          {(task.dependencies || []).length > 0 && <span style={{ fontSize: "var(--t-xs)", color: "var(--text3)" }}>{(task.dependencies || []).length} dep{(task.dependencies || []).length > 1 ? "s" : ""}</span>}
          {task.progress > 0 && task.progress < 100 && <span style={{ fontSize: "var(--t-xs)", color: "var(--text3)", fontFamily: "var(--mono)" }}>{task.progress}%</span>}
          {task.status === "in_progress" && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--blue)", display: "inline-block", animation: "spin 2.5s linear infinite", boxShadow: "0 0 5px var(--blue)" }} />}
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
        <button className="tm-btn-ghost" onClick={() => !deleting && onEdit(task)} disabled={deleting}><Pencil size={13} /></button>
        <button className="tm-btn-ghost danger" onClick={() => !deleting && getTaskId(task) && onDelete(getTaskId(task))} disabled={deleting} style={{ cursor: deleting ? "not-allowed" : "pointer" }}>
          {deleting ? <Spinner size={11} /> : <Trash2 size={13} />}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE TASK CARD  (like MobileCard in EmployeeList)
// ─────────────────────────────────────────────
function MobileTaskCard({ task, employees, onDelete, onEdit, deleting, flash }) {
  const empName = resolveEmpName(task, employees);
  const pr      = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium;
  const over    = isOverdue(task.due_date, task.status);
  const isCrit  = task.isCritical;
  const cls = ["tm-mobile-card", isCrit ? "critical" : "", flash ? "flashing" : ""].filter(Boolean).join(" ");

  return (
    <div className={cls} style={{ opacity: deleting ? 0.45 : 1 }}>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: pr.color, flexShrink: 0, marginTop: 6 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)", lineHeight: 1.3, marginBottom: 4 }}>{task.title}</div>
          {task.description && (
            <div style={{ fontSize: "var(--t-sm)", color: "var(--text3)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{task.description}</div>
          )}
        </div>
        <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
          <button className="tm-btn-ghost" onClick={() => !deleting && onEdit(task)} disabled={deleting}><Pencil size={13} /></button>
          <button className="tm-btn-ghost danger" onClick={() => !deleting && getTaskId(task) && onDelete(getTaskId(task))} disabled={deleting}>
            {deleting ? <Spinner size={11} /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <StatBadge status={task.status} />
        <PriBadge priority={task.priority} />
        {isCrit && <CpmBadge task={task} />}
        {task.pertTime && <PertBadge task={task} />}
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {empName && empName !== "Unassigned" && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>ASSIGNED</div>
            <div style={{ fontSize: "var(--t-sm)", color: "var(--text2)" }}>{empName}</div>
          </div>
        )}
        {task.duration && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>DURATION</div>
            <div style={{ fontSize: "var(--t-sm)", fontFamily: "var(--mono)", color: "var(--text2)" }}>{task.duration}d</div>
          </div>
        )}
        {task.due_date && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>DUE</div>
            <div style={{ fontSize: "var(--t-sm)", color: over ? "var(--red)" : "var(--text2)" }}>{fmtDate(task.due_date)}{over ? " ⚠" : ""}</div>
          </div>
        )}
        {(task.dependencies || []).length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>DEPS</div>
            <div style={{ fontSize: "var(--t-sm)", color: "var(--text2)" }}>{(task.dependencies || []).length}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function TaskManagement() {
  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [employees,       setEmployees]       = useState([]);
  const [tasks,           setTasks]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [tab,             setTab]             = useState("all");
  const [view,            setView]            = useState("list");
  const [fEmp,            setFEmp]            = useState("");
  const [fPri,            setFPri]            = useState("");
  const [computingCPM,    setComputingCPM]    = useState(false);
  const [deletingId,      setDeletingId]      = useState(null);
  const [taskModal,       setTaskModal]       = useState(null);
  const [socketStatus,    setSocketStatus]    = useState("connecting");
  const [toast,           setToast]           = useState({ visible: false, message: "", type: "success" });
  const [flashIds,        setFlashIds]        = useState(new Set());
  const [projectDuration, setProjectDuration] = useState(0);
  const [pertStats,       setPertStats]       = useState(null);
  const [drawerOpen,      setDrawerOpen]      = useState(false);  // mobile sidebar drawer

  const showToast = useCallback((msg, type = "success") => {
    setToast({ visible: true, message: msg, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3200);
  }, []);

  const flashCard = useCallback(id => {
    setFlashIds(p => { const n = new Set(p); n.add(String(id)); return n; });
    setTimeout(() => setFlashIds(p => { const n = new Set(p); n.delete(String(id)); return n; }), 900);
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await API.get("/employees");
      const list = Array.isArray(data) ? data : data.employees || [];
      setEmployees(list.map(e => ({ ...e, _id: String(e._id ?? e.id ?? "") })));
    } catch { showToast("Employees load nahi hue", "error"); }
  }, [showToast]);

  const fetchTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/tasks");
      const list = Array.isArray(data) ? data : data.tasks || [];
      setTasks(list.map(normalizeTask));
    } catch (err) {
      const msg = err?.response?.data?.message || "Tasks load nahi hue. Dobara try karo.";
      setError(msg);
      if (!silent) showToast(msg, "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { fetchTasks(); },    [fetchTasks]);
  useEffect(() => { const id = setInterval(() => fetchTasks(true), 6000); return () => clearInterval(id); }, [fetchTasks]);

  // Close drawer when switching to desktop
  useEffect(() => { if (!isMobile && !isTablet) setDrawerOpen(false); }, [isMobile, isTablet]);

  // Socket.IO
  useEffect(() => {
    const sock = socketIO(SOCKET_URL, { transports: ["websocket", "polling"], reconnection: true });
    sock.on("connect",    () => { setSocketStatus("online"); sock.emit("join", "admins"); });
    sock.on("disconnect", () => setSocketStatus("offline"));
    sock.on("task:statusUpdate", ({ taskId, status }) => {
      setTasks(p => p.map(t => String(getTaskId(t)) === String(taskId) ? { ...t, status } : t));
      flashCard(taskId);
    });
    sock.on("task:update", u => {
      setTasks(p => p.map(t => String(getTaskId(t)) === String(u._id || u.taskId) ? normalizeTask({ ...t, ...u }) : t));
      flashCard(u._id || u.taskId);
    });
    sock.on("task:deleted", ({ taskId }) => setTasks(p => p.filter(t => String(getTaskId(t)) !== String(taskId))));
    sock.on("task:new", nt => {
      setTasks(p => {
        if (p.find(t => String(getTaskId(t)) === String(getTaskId(nt)))) return p;
        return [normalizeTask(nt), ...p];
      });
    });
    sock.on("connect_error", () => setSocketStatus("offline"));
    return () => sock.disconnect();
  }, [flashCard]);

  async function runCPM() {
    setComputingCPM(true);
    try {
      const { data } = await API.post("/tasks/compute-cpm", {});
      const { tasks: updated, criticalPath: cp, projectDuration: pd, pertStats: ps } = data;
      setTasks(updated.map(normalizeTask));
      setProjectDuration(pd || 0);
      setPertStats(ps || null);
      showToast(`CPM computed — ${cp?.length || 0} critical, ${pd} days`);
    } catch (e) { showToast(`CPM failed: ${e?.response?.data?.message || e.message}`, "error"); }
    setComputingCPM(false);
  }

  async function saveTask(id, payload) {
    try {
      if (id) {
        const { data: updated } = await API.put(`/tasks/${id}`, payload);
        setTasks(p => p.map(t => {
          if (getTaskId(t) !== id) return t;
          const emp = employees.find(e => String(e._id ?? e.id) === String(payload.assigned_to));
          return normalizeTask({ ...t, ...(updated || payload), _id: id, status: t.status, employee_name: emp ? emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() : t.employee_name });
        }));
        showToast("Task update ho gaya");
      } else {
        const { data: created } = await API.post("/tasks", payload);
        setTasks(p => [normalizeTask(created), ...p]);
        showToast("Naya task ban gaya");
      }
      setTaskModal(null);
    } catch (e) { showToast(`Save fail: ${e?.response?.data?.message || e.message}`, "error"); }
  }

  async function deleteTask(id) {
    setDeletingId(id);
    try {
      await API.delete(`/tasks/${id}`);
      setTasks(p => p.filter(t => getTaskId(t) !== id));
      showToast("Task delete ho gaya");
    } catch (e) { showToast(`Delete fail: ${e?.response?.data?.message || e.message}`, "error"); }
    setDeletingId(null);
  }

  // Derived
  const cnt       = s => tasks.filter(t => t.status === s).length;
  const critCount = tasks.filter(t => t.isCritical).length;

  const filtered = tasks.filter(t => {
    const tabOk = tab === "all" || t.status === tab;
    const empOk = !fEmp || String(t.assigned_to?._id ?? t.assigned_to) === fEmp;
    const priOk = !fPri || t.priority === fPri;
    return tabOk && empOk && priOk;
  });

  const TABS = [
    { k: "all",         n: tasks.length,       l: "All"         },
    { k: "pending",     n: cnt("pending"),      l: "Pending"     },
    { k: "in_progress", n: cnt("in_progress"),  l: "In Progress" },
    { k: "in_review",   n: cnt("in_review"),    l: "In Review"   },
    { k: "completed",   n: cnt("completed"),    l: "Completed"   },
    { k: "blocked",     n: cnt("blocked"),      l: "Blocked"     },
  ];
  const VIEWS = [
    { k: "list",  l: "List",  Icon: List      },
    { k: "gantt", l: "Gantt", Icon: BarChart2 },
    { k: "pert",  l: "PERT",  Icon: GitBranch },
    { k: "cpm",   l: "CPM",   Icon: Zap       },
  ];

  const sockColor = { connecting: "var(--amber)", online: "var(--green)", offline: "var(--red)" }[socketStatus];
  const sockLabel = { connecting: "connecting", online: "live", offline: "offline" }[socketStatus];

  const sidebarProps = { tasks, employees, fEmp, setFEmp, fPri, setFPri, projectDuration, pertStats };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <div className="tm-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="tm-drawer">
            <SidebarContent {...sidebarProps} onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      {taskModal !== null && (
        <TaskModal
          task={taskModal.task || null}
          employees={employees}
          allTasks={tasks}
          onClose={() => setTaskModal(null)}
          onSave={saveTask}
          isMobile={isMobile}
        />
      )}

      <div style={{ fontFamily: "var(--sans)", background: "var(--bg)", color: "var(--text1)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── Top Header ── */}
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: isMobile ? "0 12px" : "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, flexShrink: 0, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Mobile: hamburger to open sidebar drawer */}
            {(isMobile || isTablet) && (
              <button className="tm-btn-ghost" onClick={() => setDrawerOpen(true)} style={{ padding: "5px 6px" }}>
                <Menu size={15} />
              </button>
            )}
            <span style={{ fontFamily: "var(--mono)", fontSize: "var(--t-md)", fontWeight: 600, color: "var(--text1)", letterSpacing: "-.01em" }}>tasks</span>
            {critCount > 0 && !isMobile && (
              <span style={{ fontSize: "var(--t-xs)", color: "var(--orange)", fontFamily: "var(--mono)", letterSpacing: ".02em" }}>{critCount} critical</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8 }}>
            {/* View switcher — icon-only on mobile */}
            <div style={{ display: "flex", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
              {VIEWS.map(v => (
                <button key={v.k} onClick={() => setView(v.k)} className={`tm-view-btn${view === v.k ? " active" : ""}`} style={{ padding: isMobile ? "5px 8px" : "5px 10px" }}>
                  <v.Icon size={12} />
                  {!isMobile && v.l}
                </button>
              ))}
            </div>

            {/* Compute CPM — hide label on mobile */}
            {!isMobile && (
              <button onClick={runCPM} disabled={computingCPM}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid var(--border2)", borderRadius: 6, color: computingCPM ? "var(--text3)" : "var(--text2)", fontFamily: "var(--sans)", fontSize: "var(--t-sm)", fontWeight: 500, padding: "5px 11px", cursor: computingCPM ? "not-allowed" : "pointer" }}>
                {computingCPM ? <><Spinner />&nbsp;computing…</> : "compute CPM"}
              </button>
            )}
            {isMobile && (
              <button onClick={runCPM} disabled={computingCPM} className="tm-btn-ghost" title="Compute CPM" style={{ padding: "5px 6px" }}>
                {computingCPM ? <Spinner size={13} /> : <Zap size={14} color="var(--text3)" />}
              </button>
            )}

            {/* New Task */}
            <button onClick={() => setTaskModal({})}
              style={{ background: "var(--blue)", border: "none", borderRadius: 6, color: "#fff", fontFamily: "var(--sans)", fontSize: "var(--t-sm)", fontWeight: 500, padding: isMobile ? "5px 10px" : "5px 12px", cursor: "pointer" }}>
              {isMobile ? "+" : "+ New Task"}
            </button>

            {/* Refresh */}
            <button onClick={() => fetchTasks()} className="tm-btn-ghost" style={{ padding: "5px 6px" }}>
              <Loader2 size={13} color="#4b5a70" style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }} />
            </button>

            {/* Socket status */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--t-xs)", color: sockColor, fontFamily: "var(--mono)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: sockColor, display: "inline-block", flexShrink: 0 }} />
              {!isMobile && sockLabel}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Desktop/wide Sidebar ── */}
          {!isMobile && !isTablet && (
            <div style={{ width: 216, borderRight: "1px solid var(--border)", background: "var(--surface)", overflowY: "auto", flexShrink: 0 }}>
              <SidebarContent {...sidebarProps} />
            </div>
          )}

          {/* ── Main Content ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Sub-header / tabs — horizontally scrollable on mobile */}
            <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 12px", display: "flex", alignItems: "center", flexShrink: 0, overflowX: "auto" }}>
              {view === "list"
                ? TABS.map(t => (
                    <button key={t.k} onClick={() => setTab(t.k)} className={`tm-tab${tab === t.k ? " active" : ""}`} style={{ padding: isMobile ? "10px 10px" : "10px 12px" }}>
                      {isMobile ? t.l.split(" ")[0] : t.l}
                      <span style={{ fontFamily: "var(--mono)", fontSize: "var(--t-xs)", color: tab === t.k ? "var(--blue)" : "var(--text3)" }}>{t.n}</span>
                    </button>
                  ))
                : (
                  <div style={{ padding: "10px 4px", fontSize: "var(--t-sm)", color: "var(--text3)", fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>
                    {view} · {filtered.length} tasks
                  </div>
                )}
              <div style={{ flex: 1, minWidth: 8 }} />
              {/* Mini filters — hidden on mobile (use drawer) */}
              {!isMobile && (
                <div style={{ display: "flex", gap: 6, padding: "0 0 0 8px", flexShrink: 0 }}>
                  <select className="tm-mini-select" value={fEmp} onChange={e => setFEmp(e.target.value)}>
                    <option value="">All employees</option>
                    {employees.map(e => { const k = String(e._id ?? e.id ?? ""); return <option key={k} value={k}>{e.name || `${e.firstName || ""} ${e.lastName || ""}`.trim()}</option>; })}
                  </select>
                  <select className="tm-mini-select" value={fPri} onChange={e => setFPri(e.target.value)}>
                    <option value="">All priorities</option>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "12px 16px 0", padding: "10px 16px", borderRadius: 10, background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.2)", fontSize: 13, color: "#fca5a5" }}>
                <span style={{ flex: 1 }}>{error}</span>
                <button style={{ background: "none", border: "1px solid rgba(252,165,165,0.25)", borderRadius: 6, color: "#fca5a5", cursor: "pointer", fontSize: 11, padding: "3px 10px" }} onClick={() => setError("")}>Dismiss</button>
                <button style={{ background: "none", border: "1px solid rgba(252,165,165,0.25)", borderRadius: 6, color: "#fca5a5", cursor: "pointer", fontSize: 11, padding: "3px 10px", marginLeft: 4 }} onClick={() => fetchTasks()}>Retry</button>
              </div>
            )}

            {/* Content area */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {view === "list" && (
                <div style={{ padding: isMobile ? "10px 12px" : "12px 16px", display: "flex", flexDirection: "column", gap: isMobile ? 8 : 5 }}>
                  {loading && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "50px 0" }}>
                      <Loader2 size={24} color="#93b4f8" style={{ animation: "spin 0.8s linear infinite" }} />
                      <span style={{ fontSize: 13, color: "#3a4556" }}>Tasks load ho rahe hain…</span>
                    </div>
                  )}
                  {!loading && !error && tasks.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 8, color: "var(--text3)" }}>
                      <List size={28} style={{ opacity: 0.2 }} />
                      <span style={{ fontSize: "var(--t-md)" }}>Abhi koi task nahi hai</span>
                      <button onClick={() => setTaskModal({})} style={{ marginTop: 4, background: "var(--blue)", border: "none", borderRadius: 6, color: "#fff", fontFamily: "var(--sans)", fontSize: "var(--t-sm)", fontWeight: 500, padding: "7px 14px", cursor: "pointer" }}>
                        + New Task
                      </button>
                    </div>
                  )}
                  {!loading && !error && tasks.length > 0 && filtered.length === 0 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, gap: 8, color: "var(--text3)" }}>
                      <List size={28} style={{ opacity: 0.2 }} />
                      <span style={{ fontSize: "var(--t-md)" }}>Koi task filter se match nahi kiya</span>
                    </div>
                  )}
                  {/* Mobile: MobileTaskCard / Desktop: TaskCard */}
                  {!loading && filtered.map(task =>
                    isMobile ? (
                      <MobileTaskCard
                        key={getTaskId(task)} task={task} employees={employees}
                        onDelete={deleteTask} onEdit={t => setTaskModal({ task: t })}
                        deleting={deletingId === getTaskId(task)}
                        flash={flashIds.has(String(getTaskId(task)))}
                      />
                    ) : (
                      <TaskCard
                        key={getTaskId(task)} task={task} employees={employees}
                        onDelete={deleteTask} onEdit={t => setTaskModal({ task: t })}
                        deleting={deletingId === getTaskId(task)}
                        flash={flashIds.has(String(getTaskId(task)))}
                      />
                    )
                  )}
                </div>
              )}
              {view === "gantt" && <GanttView tasks={filtered} projectDuration={projectDuration} />}
              {view === "pert"  && <PertView  tasks={filtered} />}
              {view === "cpm"   && <CpmSummaryView tasks={filtered} projectDuration={projectDuration} pertStats={pertStats} isMobile={isMobile} />}
            </div>
          </div>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </>
  );
}
