import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity, Camera, Clock, CheckCircle, BarChart2,
  RefreshCw, ChevronRight, ShieldAlert, User
} from "lucide-react";

const BASE = "https://workforce-backend-production-cc13.up.railway.app";

const prodColor = p => p >= 70 ? "#4ade80" : p >= 40 ? "#fbbf24" : "#f87171";

function fmtMins(m) {
  if (!m || m <= 0) return "0m";
  const h = Math.floor(m / 60), mn = m % 60;
  return h === 0 ? `${mn}m` : mn === 0 ? `${h}h` : `${h}h ${mn}m`;
}

function ini(name) {
  return (name || "??").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const PRIORITY_C = { low: "#4ade80", medium: "#fbbf24", high: "#fb923c", urgent: "#f87171" };
const STATUS_C = { pending: "#fbbf24", in_progress: "#818cf8", in_review: "#06b6d4", completed: "#4ade80", blocked: "#f87171" };

// ─── Live Clock Hook ───────────────────────────────────────────────
function useLiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function formatTime(date) {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${String(h).padStart(2, "0")}:${m}:${s} ${ampm}`;
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
}

function getGreeting(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function MyDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const time = useLiveClock();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setFetching(true);
    try {
      const r = await fetch(`${BASE}/api/emp/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setDashboard(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setFetching(false);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchDashboard();
    const id = setInterval(fetchDashboard, 60000);
    return () => clearInterval(id);
  }, [fetchDashboard]);

  if (loading) return (
    <div style={S.loadWrap}>
      <RefreshCw size={22} color="#818cf8" style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 12px" }} />
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Loading dashboard...</div>
    </div>
  );

  const profile   = dashboard?.profile          || {};
  const stats     = dashboard?.stats            || {};
  const recentAct = dashboard?.recentActivity   || [];
  const recentShot= dashboard?.recentScreenshots|| [];
  const recentTask= dashboard?.recentTasks      || [];

  const name   = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "Employee";
  const status = profile.status || "Online";
  const statusColor = { Online:"#4ade80", Working:"#34d399", Active:"#60a5fa", Idle:"#fbbf24", Offline:"#f87171" }[status] || "#4ade80";

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ ...S.avatar, position: "relative" }}>
            {ini(name)}
            <span style={{ position:"absolute", bottom:2, right:2, width:11, height:11,
              borderRadius:"50%", background:statusColor, border:"2px solid #0a0a0f" }} />
          </div>
          <div>
            <div style={S.greeting}>{getGreeting(time)},</div>
            <div style={S.name}>{name} 👋</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:5 }}>
              <span style={{ ...S.badge, background:`${statusColor}18`, border:`1px solid ${statusColor}40`, color:statusColor }}>
                <span style={{ width:5,height:5,borderRadius:"50%",background:statusColor,display:"inline-block" }} /> {status}
              </span>
              {profile.department && <span style={S.dept}>{profile.department}</span>}
              {error && <span style={S.errorTag}>⚠ {error}</span>}
            </div>
          </div>
        </div>

        {/* ── Real-time Clock ── */}
        <div style={{ textAlign: "right" }}>
          <div style={S.clockTime}>{formatTime(time)}</div>
          <div style={S.clockDate}>{formatDate(time)}</div>
          <div style={{ display:"flex", alignItems:"center", gap:5, justifyContent:"flex-end", marginTop:4 }}>
            <span style={S.liveDot} />
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>
              {fetching ? "Refreshing..." : "Live · auto-refresh 60s"}
            </span>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div style={S.statGrid}>
        {[
          { icon:<Clock size={17}/>,       bg:"#3b82f6", label:"Active Today",  val:fmtMins(stats.totalMins),   sub:"tracked time",    link:"/employee/hours"       },
          { icon:<BarChart2 size={17}/>,   bg:"#10b981", label:"Productivity",  val:`${stats.avgPct||0}%`,      vc:prodColor(stats.avgPct||0), link:"/employee/activity" },
          { icon:<Camera size={17}/>,      bg:"#8b5cf6", label:"Screenshots",   val:stats.todayScreenshots||0,  sub:"today",           link:"/employee/screenshots" },
          { icon:<CheckCircle size={17}/>, bg:"#f59e0b", label:"Tasks Pending", val:stats.pendingTasks||0,      vc:stats.pendingTasks>0?"#fbbf24":"#4ade80", link:"/employee/activity" },
        ].map((m, i) => (
          <div key={i} className="stat-card" onClick={() => navigate(m.link)}
            style={S.statCard}>
            <div style={{ width:36,height:36,borderRadius:10,background:`${m.bg}18`,border:`1px solid ${m.bg}28`,
              display:"flex",alignItems:"center",justifyContent:"center",color:m.bg,marginBottom:12 }}>
              {m.icon}
            </div>
            <div style={S.statLabel}>{m.label}</div>
            <div style={{ ...S.statVal, color:m.vc||"#fff" }}>{m.val}</div>
            <div style={S.statSub}>{m.sub || "click to view"}</div>
          </div>
        ))}
      </div>

      {/* ── Blocked Alert ── */}
      {stats.blockedScreenshots > 0 && (
        <div style={S.alert}>
          <ShieldAlert size={15} color="#f87171" style={{ flexShrink:0 }} />
          <div style={{ flex:1, fontSize:12, color:"rgba(248,113,113,0.75)" }}>
            <span style={{ color:"#f87171", fontWeight:700 }}>Blocked App Alert — </span>
            {stats.blockedScreenshots} screenshot(s) flagged apps mein hain.
          </div>
          <button onClick={() => navigate("/employee/screenshots")} style={S.alertBtn}>View</button>
        </div>
      )}

      {/* ── 2-col: Activity + Tasks ── */}
      <div style={S.twoCol}>
        {/* Activity */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}><Activity size={14} color="#6b7280" /><span>Today's Activity</span></div>
            <button onClick={() => navigate("/employee/activity")} style={S.viewBtn}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          {recentAct.length === 0
            ? <div style={S.empty}><Activity size={18} style={{ display:"block",margin:"0 auto 6px" }}/> No activity today</div>
            : recentAct.map((a, i) => (
              <div key={i} style={{ ...S.listRow, borderBottom: i<recentAct.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={S.appIcon}>{(a.app||"?")[0].toUpperCase()}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={S.rowTitle}>{a.app || "Unknown"}</div>
                  <div style={S.rowSub}>{a.time||"—"} · {a.duration||1}m</div>
                </div>
                <span style={{ fontSize:11,fontWeight:700,color:prodColor(a.pct||0) }}>{a.pct||0}%</span>
              </div>
            ))
          }
        </div>

        {/* Tasks */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}>
              <CheckCircle size={14} color="#6b7280" /><span>My Tasks</span>
              {stats.pendingTasks > 0 && (
                <span style={{ fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:8,
                  background:"rgba(251,191,36,0.12)",color:"#f59e0b",border:"1px solid rgba(251,191,36,0.25)" }}>
                  {stats.pendingTasks} active
                </span>
              )}
            </div>
            <span style={{ fontSize:11,color:"rgba(255,255,255,0.3)" }}>{stats.completedTasks||0}/{stats.totalTasks||0} done</span>
          </div>
          {stats.totalTasks > 0 && (
            <div style={{ height:5,background:"#1f2937",borderRadius:4,overflow:"hidden",marginBottom:14 }}>
              <div style={{ height:"100%",background:"#4ade80",borderRadius:4,transition:"width .5s",
                width:`${Math.round(((stats.completedTasks||0)/(stats.totalTasks||1))*100)}%` }} />
            </div>
          )}
          {recentTask.length === 0
            ? <div style={S.empty}><CheckCircle size={18} style={{ display:"block",margin:"0 auto 6px" }}/> No tasks assigned</div>
            : recentTask.map((t, i) => (
              <div key={i} style={{ ...S.listRow, borderBottom: i<recentTask.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ width:3,height:32,borderRadius:4,background:PRIORITY_C[t.priority]||"#818cf8",flexShrink:0 }} />
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={S.rowTitle}>{t.title}</div>
                  {t.due_date && <div style={S.rowSub}>Due {new Date(t.due_date).toLocaleDateString()}</div>}
                </div>
                <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap",
                  background:`${STATUS_C[t.status]||"#818cf8"}15`,
                  color:STATUS_C[t.status]||"#818cf8",
                  border:`1px solid ${STATUS_C[t.status]||"#818cf8"}28` }}>
                  {(t.status||"pending").replace("_"," ")}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* ── 3-col: Screenshots + Hours + Profile ── */}
      <div style={S.threeCol}>
        {/* Screenshots */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}><Camera size={14} color="#6b7280" /><span>Screenshots</span></div>
            <button onClick={() => navigate("/employee/screenshots")} style={S.viewBtn}>
              View all <ChevronRight size={11} />
            </button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(90px,1fr))",gap:8 }}>
            {recentShot.length === 0
              ? <div style={{ ...S.empty,gridColumn:"span 2" }}><Camera size={16} style={{ display:"block",margin:"0 auto 6px" }}/> No screenshots today</div>
              : recentShot.map((s, i) => (
                <div key={i} style={{ borderRadius:8,overflow:"hidden",background:"#0d0d10",position:"relative",
                  border:`1px solid ${s.isBlocked?"rgba(248,113,113,0.3)":"rgba(255,255,255,0.06)"}` }}>
                  <div style={{ height:52,background:"#111827",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <Camera size={13} color="#374151" />
                  </div>
                  {s.isBlocked && <div style={{ position:"absolute",top:3,right:3 }}><ShieldAlert size={10} color="#f87171" /></div>}
                  <div style={{ padding:"4px 6px",fontSize:9,color:"rgba(255,255,255,0.35)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                    {s.app||"—"}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Work Hours */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}><Clock size={14} color="#6b7280" /><span>Work Hours</span></div>
            <button onClick={() => navigate("/employee/hours")} style={S.viewBtn}>
              View <ChevronRight size={11} />
            </button>
          </div>
          <div style={{ display:"flex",alignItems:"flex-end",gap:3,height:56,marginBottom:12 }}>
            {Array.from({ length:10 }, (_, i) => {
              const h = i + 8;
              const mins = recentAct
                .filter(a => { const m=(a.time||"").match(/(\d+):/); if(!m) return false; let hr=parseInt(m[1]); if((a.time||"").toLowerCase().includes("pm")&&hr!==12) hr+=12; return hr===h; })
                .reduce((s, a) => s + (a.duration||1), 0);
              const pct = Math.min(100, (mins/60)*100);
              return (
                <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
                  <div style={{ width:"100%",height:`${Math.max(pct,mins>0?8:2)}%`,minHeight:mins>0?4:1,
                    background:mins>0?"#818cf8":"#1f2937",borderRadius:"3px 3px 0 0",transition:"height .4s" }} />
                  <div style={{ fontSize:7,color:"rgba(255,255,255,0.2)" }}>{h>12?`${h-12}p`:`${h}a`}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)" }}>
            <div>
              <div style={S.statLabel}>Total</div>
              <div style={{ fontSize:18,fontWeight:800 }}>{fmtMins(stats.totalMins)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={S.statLabel}>Productivity</div>
              <div style={{ fontSize:18,fontWeight:800,color:prodColor(stats.avgPct||0) }}>{stats.avgPct||0}%</div>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}><User size={14} color="#6b7280" /><span>My Profile</span></div>
            <button onClick={() => navigate("/employee/profile")} style={S.viewBtn}>
              Edit <ChevronRight size={11} />
            </button>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
            <div style={{ width:42,height:42,borderRadius:11,background:"linear-gradient(135deg,#818cf8,#6366f1)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0 }}>
              {ini(name)}
            </div>
            <div>
              <div style={{ fontSize:14,fontWeight:600 }}>{name}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{profile.role||"Employee"}</div>
            </div>
          </div>
          {[
            { label:"Department", val:profile.department },
            { label:"Email",      val:profile.email      },
            { label:"Employee ID",val:profile.empId      },
            { label:"Joined",     val:profile.joinDate   },
          ].filter(r => r.val).map((r, i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:11 }}>
              <span style={{ color:"rgba(255,255,255,0.35)" }}>{r.label}</span>
              <span style={{ color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120,textAlign:"right" }}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Style Objects ─────────────────────────────────────────────────
const S = {
  page:     { background:"#0a0a0f",minHeight:"100vh",padding:"clamp(16px,4vw,28px) clamp(12px,4vw,32px)",fontFamily:"'Inter',sans-serif",color:"#fff" },
  loadWrap: { background:"#0a0a0f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",flexDirection:"column" },
  header:   { display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16 },
  avatar:   { width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#818cf8,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#fff",flexShrink:0 },
  greeting: { fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:2 },
  name:     { fontSize:20,fontWeight:700,letterSpacing:"-0.02em" },
  badge:    { display:"inline-flex",alignItems:"center",gap:4,padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:600 },
  dept:     { fontSize:11,color:"rgba(255,255,255,0.3)" },
  errorTag: { fontSize:10,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"2px 8px",borderRadius:6 },
  clockTime:{ fontSize:30,fontWeight:800,letterSpacing:"-0.03em",fontVariantNumeric:"tabular-nums" },
  clockDate:{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2 },
  liveDot:  { width:6,height:6,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite",display:"inline-block" },
  statGrid: { display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20 },
  statCard: { background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 18px",cursor:"pointer",transition:"transform .2s,border-color .2s" },
  statLabel:{ fontSize:10,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4 },
  statVal:  { fontSize:26,fontWeight:800,lineHeight:1,marginBottom:3 },
  statSub:  { fontSize:10,color:"rgba(255,255,255,0.2)" },
  alert:    { background:"rgba(248,113,113,0.07)",border:"1px solid rgba(248,113,113,0.22)",borderRadius:12,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",gap:10 },
  alertBtn: { fontSize:11,color:"#f87171",background:"rgba(248,113,113,0.12)",border:"1px solid rgba(248,113,113,0.28)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontFamily:"inherit" },
  twoCol:   { display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:16 },
  threeCol: { display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16 },
  card:     { background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 18px" },
  cardHead: { display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 },
  cardTitle:{ display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:600 },
  viewBtn:  { display:"flex",alignItems:"center",gap:3,fontSize:11,color:"rgba(255,255,255,0.3)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",transition:"color .15s" },
  listRow:  { display:"flex",alignItems:"center",gap:10,padding:"8px 0" },
  appIcon:  { width:30,height:30,borderRadius:8,background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#818cf8",flexShrink:0 },
  rowTitle: { fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" },
  rowSub:   { fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1 },
  empty:    { textAlign:"center",padding:"22px 0",color:"rgba(255,255,255,0.25)",fontSize:12 },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.35 } }
  .stat-card:hover { transform: translateY(-2px) !important; border-color: #27272a !important; }
`;