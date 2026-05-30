import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, Search, Activity, Users, Camera, ChevronDown,
  BarChart2, Layers, AlertCircle, RefreshCw, Wifi, WifiOff,
  X, Eye, EyeOff, Clock, Zap, Monitor, ShieldAlert, Menu,
} from "lucide-react";
import { io as socketIO } from "socket.io-client";
import API from "../api/axios.js";
const SOCKET_URL = "https://workforce-backend-production-cc13.up.railway.app";

// ── Responsive hook (same as EmployeeList) ─────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setWidth(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return width;
}

// ── Blocked app filter ─────────────────────────────────────────────────────
const BLOCKED_KEYWORDS = ["youtube","facebook","tiktok","instagram","twitter","netflix","whatsapp","snapchat","reddit"];
function isBlockedApp(app = "", title = "") {
  const combined = (app + " " + title).toLowerCase();
  return BLOCKED_KEYWORDS.some(k => combined.includes(k));
}
function isBlockedShot(s) {
  if (!s) return true;
  if (s.isBlocked === true) return true;
  const app   = s.app   || s.appName   || s.applicationName || s.processName || "";
  const title = s.windowTitle || s.title || s.activity || "";
  return isBlockedApp(app, title);
}
const filterBlocked = (arr = []) => arr.filter(s => !isBlockedShot(s));

// ── Helpers ────────────────────────────────────────────────────────────────
const getCfg = s => (!s || s === "Offline")
  ? { color:"#f87171", bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.2)", dot:"#f87171" }
  : { color:"#4ade80", bg:"rgba(74,222,128,0.08)",  border:"rgba(74,222,128,0.2)",  dot:"#4ade80" };
const getDS = s => (!s || s === "Offline") ? "Offline" : "Online";

function getAppIcon(name) {
  const n = (name || "").toLowerCase();
  const map = {
    "chrome":"https://www.google.com/favicon.ico","google chrome":"https://www.google.com/favicon.ico",
    "firefox":"https://www.mozilla.org/favicon.ico","safari":"https://www.apple.com/favicon.ico",
    "edge":"https://www.microsoft.com/favicon.ico","vs code":"https://code.visualstudio.com/favicon.ico",
    "visual studio code":"https://code.visualstudio.com/favicon.ico",
    "figma":"https://www.figma.com/favicon.ico","slack":"https://slack.com/favicon.ico",
    "discord":"https://discord.com/favicon.ico","zoom":"https://zoom.us/favicon.ico",
    "teams":"https://teams.microsoft.com/favicon.ico","microsoft teams":"https://teams.microsoft.com/favicon.ico",
    "outlook":"https://outlook.live.com/favicon.ico","gmail":"https://mail.google.com/favicon.ico",
    "notion":"https://www.notion.so/favicon.ico","github":"https://github.com/favicon.ico",
    "gitlab":"https://gitlab.com/favicon.ico","jira":"https://www.atlassian.com/favicon.ico",
    "postman":"https://www.postman.com/favicon.ico",
    "excel":"https://www.microsoft.com/favicon.ico","word":"https://www.microsoft.com/favicon.ico",
    "powerpoint":"https://www.microsoft.com/favicon.ico",
    "photoshop":"https://www.adobe.com/favicon.ico","illustrator":"https://www.adobe.com/favicon.ico",
    "telegram":"https://telegram.org/favicon.ico","google meet":"https://meet.google.com/favicon.ico",
    "android studio":"https://developer.android.com/favicon.ico",
    "intellij":"https://www.jetbrains.com/favicon.ico","pycharm":"https://www.jetbrains.com/favicon.ico",
  };
  for (const key of Object.keys(map)) { if (n.includes(key)) return map[key]; }
  return null;
}

const APP_COLORS = {
  "Chrome":"#4285f4","Google Chrome":"#4285f4","Firefox":"#ff7139","Safari":"#006cff",
  "Edge":"#0078d4","VS Code":"#007acc","Visual Studio Code":"#007acc","Figma":"#f24e1e",
  "Slack":"#e01e5a","Discord":"#5865f2","Zoom":"#2d8cff","Teams":"#6264a7",
  "Outlook":"#0078d4","Gmail":"#ea4335","Notion":"#aaaaaa","GitHub":"#8b949e",
  "GitLab":"#e24329","Jira":"#0052cc","Postman":"#ff6c37",
  "Excel":"#217346","Word":"#2b579a","PowerPoint":"#d24726","Photoshop":"#31a8ff",
  "Illustrator":"#ff9a00","IntelliJ":"#fe315d","PyCharm":"#21d789",
  "Android Studio":"#3ddc84","Terminal":"#00dc82",
};
const PAL = ["#f43f5e","#fb923c","#facc15","#4ade80","#34d399","#22d3ee","#818cf8","#e879f9","#f472b6","#84cc16"];
function appColor(n) {
  if (!n) return "#818cf8";
  if (APP_COLORS[n]) return APP_COLORS[n];
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % PAL.length;
  return PAL[h];
}

function getImageSrc(u) {
  if (!u || typeof u !== "string" || u.trim() === "") return null;
  if (u.startsWith("data:image")) return u;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${SOCKET_URL}${u}`;
  if (u.length > 100) return `data:image/jpeg;base64,${u}`;
  return null;
}

function fmtMins(mins) {
  const n = Number(mins);
  if (!n || n <= 0 || isNaN(n)) return null;
  const h = Math.floor(n / 60); const m = n % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function cleanTime(str) {
  if (!str) return null;
  if (/^0+h\s*0+m$/.test(str.trim())) return null;
  if (str.trim() === "0m" || str.trim() === "0h") return null;
  return str;
}
function resolveActivity(obj) { return obj?.currentActivity || obj?.activity || obj?.window_title || obj?.title || obj?.currentTask || ""; }
function resolveApp(obj) { return obj?.currentApp || obj?.current_app || obj?.app || obj?.activeApp || obj?.currentApplication || ""; }
function resolveMins(obj) {
  if (!obj) return 0;
  const candidates = [obj.activeMinsToday, obj.activeMinutes, obj.totalMinutes, obj.active_minutes, obj.minutesActive, obj.totalActiveMinutes];
  for (const v of candidates) { const n = Number(v); if (n > 0 && !isNaN(n)) return n; }
  const timeStr = obj?.activeTime || obj?.active_time || obj?.totalActiveTime || "";
  if (timeStr) {
    const hM = timeStr.match(/(\d+)\s*h/i); const mM = timeStr.match(/(\d+)\s*m/i);
    const total = (hM ? parseInt(hM[1]) : 0) * 60 + (mM ? parseInt(mM[1]) : 0);
    if (total > 0) return total;
  }
  return 0;
}
function resolvePct(obj) { return obj?.activityPct ?? obj?.activity_pct ?? obj?.activityPercent ?? 0; }
function formatActiveTime(emp) {
  if (!emp) return null;
  const mins = resolveMins(emp);
  if (mins > 0) return fmtMins(mins);
  return cleanTime(emp?.activeTime || emp?.active_time || emp?.totalActiveTime || "") || null;
}
function debugLogEmployee(emp) {
  if (!emp) return;
  const tf = {};
  Object.keys(emp).forEach(k => {
    const l = k.toLowerCase();
    if (l.includes("time") || l.includes("min") || l.includes("active") || l.includes("hour") || l.includes("track")) tf[k] = emp[k];
  });
  console.log("[ActiveTime Debug]", tf);
}

// ── Sub-components ─────────────────────────────────────────────────────────
function AppIcon({ name, size = 28 }) {
  const [fail, setFail] = useState(false);
  const url = getAppIcon(name); const color = appColor(name);
  if (url && !fail) return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, overflow:"hidden", flexShrink:0, background:color+"12", border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <img src={url} alt={name} style={{ width:size*0.6, height:size*0.6, objectFit:"contain" }} onError={() => setFail(true)}/>
    </div>
  );
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.22, background:color+"18", border:`1px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.42, fontWeight:700, color, flexShrink:0 }}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}

function Avatar({ initials, size = 38, status }) {
  const cfg = getCfg(status);
  const grs = [
    "linear-gradient(135deg,#6366f1,#4338ca)","linear-gradient(135deg,#10b981,#065f46)",
    "linear-gradient(135deg,#f59e0b,#92400e)","linear-gradient(135deg,#ef4444,#7f1d1d)",
    "linear-gradient(135deg,#8b5cf6,#4c1d95)","linear-gradient(135deg,#06b6d4,#164e63)",
  ];
  const idx = (initials?.charCodeAt(0) || 0) % grs.length;
  return (
    <div style={{ position:"relative", flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:"50%", background:grs[idx], display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.35, fontWeight:600, color:"#fff", border:"2px solid #0d0d10" }}>
        {initials || "?"}
      </div>
      <span style={{ position:"absolute", bottom:1, right:1, width:size*0.27, height:size*0.27, borderRadius:"50%", background:cfg.dot, border:"2px solid #0d0d10", animation: status !== "Offline" ? "sPulse 2s infinite" : "none" }}/>
    </div>
  );
}

function Badge({ status }) {
  const ds = getDS(status); const cfg = getCfg(status);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:10, fontWeight:500, letterSpacing:"0.04em", background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, whiteSpace:"nowrap" }}>
      {ds === "Online" ? <Wifi size={8}/> : <WifiOff size={8}/>} {ds}
    </span>
  );
}

function Bar({ pct, height = 4 }) {
  const c = pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ height, background:"#1a1a1e", borderRadius:4, overflow:"hidden", minWidth:60 }}>
      <div style={{ height:"100%", width:`${Math.min(pct||0,100)}%`, background:c, borderRadius:4, transition:"width .6s" }}/>
    </div>
  );
}

function SparkBar({ data = [], color = "#818cf8", height = 56 }) {
  if (!data.length) return <div style={{ height, display:"flex", alignItems:"center", justifyContent:"center", color:"#3f3f46", fontSize:11 }}>No data</div>;
  const bars = data.slice(-24);
  const max = Math.max(...bars.map(d => d.value ?? d), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:2, height }}>
      {bars.map((d, i) => {
        const p = ((d.value ?? d) / max) * 100;
        return (
          <div key={i} style={{ flex:1, height:"100%", display:"flex", alignItems:"flex-end" }}>
            <div style={{ width:"100%", height:`${Math.max(p, 4)}%`, background: i === bars.length-1 ? color : color+"44", borderRadius:"2px 2px 0 0", transition:"height .3s" }}/>
          </div>
        );
      })}
    </div>
  );
}

function AppUsageChart({ apps = [] }) {
  const [hov, setHov] = useState(null);
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current || !apps.length) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth; const H = 160;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.height = H + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    const maxShow = Math.min(apps.length, 6);
    const r = 34; const cx = W / 2; const cy = H / 2;
    const spacing = Math.min(W / (maxShow + 1), 80);
    const startX = cx - ((maxShow - 1) / 2) * spacing;
    apps.slice(0, maxShow).forEach((app, i) => {
      const x = startX + i * spacing;
      const pct = app.pct || 0;
      const color = appColor(app.name);
      const angle = (pct / 100) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.strokeStyle = color + "18"; ctx.lineWidth = 6; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, cy, r, -Math.PI/2, -Math.PI/2 + angle); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.stroke();
      ctx.font = `600 11px 'DM Mono', monospace`; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(`${pct}%`, x, cy);
      const shortName = app.name.length > 7 ? app.name.slice(0, 6) + "…" : app.name;
      ctx.font = `500 9px 'DM Sans', sans-serif`; ctx.fillStyle = "#71717a"; ctx.fillText(shortName, x, cy + r + 14);
    });
  }, [apps]);

  if (!apps.length) return (
    <div style={{ textAlign:"center", padding:"48px 0" }}>
      <Layers size={28} color="#27272a" style={{ display:"block", margin:"0 auto 12px" }}/>
      <div style={{ fontSize:13, color:"#52525b" }}>No app usage data yet</div>
    </div>
  );
  const total = apps.reduce((s, a) => s + (a.pct || 0), 0) || 1;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
      <div style={{ marginBottom:18, background:"#0a0a0d", borderRadius:12, border:"1px solid #1a1a1e", padding:"14px 10px", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ width:"100%", display:"block" }}/>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {apps.map((app, i) => {
          const color = appColor(app.name); const pct = app.pct || 0; const isH = hov === i;
          return (
            <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ padding:"10px 12px", borderRadius:10, background: isH ? `${color}0c` : "#0a0a0d", border: isH ? `1px solid ${color}30` : "1px solid #161618", transition:"all .15s", cursor:"default" }}>
              <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                <span style={{ fontSize:9, color:"#3f3f46", width:14, textAlign:"right", fontWeight:600 }}>#{i+1}</span>
                <AppIcon name={app.name} size={28}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12.5, fontWeight:600, color:"#ffffff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.name}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0, marginLeft:8 }}>
                      {app.time && <span style={{ fontSize:10, color:"#52525b" }}>{app.time}</span>}
                      <span style={{ fontSize:13, fontWeight:700, color, fontFamily:"'DM Mono',monospace", minWidth:34, textAlign:"right" }}>{pct}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ position:"relative", height:5, background:"#111113", borderRadius:4, overflow:"hidden" }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${Math.round((pct/total)*100)}%`, background:color+"18", borderRadius:4 }}/>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct}%`, background:`linear-gradient(90deg,${color}55,${color})`, borderRadius:4, transition:"width 1s cubic-bezier(0.4,0,0.2,1)" }}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppDoughnut({ apps = [] }) {
  const cvs = useRef(null); const ch = useRef(null);
  useEffect(() => {
    if (!apps.length || !cvs.current) return;
    const load = async () => {
      if (!window.Chart) {
        await new Promise((r, j) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";
          s.onload = r; s.onerror = j; document.head.appendChild(s);
        });
      }
      if (ch.current) ch.current.destroy();
      const cols = apps.map(a => appColor(a.name));
      ch.current = new window.Chart(cvs.current.getContext("2d"), {
        type:"doughnut",
        data:{ labels:apps.map(a=>a.name), datasets:[{ data:apps.map(a=>a.pct), backgroundColor:cols.map(c=>c+"bb"), borderColor:cols, borderWidth:2, hoverOffset:10 }] },
        options:{ responsive:true, maintainAspectRatio:false, cutout:"72%", plugins:{ legend:{display:false}, tooltip:{ backgroundColor:"#18181b", borderColor:"#27272a", borderWidth:1, titleColor:"#ffffff", bodyColor:"#a1a1aa", callbacks:{ label: ctx => ` ${ctx.parsed}%  ·  ${apps[ctx.dataIndex]?.time||""}` } } }, animation:{ animateRotate:true, duration:900 } }
      });
    };
    load().catch(console.error);
    return () => { if (ch.current) ch.current.destroy(); };
  }, [apps]);
  if (!apps.length) return <div style={{ textAlign:"center", padding:"48px 0", color:"#52525b", fontSize:13 }}>No data</div>;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      <div style={{ position:"relative", width:180, height:180 }}>
        <canvas ref={cvs} style={{ position:"absolute", inset:0 }}/>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ fontSize:26, fontWeight:700, color:"#ffffff" }}>{apps.length}</div>
          <div style={{ fontSize:9, color:"#52525b", textTransform:"uppercase", letterSpacing:"0.1em" }}>Apps</div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8, alignSelf:"stretch" }}>
        {apps.map((a, i) => {
          const color = appColor(a.name);
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:2, background:color, flexShrink:0 }}/>
              <AppIcon name={a.name} size={20}/>
              <span style={{ fontSize:12, color:"#ffffff", fontWeight:500, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</span>
              <span style={{ fontSize:10, color:"#52525b" }}>{a.time}</span>
              <span style={{ fontSize:12, fontWeight:700, color, minWidth:32, textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{a.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineGraph({ timeline = [], period = "daily" }) {
  const [hov, setHov] = useState(null);
  if (!timeline.length) return (
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <Activity size={32} color="#27272a" style={{ display:"block", margin:"0 auto 14px" }}/>
      <div style={{ fontSize:14, fontWeight:600, color:"#ffffff" }}>No activity data</div>
      <div style={{ fontSize:12, color:"#52525b", marginTop:4 }}>Data will appear once tracking starts</div>
    </div>
  );
  let bucketedTimeline = timeline;
  if (period === "weekly") {
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; const map = {};
    timeline.forEach((t, idx) => {
      let day = t.day || t.date || "";
      if (!day) day = days[Math.floor((idx / timeline.length) * 7)] || `D${idx}`;
      const key = `${t.app}||${day}`;
      if (!map[key]) map[key] = { app:t.app, time:day, pct:0, count:0 };
      map[key].pct += t.pct || 0; map[key].count++;
    });
    bucketedTimeline = Object.values(map).map(v => ({ ...v, pct: Math.round(v.pct / v.count) }));
  }
  if (period === "monthly") {
    const map = {};
    timeline.forEach((t, idx) => {
      let week = t.week || t.weekLabel || "";
      if (!week) week = `W${Math.floor((idx / timeline.length) * 4) + 1}`;
      const key = `${t.app}||${week}`;
      if (!map[key]) map[key] = { app:t.app, time:week, pct:0, count:0 };
      map[key].pct += t.pct || 0; map[key].count++;
    });
    bucketedTimeline = Object.values(map).map(v => ({ ...v, pct: Math.round(v.pct / v.count) }));
  }
  const appNames = [...new Set(bucketedTimeline.map(t => t.app).filter(Boolean))];
  const times    = [...new Set(bucketedTimeline.map(t => t.time).filter(Boolean))];
  const lookup   = {};
  bucketedTimeline.forEach(t => { if (t.app && t.time) lookup[`${t.app}||${t.time}`] = t; });
  const cellW = period === "monthly" ? 52 : period === "weekly" ? 58 : 42;
  const cellH = 36;
  return (
    <div>
      <div style={{ fontSize:9.5, color:"#52525b", marginBottom:14, textTransform:"uppercase", letterSpacing:"0.09em" }}>
        {period === "daily" ? "Hourly — today" : period === "weekly" ? "Daily — this week" : "Weekly — this month"}
      </div>
      <div style={{ overflowX:"auto", paddingBottom:8 }}>
        <div style={{ minWidth: 148 + times.length * (cellW + 3) }}>
          <div style={{ display:"flex", alignItems:"flex-end", marginBottom:5, paddingLeft:148 }}>
            {times.map((t, i) => (
              <div key={i} style={{ width:cellW, flexShrink:0, marginRight:3, fontSize:9, color:"#3f3f46", textAlign:"center", fontFamily:"'DM Mono',monospace", paddingBottom:4, borderBottom:"1px solid #1a1a1e" }}>{t}</div>
            ))}
          </div>
          {appNames.map((app, ai) => {
            const color = appColor(app);
            return (
              <div key={ai} style={{ display:"flex", alignItems:"center", marginBottom:4 }}>
                <div style={{ width:148, flexShrink:0, display:"flex", alignItems:"center", gap:8, paddingRight:10 }}>
                  <AppIcon name={app} size={22}/>
                  <span style={{ fontSize:11, color:"#ffffff", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app}</span>
                </div>
                {times.map((t, ti) => {
                  const item = lookup[`${app}||${t}`];
                  const pct  = item ? Math.min(item.pct || 0, 100) : 0;
                  const hKey = `${ai}-${ti}`; const isH = hov === hKey;
                  const actC = pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171";
                  return (
                    <div key={ti} onMouseEnter={() => setHov(hKey)} onMouseLeave={() => setHov(null)}
                      style={{ width:cellW, height:cellH, flexShrink:0, marginRight:3, borderRadius:6, overflow:"hidden", position:"relative", background: item ? `${color}12` : "#080809", border: item ? isH ? `1px solid ${color}66` : `1px solid ${color}25` : "1px solid #111113", transition:"all .15s" }}>
                      {item && (
                        <>
                          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:`${pct}%`, background:`linear-gradient(0deg,${color}50,${color}15)`, transition:"height .8s" }}/>
                          <div style={{ position:"absolute", bottom:`calc(${pct}% - 2px)`, left:"20%", right:"20%", height:2, borderRadius:2, background:color }}/>
                          {isH && (
                            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#0d0d10dd", zIndex:10 }}>
                              <span style={{ fontSize:11, fontWeight:700, color:actC, fontFamily:"'DM Mono',monospace" }}>{pct}%</span>
                              {item.duration && <span style={{ fontSize:9, color:"#71717a", marginTop:1 }}>{item.duration}m</span>}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop:18, paddingTop:14, borderTop:"1px solid #1a1a1e", display:"flex", gap:18, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:9, color:"#3f3f46", textTransform:"uppercase", letterSpacing:"0.1em" }}>Activity</span>
        {[{label:"High ≥70%",color:"#4ade80"},{label:"Mid 40–69%",color:"#fbbf24"},{label:"Low <40%",color:"#f87171"}].map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:s.color }}/>
            <span style={{ fontSize:10, color:"#71717a" }}>{s.label}</span>
          </div>
        ))}
        <span style={{ marginLeft:"auto", fontSize:10, color:"#3f3f46" }}>{timeline.length} entries · {appNames.length} apps</span>
      </div>
    </div>
  );
}

function ScreenshotCard({ sc }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgErr, setImgErr] = useState(false);

  if (isBlockedShot(sc)) return (
    <div style={{ borderRadius:11, overflow:"hidden", background:"#0d0d10", border:"1px solid rgba(248,113,113,0.2)" }}>
      <div style={{ width:"100%", height:128, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, background:"#0a0305" }}>
        <div style={{ width:40, height:40, borderRadius:10, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ShieldAlert size={18} color="#f87171"/>
        </div>
        <span style={{ fontSize:10, fontWeight:700, color:"#f87171", background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", padding:"3px 10px", borderRadius:6 }}>BLOCKED — Hidden</span>
      </div>
      <div style={{ padding:"9px 11px", borderTop:"1px solid rgba(248,113,113,0.1)" }}>
        <div style={{ fontSize:10, color:"#52525b" }}>{sc.time || sc.date || "—"}</div>
      </div>
    </div>
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setImgLoading(true); setImgErr(false);
      const existing = sc.imageUrl;
      if (existing && typeof existing === "string" && existing.trim().length > 20) {
        if (!cancelled) { setImgUrl(existing); setImgLoading(false); } return;
      }
      try {
        const res = await API.get(`/screenshots/${sc._id}/image`);
        if (!cancelled) { setImgUrl(res.data?.imageUrl || null); setImgLoading(false); }
      } catch { if (!cancelled) { setImgErr(true); setImgLoading(false); } }
    }
    load();
    return () => { cancelled = true; };
  }, [sc._id, sc.imageUrl]);

  const imgSrc = getImageSrc(imgUrl);
  return (
    <div style={{ borderRadius:11, overflow:"hidden", background:"#0d0d10", border:"1px solid #1a1a1e" }}>
      <div style={{ width:"100%", height:128, position:"relative", background:"#080809" }}>
        {imgLoading ? (
          <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6 }}>
            <RefreshCw size={16} color="#27272a" style={{ animation:"spin 1s linear infinite" }}/>
            <span style={{ fontSize:9, color:"#27272a" }}>Loading...</span>
          </div>
        ) : imgErr || !imgSrc ? (
          <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Camera size={20} color="#27272a"/>
          </div>
        ) : (
          <img src={imgSrc} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={() => setImgErr(true)}/>
        )}
      </div>
      <div style={{ padding:"9px 11px" }}>
        <div style={{ fontSize:11, color:"#52525b", marginBottom:4 }}>{sc.time || sc.date}</div>
        {sc.app && (
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <AppIcon name={sc.app} size={14}/><span style={{ fontSize:11, color:"#71717a" }}>{sc.app}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mobile Employee Card (like EmployeeList's MobileCard) ──────────────────
function MobileEmpCard({ emp, isNew, onClick, onHide }) {
  const inits  = (emp.firstName?.[0] || "") + (emp.lastName?.[0] || "");
  const on     = emp.status && emp.status !== "Offline";
  const pct    = emp.activityPct || 0;
  const curAct = resolveActivity(emp);
  const curApp = resolveApp(emp);
  const aTime  = formatActiveTime(emp);
  const apps   = emp.apps || [];
  const pctColor = pct >= 70 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div onClick={onClick}
      style={{ background: isNew ? "rgba(74,222,128,0.03)" : "rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 16px", display:"flex", flexDirection:"column", gap:12, cursor:"pointer", transition:"border-color .15s" }}
      onTouchStart={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"}
      onTouchEnd={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>

      {/* top: avatar + name + status + hide */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
          <Avatar initials={inits} size={42} status={emp.status || "Offline"}/>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#fff", lineHeight:1.2, marginBottom:3 }}>{emp.firstName} {emp.lastName}</div>
            <div style={{ fontSize:11, color:"#52525b" }}>{emp.role || "—"}{emp.department ? ` · ${emp.department}` : ""}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <Badge status={emp.status || "Offline"}/>
          <button onClick={e => { e.stopPropagation(); onHide(); }}
            style={{ width:28, height:28, borderRadius:7, border:"1px solid #1f2937", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#3f3f46" }}>
            <EyeOff size={11}/>
          </button>
        </div>
      </div>

      {/* current activity */}
      {on && curAct && (
        <div style={{ padding:"9px 12px", background:"rgba(129,140,248,0.06)", border:"1px solid rgba(129,140,248,0.15)", borderRadius:9 }}>
          <div style={{ fontSize:11, fontWeight:500, color:"#ffffff", marginBottom:curApp ? 4 : 0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{curAct}</div>
          {curApp && (
            <div style={{ display:"flex", alignItems:"center", gap:5 }}>
              <AppIcon name={curApp} size={13}/><span style={{ fontSize:10, color:"#52525b" }}>{curApp}</span>
            </div>
          )}
        </div>
      )}

      {/* stats row */}
      <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
        <div>
          <div style={{ fontSize:10, color:"#3f3f46", marginBottom:2 }}>ACTIVE TIME</div>
          <div style={{ fontSize:13, fontWeight:700, color: aTime ? "#fff" : "#2a2a2e", fontFamily:"'DM Mono',monospace" }}>{aTime || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize:10, color:"#3f3f46", marginBottom:4 }}>ACTIVITY</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:60, height:3, background:"#1a1a1e", borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:pctColor, borderRadius:4 }}/>
            </div>
            <span style={{ fontSize:13, fontWeight:700, color: on ? pctColor : "#2a2a2e", fontFamily:"'DM Mono',monospace" }}>{on ? `${pct}%` : "—"}</span>
          </div>
        </div>
        {apps.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:"#3f3f46", marginBottom:4 }}>APPS</div>
            <div style={{ display:"flex", alignItems:"center", gap:3 }}>
              {apps.slice(0, 5).map(a => <AppIcon key={a} name={a} size={20}/>)}
              {apps.length > 5 && <span style={{ fontSize:9, fontWeight:600, color:"#52525b" }}>+{apps.length-5}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   EMPLOYEE DETAIL
════════════════════════════════════════════════════════ */
function EmployeeDetail({ emp, onBack, isMobile }) {
  const [tab,         setTab]         = useState("timeline");
  const [period,      setPeriod]      = useState("daily");
  const [activity,    setActivity]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [liveEmp,     setLiveEmp]     = useState(emp);
  const [screenshots, setScreenshots] = useState([]);
  const [ssLoad,      setSsLoad]      = useState(false);

  useEffect(() => {
    const sock = socketIO(SOCKET_URL, { transports:["websocket"] });
    sock.emit("join", "admins");
    sock.on("employee:update", d => {
      if (d.employeeId?.toString() !== (emp._id || emp.id)?.toString()) return;
      setLiveEmp(p => {
        const freshMins = resolveMins(d) || resolveMins(p);
        return { ...p, status: d.status ?? p.status, currentApp: resolveApp(d) || resolveApp(p), currentActivity: resolveActivity(d) || resolveActivity(p), activityPct: resolvePct(d) || p.activityPct, lastSeen: d.lastSeen ?? p.lastSeen, activeMinsToday: freshMins, activeTime: fmtMins(freshMins) || p.activeTime };
      });
    });
    return () => sock.disconnect();
  }, [emp._id, emp.id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("");
      try {
        const r = await API.get(`/employees/${emp._id || emp.id}/activity?period=${period}`);
        if (!r.data) throw new Error("No data");
        setActivity(r.data);
        const freshMins = resolveMins(r.data);
        if (freshMins > 0) setLiveEmp(p => ({ ...p, activeMinsToday: freshMins, activeTime: fmtMins(freshMins) }));
      } catch(e) { setError(e.message); }
      finally { setLoading(false); }
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [emp._id, emp.id, period]);

  useEffect(() => {
    if (tab !== "screenshots") return;
    const empId = (emp._id || emp.id)?.toString();
    if (!empId) return;
    const doFetch = async () => {
      setSsLoad(true);
      try {
        const r = await API.get(`/screenshots/employee/${empId}`);
        setScreenshots(filterBlocked(Array.isArray(r.data) ? r.data : []));
      } catch(e) { console.error(e.message); }
      finally { setSsLoad(false); }
    };
    doFetch();
    const id = setInterval(doFetch, 10000);
    return () => clearInterval(id);
  }, [tab, emp._id, emp.id]);

  const curApp    = resolveApp(liveEmp)      || resolveApp(activity)      || "";
  const curAct    = resolveActivity(liveEmp) || resolveActivity(activity) || "";
  const actPct    = resolvePct(liveEmp)      || resolvePct(activity);
  const curStatus = liveEmp.status           || "Offline";
  const ds        = getDS(curStatus);
  const activeTime = formatActiveTime(liveEmp) || formatActiveTime(activity) || null;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#ffffff" }}>
      {/* Back bar */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", borderRadius:10, background:"#111113", border:"1px solid #27272a", color:"#818cf8", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
          <ArrowLeft size={13}/> Back
        </button>
        <div style={{ flex:1, height:1, background:"#1c1c1f" }}/>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, color:"#4ade80", background:"#111113", border:"1px solid #1c1c1f", padding:"5px 12px", borderRadius:8 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"sPulse 2s infinite" }}/> Live Tracking
        </div>
      </div>

      {/* Profile card */}
      <div style={{ background:"#111113", border:"1px solid #1e1e22", borderRadius:18, padding: isMobile ? "18px 16px" : "28px 30px", marginBottom:14 }}>
        <div style={{ display:"flex", gap: isMobile ? 14 : 22, alignItems:"flex-start", flexWrap:"wrap" }}>
          <Avatar initials={(liveEmp.firstName?.[0]||"")+(liveEmp.lastName?.[0]||"")} size={isMobile ? 56 : 76} status={curStatus}/>
          <div style={{ flex:1, minWidth: isMobile ? "100%" : 220 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
              <span style={{ fontSize: isMobile ? 18 : 24, fontWeight:700, color:"#ffffff", letterSpacing:"-0.025em", lineHeight:1.1 }}>
                {liveEmp.firstName} {liveEmp.lastName}
              </span>
              <Badge status={curStatus}/>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
              <span style={{ fontSize:13, color:"#ffffff", fontWeight:500, opacity:0.7 }}>{liveEmp.role || "—"}</span>
              {liveEmp.department && <><span style={{ width:3, height:3, borderRadius:"50%", background:"#3f3f46", display:"inline-block" }}/><span style={{ fontSize:13, color:"#818cf8", fontWeight:500 }}>{liveEmp.department}</span></>}
            </div>
            {liveEmp.email && <div style={{ fontSize:11.5, color:"#ffffff", opacity:0.35, marginBottom: isMobile ? 12 : 20 }}>{liveEmp.email}</div>}

            {/* Stats strip — 2×2 on mobile, 4-col on desktop */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr", background:"#0d0d10", borderRadius:12, border:"1px solid #1a1a1e", overflow:"hidden" }}>
              {[
                { icon:<Clock size={11}/>, label:"Active Time", val: activeTime || "—", clr:"#818cf8", mono:true },
                { icon:<Zap size={11}/>,   label:"Activity",    val:`${actPct}%`, clr: actPct>=70?"#4ade80":actPct>=40?"#fbbf24":"#f87171", mono:true },
                { icon:<Monitor size={11}/>, label:"Current App", val: curApp || "—", clr: curApp ? appColor(curApp) : "#52525b", mono:false },
                { icon:<Wifi size={11}/>,  label:"Status",      val: ds, clr: ds==="Online"?"#4ade80":"#f87171", mono:false },
              ].map((it, idx) => (
                <div key={it.label} style={{ padding: isMobile ? "12px 12px" : "14px 16px", borderRight: isMobile ? (idx % 2 === 0 ? "1px solid #1a1a1e" : "none") : (idx < 3 ? "1px solid #1a1a1e" : "none"), borderBottom: isMobile && idx < 2 ? "1px solid #1a1a1e" : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, color:"#3f3f46", marginBottom:6 }}>
                    {it.icon}
                    <span style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:600 }}>{it.label}</span>
                  </div>
                  <div style={{ fontSize: isMobile ? 14 : 16, fontWeight:700, color:it.clr, fontFamily: it.mono ? "'DM Mono',monospace" : "'DM Sans',sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {it.val}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop:14, padding:"11px 14px", background: curAct ? "rgba(129,140,248,0.06)" : "rgba(255,255,255,0.02)", border: curAct ? "1px solid rgba(129,140,248,0.18)" : "1px solid #1a1a1e", borderRadius:10, display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background: curAct ? "#818cf8" : "#27272a", animation: curAct ? "sPulse 1.5s infinite" : "none", flexShrink:0 }}/>
              <span style={{ fontSize:12.5, fontWeight:500, color: curAct ? "#ffffff" : "#3f3f46" }}>
                {curAct || (getDS(curStatus) === "Online" ? "Waiting for activity data…" : "Employee is offline")}
              </span>
            </div>
          </div>
          {/* Spark bar — hidden on mobile */}
          {!isMobile && (
            <div style={{ background:"#0d0d10", border:"1px solid #1a1a1e", borderRadius:12, padding:"14px 16px", minWidth:144 }}>
              <div style={{ fontSize:9, color:"#3f3f46", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Today's Activity</div>
              <SparkBar data={activity?.hourlyBars || []} color="#818cf8" height={50}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                <span style={{ fontSize:9, color:"#27272a", fontFamily:"'DM Mono',monospace" }}>00:00</span>
                <span style={{ fontSize:9, color:"#27272a", fontFamily:"'DM Mono',monospace" }}>Now</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding:"9px 14px", borderRadius:9, background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.15)", fontSize:12, color:"#fbbf24", marginBottom:14 }}>⚠ {error}</div>
      )}

      {/* Tabs — scrollable on mobile */}
      <div style={{ display:"flex", gap:3, marginBottom:14, background:"#111113", border:"1px solid #1c1c1f", borderRadius:12, padding:3, overflowX:"auto" }}>
        {[
          { id:"timeline",    label:"Timeline",    icon:<Activity size={12}/> },
          { id:"apps",        label:"App Usage",   icon:<Layers size={12}/> },
          { id:"screenshots", label:"Screenshots", icon:<Camera size={12}/> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding: isMobile ? "9px 14px" : "9px 20px", borderRadius:9, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flex:1, justifyContent:"center", transition:"all .15s", whiteSpace:"nowrap", background: tab===t.id ? "rgba(129,140,248,0.1)" : "transparent", border: tab===t.id ? "1px solid rgba(129,140,248,0.22)" : "1px solid transparent", color: tab===t.id ? "#a5b4fc" : "#52525b" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "timeline" && (
        <div style={{ background:"#111113", border:"1px solid #1e1e22", borderRadius:16, padding: isMobile ? "16px" : "22px 26px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#ffffff" }}>Activity Timeline</div>
              <div style={{ fontSize:11, color:"#52525b", marginTop:3 }}>App usage over time · auto-refresh 15s</div>
            </div>
            <div style={{ display:"flex", background:"#0d0d10", border:"1px solid #1a1a1e", borderRadius:9, padding:3, gap:2 }}>
              {[{id:"daily",label:"Daily"},{id:"weekly",label:"Weekly"},{id:"monthly",label:"Monthly"}].map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  style={{ padding: isMobile ? "5px 10px" : "6px 16px", borderRadius:7, fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s", background: period===p.id ? "rgba(129,140,248,0.15)" : "transparent", border: period===p.id ? "1px solid rgba(129,140,248,0.28)" : "1px solid transparent", color: period===p.id ? "#a5b4fc" : "#52525b" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {loading
            ? <div style={{ textAlign:"center", padding:"48px 0" }}><RefreshCw size={18} color="#27272a" style={{ display:"block", margin:"0 auto 12px", animation:"spin 1s linear infinite" }}/><div style={{ fontSize:12, color:"#52525b" }}>Loading…</div></div>
            : <TimelineGraph timeline={activity?.timeline || []} period={period}/>}
        </div>
      )}

      {tab === "apps" && (
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:14 }}>
          <div style={{ background:"#111113", border:"1px solid #1e1e22", borderRadius:16, padding: isMobile ? "16px" : "22px 26px" }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#ffffff", marginBottom:3 }}>App Usage</div>
            <div style={{ fontSize:11, color:"#52525b", marginBottom:18 }}>Time spent per application</div>
            {loading ? <div style={{ textAlign:"center", padding:"40px 0", color:"#52525b", fontSize:12 }}>Loading…</div> : <AppUsageChart apps={activity?.topApps || []}/>}
          </div>
          <div style={{ background:"#111113", border:"1px solid #1e1e22", borderRadius:16, padding: isMobile ? "16px" : "22px 26px" }}>
            <div style={{ fontSize:14, fontWeight:600, color:"#ffffff", marginBottom:3 }}>Distribution</div>
            <div style={{ fontSize:11, color:"#52525b", marginBottom:18 }}>Share of total active time</div>
            {loading ? <div style={{ textAlign:"center", padding:"40px 0", color:"#52525b", fontSize:12 }}>Loading…</div> : <AppDoughnut apps={activity?.topApps || []}/>}
          </div>
        </div>
      )}

      {tab === "screenshots" && (
        <div style={{ background:"#111113", border:"1px solid #1e1e22", borderRadius:16, padding: isMobile ? "16px" : "22px 26px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#ffffff" }}>Screenshots</div>
              <div style={{ fontSize:11, color:"#52525b", marginTop:3 }}>Live · auto-refresh 10s · {screenshots.length} shots</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:10, color:"#4ade80" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"sPulse 2s infinite" }}/>Live
            </div>
          </div>
          {ssLoad && !screenshots.length ? (
            <div style={{ textAlign:"center", padding:"40px 0" }}><RefreshCw size={18} color="#27272a" style={{ display:"block", margin:"0 auto 12px", animation:"spin 1s linear infinite" }}/><div style={{ fontSize:12, color:"#52525b" }}>Loading…</div></div>
          ) : !screenshots.length ? (
            <div style={{ textAlign:"center", padding:"60px 0" }}>
              <Camera size={32} color="#27272a" style={{ display:"block", margin:"0 auto 12px" }}/>
              <div style={{ fontSize:13, color:"#ffffff" }}>No screenshots yet</div>
              <div style={{ fontSize:11, marginTop:6, color:"#27272a" }}>Electron client se screenshots aane par dikhenge</div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(auto-fill,minmax(155px,1fr))" : "repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
              {screenshots.map((sc, i) => <ScreenshotCard key={sc._id || i} sc={sc}/>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN — AdminActivity
════════════════════════════════════════════════════════ */
export default function AdminActivity() {
  const width    = useWindowWidth();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;

  const [employees,    setEmployees]    = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter,   setDeptFilter]   = useState("All");
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [hiddenEmps,   setHiddenEmps]   = useState(new Set());
  const [newlyOnline,  setNewlyOnline]  = useState(new Set());
  const [filtersOpen,  setFiltersOpen]  = useState(false); // mobile filters drawer

  useEffect(() => {
    const sock = socketIO(SOCKET_URL, { transports:["websocket"] });
    sock.emit("join", "admins");
    sock.on("employee:update", data => {
      setEmployees(prev => prev.map(emp => {
        if (emp._id?.toString() !== data.employeeId?.toString()) return emp;
        const wasOff = emp.status === "Offline";
        const nowOn  = data.status && data.status !== "Offline";
        if (wasOff && nowOn) {
          setNewlyOnline(s => {
            const n = new Set(s); n.add(emp._id?.toString());
            setTimeout(() => setNewlyOnline(s2 => { const n2 = new Set(s2); n2.delete(emp._id?.toString()); return n2; }), 5000);
            return n;
          });
        }
        const freshMins = resolveMins(data);
        return { ...emp, status: data.status ?? emp.status, currentApp: resolveApp(data) || resolveApp(emp), currentActivity: resolveActivity(data) || resolveActivity(emp), activityPct: resolvePct(data) || emp.activityPct, lastSeen: data.lastSeen ?? emp.lastSeen, activeMinsToday: freshMins > 0 ? freshMins : emp.activeMinsToday, activeTime: freshMins > 0 ? fmtMins(freshMins) : emp.activeTime };
      }));
    });
    return () => sock.disconnect();
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await API.get("/employees/activity");
      const data = r.data;
      const arr = Array.isArray(data) ? data : data.employees || data.data || [];
      if (arr.length > 0) debugLogEmployee(arr[0]);
      setEmployees(arr); setLastRefresh(new Date());
    } catch(e) { setError(e.message || "Failed"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
  useEffect(() => { const id = setInterval(fetchEmployees, 30000); return () => clearInterval(id); }, [fetchEmployees]);

  const depts = ["All", ...new Set(employees.map(e => e.department).filter(Boolean))];
  const isOn  = s => s && s !== "Offline";
  const stats = {
    total:  employees.length,
    online: employees.filter(e => isOn(e.status)).length,
    off:    employees.filter(e => !isOn(e.status)).length,
    avg:    employees.length ? Math.round(employees.reduce((a, e) => a + (e.activityPct || 0), 0) / employees.length) : 0,
  };

  const filtered = employees.filter(e => {
    const key = e._id || e.id || e.email;
    if (hiddenEmps.has(key)) return false;
    const q  = search.toLowerCase();
    const ms = !q || `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || (e.role || "").toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q);
    const sm = statusFilter === "All" || (statusFilter === "Online" && isOn(e.status)) || (statusFilter === "Offline" && !isOn(e.status));
    return ms && sm && (deptFilter === "All" || e.department === deptFilter);
  });

  if (selected) return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>
      <style>{CSS}</style>
      <EmployeeDetail emp={selected} onBack={() => setSelected(null)} isMobile={isMobile}/>
    </div>
  );

  // ── Metrics grid cols ──
  const metricsCols = isMobile ? "1fr 1fr" : "repeat(4,1fr)";

  // ── Table columns for tablet ──
  const tableColsTablet = "1fr 90px 1fr 80px 44px";
  const tableColsDesktop = "1fr 100px 220px 90px 110px 160px 44px";

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", color:"#ffffff" }}>
      <style>{CSS}</style>

      {/* Mobile filters drawer */}
      {filtersOpen && isMobile && (
        <>
          <div onClick={() => setFiltersOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:200 }}/>
          <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"#111113", border:"1px solid #27272a", borderRadius:"16px 16px 0 0", zIndex:201, padding:"20px 16px 32px", animation:"slideUp .2s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontSize:14, fontWeight:600, color:"#fff" }}>Filters</span>
              <button onClick={() => setFiltersOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#52525b" }}><X size={16}/></button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Status", val:statusFilter, set:setStatusFilter, opts:[{v:"All",l:"All Statuses"},{v:"Online",l:"Online"},{v:"Offline",l:"Offline"}] },
                { label:"Department", val:deptFilter, set:setDeptFilter, opts:depts.map(d => ({ v:d, l:d==="All"?"All Departments":d })) },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize:10, color:"#52525b", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>{s.label}</div>
                  <div style={{ position:"relative" }}>
                    <select value={s.val} onChange={e => { s.set(e.target.value); setFiltersOpen(false); }}
                      style={{ width:"100%", padding:"10px 28px 10px 13px", borderRadius:10, border:"1px solid #27272a", background:"#0d0d10", color:"#ffffff", fontSize:13, fontFamily:"'DM Sans',sans-serif", appearance:"none", cursor:"pointer", outline:"none" }}>
                      {s.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                    <ChevronDown size={11} color="#3f3f46" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: isMobile ? 16 : 24, flexWrap:"wrap" }}>
        <div style={{ width:34, height:34, borderRadius:10, background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Activity size={15} color="#818cf8"/>
        </div>
        <div>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:700, color:"#ffffff", letterSpacing:"-0.02em", lineHeight:1 }}>Employee Activity</div>
          <div style={{ fontSize:10, color:"#52525b", marginTop:3 }}>Live monitoring dashboard</div>
        </div>
        <div style={{ flex:1, height:1, background:"#1a1a1e", marginLeft:4 }}/>
        <div style={{ fontSize:10, color:"#52525b", background:"#111113", border:"1px solid #1a1a1e", padding:"6px 12px", borderRadius:8, display:"flex", alignItems:"center", gap:6, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
          <div style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", animation:"sPulse 2s infinite" }}/>
          {lastRefresh.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
        </div>
        {hiddenEmps.size > 0 && (
          <button onClick={() => setHiddenEmps(new Set())}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1px solid #27272a", background:"#111113", color:"#818cf8", fontSize:10, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
            <Eye size={11}/> {!isMobile && "Show All "} ({hiddenEmps.size})
          </button>
        )}
      </div>

      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16, padding:"10px 16px", borderRadius:10, background:"rgba(248,113,113,0.05)", border:"1px solid rgba(248,113,113,0.18)", fontSize:12, color:"#f87171" }}>
          <AlertCircle size={13}/>{error}
          <button style={{ marginLeft:"auto", background:"none", border:"none", color:"#f87171", cursor:"pointer" }} onClick={() => setError("")}><X size={13}/></button>
        </div>
      )}

      {/* Metrics — 2-col on mobile, 4-col on desktop */}
      <div style={{ display:"grid", gridTemplateColumns:metricsCols, gap: isMobile ? 8 : 12, marginBottom: isMobile ? 16 : 22 }}>
        {[
          { icon:<Users size={isMobile ? 14 : 16}/>,    bg:"#6366f1", label:"Total",      val:stats.total,     sub:`${depts.length-1} depts` },
          { icon:<Wifi size={isMobile ? 14 : 16}/>,     bg:"#10b981", label:"Online",     val:stats.online,    sub:`${stats.total ? Math.round(stats.online/stats.total*100) : 0}%` },
          { icon:<WifiOff size={isMobile ? 14 : 16}/>,  bg:"#ef4444", label:"Offline",    val:stats.off,       sub:"Not connected" },
          { icon:<BarChart2 size={isMobile ? 14 : 16}/>,bg:"#818cf8", label:"Avg Activity",val:`${stats.avg}%`,sub:"All staff" },
        ].map((c, i) => (
          <div key={i} style={{ background:"#111113", border:"1px solid #1a1a1e", borderRadius: isMobile ? 12 : 14, padding: isMobile ? "14px" : "18px 20px", transition:"border-color .15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#27272a"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1e"}>
            <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius:10, background:c.bg+"18", border:`1px solid ${c.bg}25`, display:"flex", alignItems:"center", justifyContent:"center", color:c.bg, marginBottom: isMobile ? 10 : 14 }}>{c.icon}</div>
            <div style={{ fontSize:9, color:"#52525b", marginBottom:4 }}>{c.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 26, fontWeight:700, color:"#ffffff", lineHeight:1, marginBottom:4, fontFamily:"'DM Mono',monospace" }}>{c.val}</div>
            <div style={{ fontSize:10, color:"#3f3f46" }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap: isMobile ? 6 : 10, marginBottom:14, alignItems:"center", flexWrap: isMobile ? "nowrap" : "wrap" }}>
        {/* Search */}
        <div style={{ position:"relative", flex:1, minWidth: isMobile ? 0 : 180 }}>
          <Search size={13} color="#3f3f46" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
          <input placeholder={isMobile ? "Search…" : "Search name, role, email…"} value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", padding:"9px 12px 9px 34px", borderRadius:10, border:"1px solid #1f2937", background:"#111113", color:"#ffffff", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
        </div>

        {/* Desktop filters inline */}
        {!isMobile && [
          { val:statusFilter, set:setStatusFilter, opts:[{v:"All",l:"All Statuses"},{v:"Online",l:"Online"},{v:"Offline",l:"Offline"}] },
          { val:deptFilter,   set:setDeptFilter,   opts:depts.map(d => ({ v:d, l:d==="All"?"All Departments":d })) },
        ].map((s, i) => (
          <div key={i} style={{ position:"relative" }}>
            <select value={s.val} onChange={e => s.set(e.target.value)}
              style={{ padding:"9px 28px 9px 13px", borderRadius:10, border:"1px solid #1f2937", background:"#111113", color:"#ffffff", fontSize:12, fontFamily:"'DM Sans',sans-serif", appearance:"none", cursor:"pointer", outline:"none" }}>
              {s.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <ChevronDown size={11} color="#3f3f46" style={{ position:"absolute", right:9, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
          </div>
        ))}

        {/* Mobile: filter icon button */}
        {isMobile && (
          <button onClick={() => setFiltersOpen(true)}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"9px 12px", borderRadius:10, border:"1px solid #1f2937", background:"#111113", color: (statusFilter !== "All" || deptFilter !== "All") ? "#818cf8" : "#a1a1aa", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
            <ChevronDown size={12}/>{(statusFilter !== "All" || deptFilter !== "All") ? "Filtered" : "Filter"}
          </button>
        )}

        {/* Refresh */}
        <button onClick={fetchEmployees}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 14px", borderRadius:10, border:"1px solid #1f2937", background:"#111113", color:"#a1a1aa", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>
          <RefreshCw size={12} style={{ animation:loading ? "spin .8s linear infinite" : "none" }}/>
          {!isMobile && "Refresh"}
        </button>
      </div>

      {/* ── Mobile: card stack ── */}
      {isMobile && (
        <>
          {loading && (
            <div style={{ textAlign:"center", padding:"50px 0" }}>
              <RefreshCw size={20} color="#27272a" style={{ display:"block", margin:"0 auto 12px", animation:"spin 1s linear infinite" }}/>
              <div style={{ fontSize:12, color:"#3f3f46" }}>Loading employees…</div>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"50px 0" }}>
              <Users size={30} color="#27272a" style={{ display:"block", margin:"0 auto 12px" }}/>
              <div style={{ fontSize:13, color:"#3f3f46" }}>No employees found</div>
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {!loading && filtered.map((emp, i) => {
              const key = emp._id || emp.id || emp.email;
              return (
                <MobileEmpCard
                  key={emp._id || emp.id || i}
                  emp={emp}
                  isNew={newlyOnline.has(emp._id?.toString() || emp.id?.toString())}
                  onClick={() => setSelected(emp)}
                  onHide={() => setHiddenEmps(p => { const n = new Set(p); n.add(key); return n; })}
                />
              );
            })}
          </div>
        </>
      )}

      {/* ── Tablet / Desktop: table ── */}
      {!isMobile && (
        <div style={{ background:"#111113", border:"1px solid #1a1a1e", borderRadius:16, overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns: isTablet ? tableColsTablet : tableColsDesktop, padding:"10px 20px", borderBottom:"1px solid #1a1a1e", background:"#0a0a0d" }}>
            {(isTablet
              ? ["Employee","Status","Activity","Active Time",""]
              : ["Employee","Status","Current Activity","Active Time","Activity %","Apps Used",""]
            ).map((h, i) => (
              <div key={i} style={{ fontSize:9.5, fontWeight:600, color:"#3f3f46", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:"56px 0" }}>
              <RefreshCw size={20} color="#27272a" style={{ display:"block", margin:"0 auto 12px", animation:"spin 1s linear infinite" }}/>
              <div style={{ fontSize:12, color:"#3f3f46" }}>Loading employees…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 0" }}>
              <Users size={30} color="#27272a" style={{ display:"block", margin:"0 auto 12px" }}/>
              <div style={{ fontSize:13, color:"#3f3f46", fontWeight:600 }}>No employees found</div>
            </div>
          ) : filtered.map((emp, i) => {
            const inits  = (emp.firstName?.[0] || "") + (emp.lastName?.[0] || "");
            const apps   = emp.apps || [];
            const on     = isOn(emp.status);
            const isNew  = newlyOnline.has(emp._id?.toString() || emp.id?.toString());
            const pct    = emp.activityPct || 0;
            const curAct = resolveActivity(emp);
            const curApp = resolveApp(emp);
            const aTime  = formatActiveTime(emp);
            const key    = emp._id || emp.id || emp.email;

            return (
              <div key={emp._id || emp.id || i} onClick={() => setSelected(emp)}
                style={{ display:"grid", gridTemplateColumns: isTablet ? tableColsTablet : tableColsDesktop, padding:"13px 20px", borderBottom: i < filtered.length-1 ? "1px solid #141416" : "none", cursor:"pointer", alignItems:"center", transition:"background .12s", background: isNew ? "rgba(74,222,128,0.03)" : "transparent" }}
                onMouseEnter={e => { if (!isNew) e.currentTarget.style.background = "rgba(255,255,255,0.018)"; }}
                onMouseLeave={e => { if (!isNew) e.currentTarget.style.background = "transparent"; }}>

                {/* Employee */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar initials={inits} size={36} status={emp.status || "Offline"}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:"#ffffff" }}>{emp.firstName} {emp.lastName}</div>
                    <div style={{ fontSize:10, color:"#52525b" }}>{emp.role || "—"}{isTablet && emp.department ? ` · ${emp.department}` : ""}</div>
                  </div>
                </div>

                {/* Status */}
                <div><Badge status={emp.status || "Offline"}/></div>

                {/* Activity (abbreviated on tablet) */}
                <div style={{ overflow:"hidden" }}>
                  {isTablet ? (
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color: pct>=70?"#4ade80":pct>=40?"#fbbf24":on?"#f87171":"#2a2a2e", fontFamily:"'DM Mono',monospace", marginBottom:4 }}>
                        {on ? `${pct}%` : "—"}
                      </div>
                      {(on || pct > 0) && <Bar pct={pct} height={3}/>}
                    </div>
                  ) : on && curAct ? (
                    <>
                      <div style={{ fontSize:12, fontWeight:500, color:"#ffffff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:3 }}>{curAct}</div>
                      {curApp && <div style={{ display:"flex", alignItems:"center", gap:5 }}><AppIcon name={curApp} size={13}/><span style={{ fontSize:10, color:"#52525b" }}>{curApp}</span></div>}
                    </>
                  ) : (
                    <span style={{ fontSize:11.5, color: on ? "#52525b" : "#2a2a2e" }}>{on ? "Waiting for data…" : "Offline"}</span>
                  )}
                </div>

                {/* Active time */}
                <div style={{ fontSize:13, fontWeight:600, fontFamily:"'DM Mono',monospace", color: aTime ? "#ffffff" : "#2a2a2e" }}>
                  {aTime || "—"}
                </div>

                {/* Activity % (desktop only) */}
                {!isTablet && (
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, marginBottom:5, fontFamily:"'DM Mono',monospace", color: pct>=70?"#4ade80":pct>=40?"#fbbf24":on?"#f87171":"#2a2a2e" }}>
                      {on ? `${pct}%` : pct > 0 ? `${pct}%` : "—"}
                    </div>
                    {(on || pct > 0) && <Bar pct={pct} height={3}/>}
                  </div>
                )}

                {/* Apps (desktop only) */}
                {!isTablet && (
                  <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                    {apps.length > 0
                      ? <>{apps.slice(0,5).map(a => <AppIcon key={a} name={a} size={22}/>)}{apps.length > 5 && <span style={{ fontSize:9, fontWeight:600, color:"#52525b" }}>+{apps.length-5}</span>}</>
                      : <span style={{ color:"#27272a", fontSize:11 }}>—</span>}
                  </div>
                )}

                {/* Hide */}
                <div style={{ display:"flex", justifyContent:"center" }}>
                  <button onClick={e => { e.stopPropagation(); setHiddenEmps(p => { const n = new Set(p); n.add(key); return n; }); }}
                    style={{ width:28, height:28, borderRadius:7, border:"1px solid #1f2937", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#3f3f46", transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background="#1c1c1f"; e.currentTarget.style.color="#71717a"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#3f3f46"; }}>
                    <EyeOff size={11}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop:10, padding:"9px 16px", background:"#111113", border:"1px solid #1a1a1e", borderRadius:10, display:"flex", alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#3f3f46" }}>
            <strong style={{ color:"#818cf8" }}>{filtered.length}</strong> / <strong style={{ color:"#52525b" }}>{employees.length}</strong> employees
          </span>
          <div style={{ marginLeft:"auto", display:"flex", gap:14 }}>
            <span style={{ fontSize:10, color:"#4ade80", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }}/>{stats.online} Online
            </span>
            <span style={{ fontSize:10, color:"#f87171", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"#f87171", display:"inline-block" }}/>{stats.off} Offline
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500;600&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  select option { background:#111113; color:#ffffff; }
  input:focus { border-color:rgba(129,140,248,0.4) !important; }
  input::placeholder { color:#3f3f46 !important; }
  @keyframes spin    { to { transform:rotate(360deg); } }
  @keyframes sPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  ::-webkit-scrollbar { width:4px; height:4px; }
  ::-webkit-scrollbar-track { background:#0d0d10; }
  ::-webkit-scrollbar-thumb { background:#27272a; border-radius:4px; }
`;