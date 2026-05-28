import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Activity, Camera, Clock, CheckCircle, BarChart2,
  RefreshCw, ChevronRight, ShieldAlert, Zap,
  User, Shield, TrendingUp
} from "lucide-react";

const BASE = "http://localhost:5000";

const prodColor = p => p >= 70 ? "#4ade80" : p >= 40 ? "#fbbf24" : "#f87171";
function fmtMins(m) {
  if (!m || m <= 0) return "0m";
  const h = Math.floor(m / 60), mn = m % 60;
  return h === 0 ? `${mn}m` : mn === 0 ? `${h}h` : `${h}h ${mn}m`;
}

const GRADS = [
  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "linear-gradient(135deg,#10b981,#065f46)",
  "linear-gradient(135deg,#8b5cf6,#4c1d95)",
  "linear-gradient(135deg,#f59e0b,#92400e)",
  "linear-gradient(135deg,#ec4899,#831843)",
];
function ini(name) {
  return (name || "??").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const STATUS_CFG = {
  Online:  { color:"#4ade80", bg:"rgba(74,222,128,0.1)",  border:"rgba(74,222,128,0.25)"  },
  Working: { color:"#34d399", bg:"rgba(52,211,153,0.1)",  border:"rgba(52,211,153,0.25)"  },
  Active:  { color:"#60a5fa", bg:"rgba(96,165,250,0.1)",  border:"rgba(96,165,250,0.25)"  },
  Idle:    { color:"#fbbf24", bg:"rgba(251,191,36,0.1)",  border:"rgba(251,191,36,0.25)"  },
  Offline: { color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.25)" },
};

const PRIORITY_C = { low:"#4ade80", medium:"#fbbf24", high:"#fb923c", urgent:"#f87171" };
const STATUS_C   = { pending:"#fbbf24", in_progress:"#818cf8", in_review:"#06b6d4", completed:"#4ade80", blocked:"#f87171" };

export default function MyDashboard() {
  const navigate = useNavigate();
  const { token } = useAuth();  // ✅ useAuth se token lo

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [fetching,  setFetching]  = useState(false);
  const [time,      setTime]      = useState(new Date());
  const [error,     setError]     = useState(null);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

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
    } catch(e) {
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
    <div style={{background:"#0a0a0f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <RefreshCw size={24} color="#1f2937" style={{display:"block",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>Loading dashboard...</div>
      </div>
    </div>
  );

  // ── Data from API ──
  const profile    = dashboard?.profile    || {};
  const stats      = dashboard?.stats      || {};
  const recentAct  = dashboard?.recentActivity    || [];
  const recentShot = dashboard?.recentScreenshots || [];
  const recentTask = dashboard?.recentTasks       || [];

  const name   = `${profile.firstName||""} ${profile.lastName||""}`.trim() || "Employee";
  const status = profile.status || "Online";
  const sCfg   = STATUS_CFG[status] || STATUS_CFG.Online;
  const grad   = GRADS[(name.charCodeAt(0)||0) % GRADS.length];

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh",padding:"28px 32px",fontFamily:"'Outfit',sans-serif",color:"#fff"}}>
      <style>{CSS}</style>

      {/* ── Greeting Header ── */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:54,height:54,borderRadius:15,background:grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff",flexShrink:0,position:"relative"}}>
            {ini(name)}
            <span style={{position:"absolute",bottom:3,right:3,width:12,height:12,borderRadius:"50%",background:sCfg.color,border:"2px solid #0a0a0f"}}/>
          </div>
          <div>
            <div style={{fontSize:11,opacity:.4,marginBottom:2}}>{greeting()},</div>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em"}}>{name} 👋</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700,background:sCfg.bg,border:`1px solid ${sCfg.border}`,color:sCfg.color}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:sCfg.color}}/>{status}
              </span>
              {profile.department&&<span style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{profile.department}</span>}
              {error&&<span style={{fontSize:10,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"2px 8px",borderRadius:6}}>⚠ {error}</span>}
            </div>
          </div>
        </div>

        {/* Live Clock */}
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:28,fontWeight:800,letterSpacing:"-0.03em"}}>
            {time.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>
            {time.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end",marginTop:4}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:10,opacity:.35}}>{fetching?"Refreshing...":"Live · auto refresh 60s"}</span>
          </div>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[
          { icon:<Clock size={18}/>,       bg:"#3b82f6", label:"Active Today",    val:fmtMins(stats.totalMins),      sub:"tracked time",              link:"/employee/hours"       },
          { icon:<BarChart2 size={18}/>,   bg:"#10b981", label:"Productivity",    val:`${stats.avgPct||0}%`,         vc:prodColor(stats.avgPct||0),   link:"/employee/activity"    },
          { icon:<Camera size={18}/>,      bg:"#8b5cf6", label:"Screenshots",     val:stats.todayScreenshots||0,     sub:"today",                     link:"/employee/screenshots" },
          { icon:<CheckCircle size={18}/>, bg:"#f59e0b", label:"Tasks Pending",   val:stats.pendingTasks||0,         vc:stats.pendingTasks>0?"#fbbf24":"#4ade80", link:"/employee/activity" },
        ].map((m,i)=>(
          <div key={i} className="metric-card" onClick={()=>navigate(m.link)}
            style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 20px",cursor:"pointer"}}>
            <div style={{width:40,height:40,borderRadius:11,background:m.bg+"20",border:`1px solid ${m.bg}30`,display:"flex",alignItems:"center",justifyContent:"center",color:m.bg,marginBottom:12}}>{m.icon}</div>
            <div style={{fontSize:10,opacity:.4,marginBottom:4,textTransform:"uppercase",letterSpacing:".07em"}}>{m.label}</div>
            <div style={{fontSize:28,fontWeight:800,color:m.vc||"#fff",lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:10,opacity:.25}}>{m.sub||"click to view"}</div>
          </div>
        ))}
      </div>

      {/* ── Blocked Alert ── */}
      {stats.blockedScreenshots > 0 && (
        <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.25)",borderRadius:12,padding:"12px 18px",marginBottom:20,display:"flex",alignItems:"center",gap:12}}>
          <ShieldAlert size={16} color="#f87171" style={{flexShrink:0}}/>
          <div style={{flex:1}}>
            <span style={{fontSize:13,color:"#f87171",fontWeight:700}}>Blocked App Alert — </span>
            <span style={{fontSize:12,color:"rgba(248,113,113,0.7)"}}>{stats.blockedScreenshots} screenshot(s) today flagged apps mein hain. Admin inhe dekh sakta hai.</span>
          </div>
          <button onClick={()=>navigate("/employee/screenshots")}
            style={{fontSize:11,color:"#f87171",background:"rgba(248,113,113,0.15)",border:"1px solid rgba(248,113,113,0.3)",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
            View
          </button>
        </div>
      )}

      {/* ── Main 2 col ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>

        {/* Recent Activity */}
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Activity size={14} color="#6b7280"/>
              <span style={{fontSize:13,fontWeight:700}}>Today's Activity</span>
            </div>
            <button onClick={()=>navigate("/employee/activity")} className="view-btn">
              View all <ChevronRight size={12}/>
            </button>
          </div>
          {recentAct.length===0?(
            <div style={{textAlign:"center",padding:"24px 0",opacity:.3}}>
              <Activity size={20} style={{display:"block",margin:"0 auto 8px"}}/>
              <div style={{fontSize:12}}>No activity today</div>
            </div>
          ):recentAct.map((a,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<recentAct.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <div style={{width:30,height:30,borderRadius:8,background:"rgba(129,140,248,0.12)",border:"1px solid rgba(129,140,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#818cf8",flexShrink:0}}>
                {(a.app||"?")[0].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.app||"Unknown"}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>{a.time||"—"} · {a.duration||1}m</div>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:prodColor(a.pct||0),flexShrink:0}}>{a.pct||0}%</span>
            </div>
          ))}
        </div>

        {/* My Tasks */}
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <CheckCircle size={14} color="#6b7280"/>
              <span style={{fontSize:13,fontWeight:700}}>My Tasks</span>
              {stats.pendingTasks>0&&(
                <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:8,background:"rgba(251,191,36,0.15)",color:"#fbbf24",border:"1px solid rgba(251,191,36,0.3)"}}>{stats.pendingTasks} active</span>
              )}
            </div>
            <span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{stats.completedTasks||0}/{stats.totalTasks||0} done</span>
          </div>

          {/* Progress bar */}
          {stats.totalTasks>0&&(
            <div style={{marginBottom:14}}>
              <div style={{height:5,background:"#1f2937",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(((stats.completedTasks||0)/(stats.totalTasks||1))*100)}%`,background:"#4ade80",borderRadius:4,transition:"width 0.5s"}}/>
              </div>
            </div>
          )}

          {recentTask.length===0?(
            <div style={{textAlign:"center",padding:"24px 0",opacity:.3}}>
              <CheckCircle size={20} style={{display:"block",margin:"0 auto 8px"}}/>
              <div style={{fontSize:12}}>No tasks assigned</div>
            </div>
          ):recentTask.map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<recentTask.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <div style={{width:3,height:34,borderRadius:4,background:PRIORITY_C[t.priority]||"#818cf8",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                {t.due_date&&<div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:1}}>Due {new Date(t.due_date).toLocaleDateString()}</div>}
              </div>
              <span style={{fontSize:9,padding:"2px 8px",borderRadius:20,background:`${STATUS_C[t.status]||"#818cf8"}18`,color:STATUS_C[t.status]||"#818cf8",border:`1px solid ${STATUS_C[t.status]||"#818cf8"}30`,fontWeight:600,whiteSpace:"nowrap"}}>
                {(t.status||"pending").replace("_"," ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom 3 col ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20}}>

        {/* Screenshots */}
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Camera size={14} color="#6b7280"/>
              <span style={{fontSize:13,fontWeight:700}}>Screenshots</span>
            </div>
            <button onClick={()=>navigate("/employee/screenshots")} className="view-btn">
              View all <ChevronRight size={12}/>
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {recentShot.length===0?(
              <div style={{gridColumn:"span 2",textAlign:"center",padding:"20px 0",opacity:.3}}>
                <Camera size={18} style={{display:"block",margin:"0 auto 6px"}}/>
                <div style={{fontSize:11}}>No screenshots today</div>
              </div>
            ):recentShot.map((s,i)=>(
              <div key={i} style={{borderRadius:8,overflow:"hidden",background:"#0d0d10",border:`1px solid ${s.isBlocked?"rgba(248,113,113,0.3)":"rgba(255,255,255,0.06)"}`,position:"relative"}}>
                <div style={{height:55,background:"linear-gradient(135deg,#111827,#1f2937)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Camera size={14} color="#374151"/>
                </div>
                {s.isBlocked&&(
                  <div style={{position:"absolute",top:3,right:3}}><ShieldAlert size={10} color="#f87171"/></div>
                )}
                <div style={{padding:"4px 7px",fontSize:9,color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.app||"—"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Work Hours Mini */}
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Clock size={14} color="#6b7280"/>
              <span style={{fontSize:13,fontWeight:700}}>Work Hours</span>
            </div>
            <button onClick={()=>navigate("/employee/hours")} className="view-btn">
              View <ChevronRight size={12}/>
            </button>
          </div>
          {/* Mini hourly bars 8AM-5PM */}
          <div style={{display:"flex",alignItems:"flex-end",gap:3,height:60,marginBottom:14}}>
            {Array.from({length:10},(_,i)=>{
              const h    = i+8;
              const mins = recentAct.filter(a=>{
                const m=(a.time||"").match(/(\d+):/);
                if(!m) return false;
                let hr=parseInt(m[1]);
                if((a.time||"").toLowerCase().includes("pm")&&hr!==12) hr+=12;
                return hr===h;
              }).reduce((s,a)=>s+(a.duration||1),0);
              const pct = Math.min(100,(mins/60)*100);
              return (
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                  <div style={{width:"100%",height:`${Math.max(pct,mins>0?8:2)}%`,minHeight:mins>0?4:1,background:mins>0?"#818cf8":"#1f2937",borderRadius:"3px 3px 0 0",transition:"height 0.4s"}}/>
                  <div style={{fontSize:7,color:"rgba(255,255,255,0.2)"}}>{h>12?`${h-12}p`:`${h}a`}</div>
                </div>
              );
            })}
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div>
              <div style={{fontSize:9,opacity:.35,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>Total</div>
              <div style={{fontSize:18,fontWeight:800}}>{fmtMins(stats.totalMins)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,opacity:.35,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>Productivity</div>
              <div style={{fontSize:18,fontWeight:800,color:prodColor(stats.avgPct||0)}}>{stats.avgPct||0}%</div>
            </div>
          </div>
        </div>

        {/* Profile Quick View */}
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"18px 20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <User size={14} color="#6b7280"/>
              <span style={{fontSize:13,fontWeight:700}}>My Profile</span>
            </div>
            <button onClick={()=>navigate("/employee/profile")} className="view-btn">
              Edit <ChevronRight size={12}/>
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{width:44,height:44,borderRadius:12,background:grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>
              {ini(name)}
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700}}>{name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{profile.role||"Employee"}</div>
            </div>
          </div>
          {[
            {label:"Department", val:profile.department},
            {label:"Email",      val:profile.email},
            {label:"Employee ID",val:profile.empId},
            {label:"Joined",     val:profile.joinDate},
          ].filter(r=>r.val).map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)",fontSize:11}}>
              <span style={{color:"rgba(255,255,255,0.35)"}}>{r.label}</span>
              <span style={{color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120,textAlign:"right"}}>{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
  .metric-card { transition: transform 0.2s, border-color 0.2s; }
  .metric-card:hover { transform: translateY(-2px); border-color: #27272a !important; }
  .view-btn { display:flex; align-items:center; gap:3px; font-size:11px; color:rgba(255,255,255,0.3); background:none; border:none; cursor:pointer; font-family:'Outfit',sans-serif; transition:color 0.15s; }
  .view-btn:hover { color: #818cf8; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0a0f; }
  ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
`;