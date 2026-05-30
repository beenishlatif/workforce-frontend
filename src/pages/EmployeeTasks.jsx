import { useState, useEffect, useCallback } from "react";
import { io as socketIO } from "socket.io-client";

const API_BASE   = "https://workforce-backend-production-cc13.up.railway.app/api";
const SOCKET_URL = "https://workforce-backend-production-cc13.up.railway.app";

async function apiCall(path, method = "GET", body = null) {
  const token = localStorage.getItem("token");
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

const STATUS = {
  pending:     { label:"Pending",     color:"#f5a623", bg:"rgba(245,166,35,.1)",  border:"rgba(245,166,35,.2)",  glow:"rgba(245,166,35,.15)"  },
  in_progress: { label:"In Progress", color:"#818cf8", bg:"rgba(129,140,248,.1)", border:"rgba(129,140,248,.25)", glow:"rgba(129,140,248,.2)" },
  in_review:   { label:"In Review",   color:"#a78bfa", bg:"rgba(167,139,250,.1)", border:"rgba(167,139,250,.25)", glow:"rgba(167,139,250,.2)" },
  completed:   { label:"Completed",   color:"#34d399", bg:"rgba(52,211,153,.1)",  border:"rgba(52,211,153,.25)",  glow:"rgba(52,211,153,.2)"  },
  blocked:     { label:"Blocked",     color:"#f87171", bg:"rgba(248,113,113,.1)", border:"rgba(248,113,113,.25)", glow:"rgba(248,113,113,.2)" },
};

const PRIORITY = {
  low:    { color:"#34d399", label:"Low",    icon:"▼" },
  medium: { color:"#f5a623", label:"Medium", icon:"■" },
  high:   { color:"#fb923c", label:"High",   icon:"▲" },
  urgent: { color:"#f87171", label:"Urgent", icon:"!!" },
};

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

// ── Mini circular progress ──
function CircleProgress({ pct, size=48, stroke=4, color="#818cf8" }) {
  const r = (size-stroke*2)/2;
  const circ = 2*Math.PI*r;
  const dash = (pct/100)*circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition:"stroke-dasharray 1s ease", filter:`drop-shadow(0 0 4px ${color}88)` }}/>
    </svg>
  );
}

// ── Toast ──
function Toast({ msg, type, show }) {
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:9999,
      transform:`translateY(${show?0:80}px)`, opacity:show?1:0,
      transition:"all .3s cubic-bezier(.34,1.56,.64,1)",
      background:"#13151f", backdropFilter:"blur(20px)",
      border:`1px solid ${type==="error"?"rgba(248,113,113,.3)":"rgba(52,211,153,.3)"}`,
      borderLeft:`3px solid ${type==="error"?"#f87171":"#34d399"}`,
      borderRadius:12, padding:"12px 18px", fontSize:12, fontWeight:600,
      color:"#e8eaf6", boxShadow:"0 16px 48px rgba(0,0,0,.6)", pointerEvents:"none",
      display:"flex", alignItems:"center", gap:10, minWidth:220,
    }}>
      <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
        background:type==="error"?"#f87171":"#34d399",
        boxShadow:`0 0 8px ${type==="error"?"#f87171":"#34d399"}` }}/>
      {msg}
    </div>
  );
}

// ── Task Card ──
function TaskCard({ task, onUpdate, updating, isSelected, onClick }) {
  const id   = getTaskId(task);
  const st   = STATUS[task.status]   || STATUS.pending;
  const pr   = PRIORITY[task.priority] || PRIORITY.medium;
  const over = isOverdue(task.due_date, task.status);
  const busy = updating === id;

  return (
    <div onClick={onClick}
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${st.glow}, rgba(255,255,255,0.02))`
          : "rgba(255,255,255,0.02)",
        border:`1px solid ${isSelected ? st.border : "rgba(255,255,255,0.06)"}`,
        borderLeft:`3px solid ${isSelected ? st.color : "transparent"}`,
        borderRadius:12, padding:"14px 16px",
        cursor:"pointer", transition:"all .2s",
        animation:"fadeUp .25s ease both",
        boxShadow: isSelected ? `0 4px 20px ${st.glow}` : "none",
        marginBottom:6,
      }}
      onMouseEnter={e=>{ if(!isSelected){e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";} }}
      onMouseLeave={e=>{ if(!isSelected){e.currentTarget.style.background="rgba(255,255,255,0.02)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";} }}>

      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#e8eaf6",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            marginBottom:6 }}>
            {task.title}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:20,
              background:st.bg, color:st.color, border:`1px solid ${st.border}`,
              display:"inline-flex", alignItems:"center", gap:4, letterSpacing:".04em" }}>
              {task.status==="in_progress"&&(
                <span style={{ width:4, height:4, borderRadius:"50%", background:st.color,
                  animation:"pulse 1.5s infinite" }}/>
              )}
              {st.label}
            </span>
            <span style={{ fontSize:10, color:pr.color, fontWeight:600 }}>
              {pr.icon} {pr.label}
            </span>
          </div>
        </div>
        {task.due_date && (
          <div style={{ fontSize:9, color:over?"#f87171":"rgba(255,255,255,0.3)",
            fontWeight:over?700:400, textAlign:"right", flexShrink:0 }}>
            {over?"⚠ ":""}{fmtDate(task.due_date)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task Detail Panel ──
function TaskDetail({ task, onUpdate, updating }) {
  const id   = getTaskId(task);
  const st   = STATUS[task.status]   || STATUS.pending;
  const pr   = PRIORITY[task.priority] || PRIORITY.medium;
  const over = isOverdue(task.due_date, task.status);
  const busy = updating === id;

  const pct = task.status==="completed" ? 100
    : task.status==="in_progress" ? task.progress||55
    : task.status==="in_review" ? 80
    : task.status==="blocked" ? 20 : 0;

  function Actions() {
    if (task.status==="completed") return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
        background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)",
        borderRadius:12 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(52,211,153,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>✓</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#34d399" }}>Task Complete!</div>
          <div style={{ fontSize:10, color:"rgba(52,211,153,0.6)", marginTop:2 }}>
            {task.completedAt ? `Completed ${fmtDate(task.completedAt)}` : "Well done!"}
          </div>
        </div>
      </div>
    );

    if (task.status==="in_review") return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px",
        background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.2)",
        borderRadius:12 }}>
        <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(167,139,250,0.15)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>⏳</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>Review Mein Hai</div>
          <div style={{ fontSize:10, color:"rgba(167,139,250,0.6)", marginTop:2 }}>Admin ka wait karo</div>
        </div>
      </div>
    );

    if (task.status==="blocked") return (
      <button onClick={()=>onUpdate(id,"in_progress")} disabled={busy} style={btnS("#818cf8","rgba(129,140,248,.1)","rgba(129,140,248,.25)")}>
        {busy?"...":"▶  Resume Karo"}
      </button>
    );

    if (task.status==="in_progress") return (
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={()=>onUpdate(id,"in_review")} disabled={busy}
          style={{ ...btnS("#a78bfa","rgba(167,139,250,.1)","rgba(167,139,250,.25)"), flex:1 }}>
          {busy?"...":"👁  Review Bhejo"}
        </button>
        <button onClick={()=>onUpdate(id,"completed")} disabled={busy}
          style={{ ...btnS("#34d399","rgba(52,211,153,.1)","rgba(52,211,153,.25)"), flex:1 }}>
          {busy?"...":"✓  Complete Karo"}
        </button>
      </div>
    );

    return (
      <button onClick={()=>onUpdate(id,"in_progress")} disabled={busy} style={btnS("#818cf8","rgba(129,140,248,.1)","rgba(129,140,248,.25)")}>
        {busy?"...":"▶  Shuru Karo"}
      </button>
    );
  }

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", gap:20,
      animation:"fadeUp .3s ease" }}>

      {/* Header */}
      <div style={{ padding:"24px 28px 0" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:16, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.25)",
              textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Task Details</div>
            <div style={{ fontSize:20, fontWeight:800, color:"#f0f0f2",
              lineHeight:1.3, letterSpacing:"-0.02em" }}>
              {task.title}
            </div>
          </div>
          <CircleProgress pct={pct} size={52} stroke={4} color={st.color}/>
        </div>

        {/* Status + Priority row */}
        <div style={{ display:"flex", gap:8, marginBottom:4 }}>
          <span style={{ fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20,
            background:st.bg, color:st.color, border:`1px solid ${st.border}`,
            display:"inline-flex", alignItems:"center", gap:5 }}>
            {task.status==="in_progress"&&(
              <span style={{ width:5, height:5, borderRadius:"50%", background:st.color,
                animation:"pulse 1.5s infinite" }}/>
            )}
            {st.label}
          </span>
          <span style={{ fontSize:10, fontWeight:700, padding:"4px 12px", borderRadius:20,
            background:`${pr.color}12`, color:pr.color, border:`1px solid ${pr.color}25` }}>
            {pr.icon} {pr.label} Priority
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginLeft:28, marginRight:28 }}/>

      {/* Body */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 28px",
        display:"flex", flexDirection:"column", gap:18 }}>

        {/* Description */}
        {task.description && (
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.25)",
              textTransform:"uppercase", letterSpacing:".1em", marginBottom:8 }}>Description</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.7,
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
              borderRadius:10, padding:"12px 14px" }}>
              {task.description}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.25)",
              textTransform:"uppercase", letterSpacing:".1em" }}>Progress</div>
            <div style={{ fontSize:11, fontWeight:700, color:st.color }}>{pct}%</div>
          </div>
          <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, borderRadius:99,
              background:`linear-gradient(90deg, ${st.color}88, ${st.color})`,
              boxShadow:`0 0 8px ${st.color}44`,
              transition:"width 1.2s cubic-bezier(.4,0,.2,1)" }}/>
          </div>
        </div>

        {/* Meta info */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { label:"Due Date",   val:task.due_date ? fmtDate(task.due_date) : "No deadline",
              color:over?"#f87171":"rgba(255,255,255,0.5)", icon:"📅" },
            { label:"Priority",   val:pr.label, color:pr.color, icon:pr.icon },
            { label:"Created",    val:task.createdAt ? fmtDate(task.createdAt) : "—",
              color:"rgba(255,255,255,0.4)", icon:"🕐" },
            { label:"Status",     val:st.label, color:st.color, icon:"●" },
          ].map(m=>(
            <div key={m.label} style={{ background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", textTransform:"uppercase",
                letterSpacing:".08em", marginBottom:6, fontWeight:600 }}>{m.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:m.color,
                display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ fontSize:11 }}>{m.icon}</span> {m.val}
              </div>
            </div>
          ))}
        </div>

        {/* Started/Completed timestamps */}
        {(task.startedAt || task.completedAt) && (
          <div style={{ display:"flex", gap:10 }}>
            {task.startedAt && (
              <div style={{ flex:1, background:"rgba(129,140,248,0.05)",
                border:"1px solid rgba(129,140,248,0.15)", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:9, color:"rgba(129,140,248,0.5)", textTransform:"uppercase",
                  letterSpacing:".08em", marginBottom:4 }}>Started</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#818cf8" }}>
                  {fmtDate(task.startedAt)}
                </div>
              </div>
            )}
            {task.completedAt && (
              <div style={{ flex:1, background:"rgba(52,211,153,0.05)",
                border:"1px solid rgba(52,211,153,0.15)", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:9, color:"rgba(52,211,153,0.5)", textTransform:"uppercase",
                  letterSpacing:".08em", marginBottom:4 }}>Completed</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#34d399" }}>
                  {fmtDate(task.completedAt)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div style={{ padding:"0 28px 28px" }}>
        <Actions/>
      </div>
    </div>
  );
}

function btnS(color, bg, border) {
  return {
    width:"100%", padding:"12px", borderRadius:10,
    border:`1px solid ${border}`, background:bg, color,
    fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:700,
    cursor:"pointer", transition:"all .2s",
    display:"flex", alignItems:"center", justifyContent:"center", gap:8,
    letterSpacing:".02em",
  };
}

// ── MAIN ──
export default function EmployeeTasks() {
  const [tasks,    setTasks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);
  const [toast,    setToast]    = useState({ show:false, msg:"", type:"success" });

  const toast$ = useCallback((msg, type="success") => {
    setToast({ show:true, msg, type });
    setTimeout(()=>setToast(t=>({...t,show:false})), 2800);
  }, []);

  const loadTasks = useCallback(async(silent=false) => {
    if (!silent) setLoading(true);
    try {
      let data;
      try { data = await apiCall("/tasks"); } catch {}
      if (!Array.isArray(data)) {
        const all = await apiCall("/tasks");
        const token  = localStorage.getItem("token");
        const userId = token ? JSON.parse(atob(token.split(".")[1]))?.id : null;
        data = Array.isArray(all)
          ? all.filter(t => String(t.assigned_to?._id??t.assigned_to??"") === String(userId))
          : [];
      }
      setTasks(data);
      // Auto-select first active task
      if (!selected && data.length > 0) {
        const active = data.find(t=>t.status==="in_progress") || data[0];
        setSelected(getTaskId(active));
      }
    } catch(e) {
      if (!silent) toast$("Tasks load nahi hue", "error");
    }
    setLoading(false);
  }, [toast$, selected]);

  useEffect(()=>{ loadTasks(); },[loadTasks]);
  useEffect(()=>{ const id=setInterval(()=>loadTasks(true),15000); return()=>clearInterval(id); },[loadTasks]);

  // Socket
  useEffect(()=>{
    const sock = socketIO(SOCKET_URL,{ transports:["websocket","polling"], reconnection:true });
    const token  = localStorage.getItem("token");
    const userId = token ? JSON.parse(atob(token.split(".")[1]))?.id : null;
    sock.on("connect",()=>{ if(userId) sock.emit("join",`emp_${userId}`); });
    sock.on("task:update", u=>{
      setTasks(p=>p.map(t=>getTaskId(t)===String(u._id??u.taskId)?{...t,...u}:t));
    });
    sock.on("task:new", nt=>{
      setTasks(p=>{
        if(p.find(t=>getTaskId(t)===getTaskId(nt))) return p;
        toast$("📋 Naya task assign hua!");
        return [...p, nt];
      });
    });
    sock.on("task:deleted",({taskId})=>{
      setTasks(p=>p.filter(t=>getTaskId(t)!==String(taskId)));
      if(selected===String(taskId)) setSelected(null);
    });
    return()=>sock.disconnect();
  },[toast$, selected]);

  async function updateStatus(id, newStatus) {
    if (updating) return;
    setUpdating(id);
    setTasks(prev=>prev.map(t=>getTaskId(t)===id?{...t,status:newStatus}:t));
    try {
      await apiCall(`/tasks/${id}/status`,"PATCH",{ status:newStatus });
      const labels = { completed:"✓ Task complete!",in_progress:"▶ Task shuru",in_review:"👁 Review bheja",pending:"Task pending" };
      toast$(labels[newStatus]||"Status update ho gaya");
    } catch(e) {
      loadTasks(true);
      toast$("Update fail: "+e.message,"error");
    }
    setUpdating(null);
  }

  const cnt = s => tasks.filter(t=>t.status===s).length;
  const pct = tasks.length ? Math.round(cnt("completed")/tasks.length*100) : 0;

  const FILTERS = [
    { k:"all",      l:"All",         n:tasks.length         },
    { k:"active",   l:"Active",      n:cnt("in_progress")   },
    { k:"pending",  l:"Pending",     n:cnt("pending")       },
    { k:"review",   l:"In Review",   n:cnt("in_review")     },
    { k:"done",     l:"Done",        n:cnt("completed")     },
    { k:"blocked",  l:"Blocked",     n:cnt("blocked")       },
  ];

  const filtered = tasks.filter(t=>{
    if (filter==="all")    return true;
    if (filter==="active") return t.status==="in_progress";
    if (filter==="done")   return t.status==="completed";
    if (filter==="review") return t.status==="in_review";
    return t.status===filter;
  }).sort((a,b)=>{
    const o={in_progress:0,pending:1,in_review:2,blocked:3,completed:4};
    return (o[a.status]??5)-(o[b.status]??5);
  });

  const selectedTask = tasks.find(t=>getTaskId(t)===selected);

  return (
    <div style={{ background:"#080a0f", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif",
      color:"#e8eaf6", display:"flex", flexDirection:"column" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:4px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ padding:"20px 28px 0", display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:24, fontWeight:800, color:"#f0f0f2",
            letterSpacing:"-0.03em", lineHeight:1 }}>My Tasks</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:5,
            display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#34d399",
              display:"inline-block", animation:"pulse 2s infinite" }}/>
            {tasks.length} tasks · auto-refresh 15s
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ display:"flex", alignItems:"center", gap:16,
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:14, padding:"12px 20px" }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", textTransform:"uppercase",
              letterSpacing:".08em", marginBottom:3 }}>Completion</div>
            <div style={{ fontSize:22, fontWeight:800, color:pct>=70?"#34d399":pct>=40?"#f5a623":"#f87171",
              fontFamily:"'DM Mono',monospace" }}>{pct}%</div>
          </div>
          <CircleProgress pct={pct} size={44} stroke={4}
            color={pct>=70?"#34d399":pct>=40?"#f5a623":"#f87171"}/>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div style={{ display:"flex", gap:8, padding:"16px 28px 0", flexWrap:"wrap" }}>
        {[
          { l:"Total",   v:tasks.length,        c:"#818cf8" },
          { l:"Active",  v:cnt("in_progress"),  c:"#818cf8" },
          { l:"Pending", v:cnt("pending"),       c:"#f5a623" },
          { l:"Done",    v:cnt("completed"),     c:"#34d399" },
          { l:"Blocked", v:cnt("blocked"),       c:"#f87171" },
        ].map(s=>(
          <div key={s.l} style={{ display:"flex", alignItems:"center", gap:8,
            background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:9, padding:"7px 14px" }}>
            <div style={{ fontSize:16, fontWeight:800, color:s.c,
              fontFamily:"'DM Mono',monospace" }}>{s.v}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontWeight:500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display:"flex", gap:4, padding:"14px 28px 0", overflowX:"auto" }}>
        {FILTERS.map(f=>(
          <button key={f.k} onClick={()=>setFilter(f.k)}
            style={{ padding:"6px 14px", borderRadius:8, fontSize:11, fontWeight:600,
              cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
              whiteSpace:"nowrap", border:"none",
              background: filter===f.k ? "rgba(129,140,248,0.15)" : "transparent",
              color: filter===f.k ? "#818cf8" : "rgba(255,255,255,0.3)",
              outline: filter===f.k ? "1px solid rgba(129,140,248,0.3)" : "none" }}>
            {f.l}
            <span style={{ marginLeft:5, fontSize:10, fontFamily:"'DM Mono',monospace",
              color:filter===f.k?"#818cf8":"rgba(255,255,255,0.2)" }}>({f.n})</span>
          </button>
        ))}
      </div>

      {/* ── Main layout ── */}
      <div style={{ flex:1, display:"flex", gap:0, padding:"14px 28px 28px",
        minHeight:0, overflow:"hidden", height:"calc(100vh - 220px)" }}>

        {/* LEFT — Task list */}
        <div style={{ width:320, flexShrink:0, overflowY:"auto",
          paddingRight:14, display:"flex", flexDirection:"column", gap:0 }}>

          {loading ? (
            <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.2)" }}>
              <div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.1)",
                borderTopColor:"#818cf8",borderRadius:"50%",animation:"spin .8s linear infinite",
                margin:"0 auto 10px" }}/>
              <div style={{ fontSize:12 }}>Tasks load ho rahe hain...</div>
            </div>
          ) : filtered.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px",
              color:"rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:32, marginBottom:10 }}>📭</div>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>
                {tasks.length===0?"Koi task nahi":"Koi task nahi mila"}
              </div>
              <div style={{ fontSize:11 }}>
                {tasks.length===0?"Admin se task assign karwao":"Filter change karo"}
              </div>
            </div>
          ) : filtered.map(task=>(
            <TaskCard
              key={getTaskId(task)}
              task={task}
              onUpdate={updateStatus}
              updating={updating}
              isSelected={selected===getTaskId(task)}
              onClick={()=>setSelected(getTaskId(task))}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width:1, background:"rgba(255,255,255,0.06)", flexShrink:0, marginRight:1 }}/>

        {/* RIGHT — Task detail */}
        <div style={{ flex:1, overflowY:"auto",
          background:"rgba(255,255,255,0.01)",
          border:"1px solid rgba(255,255,255,0.05)",
          borderRadius:16, marginLeft:14 }}>
          {selectedTask ? (
            <TaskDetail
              key={getTaskId(selectedTask)}
              task={selectedTask}
              onUpdate={updateStatus}
              updating={updating}
            />
          ) : (
            <div style={{ height:"100%", display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:12,
              color:"rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize:48 }}>📋</div>
              <div style={{ fontSize:14, fontWeight:600 }}>Koi task select karo</div>
              <div style={{ fontSize:11 }}>Left se task click karo details dekhne ke liye</div>
            </div>
          )}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} show={toast.show}/>
    </div>
  );
}
