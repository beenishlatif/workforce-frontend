import { useState, useEffect, useCallback } from "react";
import {
  Users, Clock, Wifi, WifiOff,
  BarChart2, Zap, Bell, RefreshCw,
  Award, AlertTriangle, CheckCircle, Coffee,
} from "lucide-react";
import { io as socketIO } from "socket.io-client";
import API from "../api/axios.js";

const SOCKET_URL = "https://workforce-backend-production-cc13.up.railway.app";

function fmtMins(m) {
  const n = Number(m);
  if (!n || n <= 0 || isNaN(n)) return null;
  const h = Math.floor(n / 60), min = n % 60;
  return h === 0 ? `${min}m` : min === 0 ? `${h}h` : `${h}h ${min}m`;
}
function isOn(s) { return s && s !== "Offline"; }

const APP_COLORS = {
  "Chrome":"#4285f4","Firefox":"#ff7139","VS Code":"#007acc","Figma":"#f24e1e",
  "Slack":"#e01e5a","Discord":"#5865f2","Zoom":"#2d8cff","Teams":"#6264a7",
  "Notion":"#aaaaaa","GitHub":"#8b949e","Postman":"#ff6c37","Excel":"#217346",
};
const PAL = ["#f43f5e","#fb923c","#facc15","#4ade80","#22d3ee","#818cf8","#e879f9","#f472b6"];
function appColor(n) {
  if (!n) return "#818cf8";
  if (APP_COLORS[n]) return APP_COLORS[n];
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % PAL.length;
  return PAL[h];
}
function getAppIcon(name) {
  const n = (name || "").toLowerCase();
  const map = {
    "chrome":"https://www.google.com/favicon.ico","google chrome":"https://www.google.com/favicon.ico",
    "firefox":"https://www.mozilla.org/favicon.ico","vs code":"https://code.visualstudio.com/favicon.ico",
    "visual studio code":"https://code.visualstudio.com/favicon.ico","figma":"https://www.figma.com/favicon.ico",
    "slack":"https://slack.com/favicon.ico","discord":"https://discord.com/favicon.ico",
    "zoom":"https://zoom.us/favicon.ico","notion":"https://www.notion.so/favicon.ico",
    "github":"https://github.com/favicon.ico","postman":"https://www.postman.com/favicon.ico",
  };
  for (const key of Object.keys(map)) { if (n.includes(key)) return map[key]; }
  return null;
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

function AppIcon({ name, size = 18 }) {
  const [fail, setFail] = useState(false);
  const url = getAppIcon(name);
  const color = appColor(name);
  if (url && !fail) return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, overflow:"hidden", flexShrink:0,
      background:color+"15", border:`1px solid ${color}28`,
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <img src={url} alt={name} style={{ width:size*0.6, height:size*0.6, objectFit:"contain" }}
        onError={() => setFail(true)}/>
    </div>
  );
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, background:color+"18",
      border:`1px solid ${color}30`, display:"flex", alignItems:"center",
      justifyContent:"center", fontSize:size*0.42, fontWeight:700, color, flexShrink:0 }}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}

function Avatar({ initials, size = 32, status }) {
  const grs = [
    "linear-gradient(135deg,#6366f1,#4338ca)","linear-gradient(135deg,#10b981,#065f46)",
    "linear-gradient(135deg,#f59e0b,#92400e)","linear-gradient(135deg,#ef4444,#7f1d1d)",
    "linear-gradient(135deg,#8b5cf6,#4c1d95)","linear-gradient(135deg,#06b6d4,#164e63)",
  ];
  const idx = (initials?.charCodeAt(0) || 0) % grs.length;
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:"50%", background:grs[idx],
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:size*0.34, fontWeight:700, color:"#fff",
        border: isOn(status) ? "1.5px solid rgba(74,222,128,0.3)" : "1.5px solid #1e1e22" }}>
        {initials || "?"}
      </div>
      <span style={{ position:"absolute", bottom:0, right:0,
        width:size*0.26, height:size*0.26, borderRadius:"50%",
        background: isOn(status) ? "#4ade80" : "#3f3f46",
        border:"1.5px solid #0d0d10",
        animation: isOn(status) ? "sPulse 2s infinite" : "none" }}/>
    </div>
  );
}

function MiniBar({ pct, color = "#818cf8", height = 3 }) {
  return (
    <div style={{ height, background:"#1a1a1e", borderRadius:4, overflow:"hidden", flex:1 }}>
      <div style={{ height:"100%", width:`${Math.min(pct||0,100)}%`,
        background:`linear-gradient(90deg,${color}66,${color})`,
        borderRadius:4, transition:"width .9s cubic-bezier(0.4,0,0.2,1)" }}/>
    </div>
  );
}

function SparkLine({ data = [], color = "#818cf8", height = 30 }) {
  if (data.length < 2) return <div style={{ height }}/>;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ height, width:"100%", display:"block" }}>
      <defs>
        <linearGradient id={`sg${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${pts} 100,100`} fill={`url(#sg${color.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
        style={{ filter:`drop-shadow(0 0 2px ${color}55)` }}/>
    </svg>
  );
}

function DonutChart({ data = [], size = 120, label = "" }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let offset = 0;
  const r = (size / 2) - 11;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a1e" strokeWidth={9}/>
        {data.map((d, i) => {
          const pct = d.value / total;
          const dash = circ * pct;
          const seg = (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={d.color} strokeWidth={9} strokeLinecap="round"
              strokeDasharray={`${dash - 1.5} ${circ - dash + 1.5}`}
              strokeDashoffset={-(circ * offset)}
              style={{ filter:`drop-shadow(0 0 6px ${d.color}66)` }}/>
          );
          offset += pct;
          return seg;
        })}
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:size*0.21, fontWeight:700, color:"#fff",
          fontFamily:"'DM Mono',monospace", lineHeight:1 }}>{label}</div>
        <div style={{ fontSize:size*0.09, color:"#3f3f46", textTransform:"uppercase",
          letterSpacing:"0.08em", marginTop:2 }}>online</div>
      </div>
    </div>
  );
}

function HBarChart({ data = [] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {data.map((d, i) => (
        <div key={i}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <AppIcon name={d.name} size={16}/>
              <span style={{ fontSize:11, color:"#a1a1aa", fontWeight:500 }}>{d.name}</span>
            </div>
            <span style={{ fontSize:10, color:appColor(d.name), fontFamily:"'DM Mono',monospace", fontWeight:600 }}>
              {d.label}
            </span>
          </div>
          <div style={{ height:3, background:"#0d0d10", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${(d.value / max) * 100}%`,
              background:`linear-gradient(90deg,${appColor(d.name)}44,${appColor(d.name)})`,
              borderRadius:4, transition:"width 1.3s cubic-bezier(0.4,0,0.2,1)" }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityHeatmap({ data = [] }) {
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = Array.from({length:12}, (_,i) => i*2);
  const max   = Math.max(...data.map(d => d.value || 0), 1);
  const lookup = {};
  data.forEach(d => { if (d.day != null && d.hour != null) lookup[`${d.day}-${d.hour}`] = d.value || 0; });
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ minWidth:320 }}>
        <div style={{ display:"flex", gap:3, marginBottom:5, paddingLeft:30 }}>
          {hours.map(h => (
            <div key={h} style={{ flex:1, fontSize:8, color:"#2a2a2e",
              textAlign:"center", fontFamily:"'DM Mono',monospace" }}>
              {String(h).padStart(2,"0")}
            </div>
          ))}
        </div>
        {days.map((day, di) => (
          <div key={di} style={{ display:"flex", alignItems:"center", gap:3, marginBottom:2 }}>
            <div style={{ width:26, flexShrink:0, fontSize:8.5, color:"#2a2a2e",
              textAlign:"right", paddingRight:5, fontFamily:"'DM Mono',monospace" }}>{day}</div>
            {hours.map(h => {
              const v = lookup[`${di}-${h}`] || 0;
              const pct = v / max;
              const color = pct > 0.7 ? "#4ade80" : pct > 0.4 ? "#fbbf24" : pct > 0.1 ? "#818cf8" : "#1a1a1e";
              return (
                <div key={h} title={`${day} ${h}:00 — ${Math.round(pct*100)}%`}
                  style={{ flex:1, height:16, borderRadius:3,
                    background: v > 0 ? color : "#0d0d10",
                    opacity: v > 0 ? 0.25 + pct * 0.75 : 1,
                    transition:"all .2s" }}/>
              );
            })}
          </div>
        ))}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10, paddingLeft:30 }}>
          <span style={{ fontSize:8, color:"#2a2a2e" }}>Less</span>
          {["#0d0d10","#818cf844","#fbbf2466","#4ade8077"].map((c,i) => (
            <div key={i} style={{ width:10, height:10, borderRadius:2, background:c }}/>
          ))}
          <span style={{ fontSize:8, color:"#2a2a2e" }}>More</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, sparkData, loading, badge }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#131316" : "#0e0e11",
        border:`1px solid ${hov ? color+"30" : "#161619"}`,
        borderRadius:12, padding:"13px 15px",
        position:"relative", overflow:"hidden",
        transition:"all .18s ease",
        transform: hov ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hov ? `0 6px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color}10` : "0 1px 3px rgba(0,0,0,0.3)",
      }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px",
        background:`linear-gradient(90deg,transparent,${color}44,transparent)`,
        opacity: hov ? 1 : 0.4, transition:"opacity .2s" }}/>
      <div style={{ position:"absolute", top:-24, right:-24, width:70, height:70,
        borderRadius:"50%", background:color+"08", filter:"blur(16px)", pointerEvents:"none" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
        <div style={{ width:30, height:30, borderRadius:9, background:color+"12",
          border:`1px solid ${color}1e`, display:"flex", alignItems:"center",
          justifyContent:"center", color }}>
          {icon}
        </div>
        {badge && (
          <span style={{ fontSize:8.5, fontWeight:700, color, background:color+"0e",
            border:`1px solid ${color}1a`, padding:"2px 6px", borderRadius:4,
            letterSpacing:"0.04em" }}>{badge}</span>
        )}
      </div>
      <div style={{ fontSize:8, color:"#2e2e35", textTransform:"uppercase",
        letterSpacing:"0.13em", fontWeight:700, marginBottom:3 }}>{label}</div>
      {loading
        ? <div style={{ height:24, background:"#1a1a1e", borderRadius:5,
            animation:"pulse 1.5s ease infinite", marginBottom:3 }}/>
        : <div style={{ fontSize:24, fontWeight:700, color:"#efefef", lineHeight:1,
            fontFamily:"'DM Mono',monospace", letterSpacing:"-0.02em", marginBottom:3 }}>{value}</div>
      }
      {sub && <div style={{ fontSize:9, color:"#2a2a30", lineHeight:1.4 }}>{sub}</div>}
      {sparkData && (
        <div style={{ marginTop:9, opacity: hov ? 0.85 : 0.45, transition:"opacity .2s" }}>
          <SparkLine data={sparkData} color={color} height={26}/>
        </div>
      )}
    </div>
  );
}

function AlertsPanel({ alerts = [], loading }) {
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height:46, background:"#0d0d10", borderRadius:9,
          animation:"pulse 1.5s ease infinite" }}/>
      ))}
    </div>
  );
  if (!alerts.length) return (
    <div style={{ textAlign:"center", padding:"28px 0" }}>
      <CheckCircle size={22} color="#1e1e22" style={{ display:"block", margin:"0 auto 8px" }}/>
      <div style={{ fontSize:11, color:"#3a3a3e" }}>No active alerts</div>
    </div>
  );
  const iconMap = { low_activity:<Coffee size={11}/>, offline:<WifiOff size={11}/>, high_usage:<Zap size={11}/> };
  const colorMap = { low_activity:"#fbbf24", offline:"#f87171", high_usage:"#818cf8" };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {alerts.slice(0,5).map((a, i) => {
        const c = colorMap[a.type] || "#818cf8";
        return (
          <div key={i} style={{ padding:"9px 11px", borderRadius:10,
            background:`${c}07`, border:`1px solid ${c}18`,
            display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:26, height:26, borderRadius:8, background:`${c}12`,
              border:`1px solid ${c}20`, display:"flex", alignItems:"center",
              justifyContent:"center", color:c, flexShrink:0 }}>
              {iconMap[a.type] || <AlertTriangle size={11}/>}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#ddd",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {a.employee || a.message || "Alert"}
              </div>
              <div style={{ fontSize:9.5, color:"#3a3a3e", marginTop:1 }}>
                {a.detail || a.type || ""}
              </div>
            </div>
            <span style={{ fontSize:8.5, color:c, fontWeight:600, flexShrink:0 }}>
              {a.time || ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TopPerformers({ employees, loading }) {
  const sorted = [...employees].sort((a,b) => (b.activityPct||0) - (a.activityPct||0)).slice(0,5);
  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{ height:40, background:"#0d0d10", borderRadius:9,
          animation:"pulse 1.5s ease infinite" }}/>
      ))}
    </div>
  );
  if (!sorted.length) return (
    <div style={{ textAlign:"center", padding:"24px 0", color:"#3a3a3e", fontSize:11 }}>
      No employee data
    </div>
  );
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {sorted.map((emp, i) => {
        const pct = emp.activityPct || 0;
        const color = pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171";
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
        const inits = (emp.firstName?.[0]||"") + (emp.lastName?.[0]||"");
        return (
          <div key={emp._id||i} style={{ display:"flex", alignItems:"center", gap:9,
            padding:"8px 10px", borderRadius:10, background:"#0d0d10",
            border:"1px solid #141416" }}>
            <div style={{ width:18, textAlign:"center", flexShrink:0, fontSize:11 }}>
              {medal || <span style={{ fontSize:9, color:"#2e2e32",
                fontFamily:"'DM Mono',monospace" }}>#{i+1}</span>}
            </div>
            <Avatar initials={inits} size={28} status={emp.status}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:11.5, fontWeight:600, color:"#e0e0e0",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {emp.firstName} {emp.lastName}
              </div>
              <div style={{ fontSize:9, color:"#3a3a3e", marginTop:1 }}>{emp.role||"—"}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3 }}>
              <span style={{ fontSize:12, fontWeight:700, color,
                fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
              <div style={{ width:60 }}>
                <MiniBar pct={pct} color={color} height={3}/>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const Divider = ({ label, right }) => (
  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:11 }}>
    <span style={{ fontSize:9, fontWeight:700, color:"#252529",
      textTransform:"uppercase", letterSpacing:"0.14em", whiteSpace:"nowrap" }}>{label}</span>
    <div style={{ flex:1, height:"1px", background:"#111114" }}/>
    {right && <span style={{ fontSize:9, color:"#252529", whiteSpace:"nowrap" }}>{right}</span>}
  </div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:"#0e0e11", border:"1px solid #161619",
    borderRadius:13, padding:"15px 16px", ...style }}>
    {children}
  </div>
);

const CardHead = ({ title, sub, right }) => (
  <div style={{ marginBottom:11 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:11.5, fontWeight:600, color:"#cccccc" }}>{title}</span>
      {right}
    </div>
    {sub && <div style={{ fontSize:9.5, color:"#252529", marginTop:3 }}>{sub}</div>}
  </div>
);

export default function EmployeeDashboard({ onSelectEmployee }) {
  const width = useWindowWidth();
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  const [employees,    setEmployees]    = useState([]);
  const [dashData,     setDashData]     = useState(null);
  const [alerts,       setAlerts]       = useState([]);
  const [burnoutData,  setBurnoutData]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const sock = socketIO(SOCKET_URL, { transports:["websocket"] });
    sock.emit("join", "admins");
    sock.on("employee:update", data => {
      setEmployees(prev => prev.map(emp => {
        if (emp._id?.toString() !== data.employeeId?.toString()) return emp;
        return {
          ...emp,
          status:          data.status          ?? emp.status,
          currentApp:      data.currentApp      || data.app      || emp.currentApp,
          currentActivity: data.currentActivity || data.activity || emp.currentActivity,
          activityPct:     data.activityPct     ?? data.activity_pct ?? emp.activityPct,
          activeMinsToday: data.activeMinsToday ?? data.activeMinutes ?? emp.activeMinsToday,
          lastSeen:        data.lastSeen        ?? emp.lastSeen,
        };
      }));
    });
    return () => sock.disconnect();
  }, []);

  // ✅ fetch ki jagah API use ho raha hai
  const fetchAll = useCallback(async () => {
    setIsRefreshing(true); setLoading(true);
    try {
      const [empR, dashR, alertR, burnoutR] = await Promise.allSettled([
        API.get("/employees/activity"),
        API.get("/dashboard"),
        API.get("/alerts"),
        API.get("/burnout/analysis"),
      ]);
      if (empR.status === "fulfilled") {
        const d = empR.value.data;
        setEmployees(Array.isArray(d) ? d : d.employees || d.data || []);
      }
      if (dashR.status === "fulfilled") {
        const d = dashR.value.data;
        setDashData(d.data || d);
      }
      if (alertR.status === "fulfilled") {
        const d = alertR.value.data;
        setAlerts(Array.isArray(d) ? d : d.alerts || d.data || []);
      }
      if (burnoutR.status === "fulfilled") {
        const d = burnoutR.value.data;
        setBurnoutData(Array.isArray(d) ? d : d.data || []);
      }
      setLastRefresh(new Date());
    } catch(e) { console.error(e); }
    finally { setLoading(false); setIsRefreshing(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const id = setInterval(fetchAll, 30000); return () => clearInterval(id); }, [fetchAll]);

  const onlineEmps  = employees.filter(e => isOn(e.status));
  const offlineEmps = employees.filter(e => !isOn(e.status));
  const avgActivity = employees.length
    ? Math.round(employees.reduce((a, e) => a + (e.activityPct || 0), 0) / employees.length) : 0;
  const totalMins = employees.reduce((a, e) => a + (e.activeMinsToday || 0), 0);
  const onlinePct = employees.length ? Math.round(onlineEmps.length / employees.length * 100) : 0;

  const appCounts = {};
  employees.forEach(e => (e.apps || []).forEach(a => { appCounts[a] = (appCounts[a] || 0) + 1; }));
  const topApps = Object.entries(appCounts).sort((a,b) => b[1]-a[1]).slice(0,6)
    .map(([name, count]) => ({ name, value: count, label: `${count} users` }));

  const deptMap = {};
  employees.forEach(e => {
    const d = e.department || "Other";
    if (!deptMap[d]) deptMap[d] = { total:0, online:0, pct:0 };
    deptMap[d].total++;
    if (isOn(e.status)) deptMap[d].online++;
    deptMap[d].pct += e.activityPct || 0;
  });
  const deptData = Object.entries(deptMap).map(([name, v]) => ({
    name, total:v.total, online:v.online, pct:Math.round(v.pct/v.total), color:appColor(name),
  }));

  const donutData = [
    { value:onlineEmps.length,  color:"#4ade80" },
    { value:offlineEmps.length, color:"#f87171" },
  ].filter(d => d.value > 0);

  const activityTrend = dashData?.activityTrend ||
    Array.from({length:14}, (_,i) => 40 + Math.sin(i*0.5)*20 + Math.random()*15);

  const heatmapData = Array.from({length:7*12}, (_, i) => ({
    day: Math.floor(i/12), hour: (i%12)*2,
    value: Math.random() > 0.3 ? Math.floor(Math.random()*100) : 0,
  }));

  // ── Responsive grid columns ──
  const statCols = isMobile ? "1fr 1fr" : isTablet ? "repeat(2,1fr)" : "repeat(4,1fr)";
  const middleCols = isMobile ? "1fr" : isTablet ? "1fr 1fr" : "190px 1fr 230px";
  const bottomCols = isMobile ? "1fr" : "1fr 290px";
  const burnoutCols = isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(280px,1fr))";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#ffffff", padding: isMobile ? "12px" : "0" }}>
      <style>{CSS}</style>

      {/* ══ HEADER ══ */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20,
        flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:10,
            background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.08))",
            border:"1px solid rgba(99,102,241,0.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 14px rgba(99,102,241,0.1)" }}>
            <BarChart2 size={15} color="#818cf8"/>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#efefef",
              letterSpacing:"-0.04em", lineHeight:1,
              background:"linear-gradient(90deg,#c7c7d4,#818cf8)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              WorkTrack
            </div>
            <div style={{ fontSize:9, color:"#252529", marginTop:2,
              letterSpacing:"0.12em", textTransform:"uppercase", fontWeight:600 }}>
              Live Monitor
            </div>
          </div>
        </div>

        {!isMobile && <div style={{ flex:1, height:1,
          background:"linear-gradient(90deg,#1a1a1e,transparent)", marginLeft:4 }}/>}

        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap",
          width: isMobile ? "100%" : "auto" }}>
          <div style={{ fontSize:9.5, color:"#252529",
            padding:"4px 9px", borderRadius:6,
            background:"#0d0d10", border:"1px solid #161619" }}>
            {employees.length} employees · {onlinePct}% online
          </div>
          {alerts.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:9.5, color:"#f87171",
              background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.14)",
              padding:"4px 9px", borderRadius:6, fontWeight:600 }}>
              <Bell size={9} color="#f87171"/>
              {alerts.length} alert{alerts.length > 1 ? "s" : ""}
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:9.5, color:"#4ade80",
            background:"rgba(74,222,128,0.05)", border:"1px solid rgba(74,222,128,0.12)",
            padding:"4px 9px", borderRadius:6, fontWeight:600, letterSpacing:"0.04em" }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80",
              boxShadow:"0 0 5px #4ade80", animation:"sPulse 2s infinite" }}/>
            {lastRefresh.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
          </div>
          <button onClick={fetchAll}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px",
              borderRadius:7, border:"1px solid #1a1a1e", background:"#0e0e11",
              color:"#3a3a42", fontSize:10, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
            <RefreshCw size={9} style={{ animation:isRefreshing ? "spin .7s linear infinite" : "none" }}/>
            Refresh
          </button>
        </div>
      </div>

      {/* ══ OVERVIEW ══ */}
      <Divider label="Overview" right={`${onlineEmps.length} of ${employees.length} online`}/>

      {/* stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:statCols, gap:9, marginBottom:11 }}>
        <StatCard icon={<Users size={14}/>} label="Total Employees" color="#6366f1"
          value={employees.length}
          sub={`${deptData.length} department${deptData.length !== 1 ? "s" : ""}`}
          sparkData={Array.from({length:14}, () => employees.length + Math.floor(Math.random()*2-1))}
          loading={loading}/>
        <StatCard icon={<Wifi size={14}/>} label="Online Now" color="#10b981"
          value={onlineEmps.length}
          sub={`${onlinePct}% of team`}
          badge={onlinePct >= 70 ? "Strong" : undefined}
          sparkData={Array.from({length:14}, (_,i) => Math.max(0, onlineEmps.length + Math.floor(Math.sin(i)*2)))}
          loading={loading}/>
        <StatCard icon={<Zap size={14}/>} label="Avg Activity" color="#818cf8"
          value={`${avgActivity}%`}
          sub={avgActivity >= 70 ? "High productivity" : avgActivity >= 40 ? "Moderate" : "Low activity"}
          sparkData={activityTrend}
          loading={loading}/>
        <StatCard icon={<Clock size={14}/>} label="Active Time" color="#f59e0b"
          value={fmtMins(totalMins) || "—"}
          sub={`${employees.length} employees total`}
          sparkData={Array.from({length:14}, () => 50 + Math.random()*40)}
          loading={loading}/>
      </div>

      {/* middle */}
      <div style={{ display:"grid", gridTemplateColumns:middleCols, gap:9, marginBottom:11 }}>
        <Card>
          <CardHead title="Team Status" sub="Online vs offline"/>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:11 }}>
            <DonutChart data={donutData} size={isMobile ? 100 : 115} label={onlineEmps.length}/>
            <div style={{ display:"flex", flexDirection:"column", gap:5, alignSelf:"stretch" }}>
              {[
                { label:"Online",  val:onlineEmps.length,  color:"#4ade80", icon:<Wifi size={10}/> },
                { label:"Offline", val:offlineEmps.length, color:"#f87171", icon:<WifiOff size={10}/> },
              ].map((row,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:7,
                  padding:"7px 9px", background:"#090910",
                  borderRadius:8, border:"1px solid #111114" }}>
                  <div style={{ width:22, height:22, borderRadius:6, background:`${row.color}10`,
                    display:"flex", alignItems:"center", justifyContent:"center", color:row.color }}>
                    {row.icon}
                  </div>
                  <span style={{ fontSize:10.5, color:"#5a5a64", flex:1 }}>{row.label}</span>
                  <span style={{ fontSize:14, fontWeight:700, color:row.color,
                    fontFamily:"'DM Mono',monospace" }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHead title="Department Breakdown" sub="Activity score by team"
            right={<span style={{ fontSize:9, color:"#252529",
              fontFamily:"'DM Mono',monospace" }}>{deptData.length} depts</span>}/>
          {loading
            ? [1,2,3].map(i => (
                <div key={i} style={{ height:36, background:"#0a0a0d",
                  borderRadius:8, marginBottom:5, animation:"pulse 1.5s ease infinite" }}/>
              ))
            : deptData.length === 0
              ? <div style={{ textAlign:"center", padding:"20px 0",
                  color:"#252529", fontSize:11 }}>No departments found</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {deptData.map((dept, i) => (
                    <div key={i} style={{ padding:"8px 10px", background:"#090910",
                      borderRadius:9, border:"1px solid #111114" }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", marginBottom:6 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <div style={{ width:7, height:7, borderRadius:2,
                            background:dept.color, boxShadow:`0 0 5px ${dept.color}77` }}/>
                          <span style={{ fontSize:11.5, fontWeight:600, color:"#c8c8cc" }}>{dept.name}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <span style={{ fontSize:9.5, color:"#2e2e35" }}>
                            <span style={{ color:"#4ade80", fontWeight:600 }}>{dept.online}</span>
                            /{dept.total}
                          </span>
                          <span style={{ fontSize:11.5, fontWeight:700, color:dept.color,
                            fontFamily:"'DM Mono',monospace" }}>{dept.pct}%</span>
                        </div>
                      </div>
                      <MiniBar pct={dept.pct} color={dept.color} height={3}/>
                    </div>
                  ))}
                </div>
          }
        </Card>

        <Card>
          <CardHead title="Alerts" sub="Real-time notifications"
            right={alerts.length > 0
              ? <span style={{ fontSize:9, fontWeight:700, color:"#f87171",
                  background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.15)",
                  padding:"1px 6px", borderRadius:4 }}>{alerts.length}</span>
              : null}/>
          <AlertsPanel alerts={alerts} loading={loading}/>
        </Card>
      </div>

      {/* ══ INSIGHTS ══ */}
      <Divider label="Insights"/>

      <div style={{ display:"grid", gridTemplateColumns:bottomCols, gap:9, marginBottom:9 }}>
        <Card>
          <CardHead title="Most Used Apps" sub="Across all employees today"
            right={<span style={{ fontSize:9.5, color:"#818cf8",
              background:"rgba(129,140,248,0.07)", border:"1px solid rgba(129,140,248,0.14)",
              padding:"2px 7px", borderRadius:5, fontWeight:500 }}>{topApps.length} apps</span>}/>
          {topApps.length > 0
            ? <HBarChart data={topApps}/>
            : <div style={{ textAlign:"center", padding:"20px 0",
                color:"#252529", fontSize:11 }}>No app data yet</div>
          }
        </Card>

        <Card>
          <CardHead title="Top Performers" sub="Highest activity today"
            right={<Award size={11} color="#fbbf24"/>}/>
          <TopPerformers employees={employees} loading={loading}/>
        </Card>
      </div>

      <Card>
        <CardHead title="Weekly Activity Heatmap"
          sub="When is your team most productive?"
          right={<span style={{ fontSize:9, color:"#252529" }}>Hourly intensity</span>}/>
        <ActivityHeatmap data={heatmapData}/>
      </Card>

      {/* ══ BURNOUT RISK ══ */}
      <Divider label="Burnout Risk Analysis" right="AI-powered early detection"/>

      <Card>
        <CardHead
          title="Employee Burnout Risk"
          sub="Based on hours, productivity trends & after-hours activity"
          right={
            burnoutData.filter(e => e.burnoutRisk === "HIGH").length > 0
              ? <span style={{ fontSize:9, fontWeight:700, color:"#f87171",
                  background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.18)",
                  padding:"2px 8px", borderRadius:4 }}>
                  {burnoutData.filter(e => e.burnoutRisk === "HIGH").length} High Risk
                </span>
              : <span style={{ fontSize:9, color:"#4ade80",
                  background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.14)",
                  padding:"2px 8px", borderRadius:4 }}>All Good</span>
          }/>

        {loading ? (
          <div style={{ textAlign:"center", padding:"20px 0", color:"#252529", fontSize:11 }}>
            Analyzing burnout patterns...
          </div>
        ) : burnoutData.length === 0 ? (
          <div style={{ textAlign:"center", padding:"20px 0", color:"#252529", fontSize:11 }}>
            Not enough data yet — system needs 3+ days of activity logs
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:burnoutCols, gap:9 }}>
            {burnoutData.map(emp => {
              const borderColor = emp.burnoutRisk === "HIGH" ? "#ef4444"
                : emp.burnoutRisk === "MEDIUM" ? "#f59e0b" : "#22c55e";
              const bgColor = emp.burnoutRisk === "HIGH" ? "rgba(239,68,68,0.05)"
                : emp.burnoutRisk === "MEDIUM" ? "rgba(245,158,11,0.05)" : "rgba(34,197,94,0.04)";
              const trendColor = emp.trend < -10 ? "#f87171" : emp.trend > 5 ? "#4ade80" : "#a0a0aa";
              return (
                <div key={emp.employeeId} style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}33`,
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius:10, padding:"13px 14px",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:9 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0", lineHeight:1.2 }}>
                        {emp.name}
                      </div>
                      <div style={{ fontSize:10, color:"#3a3a42", marginTop:2 }}>{emp.department}</div>
                    </div>
                    <div style={{
                      fontSize:9.5, fontWeight:700, padding:"3px 9px", borderRadius:5,
                      background: emp.burnoutRisk === "HIGH" ? "rgba(239,68,68,0.12)"
                        : emp.burnoutRisk === "MEDIUM" ? "rgba(245,158,11,0.12)" : "rgba(34,197,94,0.1)",
                      color: borderColor, border:`1px solid ${borderColor}33`,
                      whiteSpace:"nowrap",
                    }}>
                      {emp.burnoutRisk === "HIGH" ? "🔴 High Risk"
                        : emp.burnoutRisk === "MEDIUM" ? "🟡 Medium" : "🟢 Low Risk"}
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:14, marginBottom:9, flexWrap:"wrap" }}>
                    {[
                      { val:`${emp.hoursPerDay}h`, label:"avg/day" },
                      { val:`${emp.trend > 0 ? "+" : ""}${emp.trend}%`, label:"trend", color:trendColor },
                      { val:`${emp.productivityEnd}%`, label:"current", color:"#818cf8" },
                      { val:emp.afterHoursCount, label:"after-hrs", color:"#f59e0b" },
                    ].map((item, i) => (
                      <div key={i} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:item.color||"#c7c7d4",
                          fontFamily:"'DM Mono',monospace" }}>{item.val}</div>
                        <div style={{ fontSize:9, color:"#252529", marginTop:1 }}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontSize:9, color:"#252529" }}>Week Start</span>
                      <span style={{ fontSize:9, color:"#252529" }}>Week End</span>
                    </div>
                    <div style={{ height:3, background:"#111114", borderRadius:4, overflow:"hidden", position:"relative" }}>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0,
                        width:`${emp.productivityStart}%`, background:"#4ade8066", borderRadius:4 }}/>
                      <div style={{ position:"absolute", left:0, top:0, bottom:0,
                        width:`${emp.productivityEnd}%`,
                        background:`linear-gradient(90deg,${borderColor}44,${borderColor})`,
                        borderRadius:4, transition:"width .9s" }}/>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginTop:2 }}>
                      <span style={{ fontSize:9, color:"#3a3a42", fontFamily:"'DM Mono',monospace" }}>
                        {emp.productivityStart}%
                      </span>
                      <span style={{ fontSize:9, color:trendColor, fontFamily:"'DM Mono',monospace" }}>
                        {emp.productivityEnd}%
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize:10, color:"#4a4a55", lineHeight:1.4,
                    background:"rgba(255,255,255,0.02)", borderRadius:6,
                    padding:"7px 9px", border:"1px solid #111114" }}>
                    💡 {emp.recommendation}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  button:hover { opacity:0.8; }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes sPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.82)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.3} }
  ::-webkit-scrollbar       { width:3px; height:3px; }
  ::-webkit-scrollbar-track { background:#0a0a0d; }
  ::-webkit-scrollbar-thumb { background:#1e1e22; border-radius:3px; }
  @media (max-width: 640px) {
    html { font-size: 14px; }
  }
`;
