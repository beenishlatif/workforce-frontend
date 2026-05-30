import { useState, useEffect, useCallback } from "react";
import {
  X, Shield, Trash2, Camera, Clock, Calendar, ChevronDown,
  RefreshCw, Search, Users, ImageIcon, BarChart2,
  MonitorPlay, Building2, UserCircle2, CheckSquare, Square,
  CheckCircle, AlertTriangle, Activity, Zap
} from "lucide-react";
import API from "../api/axios.js";

const BLOCKED_APPS = ["youtube","facebook","tiktok","instagram","twitter","netflix","whatsapp","snapchat"];

// ── Responsive hook ─────────────────────────────────────────────────────────
function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, width: w };
  });
  useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      setBp({ isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, width: w });
    };
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return bp;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function isBlockedApp(app, wt) {
  return BLOCKED_APPS.some(b => ((app || "") + " " + (wt || "")).toLowerCase().includes(b));
}
function isBlockedShot(s) {
  return s.isBlocked === true || isBlockedApp(s.app, s.windowTitle);
}
function getDisplayApp(s) {
  return s.blockedApp || s.app || s.applicationName || s.processName || "Unknown App";
}

function getEmpShots(shots, emp) {
  if (!emp) return [];
  const id = emp._id?.toString()?.trim();
  const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim().toLowerCase();
  const email = (emp.email || "").toLowerCase().trim();
  return shots.filter(s => {
    const userId = s.userId && typeof s.userId === "object"
      ? s.userId._id?.toString()?.trim()
      : s.userId?.toString()?.trim();
    if (id) {
      if (userId && userId === id) return true;
      if (s.employeeId?.toString()?.trim() === id) return true;
      if (s.empId?.toString()?.trim() === id) return true;
    }
    const shotName = (s.employeeName || s.name || "").trim().toLowerCase();
    if (name && shotName && shotName === name) return true;
    const shotEmail = (s.email || "").trim().toLowerCase();
    if (email && shotEmail && shotEmail === email) return true;
    return false;
  });
}

function shotTimestamp(s) {
  return new Date(s.createdAt || s.timestamp || s.date || 0).getTime();
}

function ini(name) { return (name || "??").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function prodColor(p) { return p >= 70 ? "#34d399" : p >= 40 ? "#fbbf24" : "#f87171"; }

function filterByDate(shots, range) {
  if (range === "all") return shots;
  const now = new Date();
  return shots.filter(s => {
    const d = new Date(s.createdAt || s.date || s.timestamp);
    if (isNaN(d)) return true;
    if (range === "today") return d.toDateString() === now.toDateString();
    if (range === "yesterday") { const y = new Date(now); y.setDate(now.getDate()-1); return d.toDateString() === y.toDateString(); }
    if (range === "week") { const w = new Date(now); w.setDate(now.getDate()-7); return d >= w; }
    if (range === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });
}

function localDateStr(d) {
  if (!d || isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${dd}`;
}

function getShotDate(s) {
  const raw = s.createdAt || s.timestamp;
  if (raw) { const d = new Date(raw); if (!isNaN(d)) return d; }
  if (s.date) { const d = new Date(s.date); if (!isNaN(d)) return d; }
  return null;
}

function getUniqueDates(shots) {
  const dates = new Set();
  shots.forEach(s => { const d = getShotDate(s); if (d) { const str = localDateStr(d); if (str) dates.add(str); } });
  return Array.from(dates).sort((a, b) => b.localeCompare(a));
}

function fmtTime(s) {
  const d = new Date(s.createdAt || s.date || s.timestamp);
  return isNaN(d) ? (s.time || "") : d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_CFG = {
  Online:  { color: "#34d399", bg: "rgba(52,211,153,.08)",  border: "rgba(52,211,153,.2)"  },
  Working: { color: "#34d399", bg: "rgba(52,211,153,.08)",  border: "rgba(52,211,153,.2)"  },
  Idle:    { color: "#fbbf24", bg: "rgba(251,191,36,.08)",  border: "rgba(251,191,36,.2)"  },
  Meeting: { color: "#a78bfa", bg: "rgba(167,139,250,.08)", border: "rgba(167,139,250,.2)" },
  Break:   { color: "#fb923c", bg: "rgba(251,146,60,.08)",  border: "rgba(251,146,60,.2)"  },
  Offline: { color: "#475569", bg: "rgba(71,85,105,.08)",   border: "rgba(71,85,105,.15)"  },
};

const GRADS = [
  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "linear-gradient(135deg,#10b981,#065f46)",
  "linear-gradient(135deg,#8b5cf6,#4c1d95)",
  "linear-gradient(135deg,#f59e0b,#92400e)",
  "linear-gradient(135deg,#ec4899,#831843)",
  "linear-gradient(135deg,#06b6d4,#0e7490)",
  "linear-gradient(135deg,#ef4444,#991b1b)",
];

function nameColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % GRADS.length;
  return GRADS[h];
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  :root{
    --bg:#05070f; --s1:#080c18; --s2:#0c1020; --s3:#101525;
    --b1:#1a2035; --b2:#222d45; --b3:#2a3855;
    --t1:#e8edf8; --t2:#7b8db0; --t3:#3a4d6a; --t4:#1e2d45;
    --acc:#4f72f5; --green:#34d399; --amber:#fbbf24; --red:#f87171; --purple:#a78bfa;
    --mono:'JetBrains Mono',monospace; --sans:'Inter',sans-serif;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:var(--sans);background:var(--bg);color:var(--t1);font-size:13px;-webkit-font-smoothing:antialiased;}
  *{scrollbar-width:thin;scrollbar-color:var(--b2) transparent;}
  ::-webkit-scrollbar{width:3px;height:3px;}
  ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px;}
  select option{background:#080c18;color:#e8edf8;}
  input::placeholder{color:var(--t4)!important;}

  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  @keyframes slideIn{from{opacity:0;transform:scale(.97) translateY(-6px)}to{opacity:1;transform:none}}
  @keyframes toast{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}

  .ec{background:var(--s1);border:1px solid var(--b1);border-radius:16px;overflow:hidden;cursor:pointer;transition:border-color .2s,transform .22s,box-shadow .22s;animation:fadeUp .3s ease both;position:relative;}
  .ec:hover{border-color:var(--b2);transform:translateY(-5px);box-shadow:0 20px 60px rgba(0,0,0,.7),0 0 0 1px rgba(79,114,245,.08);}
  .ec-img{height:158px;position:relative;overflow:hidden;background:#030508;}
  .ec-img img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .35s;}
  .ec:hover .ec-img img{transform:scale(1.04);}
  .ec-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 25%,rgba(5,7,15,.92) 100%);pointer-events:none;}
  .ec-body{padding:15px 17px;}

  .sc{background:var(--s2);border:1px solid var(--b1);border-radius:12px;overflow:hidden;transition:border-color .15s,transform .15s;}
  .sc:hover{border-color:var(--b2);transform:translateY(-2px);}

  .dt{border-radius:10px;overflow:hidden;border:2px solid var(--b1);cursor:pointer;background:var(--s2);transition:border-color .15s,transform .12s;position:relative;}
  .dt:hover{border-color:var(--b2);}
  .dt.sel{border-color:#7c5af7;box-shadow:0 0 0 1px rgba(124,90,247,.25);}

  .btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:9px;border:1px solid var(--b1);background:var(--s1);color:var(--t2);cursor:pointer;font-size:12px;font-weight:500;font-family:var(--sans);transition:all .15s;white-space:nowrap;}
  .btn:hover{border-color:var(--b2);background:var(--s2);color:var(--t1);}
  .btn.primary{border-color:rgba(79,114,245,.3);background:rgba(79,114,245,.08);color:#7c9bfa;}
  .btn.primary:hover{background:rgba(79,114,245,.15);border-color:rgba(79,114,245,.45);}
  .btn.danger{border-color:rgba(248,113,113,.1);background:transparent;color:var(--t3);}
  .btn.danger:hover{border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.07);color:#f87171;}
  .btn.ghost{background:transparent;border-color:transparent;color:var(--t3);padding:8px;}
  .btn.ghost:hover{background:var(--s2);border-color:var(--b1);color:var(--t2);}

  .mc{background:var(--s1);border:1px solid var(--b1);border-radius:14px;padding:20px 22px;transition:border-color .15s;position:relative;overflow:hidden;}
  .mc::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(79,114,245,.25),transparent);}
  .mc:hover{border-color:var(--b2);}

  .ef-wrap{background:var(--s1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;margin-bottom:22px;}
  .ef-head{display:flex;align-items:center;gap:10px;padding:11px 18px;border-bottom:1px solid var(--b1);background:rgba(255,255,255,.012);}
  .ef-scroll{display:flex;gap:0;overflow-x:auto;padding:0;}
  .ef-scroll::-webkit-scrollbar{height:2px;}
  .ef-item{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 18px;cursor:pointer;border-right:1px solid var(--b1);border-bottom:none;transition:background .15s;flex-shrink:0;min-width:90px;position:relative;}
  .ef-item:last-child{border-right:none;}
  .ef-item:hover{background:rgba(255,255,255,.03);}
  .ef-item.active{background:rgba(79,114,245,.07);}
  .ef-item.active::after{content:'';position:absolute;bottom:0;left:10%;right:10%;height:2px;background:var(--acc);border-radius:2px 2px 0 0;}
  .ef-av{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;position:relative;flex-shrink:0;}
  .ef-dot{position:absolute;bottom:-2px;right:-2px;width:9px;height:9px;border-radius:50%;border:2px solid var(--s1);}
  .ef-name{font-size:10px;font-weight:600;color:var(--t2);white-space:nowrap;text-align:center;max-width:80px;overflow:hidden;text-overflow:ellipsis;}
  .ef-item.active .ef-name{color:var(--t1);}
  .ef-cnt{font-size:10px;font-weight:700;color:var(--t3);font-family:var(--mono);background:var(--b1);padding:1px 7px;border-radius:5px;}
  .ef-item.active .ef-cnt{color:#7c9bfa;background:rgba(79,114,245,.2);}

  .inp{padding:8px 12px;border-radius:9px;border:1px solid var(--b1);background:var(--s1);color:var(--t1);font-size:12px;font-family:var(--sans);outline:none;transition:border-color .15s;}
  .inp:focus{border-color:rgba(79,114,245,.45);}
  .sel-wrap{position:relative;display:flex;align-items:center;}
  .sel-wrap select{padding:8px 28px 8px 10px;border-radius:9px;border:1px solid var(--b1);background:var(--s1);color:var(--t2);font-size:12px;font-family:var(--sans);appearance:none;outline:none;cursor:pointer;transition:all .15s;}
  .sel-wrap select:focus,.sel-wrap select:hover{border-color:rgba(79,114,245,.35);color:var(--t1);}
  .sel-wrap svg{position:absolute;right:8px;pointer-events:none;}

  .sb{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:600;font-family:var(--mono);letter-spacing:.03em;}

  .modal-bg{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.88);backdrop-filter:blur(12px);display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;overflow-y:auto;}
  .modal{background:var(--s1);border:1px solid var(--b2);border-radius:20px;width:100%;max-width:980px;overflow:hidden;animation:slideIn .22s cubic-bezier(.2,.8,.3,1) both;margin-bottom:24px;}
  .modal-sm{max-width:820px;}
  .modal-hd{padding:18px 22px;border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.012);}

  .confirm{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:rgba(248,113,113,.06);border:1px solid rgba(248,113,113,.18);}

  .prog-track{height:2px;background:var(--b1);border-radius:2px;overflow:hidden;}
  .prog-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#4f72f5,#a78bfa);transition:width .1s;}

  .toast-wrap{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;}
  .toast{display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:11px;min-width:240px;max-width:320px;background:var(--s2);box-shadow:0 8px 32px rgba(0,0,0,.7);animation:toast .25s ease both;font-size:12px;color:var(--t1);}

  @media (max-width: 639px) {
    .toast-wrap{left:12px;right:12px;bottom:16px;}
    .toast{min-width:unset;max-width:100%;}
    .modal-bg{padding:0;align-items:flex-end;}
    .modal{border-radius:20px 20px 0 0;margin-bottom:0;max-height:94vh;display:flex;flex-direction:column;}
    .modal .modal-hd{flex-shrink:0;}
    .modal-sm{max-width:100%;}
    .ef-item{min-width:72px;padding:10px 10px;}
    .btn{padding:7px 10px;font-size:11px;}
    .mc{padding:14px 15px;}
  }

  @media (min-width:640px) and (max-width:1023px) {
    .ef-item{min-width:80px;padding:12px 13px;}
  }
`;

// ── Image cache ──────────────────────────────────────────────────────────────
const _imgCache = new Map();

function ShotImg({ shot, style: sx }) {
  const id = shot?._id;
  const inline = shot?.imageUrl || shot?.image || shot?.screenshot || shot?.imageData;
  const [src, setSrc] = useState(() => inline || _imgCache.get(id) || null);
  const [loading, setLoading] = useState(!src && !!id);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    if (inline) { setSrc(inline); setLoading(false); return; }
    if (_imgCache.has(id)) { setSrc(_imgCache.get(id)); setLoading(false); return; }
    setLoading(true); setFailed(false);
    // axios pattern: API.get returns { data }
    API.get(`/screenshots/${id}/image`)
      .then(({ data }) => {
        const url = data?.imageUrl || data?.image || null;
        if (url) { _imgCache.set(id, url); setSrc(url); }
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [id, inline]);

  if (loading) return (
    <div style={{ ...sx, display: "flex", alignItems: "center", justifyContent: "center", background: "#030508" }}>
      <RefreshCw size={14} color="#1a2540" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!src || failed) return (
    <div style={{ ...sx, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "#030508" }}>
      <Camera size={18} color="#1a2540" strokeWidth={1.5} />
      <span style={{ fontSize: 9, color: "#1a2540", fontFamily: "var(--mono)" }}>no image</span>
    </div>
  );

  return <img src={src} alt="" style={sx} onError={() => { setFailed(true); setSrc(null); }} />;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Offline;
  return (
    <span className="sb" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
      {status}
    </span>
  );
}

function ToastList({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className="toast"
          style={{ borderLeft: `3px solid ${t.type === "error" ? "#f87171" : t.type === "warn" ? "#fbbf24" : "#34d399"}`, border: `1px solid ${t.type === "error" ? "rgba(248,113,113,.2)" : t.type === "warn" ? "rgba(251,191,36,.2)" : "rgba(52,211,153,.2)"}` }}>
          {t.type === "error" ? <AlertTriangle size={13} color="#f87171" /> : <CheckCircle size={13} color="#34d399" />}
          <span style={{ flex: 1, lineHeight: 1.5 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function ConfirmInline({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="confirm">
      <AlertTriangle size={11} color="#f87171" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "#fca5a5", flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onConfirm} disabled={loading}
        style={{ fontSize: 11, fontWeight: 600, color: "#f87171", background: "rgba(248,113,113,.15)", border: "1px solid rgba(248,113,113,.3)", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 4 }}>
        {loading && <RefreshCw size={9} style={{ animation: "spin .6s linear infinite" }} />}
        {loading ? "…" : "Yes"}
      </button>
      <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", padding: 2 }}><X size={11} /></button>
    </div>
  );
}

// ── Delete by Date Modal ─────────────────────────────────────────────────────
function DeleteDateModal({ screenshots, onClose, onDeleteSelected, deleting, deleteProgress }) {
  const { isMobile } = useBreakpoint();
  const [selDate, setSelDate] = useState("");
  const [selIds, setSelIds] = useState([]);
  const dates = getUniqueDates(screenshots);

  const dateSS = selDate
    ? screenshots.filter(s => { const d = getShotDate(s); return d && localDateStr(d) === selDate; })
    : [];

  const allSel = dateSS.length > 0 && selIds.length === dateSS.length;
  useEffect(() => setSelIds([]), [selDate]);

  const today = new Date().toISOString().split("T")[0];
  const yestD = (() => { const y = new Date(); y.setDate(y.getDate()-1); return y.toISOString().split("T")[0]; })();

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1200, background: "rgba(0,0,0,.92)", backdropFilter: "blur(14px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 24 }}
      onClick={onClose}
    >
      <div
        className="modal modal-sm"
        style={{ maxHeight: isMobile ? "94vh" : "92vh", display: "flex", flexDirection: "column", borderRadius: isMobile ? "20px 20px 0 0" : 20, marginBottom: 0, width: "100%" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-hd" style={{ flexShrink: 0, padding: isMobile ? "14px 16px" : "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,90,247,.12)", border: "1px solid rgba(124,90,247,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Calendar size={15} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: "var(--t1)" }}>Delete by Date</div>
              <div style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>Pick a date · select · delete</div>
            </div>
          </div>
          <button className="btn ghost" onClick={onClose}><X size={13} /></button>
        </div>

        <div style={{ padding: isMobile ? "12px 16px" : "14px 22px", borderBottom: "1px solid var(--b1)", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".1em" }}>Available Dates ({dates.length})</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {dates.length === 0 && <span style={{ fontSize: 12, color: "var(--t3)" }}>No dates found</span>}
            {dates.map(date => {
              const cnt = screenshots.filter(s => { const d = getShotDate(s); return d && localDateStr(d) === date; }).length;
              const isA = selDate === date;
              const lbl = date === today ? "Today" : date === yestD ? "Yesterday" : date;
              return (
                <button key={date} onClick={() => setSelDate(date)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: isMobile ? "5px 10px" : "6px 12px", borderRadius: 8, border: `1px solid ${isA ? "rgba(124,90,247,.4)" : "var(--b1)"}`, background: isA ? "rgba(124,90,247,.1)" : "rgba(255,255,255,.02)", cursor: "pointer", fontFamily: "var(--sans)", transition: "all .15s" }}>
                  <Calendar size={9} color={isA ? "#a78bfa" : "var(--t3)"} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: isA ? "var(--t1)" : "var(--t2)" }}>{lbl}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: isA ? "rgba(124,90,247,.25)" : "var(--b1)", color: isA ? "#a78bfa" : "var(--t3)", padding: "1px 7px", borderRadius: 5, fontFamily: "var(--mono)" }}>{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selDate && dateSS.length > 0 && (
          <div style={{ padding: isMobile ? "8px 16px" : "9px 22px", borderBottom: "1px solid var(--b1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "rgba(255,255,255,.01)", flexWrap: "wrap", gap: 6 }}>
            <button onClick={() => allSel ? setSelIds([]) : setSelIds(dateSS.map(s => s._id))}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--t2)", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 500 }}>
              {allSel ? <CheckSquare size={14} color="#7c5af7" /> : <Square size={14} color="var(--t3)" />}
              {allSel ? "Deselect All" : "Select All"} ({dateSS.length})
            </button>
            {selIds.length > 0 && (
              <button onClick={() => onDeleteSelected(selIds)} disabled={deleting}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(248,113,113,.3)", background: "rgba(248,113,113,.08)", color: "#f87171", cursor: "pointer", fontFamily: "var(--sans)", fontSize: 12, fontWeight: 600, transition: "all .15s" }}>
                <Trash2 size={12} />
                {deleting ? <><RefreshCw size={10} style={{ animation: "spin .6s linear infinite" }} />{deleteProgress}%</> : `Delete ${selIds.length}`}
              </button>
            )}
          </div>
        )}

        {deleting && (
          <div style={{ padding: "6px 22px 0", flexShrink: 0 }}>
            <div className="prog-track"><div className="prog-fill" style={{ width: `${deleteProgress}%` }} /></div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 16px" : "16px 22px" }}>
          {!selDate ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, gap: 10 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(124,90,247,.07)", border: "1px solid rgba(124,90,247,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Calendar size={20} color="#3a2a70" strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: 13, color: "var(--t3)" }}>Select a date to preview screenshots</span>
            </div>
          ) : dateSS.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 220, gap: 10 }}>
              <Camera size={26} color="#1a2540" strokeWidth={1.5} />
              <span style={{ fontSize: 13, color: "var(--t3)" }}>No screenshots on this date</span>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? "130px" : "155px"},1fr))`, gap: isMobile ? 8 : 10 }}>
              {dateSS.map((s, i) => {
                const isSel = selIds.includes(s._id);
                return (
                  <div key={s._id || i} className={`dt${isSel ? " sel" : ""}`}
                    onClick={() => setSelIds(prev => prev.includes(s._id) ? prev.filter(x => x !== s._id) : [...prev, s._id])}>
                    <ShotImg shot={s} style={{ width: "100%", height: isMobile ? 80 : 95, objectFit: "cover", display: "block" }} />
                    {isSel && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(124,90,247,.18)" }}>
                        <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 5, background: "#7c5af7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckSquare size={11} color="#fff" />
                        </div>
                      </div>
                    )}
                    <div style={{ padding: "7px 9px", background: "var(--s2)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getDisplayApp(s)}</div>
                      <div style={{ fontSize: 9, color: "var(--t3)", display: "flex", alignItems: "center", gap: 3, marginTop: 2, fontFamily: "var(--mono)" }}><Clock size={7} />{fmtTime(s)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Employee Modal ───────────────────────────────────────────────────────────
function EmpModal({ emp, allShots, dateRange, onClose, onDelete, deletingIds }) {
  const { isMobile } = useBreakpoint();
  const [shots, setShots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelId, setConfirmDelId] = useState(null);

  const empName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
  const status = emp.status || "Offline";
  const avgProd = shots.length ? Math.round(shots.reduce((a, s) => a + (s.productivity || 0), 0) / shots.length) : 0;

  useEffect(() => {
    if (!emp._id) return;
    const load = async () => {
      setLoading(true);
      try {
        // axios pattern: destructure { data }
        const { data } = await API.get(`/screenshots/employee/${emp._id}`);
        setShots(filterByDate((Array.isArray(data) ? data : []).filter(s => !isBlockedShot(s)), dateRange));
      } catch {
        setShots(filterByDate(getEmpShots(allShots, emp).filter(s => !isBlockedShot(s)), dateRange));
      }
      setLoading(false);
    };
    load();
  }, [emp._id, dateRange]);

  const handleDelete = async (id) => {
    setConfirmDelId(null);
    setShots(prev => prev.filter(s => s._id !== id));
    await onDelete(id);
  };

  const modalGridCols = isMobile ? "repeat(auto-fill,minmax(145px,1fr))" : "repeat(auto-fill,minmax(195px,1fr))";
  const modalPad = isMobile ? "14px 14px" : "20px 22px";
  const modalHdPad = isMobile ? "14px 16px" : "18px 22px";

  return (
    <div className="modal-bg" style={{ padding: isMobile ? 0 : "24px 16px", alignItems: isMobile ? "flex-end" : "flex-start" }} onClick={onClose}>
      <div className="modal" style={{ borderRadius: isMobile ? "20px 20px 0 0" : 20, marginBottom: 0, maxHeight: isMobile ? "94vh" : undefined, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div className="modal-hd" style={{ padding: modalHdPad, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, flex: 1, flexWrap: "wrap" }}>
            <div style={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 13, background: nameColor(empName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{ini(empName)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, color: "var(--t1)", marginBottom: 6 }}>{empName}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <StatusBadge status={status} />
                {emp.department && !isMobile && <span style={{ fontSize: 10, color: "var(--t2)", background: "var(--s2)", padding: "2px 8px", borderRadius: 5, border: "1px solid var(--b1)", display: "flex", alignItems: "center", gap: 3 }}><Building2 size={8} color="var(--t4)" />{emp.department}</span>}
                {emp.role && !isMobile && <span style={{ fontSize: 10, color: "var(--t2)", background: "var(--s2)", padding: "2px 8px", borderRadius: 5, border: "1px solid var(--b1)", display: "flex", alignItems: "center", gap: 3 }}><UserCircle2 size={8} color="var(--t4)" />{emp.role}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: isMobile ? 6 : 10, flexShrink: 0 }}>
              {[{ label: "Screenshots", val: shots.length, c: "var(--t1)" }, { label: "Avg Prod", val: `${avgProd}%`, c: prodColor(avgProd) }].map(m => (
                <div key={m.label} style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 10, padding: isMobile ? "8px 12px" : "10px 16px", textAlign: "center", minWidth: isMobile ? 64 : 82 }}>
                  <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: m.c, lineHeight: 1, fontFamily: "var(--mono)" }}>{m.val}</div>
                  <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 5, textTransform: "uppercase", letterSpacing: ".07em" }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn ghost" onClick={onClose} style={{ marginLeft: 8, flexShrink: 0 }}><X size={13} /></button>
        </div>

        <div style={{ padding: modalPad, flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <RefreshCw size={20} color="var(--t3)" style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 12, color: "var(--t3)" }}>Loading screenshots…</div>
            </div>
          ) : shots.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Camera size={28} color="var(--b2)" strokeWidth={1.5} style={{ display: "block", margin: "0 auto 14px" }} />
              <div style={{ fontSize: 13, color: "var(--t3)" }}>No screenshots in this date range</div>
              <div style={{ fontSize: 11, color: "var(--t4)", marginTop: 5 }}>Try "All Time" to see everything</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: modalGridCols, gap: 12, maxHeight: isMobile ? "none" : 520, overflowY: isMobile ? "visible" : "auto" }}>
              {shots.map((s, i) => {
                const isDel = deletingIds?.has(s._id);
                const isConf = confirmDelId === s._id;
                return (
                  <div key={s._id || i} className="sc" style={{ opacity: isDel ? .3 : 1, transition: "opacity .2s" }}>
                    <div style={{ position: "relative" }}>
                      <ShotImg shot={s} style={{ width: "100%", height: isMobile ? 100 : 114, objectFit: "cover", display: "block" }} />
                      <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,.75)", borderRadius: 5, padding: "2px 7px" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: prodColor(s.productivity || 0), fontFamily: "var(--mono)" }}>{s.productivity || 0}%</span>
                      </div>
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--t1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{getDisplayApp(s)}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--t3)", marginBottom: 9, fontFamily: "var(--mono)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Calendar size={7} />{s.date}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={7} />{fmtTime(s)}</span>
                      </div>
                      <div style={{ background: "rgba(0,0,0,.35)", borderRadius: 8, padding: 2, border: "1px solid rgba(255,255,255,.04)" }}>
                        {isConf ? (
                          <ConfirmInline message="Delete?" loading={isDel} onConfirm={() => handleDelete(s._id)} onCancel={() => setConfirmDelId(null)} />
                        ) : (
                          <button onClick={() => setConfirmDelId(s._id)} disabled={isDel}
                            className="btn danger"
                            style={{ width: "100%", justifyContent: "center", padding: "5px 8px", borderRadius: 6, borderColor: "transparent", fontSize: 11 }}>
                            <Trash2 size={10} />{isDel ? "Deleting…" : "Delete"}
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
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AllScreenshots() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [employees,     setEmployees]     = useState([]);
  const [screenshots,   setScreenshots]   = useState([]);
  const [activity,      setActivity]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetching,      setFetching]      = useState(false);
  const [selEmp,        setSelEmp]        = useState("All");
  const [dateRange,     setDateRange]     = useState("all");
  const [deletingIds,   setDeletingIds]   = useState(new Set());
  const [deletingBulk,  setDeletingBulk]  = useState(false);
  const [deleteProgress,setDeleteProgress]= useState(0);
  const [modalEmp,      setModalEmp]      = useState(null);
  const [showDelDate,   setShowDelDate]   = useState(false);
  const [search,        setSearch]        = useState("");
  const [error,         setError]         = useState(null);
  const [totalInDB,     setTotalInDB]     = useState(0);
  const [confirmOld,    setConfirmOld]    = useState(false);
  const [deletingOld,   setDeletingOld]   = useState(false);
  const [toasts,        setToasts]        = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  // ── Fetch screenshots — axios pattern ────────────────────────────────────
  const fetchScreenshots = useCallback(async () => {
    setFetching(true);
    try {
      let all = [], page = 1;
      while (true) {
        const { data } = await API.get(`/screenshots/live?page=${page}&limit=200`);
        const arr = Array.isArray(data) ? data : [];
        if (!arr.length) break;
        all = all.concat(arr);
        if (arr.length < 200) break;
        if (++page > 10) break;
      }
      const visible = all.filter(s => !isBlockedShot(s));
      setScreenshots(visible);
      setTotalInDB(visible.length);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    }
    setFetching(false);
  }, []);

  // ── Fetch all data — axios pattern ───────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [empResult, , actResult] = await Promise.allSettled([
      API.get("/employees"),
      fetchScreenshots(),
      API.get("/employees/activity"),
    ]);

    if (empResult.status === "fulfilled") {
      const d = empResult.value.data;
      setEmployees(Array.isArray(d) ? d : (d.employees || d.data || []));
    }
    if (actResult.status === "fulfilled") {
      const d = actResult.value.data;
      setActivity(Array.isArray(d) ? d : (d.employees || []));
    }
    setLoading(false);
  }, [fetchScreenshots]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const id = setInterval(fetchScreenshots, 60000); return () => clearInterval(id); }, [fetchScreenshots]);

  // ── Delete one — axios pattern ───────────────────────────────────────────
  const deleteOne = async (id) => {
    setDeletingIds(p => new Set([...p, id]));
    setScreenshots(p => p.filter(s => s._id !== id));
    try {
      await API.delete(`/screenshots/${id}`);
      toast("Screenshot deleted");
    } catch (e) {
      toast(e?.response?.data?.message || "Delete failed", "error");
    }
    setDeletingIds(p => { const n = new Set(p); n.delete(id); return n; });
  };

  // ── Delete bulk ──────────────────────────────────────────────────────────
  const deleteBulk = async (ids) => {
    setDeletingBulk(true); setDeleteProgress(0);
    setScreenshots(p => p.filter(s => !ids.includes(s._id)));
    let done = 0, failed = 0;
    for (let i = 0; i < ids.length; i += 10) {
      const batch = ids.slice(i, i + 10);
      const results = await Promise.allSettled(batch.map(id => API.delete(`/screenshots/${id}`)));
      results.forEach(r => { if (r.status === "rejected") failed++; });
      done += batch.length;
      setDeleteProgress(Math.round((done / ids.length) * 100));
    }
    setDeletingBulk(false); setDeleteProgress(0); setShowDelDate(false);
    toast(`${ids.length - failed} screenshots deleted${failed ? `, ${failed} failed` : ""}`);
  };

  // ── Delete old — axios pattern ───────────────────────────────────────────
  const deleteOld = async () => {
    setDeletingOld(true);
    try {
      const { data } = await API.delete("/screenshots/old/all");
      toast(`${data.deleted} screenshots deleted`);
      setConfirmOld(false);
      fetchScreenshots();
    } catch (e) {
      toast(e?.response?.data?.message || "Delete failed", "error");
    }
    setDeletingOld(false);
  };

  // ── Derived state ────────────────────────────────────────────────────────
  const statusMap = {};
  activity.forEach(e => { statusMap[e._id?.toString()] = e; });

  const dated = filterByDate(screenshots, dateRange);
  const avgProd = dated.length ? Math.round(dated.reduce((a, s) => a + (s.productivity || 0), 0) / dated.length) : 0;
  const dateLabel = { all: "All Time", today: "Today", yesterday: "Yesterday", week: "This Week", month: "This Month" }[dateRange] || dateRange;

  const filtered = employees.filter(e => {
    const n = `${e.firstName} ${e.lastName}`.trim();
    return (selEmp === "All" || n === selEmp) && (!search || n.toLowerCase().includes(search.toLowerCase()) || (e.department || "").toLowerCase().includes(search.toLowerCase()));
  });

  // ── Responsive values ────────────────────────────────────────────────────
  const pagePad      = isMobile ? "16px 14px" : isTablet ? "20px 20px" : "26px 30px";
  const headerFlex   = isMobile ? "column" : "row";
  const h1Size       = isMobile ? 17 : 20;
  const controlsGap  = isMobile ? 6 : 7;
  const searchWidth  = isMobile ? "100%" : isTablet ? 150 : 170;
  const metricsGrid  = isMobile ? "1fr" : "repeat(3,1fr)";
  const metricsPad   = isMobile ? "14px 15px" : "20px 22px";
  const empCardGrid  = isMobile ? "1fr" : isTablet ? "repeat(auto-fill,minmax(250px,1fr))" : "repeat(auto-fill,minmax(285px,1fr))";
  const empImgH      = isMobile ? 130 : 158;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: pagePad, fontFamily: "var(--sans)", color: "var(--t1)" }}>
      <style>{CSS}</style>
      <ToastList toasts={toasts} />

      {showDelDate && (
        <DeleteDateModal
          screenshots={screenshots}
          onClose={() => setShowDelDate(false)}
          onDeleteSelected={deleteBulk}
          deleting={deletingBulk}
          deleteProgress={deleteProgress}
        />
      )}
      {modalEmp && (
        <EmpModal
          emp={{ ...modalEmp, ...(statusMap[modalEmp._id?.toString()] || {}) }}
          allShots={screenshots}
          dateRange={dateRange}
          onClose={() => setModalEmp(null)}
          onDelete={deleteOne}
          deletingIds={deletingIds}
        />
      )}

      {/* ── HEADER ── */}
      <div style={{ display: "flex", flexDirection: headerFlex, justifyContent: "space-between", alignItems: isMobile ? "stretch" : "flex-start", marginBottom: isMobile ? 18 : 26, gap: isMobile ? 12 : 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(79,114,245,.1)", border: "1px solid rgba(79,114,245,.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MonitorPlay size={16} color="#7c9bfa" />
            </div>
            <h1 style={{ fontSize: h1Size, fontWeight: 700, letterSpacing: "-.025em" }}>Screenshots</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 46, flexWrap: "wrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse 2s infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--t2)" }}>{fetching ? "Syncing…" : `${totalInDB} screenshots · refresh every 60s`}</span>
            {error && <span style={{ fontSize: 10, color: "#f87171", background: "rgba(248,113,113,.07)", padding: "2px 8px", borderRadius: 5, display: "flex", alignItems: "center", gap: 3 }}><AlertTriangle size={8} />{error}</span>}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: controlsGap, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "none" }}>
            <Search size={11} color="var(--t4)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input className="inp" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30, width: isMobile ? "100%" : searchWidth }} />
          </div>

          <div style={{ display: "flex", gap: controlsGap, alignItems: "center", flexWrap: "wrap", flex: isMobile ? "1 1 100%" : "none" }}>
            <div className="sel-wrap" style={{ flex: isMobile ? 1 : "none" }}>
              <select value={selEmp} onChange={e => setSelEmp(e.target.value)} style={{ width: isMobile ? "100%" : undefined }}>
                <option value="All">All Employees</option>
                {employees.map(e => { const n = `${e.firstName} ${e.lastName}`.trim(); return <option key={e._id} value={n}>{n}</option>; })}
              </select>
              <ChevronDown size={11} color="var(--t3)" />
            </div>
            <div className="sel-wrap" style={{ flex: isMobile ? 1 : "none" }}>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ width: isMobile ? "100%" : undefined }}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <ChevronDown size={11} color="var(--t3)" />
            </div>
            <button className="btn" onClick={() => { setLoading(true); fetchAll(); }} style={{ flexShrink: 0 }}>
              <RefreshCw size={13} style={{ animation: (loading || fetching) ? "spin 1s linear infinite" : "none" }} />
              {!isMobile && "Refresh"}
            </button>
          </div>

          <div style={{ display: "flex", gap: controlsGap, alignItems: "center", flex: isMobile ? "1 1 100%" : "none", flexWrap: "wrap" }}>
            <button className="btn primary" onClick={() => setShowDelDate(true)} style={{ flex: isMobile ? 1 : "none", justifyContent: "center" }}>
              <Calendar size={13} /> Delete by Date
            </button>
            {confirmOld ? (
              <div style={{ flex: isMobile ? "1 1 100%" : "none" }}>
                <ConfirmInline message="Delete all screenshots older than 24h?" loading={deletingOld} onConfirm={deleteOld} onCancel={() => setConfirmOld(false)} />
              </div>
            ) : (
              <button className="btn danger" onClick={() => setConfirmOld(true)} style={{ flex: isMobile ? 1 : "none", justifyContent: "center", borderColor: "rgba(248,113,113,.15)", background: "rgba(248,113,113,.04)", color: "var(--t3)" }}>
                <Trash2 size={13} /> {!isMobile && "Delete Old"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: metricsGrid, gap: isMobile ? 8 : 12, marginBottom: isMobile ? 16 : 22 }}>
        {[
          { icon: <ImageIcon size={17} />, accent: "#4f72f5", label: "Total Screenshots", val: dated.length,       sub: `of ${totalInDB} total` },
          { icon: <Activity size={17} />,  accent: "#34d399", label: "Avg Productivity",  val: `${avgProd}%`,      vc: prodColor(avgProd) },
          { icon: <Users size={17} />,     accent: "#a78bfa", label: "Employees",         val: employees.length,   sub: "registered" },
        ].map((m, i) => (
          <div key={i} className="mc" style={{ padding: metricsPad }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${m.accent}14`, border: `1px solid ${m.accent}22`, display: "flex", alignItems: "center", justifyContent: "center", color: m.accent, marginBottom: isMobile ? 10 : 13 }}>{m.icon}</div>
            <div style={{ fontSize: 9, color: "var(--t4)", marginBottom: 5, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: m.vc || "var(--t1)", lineHeight: 1, marginBottom: 4, fontFamily: "var(--mono)" }}>{m.val}</div>
            <div style={{ fontSize: 11, color: "var(--t3)" }}>{m.sub || dateLabel}</div>
          </div>
        ))}
      </div>

      {/* ── EMPLOYEE FILTER BAR ── */}
      <div className="ef-wrap">
        <div className="ef-head" style={{ padding: isMobile ? "9px 14px" : "11px 18px" }}>
          <Zap size={11} color="#5a72c4" />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)", textTransform: "uppercase", letterSpacing: ".1em" }}>Employees</span>
          <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,var(--b1),transparent)" }} />
          <span style={{ fontSize: 10, color: "var(--t3)", fontFamily: "var(--mono)", fontWeight: 600 }}>{dated.length} shots · {dateLabel}</span>
        </div>
        <div className="ef-scroll">
          {(() => {
            const isA = selEmp === "All";
            return (
              <button className={`ef-item${isA ? " active" : ""}`} onClick={() => setSelEmp("All")}>
                <div className="ef-av" style={{ background: "rgba(79,114,245,.15)", border: "1px solid rgba(79,114,245,.2)", borderRadius: 10 }}>
                  <Users size={14} color="#7c9bfa" />
                </div>
                <span className="ef-name" style={{ color: isA ? "var(--t1)" : "var(--t2)" }}>All</span>
                <span className="ef-cnt">{dated.length}</span>
              </button>
            );
          })()}
          {employees.map((emp) => {
            const name = `${emp.firstName} ${emp.lastName}`.trim();
            const isA = selEmp === name;
            const cnt = getEmpShots(dated, emp).length;
            const empSt = (statusMap[emp._id?.toString()] || emp)?.status || "Offline";
            const cfg = STATUS_CFG[empSt] || STATUS_CFG.Offline;
            const grad = nameColor(name);
            return (
              <button key={emp._id} className={`ef-item${isA ? " active" : ""}`} onClick={() => setSelEmp(name)}>
                <div className="ef-av" style={{ background: grad }}>
                  {ini(name)}
                  <span className="ef-dot" style={{ background: cfg.color }} />
                </div>
                <span className="ef-name">{emp.firstName || name}</span>
                <span className="ef-cnt">{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: "70px 0" }}>
          <RefreshCw size={22} color="var(--b2)" style={{ display: "block", margin: "0 auto 14px", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: 12, color: "var(--t3)" }}>Loading data…</div>
        </div>
      )}

      {/* ── EMPLOYEE CARDS ── */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: empCardGrid, gap: isMobile ? 10 : 15 }}>
          {filtered.map((emp) => {
            const empShots = getEmpShots(dated, emp);
            const live = statusMap[emp._id?.toString()] || emp;
            const status = live.status || "Offline";
            const avgP = empShots.length ? Math.round(empShots.reduce((a, s) => a + (s.productivity || 0), 0) / empShots.length) : 0;
            const empName = `${emp.firstName} ${emp.lastName}`.trim();
            const sorted = [...empShots].sort((a, b) => shotTimestamp(b) - shotTimestamp(a));
            const latest = sorted[0] ?? null;
            const grad = nameColor(empName);

            return (
              <div key={emp._id} className="ec" onClick={() => setModalEmp(emp)}>
                <div className="ec-img" style={{ height: empImgH }}>
                  {latest ? (
                    <>
                      <ShotImg shot={latest} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      <div className="ec-overlay" />
                      <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", gap: 5, alignItems: "center" }}>
                        <div style={{ background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)", borderRadius: 6, padding: "3px 8px", display: "flex", alignItems: "center", gap: 5 }}>
                          <ImageIcon size={9} color="#7c9bfa" />
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: "var(--mono)" }}>{empShots.length}</span>
                        </div>
                        <div style={{ background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", borderRadius: 6, padding: "3px 8px", fontSize: 9, color: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", gap: 3, fontFamily: "var(--mono)" }}>
                          <Clock size={8} />{fmtTime(latest)}
                        </div>
                      </div>
                      <div style={{ position: "absolute", bottom: 34, left: 10 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,.6)", background: "rgba(0,0,0,.5)", padding: "2px 7px", borderRadius: 5, backdropFilter: "blur(4px)" }}>{getDisplayApp(latest)}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
                      <Camera size={22} color="#1a2540" strokeWidth={1.5} />
                      <span style={{ fontSize: 10, color: "#1a2540", fontFamily: "var(--mono)" }}>no screenshots ({dateLabel})</span>
                    </div>
                  )}
                  <div style={{ position: "absolute", top: 10, right: 10 }}><StatusBadge status={status} /></div>
                </div>

                <div className="ec-body" style={{ padding: isMobile ? "12px 14px" : "15px 17px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 11 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{ini(empName)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t1)", marginBottom: 2 }}>{empName}</div>
                      <div style={{ fontSize: 11, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 11, flexWrap: "wrap" }}>
                    {emp.department && <span style={{ fontSize: 9, color: "var(--t2)", background: "var(--s2)", padding: "2px 8px", borderRadius: 5, border: "1px solid var(--b1)", display: "flex", alignItems: "center", gap: 3 }}><Building2 size={8} color="var(--t4)" />{emp.department}</span>}
                    {emp.role && <span style={{ fontSize: 9, color: "var(--t2)", background: "var(--s2)", padding: "2px 8px", borderRadius: 5, border: "1px solid var(--b1)", display: "flex", alignItems: "center", gap: 3 }}><UserCircle2 size={8} color="var(--t4)" />{emp.role}</span>}
                  </div>
                  {empShots.length > 0 ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 6 }}>
                        <span style={{ color: "var(--t3)" }}>Avg Productivity</span>
                        <span style={{ color: prodColor(avgP), fontWeight: 700, fontFamily: "var(--mono)" }}>{avgP}%</span>
                      </div>
                      <div style={{ height: 2, background: "var(--b1)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${avgP}%`, height: "100%", background: prodColor(avgP), borderRadius: 2, transition: "width .6s ease" }} />
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: 2, background: "var(--b1)", borderRadius: 2 }} />
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "70px 0" }}>
              <Users size={28} style={{ display: "block", margin: "0 auto 14px", opacity: .1 }} />
              <div style={{ fontSize: 13, color: "var(--t3)" }}>No employees match your search</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
