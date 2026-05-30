import { useState, useEffect, useCallback } from "react";
import { io as socketIO } from "socket.io-client";

const API_BASE   = "https://workforce-backend-production-cc13.up.railway.app/api";
const SOCKET_URL = "https://workforce-backend-production-cc13.up.railway.app";

// ─── Auth helpers ──────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token"); }
function getMyUserId() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // common fields: id, _id, userId, sub
    return String(payload?.id ?? payload?._id ?? payload?.userId ?? payload?.sub ?? "");
  } catch { return null; }
}

async function apiCall(path, method = "GET", body = null) {
  const token = getToken();
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...(body && { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

// ─── Constants ────────────────────────────────────────────────────
const STATUS = {
  pending:     { label:"Pending",     color:"#f5a623", bg:"rgba(245,166,35,.08)",  border:"rgba(245,166,35,.2)"  },
  in_progress: { label:"In Progress", color:"#818cf8", bg:"rgba(129,140,248,.08)", border:"rgba(129,140,248,.22)" },
  in_review:   { label:"In Review",   color:"#a78bfa", bg:"rgba(167,139,250,.08)", border:"rgba(167,139,250,.22)" },
  completed:   { label:"Completed",   color:"#34d399", bg:"rgba(52,211,153,.08)",  border:"rgba(52,211,153,.22)"  },
  blocked:     { label:"Blocked",     color:"#f87171", bg:"rgba(248,113,113,.08)", border:"rgba(248,113,113,.22)" },
};

const PRIORITY = {
  low:    { color:"#34d399", label:"Low",    icon:"▼" },
  medium: { color:"#f5a623", label:"Medium", icon:"■" },
  high:   { color:"#fb923c", label:"High",   icon:"▲" },
  urgent: { color:"#f87171", label:"Urgent", icon:"!!" },
};

// ─── Utils ────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" });
}
function isOverdue(due, status) {
  if (!due || status === "completed") return false;
  return new Date(due) < new Date();
}
function getTaskId(t) { return String(t?._id ?? t?.id ?? ""); }

// ─── isMyTask: assigned_to match karo current user se ──────────────
function isMyTask(task, myId) {
  if (!myId) return true; // fallback: sab dikhao
  const at = task.assigned_to;
  if (!at) return false;
  // assigned_to string/ObjectId ho sakta hai ya object { _id, ... }
  const atId = String(at?._id ?? at?.id ?? at ?? "");
  return atId === myId;
}

// ─── Components ───────────────────────────────────────────────────

function CircleProgress({ pct, size=48, stroke=4, color="#818cf8" }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1s ease" }}/>
    </svg>
  );
}

function Toast({ msg, type, show }) {
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      transform:`translateY(${show ? 0 : 80}px)`, opacity:show ? 1 : 0,
      transition:"all .3s cubic-bezier(.34,1.56,.64,1)",
      background:"#13151f",
      border:`1px solid ${type==="error" ? "rgba(248,113,113,.3)" : "rgba(52,211,153,.3)"}`,
      borderLeft:`3px solid ${type==="error" ? "#f87171" : "#34d399"}`,
      borderRadius:12, padding:"12px 18px", fontSize:12, fontWeight:600,
      color:"#e8eaf6", boxShadow:"0 16px 48px rgba(0,0,0,.6)", pointerEvents:"none",
      display:"flex", alignItems:"center", gap:10, minWidth:220,
    }}>
      <div style={{ width:7, height:7, borderRadius:"50%", flexShrink:0,
        background:type==="error" ? "#f87171" : "#34d399" }}/>
      {msg}
    </div>
  );
}

function StatusBadge({ status }) {
  const st = STATUS[status] || STATUS.pending;
  return (
    <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20,
      background:st.bg, color:st.color, border:`1px solid ${st.border}`,
      display:"inline-flex", alignItems:"center", gap:4, letterSpacing:".04em" }}>
      {status === "in_progress" && (
        <span style={{ width:4, height:4, borderRadius:"50%", background:st.color,
          animation:"pulse 1.5s infinite" }}/>
      )}
      {st.label}
    </span>
  );
}

function TaskCard({ task, updating, isSelected, onClick }) {
  const id   = getTaskId(task);
  const st   = STATUS[task.status]     || STATUS.pending;
  const pr   = PRIORITY[task.priority] || PRIORITY.medium;
  const over = isOverdue(task.due_date, task.status);
  const busy = updating === id;

  return (
    <div onClick={onClick} style={{
      background: isSelected ? "rgba(129,140,248,0.07)" : "transparent",
      border:`1px solid ${isSelected ? "rgba(129,140,248,0.25)" : "rgba(255,255,255,0.05)"}`,
      borderLeft:`3px solid ${isSelected ? st.color : "transparent"}`,
      borderRadius:10, padding:"13px 14px",
      cursor:"pointer", transition:"all .15s",
      marginBottom:5, opacity: busy ? .6 : 1,
    }}
    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background="rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; }}}
    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background="transparent";              e.currentTarget.style.borderColor="rgba(255,255,255,0.05)"; }}}>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:600, color: isSelected ? "#f0f0f2" : "#c9cce8",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:7 }}>
            {task.title}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <StatusBadge status={task.status}/>
            <span style={{ fontSize:9, color:pr.color, fontWeight:600 }}>{pr.icon} {pr.label}</span>
          </div>
        </div>
        {task.due_date && (
          <div style={{ fontSize:9, color:over ? "#f87171" : "rgba(255,255,255,0.25)",
            fontWeight:over ? 700 : 400, textAlign:"right", flexShrink:0, marginTop:1 }}>
            {over ? "⚠ " : ""}{fmtDate(task.due_date)}
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(color, bg, border) {
  return {
    width:"100%", padding:"11px", borderRadius:9,
    border:`1px solid ${border}`, background:bg, color,
    fontFamily:"'DM Sans',sans-serif", fontSize:12, fontWeight:700,
    cursor:"pointer", transition:"opacity .15s",
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
  };
}

function TaskDetail({ task, onUpdate, updating }) {
  const id   = getTaskId(task);
  const st   = STATUS[task.status]     || STATUS.pending;
  const pr   = PRIORITY[task.priority] || PRIORITY.medium;
  const over = isOverdue(task.due_date, task.status);
  const busy = updating === id;

  const pct =
    task.status === "completed"   ? 100 :
    task.status === "in_review"   ? 80  :
    task.status === "in_progress" ? (task.progress || 55) :
    task.status === "blocked"     ? 20  : 0;

  function ActionBar() {
    if (task.status === "completed") return (
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
        background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.18)",
        borderRadius:10 }}>
        <div style={{ width:30, height:30, borderRadius:"50%",
          background:"rgba(52,211,153,0.15)", display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:14 }}>✓</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#34d399" }}>Task Complete!</div>
          <div style={{ fontSize:10, color:"rgba(52,211,153,0.55)", marginTop:2 }}>
            {task.completedAt ? `Completed ${fmtDate(task.completedAt)}` : "Well done!"}
          </div>
        </div>
      </div>
    );

    if (task.status === "in_review") return (
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
        background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.18)",
        borderRadius:10 }}>
        <div style={{ width:30, height:30, borderRadius:"50%",
          background:"rgba(167,139,250,0.15)", display:"flex",
          alignItems:"center", justifyContent:"center", fontSize:14 }}>⏳</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>Review Mein Hai</div>
          <div style={{ fontSize:10, color:"rgba(167,139,250,0.55)", marginTop:2 }}>Admin ka wait karo</div>
        </div>
      </div>
    );

    if (task.status === "blocked") return (
      <button onClick={() => onUpdate(id, "in_progress")} disabled={busy}
        style={btnStyle("#818cf8","rgba(129,140,248,.08)","rgba(129,140,248,.25)")}>
        {busy ? "..." : "▶  Resume Karo"}
      </button>
    );

    if (task.status === "in_progress") return (
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => onUpdate(id, "in_review")} disabled={busy}
          style={{ ...btnStyle("#a78bfa","rgba(167,139,250,.08)","rgba(167,139,250,.25)"), flex:1 }}>
          {busy ? "..." : "👁  Review Bhejo"}
        </button>
        <button onClick={() => onUpdate(id, "completed")} disabled={busy}
          style={{ ...btnStyle("#34d399","rgba(52,211,153,.08)","rgba(52,211,153,.25)"), flex:1 }}>
          {busy ? "..." : "✓  Complete Karo"}
        </button>
      </div>
    );

    return (
      <button onClick={() => onUpdate(id, "in_progress")} disabled={busy}
        style={btnStyle("#818cf8","rgba(129,140,248,.08)","rgba(129,140,248,.25)")}>
        {busy ? "..." : "▶  Shuru Karo"}
      </button>
    );
  }

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column",
      animation:"fadeUp .25s ease" }}>

      {/* Header */}
      <div style={{ padding:"24px 26px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.22)",
              textTransform:"uppercase", letterSpacing:".1em", marginBottom:7 }}>Task Details</div>
            <div style={{ fontSize:19, fontWeight:800, color:"#f0f0f2",
              lineHeight:1.3, letterSpacing:"-0.02em" }}>
              {task.title}
            </div>
          </div>
          <CircleProgress pct={pct} size={50} stroke={4} color={st.color}/>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          <StatusBadge status={task.status}/>
          <span style={{ fontSize:9, fontWeight:700, padding:"2px 9px", borderRadius:20,
            background:`${pr.color}10`, color:pr.color, border:`1px solid ${pr.color}22` }}>
            {pr.icon} {pr.label} Priority
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 26px",
        display:"flex", flexDirection:"column", gap:18 }}>

        {/* Description */}
        {task.description && (
          <div>
            <div style={labelStyle}>Description</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7,
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:9, padding:"12px 14px" }}>
              {task.description}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={labelStyle}>Progress</div>
            <div style={{ fontSize:11, fontWeight:700, color:st.color }}>{pct}%</div>
          </div>
          <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, borderRadius:99,
              background:st.color, transition:"width 1.2s cubic-bezier(.4,0,.2,1)" }}/>
          </div>
        </div>

        {/* Meta grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9 }}>
          {[
            { label:"Due Date", val:task.due_date ? fmtDate(task.due_date) : "No deadline",
              color:over ? "#f87171" : "rgba(255,255,255,0.5)", icon:"📅" },
            { label:"Priority", val:pr.label, color:pr.color, icon:pr.icon },
            { label:"Created",  val:task.createdAt ? fmtDate(task.createdAt) : "—",
              color:"rgba(255,255,255,0.4)", icon:"🕐" },
            { label:"Status",   val:st.label, color:st.color, icon:"●" },
          ].map(m => (
            <div key={m.label} style={{ background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.06)", borderRadius:9, padding:"11px 13px" }}>
              <div style={labelStyle}>{m.label}</div>
              <div style={{ fontSize:12, fontWeight:600, color:m.color,
                display:"flex", alignItems:"center", gap:5, marginTop:5 }}>
                <span style={{ fontSize:10 }}>{m.icon}</span>{m.val}
              </div>
            </div>
          ))}
        </div>

        {/* Timestamps */}
        {(task.startedAt || task.completedAt) && (
          <div style={{ display:"flex", gap:9 }}>
            {task.startedAt && (
              <div style={{ flex:1, background:"rgba(129,140,248,0.04)",
                border:"1px solid rgba(129,140,248,0.14)", borderRadius:9, padding:"10px 13px" }}>
                <div style={labelStyle}>Started</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#818cf8", marginTop:4 }}>
                  {fmtDate(task.startedAt)}
                </div>
              </div>
            )}
            {task.completedAt && (
              <div style={{ flex:1, background:"rgba(52,211,153,0.04)",
                border:"1px solid rgba(52,211,153,0.14)", borderRadius:9, padding:"10px 13px" }}>
                <div style={labelStyle}>Completed</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#34d399", marginTop:4 }}>
                  {fmtDate(task.completedAt)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div style={{ padding:"16px 26px 24px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <ActionBar/>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.22)",
  textTransform:"uppercase", letterSpacing:".09em",
};

// ══════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════
export default function EmployeeTasks() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState({ show:false, msg:"", type:"success" });

  const myId = getMyUserId();

  const showToast = useCallback((msg, type="success") => {
    setToast({ show:true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show:false })), 2800);
  }, []);

  // ── Load: sirf apne tasks fetch karo ──────────────────────────
  const loadTasks = useCallback(async (silent=false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Pehle employee-specific endpoint try karo
      let data = null;
      try { data = await apiCall("/emp/tasks"); } catch {}

      // 2. Fallback: /tasks/my endpoint
      if (!Array.isArray(data)) {
        try { data = await apiCall("/tasks/my"); } catch {}
      }

      // 3. Fallback: /tasks?assigned_to=me
      if (!Array.isArray(data)) {
        try { data = await apiCall("/tasks?assigned_to=me"); } catch {}
      }

      // 4. Last resort: sab tasks fetch karo aur apne filter karo
      if (!Array.isArray(data)) {
        const all = await apiCall("/tasks");
        data = Array.isArray(all)
          ? all.filter(t => isMyTask(t, myId))
          : [];
      }

      // Extra safety: ensure sirf apne tasks hain
      const myTasks = data.filter(t => isMyTask(t, myId));

      setTasks(myTasks);

      // Auto-select first active task
      setSelected(prev => {
        if (prev && myTasks.find(t => getTaskId(t) === prev)) return prev;
        const active = myTasks.find(t => t.status === "in_progress") || myTasks[0];
        return active ? getTaskId(active) : null;
      });

    } catch (e) {
      if (!silent) showToast("Tasks load nahi hue: " + e.message, "error");
    }
    setLoading(false);
  }, [myId, showToast]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => {
    const id = setInterval(() => loadTasks(true), 15000);
    return () => clearInterval(id);
  }, [loadTasks]);

  // ── Socket ────────────────────────────────────────────────────
  useEffect(() => {
    const sock = socketIO(SOCKET_URL, { transports:["websocket","polling"], reconnection:true });
    sock.on("connect", () => {
      if (myId) sock.emit("join", `emp_${myId}`);
    });
    sock.on("task:update", u => {
      setTasks(prev => prev.map(t =>
        getTaskId(t) === String(u._id ?? u.taskId) ? { ...t, ...u } : t
      ));
    });
    sock.on("task:new", nt => {
      if (!isMyTask(nt, myId)) return; // dusron ke tasks ignore karo
      setTasks(prev => {
        if (prev.find(t => getTaskId(t) === getTaskId(nt))) return prev;
        showToast("📋 Naya task assign hua!");
        return [...prev, nt];
      });
    });
    sock.on("task:deleted", ({ taskId }) => {
      setTasks(prev => prev.filter(t => getTaskId(t) !== String(taskId)));
      setSelected(prev => prev === String(taskId) ? null : prev);
    });
    return () => sock.disconnect();
  }, [myId, showToast]);

  // ── Update status ─────────────────────────────────────────────
  async function updateStatus(id, newStatus) {
    if (updating) return;
    setUpdating(id);
    setTasks(prev => prev.map(t => getTaskId(t) === id ? { ...t, status:newStatus } : t));
    try {
      await apiCall(`/tasks/${id}/status`, "PATCH", { status:newStatus });
      const labels = {
        completed:   "✓ Task complete!",
        in_progress: "▶ Task shuru",
        in_review:   "👁 Review bheja",
        pending:     "Task pending",
      };
      showToast(labels[newStatus] || "Status update ho gaya");
    } catch (e) {
      loadTasks(true);
      showToast("Update fail: " + e.message, "error");
    }
    setUpdating(null);
  }

  // ── Derived stats ─────────────────────────────────────────────
  const cnt = s => tasks.filter(t => t.status === s).length;
  const pct = tasks.length ? Math.round(cnt("completed") / tasks.length * 100) : 0;
  const pctColor = pct >= 70 ? "#34d399" : pct >= 40 ? "#f5a623" : "#f87171";

  const FILTERS = [
    { k:"all",         l:"All",        n:tasks.length        },
    { k:"in_progress", l:"Active",     n:cnt("in_progress")  },
    { k:"pending",     l:"Pending",    n:cnt("pending")      },
    { k:"in_review",   l:"In Review",  n:cnt("in_review")    },
    { k:"completed",   l:"Done",       n:cnt("completed")    },
    { k:"blocked",     l:"Blocked",    n:cnt("blocked")      },
  ];

  const filtered = tasks
    .filter(t => filter === "all" ? true : t.status === filter)
    .sort((a, b) => {
      const o = { in_progress:0, pending:1, in_review:2, blocked:3, completed:4 };
      return (o[a.status] ?? 5) - (o[b.status] ?? 5);
    });

  const selectedTask = tasks.find(t => getTaskId(t) === selected);

  return (
    <div style={{ background:"#080a0f", minHeight:"100vh",
      fontFamily:"'DM Sans',sans-serif", color:"#e8eaf6",
      display:"flex", flexDirection:"column" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar       { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.07); border-radius:4px; }
        .filter-btn:hover { background:rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* ══ Top bar ════════════════════════════════════════════ */}
      <div style={{ padding:"22px 28px 0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:12 }}>

        <div>
          <div style={{ fontSize:22, fontWeight:800, color:"#f0f0f2",
            letterSpacing:"-0.03em", lineHeight:1 }}>My Tasks</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.28)", marginTop:5,
            display:"flex", alignItems:"center", gap:7 }}>
            <span style={{ width:5, height:5, borderRadius:"50%", background:"#34d399",
              display:"inline-block", animation:"pulse 2s infinite" }}/>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} · live sync on
          </div>
        </div>

        {/* Completion widget */}
        <div style={{ display:"flex", alignItems:"center", gap:14,
          background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:12, padding:"11px 18px" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.28)", textTransform:"uppercase",
              letterSpacing:".08em", marginBottom:3 }}>Completion</div>
            <div style={{ fontSize:22, fontWeight:800, color:pctColor,
              fontFamily:"'DM Mono',monospace" }}>{pct}%</div>
          </div>
          <CircleProgress pct={pct} size={42} stroke={4} color={pctColor}/>
        </div>
      </div>

      {/* ══ Stat pills ═════════════════════════════════════════ */}
      <div style={{ display:"flex", gap:7, padding:"14px 28px 0", flexWrap:"wrap" }}>
        {[
          { l:"Total",    v:tasks.length,       c:"#818cf8" },
          { l:"Active",   v:cnt("in_progress"), c:"#818cf8" },
          { l:"Pending",  v:cnt("pending"),      c:"#f5a623" },
          { l:"Done",     v:cnt("completed"),    c:"#34d399" },
          { l:"Blocked",  v:cnt("blocked"),      c:"#f87171" },
        ].map(s => (
          <div key={s.l} style={{ display:"flex", alignItems:"center", gap:7,
            background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)",
            borderRadius:8, padding:"6px 13px" }}>
            <div style={{ fontSize:15, fontWeight:800, color:s.c,
              fontFamily:"'DM Mono',monospace" }}>{s.v}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", fontWeight:500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ══ Filter tabs ════════════════════════════════════════ */}
      <div style={{ display:"flex", gap:3, padding:"12px 28px 0",
        overflowX:"auto", borderBottom:"1px solid rgba(255,255,255,0.05)",
        paddingBottom:14 }}>
        {FILTERS.map(f => (
          <button key={f.k} className="filter-btn" onClick={() => setFilter(f.k)} style={{
            padding:"5px 13px", borderRadius:7, fontSize:11, fontWeight:600,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
            whiteSpace:"nowrap", border:"none",
            background: filter === f.k ? "rgba(129,140,248,0.12)" : "transparent",
            color:      filter === f.k ? "#818cf8" : "rgba(255,255,255,0.28)",
            outline:    filter === f.k ? "1px solid rgba(129,140,248,0.25)" : "none",
          }}>
            {f.l}
            <span style={{ marginLeft:4, fontSize:9, fontFamily:"'DM Mono',monospace",
              color:filter === f.k ? "#818cf8" : "rgba(255,255,255,0.2)" }}>
              {f.n}
            </span>
          </button>
        ))}
      </div>

      {/* ══ Main layout ════════════════════════════════════════ */}
      <div style={{ flex:1, display:"flex", gap:0,
        padding:"14px 28px 28px", minHeight:0,
        height:"calc(100vh - 230px)", overflow:"hidden" }}>

        {/* LEFT — list */}
        <div style={{ width:300, flexShrink:0, overflowY:"auto", paddingRight:12 }}>
          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.18)" }}>
              <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.08)",
                borderTopColor:"#818cf8", borderRadius:"50%", animation:"spin .8s linear infinite",
                margin:"0 auto 10px" }}/>
              <div style={{ fontSize:12 }}>Tasks load ho rahe hain...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 16px",
              color:"rgba(255,255,255,0.18)" }}>
              <div style={{ fontSize:30, marginBottom:10 }}>📭</div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>
                {tasks.length === 0 ? "Koi task nahi" : "Koi task nahi mila"}
              </div>
              <div style={{ fontSize:11 }}>
                {tasks.length === 0 ? "Admin se task assign karwao" : "Filter change karo"}
              </div>
            </div>
          ) : filtered.map(task => (
            <TaskCard
              key={getTaskId(task)}
              task={task}
              updating={updating}
              isSelected={selected === getTaskId(task)}
              onClick={() => setSelected(getTaskId(task))}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width:1, background:"rgba(255,255,255,0.05)",
          flexShrink:0, margin:"0 1px" }}/>

        {/* RIGHT — detail */}
        <div style={{ flex:1, overflowY:"auto", marginLeft:12,
          background:"rgba(255,255,255,0.015)",
          border:"1px solid rgba(255,255,255,0.05)",
          borderRadius:14 }}>
          {selectedTask ? (
            <TaskDetail
              key={getTaskId(selectedTask)}
              task={selectedTask}
              onUpdate={updateStatus}
              updating={updating}
            />
          ) : (
            <div style={{ height:"100%", display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:10,
              color:"rgba(255,255,255,0.13)" }}>
              <div style={{ fontSize:44 }}>📋</div>
              <div style={{ fontSize:13, fontWeight:600 }}>Koi task select karo</div>
              <div style={{ fontSize:11 }}>Left se task click karo details dekhne ke liye</div>
            </div>
          )}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  );
}