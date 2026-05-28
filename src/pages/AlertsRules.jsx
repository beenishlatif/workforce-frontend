import { useState, useEffect, useCallback } from "react";
import API from "../api/axios.js"; // ✅ axios instance

/* ── Responsive hook ── */
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

const T = {
  bg:"#0a0b0f", surface:"#0e1018", card:"#13151f",
  border:"#1c1f2e", border2:"#252838",
  text:"#e8eaf6", textSub:"#9196b0", muted:"rgba(145,150,176,0.5)", dim:"#1c1f2e",
  success:"#34d399", successBg:"rgba(52,211,153,0.08)",  successBr:"rgba(52,211,153,0.2)",
  danger:"#f87171",  dangerBg:"rgba(248,113,113,0.08)",  dangerBr:"rgba(248,113,113,0.2)",
  warn:"#fbbf24",    warnBg:"rgba(251,191,36,0.08)",     warnBr:"rgba(251,191,36,0.2)",
  accent:"#818cf8",  accentBg:"rgba(129,140,248,0.08)",  accentBr:"rgba(129,140,248,0.2)",
  sky:"#38bdf8",     skyBg:"rgba(56,189,248,0.08)",      skyBr:"rgba(56,189,248,0.2)",
};

const GRADS = [
  "linear-gradient(135deg,#6366f1,#4f46e5)",
  "linear-gradient(135deg,#0ea5e9,#0284c7)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#14b8a6,#0d9488)",
];

const SEV_CFG = {
  high:   { color:"#f87171", bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.2)", label:"HIGH", dot:"#f87171" },
  medium: { color:"#fbbf24", bg:"rgba(251,191,36,0.08)",  border:"rgba(251,191,36,0.2)",  label:"MED",  dot:"#fbbf24" },
  low:    { color:"#34d399", bg:"rgba(52,211,153,0.08)",  border:"rgba(52,211,153,0.2)",  label:"LOW",  dot:"#34d399" },
};

const TYPE_LABEL = {
  blocked_app:"Blocked App", low_productivity:"Low Productivity",
  idle:"Idle Detected", after_hours:"After Hours",
};

const DEFAULT_RULES = [
  { id:1, name:"YouTube",   icon:"▶", category:"Video streaming", severity:"high",   on:true  },
  { id:2, name:"Facebook",  icon:"f", category:"Social media",    severity:"high",   on:true  },
  { id:3, name:"TikTok",    icon:"♪", category:"Video sharing",   severity:"high",   on:true  },
  { id:4, name:"Instagram", icon:"◈", category:"Social media",    severity:"high",   on:true  },
  { id:5, name:"Netflix",   icon:"N", category:"Streaming",       severity:"medium", on:false },
  { id:6, name:"WhatsApp",  icon:"◉", category:"Messaging",       severity:"medium", on:true  },
  { id:7, name:"Twitter",   icon:"✕", category:"Social media",    severity:"medium", on:true  },
  { id:8, name:"Snapchat",  icon:"◑", category:"Social media",    severity:"low",    on:false },
];

const DEFAULT_PROD_RULES = [
  { id:1, label:"Low productivity alert",  sub:"Alert if below 40% for 30 mins", on:true  },
  { id:2, label:"Idle detection",          sub:"Alert if no activity for 15 mins",on:true  },
  { id:3, label:"After-hours monitoring",  sub:"Track activity after 6 PM",       on:false },
  { id:4, label:"Auto-delete screenshots", sub:"Delete after 7 days",             on:true  },
];

function ini(name) { return (name||"??").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2); }
function prodColor(p) { return p >= 70 ? T.success : p >= 40 ? T.warn : T.danger; }

/* ── Toggle ── */
function Toggle({ on, onChange }) {
  return (
    <div onClick={onChange}
      style={{ width:40, height:22, borderRadius:11,
        background:on?T.success:T.border2, border:`1px solid ${on?T.successBr:T.border2}`,
        position:"relative", cursor:"pointer", transition:"all 0.25s", flexShrink:0 }}>
      <div style={{ width:16, height:16, borderRadius:"50%", background:"#fff",
        position:"absolute", top:2, left:on?21:3, transition:"left 0.25s",
        boxShadow:"0 1px 3px rgba(0,0,0,0.5)" }}/>
    </div>
  );
}

/* ── Severity Badge ── */
function SevBadge({ severity, small }) {
  const s = SEV_CFG[severity] || SEV_CFG.low;
  return (
    <span style={{ fontSize:small?8:9, fontWeight:700, letterSpacing:"0.06em",
      padding:small?"1px 6px":"2px 8px", borderRadius:4,
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
      fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
}

/* ── Avatar ── */
function EmpAvatar({ name, size=28 }) {
  const grad = GRADS[(name||"").charCodeAt(0) % GRADS.length];
  return (
    <div style={{ width:size, height:size, borderRadius:Math.round(size*0.3),
      background:grad, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.34, fontWeight:700, color:"#fff", flexShrink:0, letterSpacing:"0.02em" }}>
      {ini(name)}
    </div>
  );
}

/* ── Mini Donut ── */
function MiniDonut({ high=0, medium=0, low=0, size=68 }) {
  const total=high+medium+low||1;
  const r=22, cx=32, cy=32, circ=2*Math.PI*r;
  let offset=0;
  const segs=[{v:high,color:T.danger},{v:medium,color:T.warn},{v:low,color:T.success}];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={T.border2} strokeWidth="6"/>
      {segs.map((s,i)=>{
        const dash=(s.v/total)*circ;
        const el=(<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.v>0?s.color:T.dim}
          strokeWidth="6" strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={-offset}
          strokeLinecap="butt" style={{transform:"rotate(-90deg)",transformOrigin:"50% 50%"}}/>);
        offset+=dash; return el;
      })}
      <text x={cx} y={cx+1} textAnchor="middle" dominantBaseline="middle"
        fill={T.text} fontSize="12" fontWeight="700" fontFamily="'Outfit',sans-serif">
        {high+medium+low}
      </text>
    </svg>
  );
}

/* ── Spark Bars ── */
function SparkBars({ data=[], color=T.accent, height=40 }) {
  if (!data.length) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted, fontSize:10 }}>No data</div>;
  const max=Math.max(...data,1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height }}>
      {data.map((v,i)=>(
        <div key={i} style={{ flex:1, height:"100%", display:"flex", alignItems:"flex-end" }}>
          <div style={{ width:"100%", height:`${Math.max((v/max)*100,4)}%`,
            background:i===data.length-1?color:color+"40", borderRadius:"2px 2px 0 0", transition:"height 0.5s" }}/>
        </div>
      ))}
    </div>
  );
}

/* ── Metric Card ── */
function MetricCard({ icon, color, label, val, vc, sub, onClick, isMobile }) {
  return (
    <div className="metric-card" onClick={onClick}
      style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14,
        padding:isMobile?"13px 14px":"18px 20px", cursor:onClick?"pointer":"default" }}>
      <div style={{ width:isMobile?32:40, height:isMobile?32:40, borderRadius:11, background:color+"15",
        border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center",
        color:color, fontSize:isMobile?15:18, marginBottom:isMobile?10:14 }}>
        {icon}
      </div>
      <div style={{ fontSize:isMobile?9:10, color:T.textSub, marginBottom:4,
        textTransform:"uppercase", letterSpacing:".07em", fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:isMobile?20:26, fontWeight:800, color:vc||T.text, lineHeight:1, marginBottom:4 }}>{val}</div>
      {sub && <div style={{ fontSize:isMobile?9:10, color:T.muted }}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function AlertsRules() {
  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [alerts,       setAlerts]       = useState([]);
  const [stats,        setStats]        = useState(null);
  const [flagged,      setFlagged]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeTab,    setActiveTab]    = useState("all");
  const [filterSev,    setFilterSev]    = useState("all");
  const [rules,        setRules]        = useState(DEFAULT_RULES);
  const [prodRules,    setProdRules]    = useState(DEFAULT_PROD_RULES);
  const [ssInterval,   setSsInterval]   = useState("10");
  const [dismissingId, setDismissingId] = useState(null);
  const [newAppName,   setNewAppName]   = useState("");
  const [showAddApp,   setShowAddApp]   = useState(false);
  const [expandedEmp,  setExpandedEmp]  = useState(null);
  const [section,      setSection]      = useState("alerts");
  const [search,       setSearch]       = useState("");
  const [mobileNav,    setMobileNav]    = useState(false);

  /* ── Fetch via axios ── */
  const fetchAll = useCallback(async () => {
    try {
      const [aRes, sRes, fRes] = await Promise.allSettled([
        API.get("/alerts"),
        API.get("/alerts/stats"),
        API.get("/alerts/flagged-employees"),
      ]);
      if (aRes.status === "fulfilled") {
        const d = aRes.value.data;
        setAlerts(Array.isArray(d) ? d : []);
      }
      if (sRes.status === "fulfilled") setStats(sRes.value.data);
      if (fRes.status === "fulfilled") {
        const d = fRes.value.data;
        setFlagged(Array.isArray(d) ? d : []);
      }
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const resolveAlert = async (id) => {
    setDismissingId(id);
    try { await API.patch(`/alerts/${id}/resolve`); await fetchAll(); }
    catch(e) { console.error(e); }
    finally { setDismissingId(null); }
  };

  const resolveAll = async () => {
    if (!window.confirm("Saare alerts resolve karein?")) return;
    await API.patch("/alerts/resolve-all");
    fetchAll();
  };

  const deleteAlert = async (id) => {
    await API.delete(`/alerts/${id}`);
    fetchAll();
  };

  const addAppRule = () => {
    if (!newAppName.trim()) return;
    setRules(p=>[...p,{id:Date.now(),name:newAppName.trim(),icon:newAppName[0].toUpperCase(),category:"Custom",severity:"medium",on:true}]);
    setNewAppName(""); setShowAddApp(false);
  };

  const unresolved    = alerts.filter(a=>!a.resolved).length;
  const blockedCount  = alerts.filter(a=>a.type==="blocked_app").length;
  const resolvedCount = alerts.filter(a=>a.resolved).length;

  const empGroups = {};
  alerts.forEach(a=>{ const k=a.employeeName||"Unknown"; if(!empGroups[k])empGroups[k]=[]; empGroups[k].push(a); });

  const filtered = alerts
    .filter(a=>{
      if (activeTab==="blocked")    return a.type==="blocked_app";
      if (activeTab==="low_prod")   return a.type==="low_productivity";
      if (activeTab==="resolved")   return a.resolved===true;
      if (activeTab==="unresolved") return a.resolved===false;
      return true;
    })
    .filter(a=>filterSev==="all"||a.severity===filterSev)
    .filter(a=>!search||(a.employeeName||"").toLowerCase().includes(search.toLowerCase())||(a.blockedApp||a.app||"").toLowerCase().includes(search.toLowerCase()));

  const hours=Array(12).fill(0);
  alerts.forEach(a=>{ try{ const h=new Date(a.createdAt).getHours()%12; hours[h]++; }catch{} });

  /* ── Responsive values ── */
  const pad        = isMobile ? "16px 14px" : "28px 32px";
  const metricCols = isMobile ? "repeat(3,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)";
  const chartCols  = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "200px 1fr 1fr";
  const rulesCols  = isMobile ? "1fr" : "1fr 1fr";

  const SEL = {
    padding:"7px 26px 7px 11px", borderRadius:8, border:`1px solid ${T.border2}`,
    background:T.card, color:T.text, fontSize:11, cursor:"pointer",
    fontFamily:"'Outfit',sans-serif", appearance:"none", outline:"none",
  };
  const BTN = {
    display:"flex", alignItems:"center", gap:6, padding:"8px 14px",
    borderRadius:9, border:`1px solid ${T.border2}`, background:T.card,
    color:T.text, cursor:"pointer", fontSize:12, fontWeight:600,
    fontFamily:"'Outfit',sans-serif", transition:"all 0.15s",
  };

  const NAV_ITEMS = [
    { id:"alerts",    label:"Live Alerts"    },
    { id:"employees", label:"By Employee"    },
    { id:"rules",     label:"Rules & Config" },
  ];

  return (
    <div style={{ background:T.bg, minHeight:"100vh", padding:pad,
      fontFamily:"'Outfit',sans-serif", color:T.text }}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
        marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:36, height:36, borderRadius:10,
              background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h1 style={{ fontSize:isMobile?17:22, fontWeight:800, letterSpacing:"-0.02em", color:T.text }}>
              Alerts & Rules
            </h1>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:46, flexWrap:"wrap" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:T.success, animation:"pulse 2s infinite" }}/>
            <span style={{ fontSize:11, color:T.textSub }}>Live · 5s refresh</span>
            {unresolved>0&&(
              <span style={{ fontSize:10, color:T.danger, background:T.dangerBg,
                padding:"2px 8px", borderRadius:6, border:`1px solid ${T.dangerBr}`, fontWeight:600 }}>
                {unresolved} unresolved
              </span>
            )}
          </div>
        </div>

        {/* Desktop nav buttons */}
        {!isMobile && (
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {NAV_ITEMS.map(n=>(
              <button key={n.id} onClick={()=>setSection(n.id)} className="nav-btn"
                style={{ ...BTN,
                  background:section===n.id?T.accentBg:"transparent",
                  borderColor:section===n.id?T.accentBr:T.border2,
                  color:section===n.id?T.accent:T.textSub }}>
                {n.label}
                {n.id==="alerts"&&unresolved>0&&(
                  <span style={{ background:T.danger, color:"#fff", fontSize:9, fontWeight:700,
                    padding:"1px 6px", borderRadius:8 }}>{unresolved}</span>
                )}
              </button>
            ))}
            <button onClick={fetchAll} style={BTN}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ animation:loading?"spin 1s linear infinite":"none" }}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Refresh
            </button>
            {unresolved>0&&(
              <button onClick={resolveAll}
                style={{ ...BTN, borderColor:T.successBr, background:T.successBg, color:T.success, fontWeight:700 }}>
                ✓ Resolve All
              </button>
            )}
          </div>
        )}

        {/* Mobile: hamburger + refresh */}
        {isMobile && (
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={fetchAll} style={{ ...BTN, padding:"8px 10px" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ animation:loading?"spin 1s linear infinite":"none" }}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
            </button>
            <button onClick={()=>setMobileNav(v=>!v)}
              style={{ ...BTN, padding:"8px 12px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile nav dropdown */}
      {isMobile && mobileNav && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12,
          overflow:"hidden", marginBottom:16, animation:"fadeDown .15s ease" }}>
          {NAV_ITEMS.map((n,i)=>(
            <button key={n.id} onClick={()=>{setSection(n.id);setMobileNav(false);}}
              style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                width:"100%", padding:"13px 16px", cursor:"pointer", border:"none",
                fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:600,
                background:section===n.id?T.accentBg:"transparent",
                color:section===n.id?T.accent:T.textSub,
                borderBottom:i<NAV_ITEMS.length-1?`1px solid ${T.border}`:"none" }}>
              {n.label}
              {n.id==="alerts"&&unresolved>0&&(
                <span style={{ background:T.danger, color:"#fff", fontSize:9, fontWeight:700,
                  padding:"1px 7px", borderRadius:8 }}>{unresolved}</span>
              )}
            </button>
          ))}
          {unresolved>0&&(
            <button onClick={()=>{resolveAll();setMobileNav(false);}}
              style={{ display:"flex", alignItems:"center", gap:6, width:"100%", padding:"13px 16px",
                cursor:"pointer", border:"none", borderTop:`1px solid ${T.border}`,
                fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:700,
                background:T.successBg, color:T.success }}>
              ✓ Resolve All ({unresolved})
            </button>
          )}
        </div>
      )}

      {/* Mobile: active section pill */}
      {isMobile && (
        <div style={{ fontSize:11, fontWeight:600, color:T.accent, background:T.accentBg,
          border:`1px solid ${T.accentBr}`, padding:"5px 12px", borderRadius:20,
          display:"inline-flex", alignItems:"center", gap:6, marginBottom:14 }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:T.accent }}/>
          {NAV_ITEMS.find(n=>n.id===section)?.label}
        </div>
      )}

      {/* ── METRICS ── */}
      <div style={{ display:"grid", gridTemplateColumns:metricCols, gap:isMobile?9:14, marginBottom:isMobile?14:24 }}>
        <MetricCard icon="🔔" color={T.danger} label="Total" val={alerts.length}
          sub={`${unresolved} pending`} isMobile={isMobile}
          onClick={unresolved>0?()=>{setSection("alerts");setActiveTab("unresolved");}:undefined}/>
        <MetricCard icon="🔒" color={T.warn} label="Blocked" val={blockedCount}
          sub="Today" isMobile={isMobile}
          onClick={blockedCount>0?()=>{setSection("alerts");setActiveTab("blocked");}:undefined}/>
        <MetricCard icon="✓" color={T.success} label="Resolved" val={resolvedCount}
          vc={T.success} sub="All time" isMobile={isMobile}/>
        {/* These 2 hide on mobile (shown in second row) */}
        {!isMobile && <>
          <MetricCard icon="⚙" color={T.accent} label="Active Rules" val={rules.filter(r=>r.on).length}
            sub={`of ${rules.length} total`} isMobile={isMobile}/>
          <MetricCard icon="👤" color={T.sky} label="Flagged" val={flagged.length}
            sub="Need attention" isMobile={isMobile}
            onClick={flagged.length>0?()=>setSection("employees"):undefined}/>
        </>}
      </div>

      {/* Mobile: extra 2 metrics */}
      {isMobile && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
          <MetricCard icon="⚙" color={T.accent} label="Active Rules" val={rules.filter(r=>r.on).length}
            sub={`of ${rules.length}`} isMobile={isMobile}/>
          <MetricCard icon="👤" color={T.sky} label="Flagged" val={flagged.length}
            sub="Attention" isMobile={isMobile}
            onClick={flagged.length>0?()=>setSection("employees"):undefined}/>
        </div>
      )}

      {/* ── CHARTS ── */}
      <div style={{ display:"grid", gridTemplateColumns:chartCols, gap:isMobile?9:14, marginBottom:isMobile?14:24 }}>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ fontSize:9, color:T.textSub, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>By Severity</div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <MiniDonut
              high={alerts.filter(a=>a.severity==="high").length}
              medium={alerts.filter(a=>a.severity==="medium").length}
              low={alerts.filter(a=>a.severity==="low").length}/>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                {l:"High",   c:T.danger,  v:alerts.filter(a=>a.severity==="high").length},
                {l:"Medium", c:T.warn,    v:alerts.filter(a=>a.severity==="medium").length},
                {l:"Low",    c:T.success, v:alerts.filter(a=>a.severity==="low").length},
              ].map(s=>(
                <div key={s.l} style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:6, height:6, borderRadius:2, background:s.c, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:T.textSub }}>{s.l}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:s.c, marginLeft:"auto", paddingLeft:10 }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ fontSize:9, color:T.textSub, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", marginBottom:14 }}>By Type</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              {l:"Blocked App",  v:alerts.filter(a=>a.type==="blocked_app").length,     c:T.danger},
              {l:"Low Prod",     v:alerts.filter(a=>a.type==="low_productivity").length, c:T.warn},
              {l:"Idle",         v:alerts.filter(a=>a.type==="idle").length,             c:T.accent},
              {l:"After Hours",  v:alerts.filter(a=>a.type==="after_hours").length,      c:T.sky},
            ].map(t=>{
              const max=Math.max(alerts.length,1);
              return(
                <div key={t.l}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, color:T.textSub }}>{t.l}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:t.c }}>{t.v}</span>
                  </div>
                  <div style={{ height:3, background:T.border2, borderRadius:4, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(t.v/max)*100}%`, background:t.c, borderRadius:4, transition:"width 0.8s" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontSize:9, color:T.textSub, fontWeight:700, textTransform:"uppercase", letterSpacing:".08em" }}>Alert Frequency</div>
            <span style={{ fontSize:9, color:T.muted }}>Last 12h</span>
          </div>
          <SparkBars data={hours} color={T.danger} height={44}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <span style={{ fontSize:9, color:T.muted }}>12h ago</span>
            <span style={{ fontSize:9, color:T.muted }}>Now</span>
          </div>
        </div>
      </div>

      {/* ══ SECTION: LIVE ALERTS ══ */}
      {section==="alerts" && (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>

          {/* Toolbar */}
          <div style={{ padding:"12px 14px", borderBottom:`1px solid ${T.border}`,
            display:"flex", flexDirection:"column", gap:10, background:T.bg }}>
            {/* Tab filters — scrollable */}
            <div style={{ display:"flex", gap:4, overflowX:"auto", scrollbarWidth:"none", paddingBottom:2 }}>
              {[
                {k:"all",        l:`All (${alerts.length})`},
                {k:"unresolved", l:`Pending (${unresolved})`},
                {k:"blocked",    l:`Blocked (${blockedCount})`},
                {k:"low_prod",   l:"Low Prod"},
                {k:"resolved",   l:`Done (${resolvedCount})`},
              ].map(t=>(
                <button key={t.k} onClick={()=>setActiveTab(t.k)}
                  style={{ padding:"5px 12px", borderRadius:7, whiteSpace:"nowrap", flexShrink:0,
                    border:`1px solid ${activeTab===t.k?T.accentBr:T.border2}`,
                    background:activeTab===t.k?T.accentBg:"transparent",
                    color:activeTab===t.k?T.accent:T.textSub,
                    cursor:"pointer", fontSize:11, fontWeight:600,
                    fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                  {t.l}
                </button>
              ))}
            </div>

            {/* Search + filter */}
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <div style={{ position:"relative", flex:1, minWidth:140 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={T.textSub} strokeWidth="2"
                  style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ width:"100%", paddingLeft:30, padding:"7px 11px 7px 30px", borderRadius:8,
                    border:`1px solid ${T.border2}`, background:T.card, color:T.text,
                    fontSize:11, fontFamily:"'Outfit',sans-serif", outline:"none" }}/>
              </div>
              <div style={{ position:"relative", flexShrink:0 }}>
                <select value={filterSev} onChange={e=>setFilterSev(e.target.value)} style={SEL}>
                  <option value="all">All Severity</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke={T.textSub} strokeWidth="2"
                  style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop column headers */}
          {!isMobile && (
            <div style={{ display:"grid",
              gridTemplateColumns:"8px 200px 130px 120px 80px 90px 110px 100px",
              gap:12, padding:"10px 20px", borderBottom:`1px solid ${T.border}`, background:T.bg }}>
              {["","Employee","Type","App","Severity","Prod","Time",""].map((h,i)=>(
                <div key={i} style={{ fontSize:9, fontWeight:700, color:T.muted,
                  textTransform:"uppercase", letterSpacing:".08em" }}>{h}</div>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ textAlign:"center", padding:"48px 0" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={T.accent} strokeWidth="2"
                style={{ display:"block", margin:"0 auto 10px", animation:"spin 1s linear infinite" }}>
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              <div style={{ fontSize:12, color:T.textSub }}>Loading alerts...</div>
            </div>
          )}

          {!loading && filtered.length===0 && (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke={T.border2} strokeWidth="1.5"
                style={{ display:"block", margin:"0 auto 12px" }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div style={{ fontSize:13, fontWeight:700, color:T.text }}>No alerts found</div>
              <div style={{ fontSize:11, color:T.textSub, marginTop:4 }}>All clear!</div>
            </div>
          )}

          {!loading && filtered.map((a,i)=>{
            const sev   = SEV_CFG[a.severity] || SEV_CFG.low;
            const isDis = dismissingId===a._id;

            /* Mobile: card layout */
            if (isMobile) return (
              <div key={a._id} style={{ padding:"13px 14px",
                borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",
                opacity:isDis?0.4:a.resolved?0.45:1 }}>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, minWidth:0 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:sev.dot, flexShrink:0, marginTop:2 }}/>
                    <EmpAvatar name={a.employeeName} size={28}/>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:T.text,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {a.employeeName||"Unknown"}
                      </div>
                      <div style={{ fontSize:10, color:T.textSub }}>{TYPE_LABEL[a.type]||a.type||"—"}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                    {!a.resolved ? (
                      <>
                        <button onClick={()=>resolveAlert(a._id)} disabled={isDis}
                          style={{ padding:"4px 10px", borderRadius:6,
                            border:`1px solid ${T.successBr}`, background:T.successBg,
                            color:T.success, cursor:"pointer", fontSize:10, fontWeight:700,
                            fontFamily:"'Outfit',sans-serif" }}>
                          {isDis?"...":"✓"}
                        </button>
                        <button onClick={()=>deleteAlert(a._id)}
                          style={{ padding:"4px 10px", borderRadius:6,
                            border:`1px solid ${T.border2}`, background:"transparent",
                            color:T.textSub, cursor:"pointer", fontSize:10,
                            fontFamily:"'Outfit',sans-serif" }}>✕</button>
                      </>
                    ) : (
                      <button onClick={()=>deleteAlert(a._id)}
                        style={{ padding:"4px 10px", borderRadius:6,
                          border:`1px solid ${T.border2}`, background:"transparent",
                          color:T.muted, cursor:"pointer", fontSize:10,
                          fontFamily:"'Outfit',sans-serif" }}>✕</button>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", paddingLeft:22 }}>
                  {(a.blockedApp||a.app) && (
                    <span style={{ fontSize:11, fontWeight:600, color:sev.color }}>
                      {a.blockedApp||a.app}
                    </span>
                  )}
                  <SevBadge severity={a.severity} small/>
                  <span style={{ fontSize:10, color:T.textSub, marginLeft:"auto" }}>{a.time}</span>
                </div>
              </div>
            );

            /* Desktop: grid row */
            return (
              <div key={a._id} className="alert-row"
                style={{ display:"grid",
                  gridTemplateColumns:"8px 200px 130px 120px 80px 90px 110px 100px",
                  gap:12, padding:"12px 20px",
                  borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none",
                  alignItems:"center", opacity:isDis?0.4:a.resolved?0.45:1,
                  background:"transparent", transition:"all 0.15s" }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:sev.dot,
                  boxShadow:`0 0 6px ${sev.dot}60`, flexShrink:0 }}/>
                <div style={{ display:"flex", alignItems:"center", gap:8, minWidth:0 }}>
                  <EmpAvatar name={a.employeeName} size={28}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {a.employeeName||"Unknown"}
                    </div>
                    <div style={{ fontSize:10, color:T.textSub }}>{a.department||"—"}</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:T.textSub }}>{TYPE_LABEL[a.type]||a.type||"—"}</div>
                <div style={{ fontSize:12, fontWeight:600, color:sev.color,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {a.blockedApp||a.app||"—"}
                </div>
                <div><SevBadge severity={a.severity}/></div>
                <div>
                  {a.productivity!==undefined?(
                    <div>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        fontSize:9, color:T.muted, marginBottom:3 }}>
                        <span>Prod</span>
                        <span style={{ color:prodColor(a.productivity) }}>{a.productivity}%</span>
                      </div>
                      <div style={{ height:3, background:T.border2, borderRadius:4, overflow:"hidden" }}>
                        <div style={{ width:`${a.productivity}%`, height:"100%",
                          background:prodColor(a.productivity), borderRadius:4 }}/>
                      </div>
                    </div>
                  ):a.resolved?(
                    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:4,
                      background:T.successBg, color:T.success,
                      border:`1px solid ${T.successBr}`, fontWeight:600 }}>DONE</span>
                  ):null}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.text }}>{a.time}</div>
                  <div style={{ fontSize:10, color:T.textSub }}>{a.date}</div>
                </div>
                <div style={{ display:"flex", gap:5, justifyContent:"flex-end" }}>
                  {!a.resolved?(
                    <>
                      <button onClick={()=>resolveAlert(a._id)} disabled={isDis}
                        style={{ padding:"4px 10px", borderRadius:6,
                          border:`1px solid ${T.successBr}`, background:T.successBg,
                          color:T.success, cursor:"pointer", fontSize:10, fontWeight:700,
                          fontFamily:"'Outfit',sans-serif" }}>
                        {isDis?"...":"✓"}
                      </button>
                      <button onClick={()=>deleteAlert(a._id)}
                        style={{ padding:"4px 10px", borderRadius:6,
                          border:`1px solid ${T.border2}`, background:"transparent",
                          color:T.textSub, cursor:"pointer", fontSize:10,
                          fontFamily:"'Outfit',sans-serif" }}>✕</button>
                    </>
                  ):(
                    <button onClick={()=>deleteAlert(a._id)}
                      style={{ padding:"4px 10px", borderRadius:6,
                        border:`1px solid ${T.border2}`, background:"transparent",
                        color:T.muted, cursor:"pointer", fontSize:10,
                        fontFamily:"'Outfit',sans-serif" }}>✕</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ SECTION: BY EMPLOYEE ══ */}
      {section==="employees" && (
        <div>
          <div style={{ fontSize:10, color:T.textSub, fontWeight:700, textTransform:"uppercase",
            letterSpacing:".08em", marginBottom:16 }}>
            {Object.keys(empGroups).length} employees with alerts
          </div>

          <div style={{ display:"grid",
            gridTemplateColumns:isMobile?"1fr":isTablet?"repeat(2,1fr)":"repeat(auto-fill,minmax(300px,1fr))",
            gap:14, marginBottom:16 }}>
            {Object.entries(empGroups).sort((a,b)=>b[1].length-a[1].length).map(([name,empAlerts])=>{
              const isOpen        = expandedEmp===name;
              const unresolvedEmp = empAlerts.filter(a=>!a.resolved).length;
              const appFreq={};
              empAlerts.forEach(a=>{ const k=a.blockedApp||a.app||"—"; appFreq[k]=(appFreq[k]||0)+1; });
              const topApps=Object.entries(appFreq).sort((a,b)=>b[1]-a[1]).slice(0,3);

              return (
                <div key={name} className="emp-card"
                  onClick={()=>setExpandedEmp(isOpen?null:name)}
                  style={{ background:T.surface,
                    border:`1px solid ${isOpen?T.accentBr:T.border}`,
                    borderRadius:16, overflow:"hidden", cursor:"pointer" }}>
                  <div style={{ padding:"16px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                      <EmpAvatar name={name} size={44}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:T.text }}>{name}</div>
                        <div style={{ fontSize:10, color:T.textSub }}>{empAlerts[0]?.department||"—"}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:24, fontWeight:800, color:unresolvedEmp>0?T.danger:T.textSub }}>
                          {empAlerts.length}
                        </div>
                        <div style={{ fontSize:9, color:T.muted }}>alerts</div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                      {[
                        {l:"Pending",  v:unresolvedEmp,                                      c:T.danger},
                        {l:"Blocked",  v:empAlerts.filter(a=>a.type==="blocked_app").length,  c:T.warn},
                        {l:"High",     v:empAlerts.filter(a=>a.severity==="high").length,     c:T.danger},
                      ].map(s=>(
                        <div key={s.l} style={{ background:T.card, borderRadius:8, padding:"8px 10px",
                          textAlign:"center", border:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:18, fontWeight:800, color:s.v>0?s.c:T.muted }}>{s.v}</div>
                          <div style={{ fontSize:9, color:T.muted }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {topApps.length>0 && (
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {topApps.map(([app,cnt])=>(
                          <span key={app} style={{ fontSize:10, padding:"2px 8px", borderRadius:6,
                            background:T.dangerBg, color:T.danger,
                            border:`1px solid ${T.dangerBr}`, fontWeight:600 }}>
                            {app} ×{cnt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div style={{ borderTop:`1px solid ${T.border}`, maxHeight:260, overflowY:"auto" }}
                      onClick={e=>e.stopPropagation()}>
                      {empAlerts.map((a,i)=>{
                        const sev=SEV_CFG[a.severity]||SEV_CFG.low;
                        return(
                          <div key={a._id} style={{ display:"flex", justifyContent:"space-between",
                            alignItems:"center", padding:"10px 18px",
                            borderBottom:i<empAlerts.length-1?`1px solid ${T.border}`:"none",
                            opacity:a.resolved?0.45:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:5, height:5, borderRadius:"50%", background:sev.dot, flexShrink:0 }}/>
                              <div>
                                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>
                                  {a.blockedApp||a.app||TYPE_LABEL[a.type]||"—"}
                                </div>
                                <div style={{ fontSize:10, color:T.textSub }}>{TYPE_LABEL[a.type]||a.type}</div>
                              </div>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <span style={{ fontSize:10, color:T.textSub }}>{a.time}</span>
                              <SevBadge severity={a.severity} small/>
                              {!a.resolved && (
                                <button onClick={()=>resolveAlert(a._id)}
                                  style={{ padding:"3px 8px", borderRadius:5,
                                    border:`1px solid ${T.successBr}`, background:T.successBg,
                                    color:T.success, cursor:"pointer", fontSize:9, fontWeight:700,
                                    fontFamily:"'Outfit',sans-serif" }}>✓</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ padding:"8px 18px", borderTop:`1px solid ${T.border}`,
                    textAlign:"center", fontSize:10, color:T.muted }}>
                    {isOpen?"▲ Collapse":"▼ Expand alerts"}
                  </div>
                </div>
              );
            })}
          </div>

          {flagged.length>0 && (
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:"20px 22px" }}>
              <div style={{ fontSize:9, color:T.textSub, fontWeight:700, textTransform:"uppercase",
                letterSpacing:".08em", marginBottom:14 }}>Most Flagged</div>
              <div style={{ display:"grid",
                gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(200px,1fr))",
                gap:10 }}>
                {flagged.map((emp)=>{
                  const c=emp.count>=5?T.danger:emp.count>=3?T.warn:T.accent;
                  return(
                    <div key={emp._id} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 14px", background:T.card, borderRadius:10,
                      border:`1px solid ${T.border}` }}>
                      <EmpAvatar name={emp.employeeName} size={32}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T.text,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {emp.employeeName}
                        </div>
                        <div style={{ fontSize:10, color:T.textSub }}>{emp.department}</div>
                      </div>
                      <span style={{ fontSize:13, padding:"2px 9px", borderRadius:20,
                        background:c+"15", color:c, border:`1px solid ${c}35`, fontWeight:700, flexShrink:0 }}>
                        {emp.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SECTION: RULES ══ */}
      {section==="rules" && (
        <div style={{ display:"grid", gridTemplateColumns:rulesCols, gap:16 }}>

          {/* Blocked App Rules */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}`,
              display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Blocked App Rules</div>
                <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>
                  {rules.filter(r=>r.on).length} active · {rules.filter(r=>!r.on).length} disabled
                </div>
              </div>
              <button onClick={()=>setShowAddApp(v=>!v)}
                style={{ ...BTN, borderColor:T.accentBr, background:T.accentBg, color:T.accent, fontWeight:700, fontSize:12 }}>
                + Add App
              </button>
            </div>

            {showAddApp && (
              <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`,
                display:"flex", gap:8, background:T.bg }}>
                <input value={newAppName} onChange={e=>setNewAppName(e.target.value)}
                  placeholder="App name (e.g. Reddit)"
                  onKeyDown={e=>e.key==="Enter"&&addAppRule()}
                  style={{ flex:1, padding:"8px 12px", borderRadius:8,
                    border:`1px solid ${T.border2}`, background:T.card,
                    color:T.text, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none" }}/>
                <button onClick={addAppRule}
                  style={{ ...BTN, borderColor:T.successBr, background:T.successBg, color:T.success, fontWeight:700 }}>
                  Add
                </button>
              </div>
            )}

            {rules.map((r,i)=>(
              <div key={r.id} className="rule-row"
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px",
                  borderBottom:i<rules.length-1?`1px solid ${T.border}`:"none" }}>
                <div style={{ width:36, height:36, borderRadius:10,
                  background:r.on?T.dangerBg:T.border, border:`1px solid ${r.on?T.dangerBr:T.border2}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, flexShrink:0, transition:"all 0.2s", color:r.on?T.danger:T.muted }}>
                  {r.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:r.on?T.text:T.textSub }}>{r.name}</div>
                  <div style={{ fontSize:10, color:T.muted }}>{r.category}</div>
                </div>
                <SevBadge severity={r.severity}/>
                <Toggle on={r.on} onChange={()=>setRules(p=>p.map(x=>x.id===r.id?{...x,on:!x.on}:x))}/>
              </div>
            ))}
          </div>

          {/* Productivity Rules */}
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.text }}>Productivity Rules</div>
              <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>Monitoring thresholds</div>
            </div>

            {prodRules.map((r,i)=>(
              <div key={r.id} className="rule-row"
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"14px 20px", borderBottom:i<prodRules.length-1?`1px solid ${T.border}`:"none" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:r.on?T.text:T.textSub }}>{r.label}</div>
                  <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{r.sub}</div>
                </div>
                <Toggle on={r.on} onChange={()=>setProdRules(p=>p.map(x=>x.id===r.id?{...x,on:!x.on}:x))}/>
              </div>
            ))}

            <div style={{ padding:"14px 20px", borderTop:`1px solid ${T.border}`, background:T.bg }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Screenshot Frequency</div>
                  <div style={{ fontSize:10, color:T.textSub, marginTop:2 }}>How often screenshots are captured</div>
                </div>
                <div style={{ position:"relative", flexShrink:0 }}>
                  <select value={ssInterval} onChange={e=>setSsInterval(e.target.value)} style={SEL}>
                    <option value="10">Every 10s</option>
                    <option value="30">Every 30s</option>
                    <option value="60">Every 1 min</option>
                    <option value="300">Every 5 min</option>
                  </select>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={T.textSub} strokeWidth="2"
                    style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            <div style={{ margin:"14px 20px", padding:"14px", background:T.bg, borderRadius:10, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:9, color:T.muted, fontWeight:700, textTransform:"uppercase",
                letterSpacing:".07em", marginBottom:10 }}>Summary</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  {l:"Apps Blocked",  v:rules.filter(r=>r.on).length,    c:T.danger},
                  {l:"Apps Allowed",  v:rules.filter(r=>!r.on).length,   c:T.success},
                  {l:"Prod Rules On", v:prodRules.filter(r=>r.on).length, c:T.accent},
                  {l:"SS Interval",   v:`${ssInterval}s`,                 c:T.warn},
                ].map(s=>(
                  <div key={s.l} style={{ background:T.card, borderRadius:9, padding:"10px 12px", border:`1px solid ${T.border}` }}>
                    <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:9, color:T.muted, marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  select option { background:#13151f; color:#e8eaf6; }
  input::placeholder { color:rgba(145,150,176,0.4) !important; }
  input:focus { border-color:rgba(129,140,248,0.35) !important; }
  @keyframes spin     { to { transform:rotate(360deg); } }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.35} }
  @keyframes fadeDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:none} }
  .alert-row:hover  { background:rgba(255,255,255,0.018) !important; }
  .rule-row:hover   { background:rgba(255,255,255,0.018) !important; }
  .nav-btn:hover    { background:rgba(255,255,255,0.04) !important; }
  .emp-card:hover   { border-color:#252838 !important; transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,0.5); transition:all 0.2s; }
  .metric-card:hover { border-color:#1c1f2e !important; transform:translateY(-1px); transition:all 0.15s; }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:#0a0b0f; }
  ::-webkit-scrollbar-thumb { background:#1c1f2e; border-radius:4px; }
`;