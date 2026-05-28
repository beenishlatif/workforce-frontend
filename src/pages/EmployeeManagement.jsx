import { useState, useEffect } from "react";
import {
  Users, UserMinus, ClipboardList, CheckCircle2,
  Clock, UserPlus, LayoutList, ChevronRight, RefreshCw, Wifi,
} from "lucide-react";
import API from "../api/axios.js";
import AddEmployee from "./AddEmployee";
import EmployeeList from "./EmployeeList";

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

/* ── STAT CONFIG ── */
const STAT_CONFIG = [
  { id:"total",     label:"Total Employees",  key:"totalEmployees",  fallbackKey:null,              icon:Users,        color:"#93b4f8", bg:"rgba(147,180,248,0.08)", bar:"linear-gradient(90deg,#93b4f8,#bfcffd)" },
  { id:"active",    label:"Online Now",        key:"onlineEmployees", fallbackKey:"activeEmployees", icon:Wifi,         color:"#6ee7b7", bg:"rgba(110,231,183,0.08)", bar:"linear-gradient(90deg,#6ee7b7,#a7f3d0)" },
  { id:"leave",     label:"On Leave",          key:"onLeave",         fallbackKey:null,              icon:UserMinus,    color:"#fcd34d", bg:"rgba(252,211,77,0.08)",  bar:"linear-gradient(90deg,#fcd34d,#fde68a)" },
  { id:"tasks",     label:"Total Tasks",       key:"totalTasks",      fallbackKey:null,              icon:ClipboardList,color:"#c4b5fd", bg:"rgba(196,181,253,0.08)", bar:"linear-gradient(90deg,#c4b5fd,#ddd6fe)" },
  { id:"completed", label:"Completed Tasks",   key:"completedTasks",  fallbackKey:null,              icon:CheckCircle2, color:"#67e8f9", bg:"rgba(103,232,249,0.08)", bar:"linear-gradient(90deg,#67e8f9,#a5f3fc)" },
  { id:"pending",   label:"Pending Tasks",     key:"pendingTasks",    fallbackKey:null,              icon:Clock,        color:"#fca5a5", bg:"rgba(252,165,165,0.08)", bar:"linear-gradient(90deg,#fca5a5,#fecaca)" },
];

const navCards = [
  { id:"add-employee",  title:"Add Employee",  subKey:"registeredLabel",  icon:UserPlus,   gradient:"linear-gradient(135deg,rgba(147,180,248,0.15),rgba(191,207,253,0.08))", iconColor:"#93b4f8", accent:"#93b4f8" },
  { id:"employee-list", title:"Employee List", subKey:"activeLeaveLabel", icon:LayoutList, gradient:"linear-gradient(135deg,rgba(110,231,183,0.15),rgba(167,243,208,0.08))", iconColor:"#6ee7b7", accent:"#6ee7b7" },
];

/* ── Animated Number ── */
function AnimatedNumber({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target && target !== 0) return;
    let start = 0;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{val}</span>;
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div style={{ ...s.statCard, gap:8 }}>
      <div style={{ height:2, borderRadius:2, background:"rgba(255,255,255,0.05)" }}/>
      <div style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,0.05)", animation:"shimmer 1.5s ease infinite" }}/>
      <div style={{ width:"50%", height:22, borderRadius:6, background:"rgba(255,255,255,0.05)", animation:"shimmer 1.5s ease infinite" }}/>
      <div style={{ width:"75%", height:11, borderRadius:4, background:"rgba(255,255,255,0.04)", animation:"shimmer 1.5s ease infinite" }}/>
    </div>
  );
}

/* ── Section Divider ── */
function SectionDivider({ label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
      <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.14em", textTransform:"uppercase", color:"#374151", whiteSpace:"nowrap" }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.05)" }}/>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function EmployeeDashboard() {
  const width     = useWindowWidth();
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredNav,  setHoveredNav]  = useState(null);
  const [activePage,  setActivePage]  = useState("add-employee");
  const [mounted,     setMounted]     = useState(false);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [lastUpdated,   setLastUpdated]   = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true); setError(null);
      const [statsRes, empRes] = await Promise.all([
        API.get("/dashboard/stats"),
        API.get("/employees/activity").catch(() => null),
      ]);
      const data = statsRes.data;
      if (empRes?.data) {
        const empData  = empRes.data;
        const employees = Array.isArray(empData) ? empData : empData.employees || empData.data || [];
        data.onlineEmployees = employees.filter(e => e.status && e.status.toLowerCase() !== "offline").length;
      }
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const stats = STAT_CONFIG.map(cfg => {
    let value = 0;
    if (dashboardData) {
      const primary  = dashboardData[cfg.key];
      const fallback = cfg.fallbackKey ? dashboardData[cfg.fallbackKey] : undefined;
      value = primary ?? fallback ?? 0;
    }
    return { ...cfg, value };
  });

  const onlineCount = dashboardData ? (dashboardData.onlineEmployees ?? dashboardData.activeEmployees ?? 0) : 0;
  const totalCount  = dashboardData?.totalEmployees ?? 0;

  const headerPills = dashboardData?.headerStats
    ? [`${dashboardData.headerStats.total} Total`, `${dashboardData.headerStats.active} Active`, `${dashboardData.headerStats.pending} Pending`]
    : ["-- Total", "-- Active", "-- Pending"];

  const headerSub = dashboardData
    ? `${dashboardData.totalEmployees} registered · ${onlineCount} online · ${dashboardData.totalTasks} tasks`
    : "Loading...";

  /* ── Responsive grid columns ── */
  const statsColumns =
    isMobile  ? "repeat(2, 1fr)" :
    isTablet  ? "repeat(3, 1fr)" :
                "repeat(6, 1fr)";

  const navColumns = isMobile ? "1fr" : "repeat(2, 1fr)";

  const mainPadding = isMobile ? "16px 14px" : isTablet ? "22px 20px" : "26px 28px";
  const headerPadding = isMobile ? "0 14px" : "0 28px";

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .stat-card { animation: fadeUp 0.4s ease both; }
        .nav-card  { animation: fadeUp 0.4s ease both; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={s.gridBg}/>
      <div style={{ ...s.orb, top:-60,   left:"25%", width:520, height:320, background:"radial-gradient(ellipse,rgba(147,180,248,0.07) 0%,transparent 70%)" }}/>
      <div style={{ ...s.orb, bottom:0,  right:"15%",width:400, height:280, background:"radial-gradient(ellipse,rgba(110,231,183,0.05) 0%,transparent 70%)" }}/>
      <div style={{ ...s.orb, top:"40%", left:"60%", width:300, height:300, background:"radial-gradient(ellipse,rgba(196,181,253,0.04) 0%,transparent 70%)" }}/>

      {/* ── HEADER ── */}
      <header style={{ ...s.header, padding:headerPadding }}>
        <div style={s.headerLeft}>
          <div style={s.headerIconWrap}>
            <Users size={15} color="#93b4f8"/>
          </div>
          <div>
            <div style={{ ...s.logo, fontSize: isMobile ? 13 : 15 }}>
              {isMobile ? "Employees" : "Employee Management"}
            </div>
            {!isMobile && <div style={s.headerSub}>{headerSub}</div>}
          </div>
        </div>

        <div style={{ ...s.headerRight, gap: isMobile ? 6 : 8 }}>
          {/* Pills — desktop only */}
          {!isMobile && headerPills.map((t, i) => (
            <span key={i} style={s.pill}>{t}</span>
          ))}

          <button onClick={fetchDashboardData} disabled={loading}
            style={s.refreshBtn} title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : "Refresh"}>
            <RefreshCw size={12} color="#4b5a70"
              style={{ animation: loading ? "spin 1s linear infinite" : "none" }}/>
          </button>

          <div style={{ ...s.liveBadge, padding: isMobile ? "3px 8px" : "3px 10px" }}>
            <span style={{ ...s.liveDot,
              background: error ? "#fca5a5" : "#6ee7b7",
              boxShadow: error ? "0 0 7px #fca5a5" : "0 0 7px #6ee7b7" }}/>
            {error ? "Error" : loading ? "Sync" : "Live"}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ ...s.main, padding:mainPadding, opacity:mounted?1:0, transition:"opacity 0.4s ease" }}>

        {/* Mobile: header sub info */}
        {isMobile && (
          <div style={{ fontSize:11, color:"#374151", marginBottom:14, lineHeight:1.5 }}>
            {headerSub}
          </div>
        )}

        {error && (
          <div style={s.errorBanner}>
            <span style={{ fontSize:12, color:"#fca5a5" }}>⚠ Data load nahi hua: {error}</span>
            <button onClick={fetchDashboardData} style={s.retryBtn}>Retry</button>
          </div>
        )}

        <SectionDivider label="Overview"/>

        {/* ── STATS GRID ── */}
        <div style={{ display:"grid", gridTemplateColumns:statsColumns, gap: isMobile ? 9 : 11, marginBottom:28 }}>
          {loading && !dashboardData
            ? STAT_CONFIG.map((_, i) => <SkeletonCard key={i}/>)
            : stats.map((stat, i) => {
                const Icon = stat.icon;
                const hov  = hoveredStat === stat.id;
                const isOnlineCard = stat.id === "active";
                return (
                  <div key={stat.id} className="stat-card"
                    style={{
                      ...s.statCard,
                      animationDelay:`${i * 55}ms`,
                      borderColor: hov ? stat.color+"45" : "rgba(255,255,255,0.055)",
                      boxShadow:   hov ? `0 6px 28px rgba(0,0,0,0.28),0 0 0 1px ${stat.color}18` : "none",
                      transform:   hov ? "translateY(-3px)" : "translateY(0)",
                      transition:  "all 0.22s ease",
                      padding:     isMobile ? "11px 12px" : "13px 14px",
                    }}
                    onMouseEnter={() => setHoveredStat(stat.id)}
                    onMouseLeave={() => setHoveredStat(null)}>
                    <div style={{ ...s.stripe, background:stat.bar, opacity:hov?1:0.55 }}/>
                    <div style={{ position:"absolute", top:-10, right:-10, width:60, height:60, borderRadius:"50%", background:stat.bg, filter:"blur(14px)", pointerEvents:"none" }}/>
                    <div style={{ ...s.statIconBox, background:stat.bg }}>
                      <Icon size={isMobile ? 12 : 14} color={stat.color}/>
                    </div>
                    <div style={{ ...s.statVal, fontSize: isMobile ? 18 : 22 }}>
                      <AnimatedNumber target={stat.value}/>
                    </div>
                    <div style={{ ...s.statLabel, fontSize: isMobile ? 9.5 : 10.5 }}>{stat.label}</div>
                    {isOnlineCard && dashboardData && (
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:-2 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:"#6ee7b7", boxShadow:"0 0 6px #6ee7b7", display:"inline-block", animation:"pulse-dot 2s ease infinite", flexShrink:0 }}/>
                        <span style={{ fontSize:9.5, color:"#2e3a4e" }}>of {totalCount} total</span>
                      </div>
                    )}
                  </div>
                );
              })
          }
        </div>

        <SectionDivider label="Management"/>

        {/* ── NAV CARDS ── */}
        <div style={{ display:"grid", gridTemplateColumns:navColumns, gap: isMobile ? 10 : 12 }}>
          {navCards.map((card, i) => {
            const Icon   = card.icon;
            const hov    = hoveredNav === card.id;
            const active = activePage === card.id;
            const subText = dashboardData?.[card.subKey] ?? "Loading...";
            return (
              <div key={card.id} className="nav-card"
                onClick={() => setActivePage(card.id)}
                style={{
                  ...s.navCard,
                  animationDelay:`${i * 70 + 200}ms`,
                  borderColor: active ? card.accent+"50" : hov ? card.accent+"30" : "rgba(255,255,255,0.055)",
                  boxShadow:   active ? `0 0 0 1px ${card.accent}20,0 8px 32px rgba(0,0,0,0.32)` : hov ? "0 4px 20px rgba(0,0,0,0.25)" : "none",
                  transform:   hov && !active ? "translateY(-2px)" : "translateY(0)",
                  transition:  "all 0.22s ease",
                  cursor:      "pointer",
                  padding:     isMobile ? "13px 14px" : "15px 17px",
                }}
                onMouseEnter={() => setHoveredNav(card.id)}
                onMouseLeave={() => setHoveredNav(null)}>

                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:card.accent, borderTopLeftRadius:14, borderTopRightRadius:14, opacity:active?0.9:hov?0.45:0.18, transition:"opacity 0.22s ease" }}/>
                {active && <div style={{ position:"absolute", inset:0, background:card.gradient, borderRadius:14, opacity:0.6, pointerEvents:"none" }}/>}

                <div style={{ position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"center", width:"100%" }}>
                  <div style={s.navLeft}>
                    <div style={{ ...s.navIconBox, background:card.gradient, border:`1px solid ${card.accent}22`,
                      width: isMobile ? 34 : 40, height: isMobile ? 34 : 40 }}>
                      <Icon size={isMobile ? 14 : 17} color={card.iconColor}/>
                    </div>
                    <div>
                      <div style={{ ...s.navTitle, color:active?card.iconColor:"#dde3f0", fontSize: isMobile ? 12 : 13 }}>{card.title}</div>
                      <div style={s.navSub}>{subText}</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color={active?card.accent:"#374151"}
                    style={{ transform:hov?"translateX(3px)":"translateX(0)", transition:"transform 0.2s ease" }}/>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: isMobile ? 20 : 26 }}>
          {activePage === "add-employee"  && <AddEmployee/>}
          {activePage === "employee-list" && <EmployeeList/>}
        </div>
      </main>
    </div>
  );
}

/* ── STYLES ── */
const s = {
  root: {
    fontFamily:"'DM Sans', sans-serif",
    background:"#0c1017",
    minHeight:"100vh",
    color:"#dde3f0",
    position:"relative",
    overflow:"hidden",
  },
  gridBg: {
    position:"fixed", inset:0, pointerEvents:"none",
    backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
    backgroundSize:"52px 52px",
  },
  orb: { position:"fixed", borderRadius:"50%", filter:"blur(70px)", pointerEvents:"none" },
  header: {
    height:60,
    display:"flex", alignItems:"center", justifyContent:"space-between",
    borderBottom:"1px solid rgba(255,255,255,0.055)",
    background:"rgba(12,16,23,0.85)",
    backdropFilter:"blur(14px)",
    position:"sticky", top:0, zIndex:50,
  },
  headerLeft:    { display:"flex", alignItems:"center", gap:11 },
  headerIconWrap: {
    width:34, height:34, borderRadius:9, flexShrink:0,
    background:"rgba(147,180,248,0.1)",
    border:"1px solid rgba(147,180,248,0.18)",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  logo:        { fontSize:15, fontWeight:700, color:"#e8edf8", letterSpacing:"-0.02em" },
  headerSub:   { fontSize:11, color:"#2e3a4e", marginTop:1 },
  headerRight: { display:"flex", alignItems:"center" },
  pill: {
    fontSize:11, fontWeight:500,
    padding:"3px 10px", borderRadius:20,
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.07)",
    color:"#4b5a70",
  },
  refreshBtn: {
    width:28, height:28, borderRadius:8,
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.07)",
    display:"flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer",
  },
  liveBadge: {
    display:"flex", alignItems:"center", gap:5,
    fontSize:11, fontWeight:600,
    color:"#6ee7b7",
    background:"rgba(110,231,183,0.07)",
    border:"1px solid rgba(110,231,183,0.14)",
    borderRadius:20,
  },
  liveDot: {
    display:"inline-block", width:6, height:6, borderRadius:"50%",
    animation:"pulse-dot 2s ease infinite",
  },
  errorBanner: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    background:"rgba(252,165,165,0.08)",
    border:"1px solid rgba(252,165,165,0.2)",
    borderRadius:10, padding:"10px 16px", marginBottom:18,
  },
  retryBtn: {
    fontSize:11, fontWeight:600,
    color:"#fca5a5", background:"rgba(252,165,165,0.1)",
    border:"1px solid rgba(252,165,165,0.2)",
    borderRadius:8, padding:"4px 12px", cursor:"pointer",
  },
  main:    { position:"relative", zIndex:1 },
  statCard: {
    background:"rgba(255,255,255,0.028)",
    borderRadius:12,
    border:"1px solid rgba(255,255,255,0.055)",
    position:"relative", overflow:"hidden",
    display:"flex", flexDirection:"column", gap:8,
  },
  stripe:     { height:2, borderRadius:2, transition:"opacity 0.22s ease" },
  statIconBox: {
    width:30, height:30, borderRadius:8,
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  statVal:   { fontSize:22, fontWeight:700, color:"#eef1f9", letterSpacing:"-0.03em", lineHeight:1 },
  statLabel: { fontSize:10.5, color:"#3a4556", lineHeight:1.35 },
  navCard: {
    background:"rgba(255,255,255,0.028)", borderRadius:14,
    border:"1px solid rgba(255,255,255,0.055)",
    display:"flex", alignItems:"center",
    position:"relative", overflow:"hidden",
  },
  navLeft:   { display:"flex", alignItems:"center", gap:11 },
  navIconBox: {
    width:40, height:40, borderRadius:10,
    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
  },
  navTitle: { fontSize:13, fontWeight:600, letterSpacing:"-0.01em" },
  navSub:   { fontSize:11, color:"#2e3a4e", marginTop:2 },
};