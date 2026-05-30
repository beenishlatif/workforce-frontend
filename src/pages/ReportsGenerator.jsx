import { useState, useEffect, useCallback, useRef } from "react";
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
  bg:"#080809", s0:"#0c0c0f", s1:"#111114", s2:"#18181c",
  border:"#1f1f24", border2:"#2a2a30",
  text:"#f0f0f2", sub:"#c4c4cc", muted:"#6b6b78", dim:"#3a3a42",
  indigo:"#818cf8", indigoDim:"rgba(129,140,248,0.1)", indigoB:"rgba(129,140,248,0.22)",
  green:"#4ade80",  greenDim:"rgba(74,222,128,0.08)",  greenB:"rgba(74,222,128,0.2)",
  amber:"#fbbf24",  amberDim:"rgba(251,191,36,0.08)",  amberB:"rgba(251,191,36,0.2)",
  red:"#f87171",    redDim:"rgba(248,113,113,0.08)",   redB:"rgba(248,113,113,0.2)",
  cyan:"#22d3ee",   rose:"#fb7185", purple:"#a78bfa",
};

const GRADS = [
  "linear-gradient(135deg,#6366f1,#4338ca)",
  "linear-gradient(135deg,#059669,#064e3b)",
  "linear-gradient(135deg,#d97706,#92400e)",
  "linear-gradient(135deg,#dc2626,#7f1d1d)",
  "linear-gradient(135deg,#7c3aed,#4c1d95)",
  "linear-gradient(135deg,#0ea5e9,#1e3a5f)",
  "linear-gradient(135deg,#ec4899,#9d174d)",
];

const APP_COLORS = {
  Chrome:"#4285f4","Google Chrome":"#4285f4",Firefox:"#ff7139",Safari:"#006cff",
  Edge:"#0078d4","VS Code":"#007acc","Visual Studio Code":"#007acc",Figma:"#f24e1e",
  Slack:"#e01e5a",Discord:"#5865f2",Zoom:"#2d8cff",Teams:"#6264a7",
  Outlook:"#0078d4",Gmail:"#ea4335",Notion:"#aaaaaa",GitHub:"#8b949e",
  Excel:"#217346",Word:"#2b579a",PowerPoint:"#d24726",Photoshop:"#31a8ff",
  Terminal:"#00dc82",YouTube:"#ff0000",Spotify:"#1db954",Postman:"#ff6c37",
};
const PAL = ["#f43f5e","#fb923c","#facc15","#4ade80","#34d399","#22d3ee","#818cf8","#e879f9","#f472b6","#84cc16"];

function appColor(n) {
  if (!n) return T.indigo;
  if (APP_COLORS[n]) return APP_COLORS[n];
  let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % PAL.length;
  return PAL[h];
}
function initials(name) { return (name||"??").split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2); }
function gradIdx(name)  { return (name||"A").charCodeAt(0) % GRADS.length; }

function getImageSrc(url) {
  if (!url || typeof url !== "string" || url.trim() === "") return null;
  if (url.startsWith("data:image")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.length > 100) return `data:image/jpeg;base64,${url}`;
  return null;
}

function fmtMins(m) {
  const n = Number(m); if (!n || n <= 0 || isNaN(n)) return null;
  const h = Math.floor(n / 60), mi = n % 60;
  if (h === 0) return `${mi}m`; if (mi === 0) return `${h}h`; return `${h}h ${mi}m`;
}

function isBlockedShot(sc) { return sc && sc.isBlocked === true; }
function filterBlocked(arr) { return Array.isArray(arr) ? arr.filter(sc => !isBlockedShot(sc)) : []; }

function resolveActiveTime(empData, reportData) {
  const str = reportData?.activeTime || reportData?.active_time || reportData?.totalActiveTime
    || empData?.activeTime || empData?.active_time || "";
  if (str && str.trim() && !/^0+h\s*0+m$/.test(str.trim()) && str.trim() !== "0m" && str.trim() !== "0h") return str;
  const mins = reportData?.activeMinsToday || reportData?.activeMins || reportData?.activeMinutes
    || reportData?.total_active_minutes || reportData?.totalMinutes
    || empData?.activeMinsToday || empData?.activeMinutes || empData?.totalMinutes || 0;
  const fromMins = fmtMins(mins);
  if (fromMins) return fromMins;
  const secs = reportData?.activeSeconds || reportData?.active_seconds || 0;
  if (secs > 0) return fmtMins(Math.round(secs / 60));
  return "—";
}

function actColor(pct) { return pct >= 70 ? T.green : pct >= 40 ? T.amber : T.red; }
function fmtDate(d) {
  if (!d) return ""; const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" });
}
function isOverdue(due, status) {
  if (!due || status === "completed") return false;
  return new Date(due) < new Date();
}

const STATUS_TASK = {
  pending:     { label:"Pending",     color:"#f5a623", bg:"rgba(245,166,35,.12)",  border:"rgba(245,166,35,.25)"  },
  in_progress: { label:"In Progress", color:"#818cf8", bg:"rgba(129,140,248,.12)", border:"rgba(129,140,248,.3)"  },
  in_review:   { label:"In Review",   color:"#a78bfa", bg:"rgba(167,139,250,.12)", border:"rgba(167,139,250,.3)"  },
  completed:   { label:"Completed",   color:"#4ade80", bg:"rgba(74,222,128,.12)",  border:"rgba(74,222,128,.3)"   },
  blocked:     { label:"Blocked",     color:"#f87171", bg:"rgba(248,113,113,.12)", border:"rgba(248,113,113,.3)"  },
};
const PRIORITY_TASK = {
  low:    { color:"#4ade80", label:"Low"    },
  medium: { color:"#fbbf24", label:"Medium" },
  high:   { color:"#fb923c", label:"High"   },
  urgent: { color:"#f87171", label:"Urgent" },
};

/* ── Print HTML (same as original) ── */
function generatePrintHTML(empName, empRole, empDept, period, activeTime, actPct, reportData, screenshots, tasks) {
  const fc = p => p >= 70 ? "#16a34a" : p >= 40 ? "#d97706" : "#dc2626";
  const doneCount = tasks.filter(t => t.status === "completed").length;
  const safeShots = filterBlocked(screenshots);
  const hoursHTML = (() => {
    const rawHours = reportData?.workHours || reportData?.work_hours || [];
    const hourlyBars = reportData?.hourlyBars || [];
    let slots = Array.from({length:24}, (_,i) => ({hour:i, mins:0}));
    if (rawHours.length > 0) rawHours.forEach(h => { const idx=h.hour??h.h??0; if(idx>=0&&idx<24) slots[idx].mins=h.minutes??h.mins??h.value??0; });
    else if (hourlyBars.length > 0) hourlyBars.forEach((b,i) => { if(i<24){const raw=b?.value??b??0; slots[i].mins=raw>100?raw:Math.round((raw/100)*60);} });
    const visible = slots.filter((_,i) => i>=6 && i<=21);
    const maxMins = Math.max(...visible.map(s=>s.mins),1);
    const bars = visible.map(s => {
      const pct = (s.mins/maxMins)*100;
      const color = s.mins>=50?"#16a34a":s.mins>=20?"#d97706":"#4f46e5";
      return `<div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;flex:1;height:60px;gap:2px;"><div style="width:100%;height:${Math.max(s.mins>0?pct:2,2)}%;background:${s.mins>0?color:"#e5e7eb"};border-radius:2px 2px 0 0;"></div><div style="font-size:7px;color:#9ca3af;">${s.hour%3===0?String(s.hour).padStart(2,"0"):""}</div></div>`;
    }).join("");
    return `<div style="display:flex;align-items:flex-end;gap:2px;height:70px;">${bars}</div>`;
  })();
  const appsHTML = (reportData?.topApps||[]).slice(0,6).map((a,i) => `<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid #f3f4f6;"><span style="font-size:10px;color:#9ca3af;width:16px;">#${i+1}</span><div style="width:22px;height:22px;border-radius:5px;background:${appColor(a.name)}22;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:${appColor(a.name)};">${(a.name||"?")[0]}</div><span style="flex:1;font-size:12px;font-weight:600;">${a.name}</span><span style="font-size:11px;color:#6b7280;">${a.time||""}</span><div style="width:80px;background:#e5e7eb;border-radius:4px;height:5px;"><div style="height:100%;width:${a.pct||0}%;background:${appColor(a.name)};border-radius:4px;"></div></div><span style="font-size:12px;font-weight:800;color:${appColor(a.name)};width:35px;text-align:right;">${a.pct}%</span></div>`).join("");
  const tlHTML = (reportData?.timeline||[]).slice(0,15).map((t,i) => `<tr style="background:${i%2?"#f9fafb":"#fff"}"><td style="padding:6px 10px;font-size:11px;color:#6b7280;">${t.time||""}</td><td style="padding:6px 10px;font-size:11px;font-weight:600;">${t.app||""}</td><td style="padding:6px 10px;font-size:11px;color:#6b7280;">${t.duration||""}m</td><td style="padding:6px 10px;"><div style="background:#e5e7eb;border-radius:3px;height:5px;"><div style="height:100%;width:${t.pct||0}%;background:${(t.pct||0)>=70?"#16a34a":(t.pct||0)>=40?"#d97706":"#dc2626"};border-radius:3px;"></div></div></td><td style="padding:6px 10px;font-size:12px;font-weight:700;color:${(t.pct||0)>=70?"#16a34a":(t.pct||0)>=40?"#d97706":"#dc2626"};">${t.pct||0}%</td></tr>`).join("");
  const tasksHTML = tasks.slice(0,20).map((t,i) => { const st=STATUS_TASK[t.status]||STATUS_TASK.pending; const pr=PRIORITY_TASK[t.priority]||PRIORITY_TASK.medium; const over=isOverdue(t.due_date,t.status); return `<tr style="background:${i%2?"#f9fafb":"#fff"}"><td style="padding:7px 10px;font-size:12px;font-weight:600;${t.status==="completed"?"text-decoration:line-through;opacity:.6":""}">${t.title||"—"}</td><td style="padding:7px 10px;"><span style="padding:2px 7px;border-radius:4px;font-size:9px;font-weight:800;background:${st.bg};color:${st.color};">${st.label.toUpperCase()}</span></td><td style="padding:7px 10px;font-size:11px;font-weight:600;color:${pr.color};">${pr.label}</td><td style="padding:7px 10px;font-size:11px;color:${over?"#dc2626":"#6b7280"};font-weight:${over?700:400};">${t.due_date?fmtDate(t.due_date):"—"}${over?" ⚠":""}</td></tr>`; }).join("");
  const ssHTML = safeShots.slice(0,12).map(sc => { const src=getImageSrc(sc.imageUrl); return `<div style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">${src?`<img src="${src}" style="width:100%;height:100px;object-fit:cover;display:block;" onerror="this.style.display='none'"/>`:`<div style="height:100px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:20px;">📷</div>`}<div style="padding:6px 8px;"><div style="font-size:9px;color:#374151;font-weight:600;">${sc.time||sc.date||"—"}</div>${sc.app?`<div style="font-size:8px;color:#9ca3af;">${sc.app}</div>`:""}</div></div>`; }).join("");
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Report — ${empName} — ${period}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#111;font-size:13px;}.page{padding:16mm 20mm;}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #4f46e5;padding-bottom:14px;margin-bottom:20px;}.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#e5e7eb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:20px;}.kpi{background:#fff;padding:14px 12px;text-align:center;}.kpi-val{font-size:22px;font-weight:800;margin-bottom:3px;}.kpi-lbl{font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;font-weight:600;}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}.box{border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;}.box-title{font-size:9px;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f3f4f6;}.pbar-row{display:flex;justify-content:space-between;margin-bottom:4px;}.pbar-bg{background:#e5e7eb;border-radius:4px;height:5px;margin-bottom:10px;}table{width:100%;border-collapse:collapse;}th{font-size:8px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;padding:7px 10px;background:#f9fafb;border-bottom:1px solid #e5e7eb;text-align:left;}.ss-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}.pb{break-before:page;padding-top:10mm;}@media print{@page{margin:8mm;size:A4;}.pb{break-before:page;}}</style></head><body><div class="page"><div class="header"><div><div style="font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:5px;font-weight:600;">Employee Performance Report · ${period}</div><div style="font-size:26px;font-weight:800;letter-spacing:-.02em;">${empName}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;">${empRole||""}${empDept?` · ${empDept}`:""}</div></div><div style="text-align:right;"><div style="font-size:9px;color:#6b7280;margin-bottom:4px;">Generated</div><div style="font-size:13px;font-weight:800;">${new Date().toLocaleDateString("en-PK",{year:"numeric",month:"long",day:"numeric"})}</div><div style="font-size:10px;color:#9ca3af;margin-top:2px;">${new Date().toLocaleTimeString()}</div></div></div><div class="kpi-grid"><div class="kpi"><div class="kpi-val" style="color:#4f46e5;">${activeTime}</div><div class="kpi-lbl">Active Time</div></div><div class="kpi"><div class="kpi-val" style="color:${fc(actPct)};">${actPct}%</div><div class="kpi-lbl">Activity Rate</div></div><div class="kpi"><div class="kpi-val" style="color:#16a34a;">${doneCount}/${tasks.length}</div><div class="kpi-lbl">Tasks Done</div></div><div class="kpi"><div class="kpi-val" style="color:#0ea5e9;">${safeShots.length}</div><div class="kpi-lbl">Screenshots</div></div><div class="kpi"><div class="kpi-val" style="color:#7c3aed;">${(reportData?.topApps||[]).length}</div><div class="kpi-lbl">Apps Used</div></div></div><div class="two-col"><div class="box"><div class="box-title">Work Hours</div>${hoursHTML}</div><div class="box"><div class="box-title">Performance</div>${[["Activity Rate",actPct,fc(actPct)],["Task Completion",tasks.length?Math.round(doneCount/tasks.length*100):0,"#16a34a"]].map(([l,p,c])=>`<div class="pbar-row"><span style="font-size:11px;color:#6b7280;">${l}</span><span style="font-size:11px;font-weight:700;color:${c};">${p}%</span></div><div class="pbar-bg"><div style="height:100%;width:${Math.min(p,100)}%;background:${c};border-radius:4px;"></div></div>`).join("")}</div></div>${(reportData?.topApps||[]).length?`<div class="box" style="margin-bottom:16px;"><div class="box-title">Top Applications</div>${appsHTML}</div>`:``}${(reportData?.timeline||[]).length?`<div class="box" style="margin-bottom:16px;"><div class="box-title">Activity Timeline</div><table><thead><tr><th>Time</th><th>App</th><th>Duration</th><th>Activity</th><th>Score</th></tr></thead><tbody>${tlHTML}</tbody></table></div>`:``}${tasks.length?`<div class="box" style="margin-bottom:16px;"><div class="box-title">Tasks (${tasks.length})</div><table><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead><tbody>${tasksHTML}</tbody></table></div>`:``}${safeShots.length?`<div class="pb"><div class="box"><div class="box-title">Screenshots (${safeShots.length})</div><div class="ss-grid">${ssHTML}</div></div></div>`:``}<div style="margin-top:20px;padding-top:10px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:8px;color:#9ca3af;"><span>WorkTrack Pro · Confidential</span><span>${empName} · ${period} Report</span><span>Generated ${new Date().toLocaleDateString()}</span></div></div></body></html>`;
}

/* ── UI Components ── */
function Avatar({ name, size=42 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:GRADS[gradIdx(name)],
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.34, fontWeight:800, color:"#fff", flexShrink:0,
      boxShadow:`0 0 0 2px #0c0c0f,0 0 0 3px ${T.border2}` }}>
      {initials(name)}
    </div>
  );
}

function PBar({ pct, color, height=4 }) {
  const c = color || actColor(pct);
  return (
    <div style={{ height, background:T.border, borderRadius:99, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(pct||0,100)}%`, borderRadius:99,
        background:`linear-gradient(90deg,${c}66,${c})`,
        transition:"width 1s cubic-bezier(.4,0,.2,1)" }}/>
    </div>
  );
}

/* ── CSP-safe AppIcon — no external img requests ── */
function AppIcon({ name, size=24 }) {
  const color = appColor(name);
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.25, background:`${color}18`,
      border:`1px solid ${color}28`, display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.44, fontWeight:800, color, flexShrink:0 }}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}

function ShotCard({ sc, onClick }) {
  const [imgUrl,  setImgUrl]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(false);

  useEffect(() => {
    if (isBlockedShot(sc)) { setLoading(false); return; }
    let cancelled = false;
    async function load() {
      setLoading(true); setErr(false);
      if (sc.imageUrl && sc.imageUrl.trim().length > 20) {
        if (!cancelled) { setImgUrl(sc.imageUrl); setLoading(false); } return;
      }
      try {
        // ✅ axios se screenshot fetch
        const res = await API.get(`/screenshots/${sc._id}/image`);
        if (!cancelled) { setImgUrl(res.data.imageUrl || null); setLoading(false); }
      } catch { if (!cancelled) { setErr(true); setLoading(false); } }
    }
    load(); return () => { cancelled = true; };
  }, [sc._id, sc.imageUrl, sc.isBlocked]);

  if (isBlockedShot(sc)) return (
    <div style={{ borderRadius:10, overflow:"hidden", background:T.s0, border:`1px solid ${T.redB}` }}>
      <div style={{ height:88, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:T.redDim, gap:4 }}>
        <span style={{ fontSize:22 }}>🛡️</span>
        <span style={{ fontSize:9, fontWeight:700, color:T.red, letterSpacing:".06em" }}>BLOCKED</span>
      </div>
      <div style={{ padding:"5px 7px" }}>
        <div style={{ fontSize:9, color:T.muted }}>{sc.time||sc.date||"—"}</div>
        {sc.app && <div style={{ fontSize:8, color:T.dim, marginTop:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sc.app}</div>}
      </div>
    </div>
  );

  const imgSrc = getImageSrc(imgUrl);
  return (
    <div onClick={() => imgSrc && onClick(sc, imgSrc)}
      style={{ borderRadius:10, overflow:"hidden", background:T.s0, border:`1px solid ${T.border}`,
        cursor:imgSrc?"pointer":"default", transition:"all .15s" }}
      onMouseEnter={e => { if(imgSrc){ e.currentTarget.style.borderColor=T.indigoB; e.currentTarget.style.transform="scale(1.02)"; }}}
      onMouseLeave={e => { e.currentTarget.style.borderColor=T.border; e.currentTarget.style.transform="scale(1)"; }}>
      <div style={{ height:88, position:"relative", background:"#080809" }}>
        {loading
          ? <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div style={{ width:14,height:14,border:`2px solid ${T.border}`,borderTopColor:T.indigo,borderRadius:"50%",animation:"spin .8s linear infinite" }}/>
            </div>
          : err||!imgSrc
            ? <div style={{ width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:T.dim,fontSize:18 }}>📷</div>
            : <img src={imgSrc} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }} onError={()=>setErr(true)}/>
        }
      </div>
      <div style={{ padding:"5px 7px" }}>
        <div style={{ fontSize:9,color:T.muted }}>{sc.time||sc.date||"—"}</div>
        {sc.app && <div style={{ fontSize:8,color:T.dim,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{sc.app}</div>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   EMPLOYEE REPORT
════════════════════════════════════════════ */
function EmployeeReport({ empId, period, onBack }) {
  const width    = useWindowWidth();
  const isMobile = width < 640;

  const [emp,         setEmp]         = useState(null);
  const [reportData,  setReportData]  = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lightSrc,    setLightSrc]    = useState(null);
  const [lightSc,     setLightSc]     = useState(null);

  useEffect(() => {
    if (!empId) return;
    let cancelled = false;
    setLoading(true); setReportData(null); setScreenshots([]); setTasks([]); setEmp(null);

    async function fetchAll() {
      try {
        // ✅ saare fetch → API
        const empRes  = await API.get("/employees/activity");
        const allEmps = Array.isArray(empRes.data) ? empRes.data : (empRes.data.employees||empRes.data.data||[]);
        const foundEmp = allEmps.find(e => (e._id||e.id) === empId);
        if (!cancelled && foundEmp) setEmp(foundEmp);

        const [actRes, ssRes, tkRes] = await Promise.allSettled([
          API.get(`/employees/${empId}/activity`, { params:{ period:period.toLowerCase() } }),
          API.get(`/screenshots/employee/${empId}`),
          API.get("/tasks", { params:{ assigned_to:empId } })
            .catch(() => API.get("/tasks")),
        ]);

        if (!cancelled) {
          if (actRes.status === "fulfilled") setReportData(actRes.value.data);
          if (ssRes.status === "fulfilled") {
            const sd = ssRes.value.data;
            const empName = foundEmp ? `${foundEmp.firstName||""} ${foundEmp.lastName||""}`.trim().toLowerCase() : "";
            const filtered = filterBlocked(
              (Array.isArray(sd)?sd:[]).filter(s =>
                s.employeeId?.toString()===empId?.toString() ||
                s.empId?.toString()===empId?.toString() ||
                s.employeeName?.trim().toLowerCase()===empName
              )
            );
            setScreenshots(filtered);
          }
          if (tkRes.status === "fulfilled") {
            const td = tkRes.value.data;
            const all = Array.isArray(td)?td:(td.tasks||[]);
            setTasks(all.filter(t => String(t.assigned_to?._id??t.assigned_to??"")=== String(empId)));
          }
        }
      } catch(e) { console.error(e); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [empId, period]);

  const empName    = emp ? `${emp.firstName||""} ${emp.lastName||""}`.trim() || "Unknown" : "Loading…";
  const actPct     = reportData?.activityPct || emp?.activityPct || 0;
  const activeTime = resolveActiveTime(emp||{}, reportData||{});
  const isOnline   = emp?.status && emp.status !== "Offline";
  const topApps    = reportData?.topApps || [];
  const timeline   = reportData?.timeline || [];
  const activeMins = reportData?.activeMinsToday || reportData?.activeMins || emp?.activeMinsToday || 0;
  const doneCount  = tasks.filter(t => t.status==="completed").length;
  const taskPct    = tasks.length ? Math.round((doneCount/tasks.length)*100) : 0;
  const curApp     = emp?.currentApp || "";
  const curAct     = emp?.currentActivity || "";

  const rawHours   = reportData?.workHours || reportData?.work_hours || [];
  const hourlyBars = reportData?.hourlyBars || [];
  let slots = Array.from({length:24}, (_,i) => ({hour:i, mins:0}));
  if (rawHours.length > 0) rawHours.forEach(h => { const idx=h.hour??h.h??0; if(idx>=0&&idx<24) slots[idx].mins=h.minutes??h.mins??h.value??0; });
  else if (hourlyBars.length > 0) hourlyBars.forEach((b,i) => { if(i<24){const raw=b?.value??b??0; slots[i].mins=raw>100?raw:Math.round((raw/100)*60);} });
  else if (timeline.length > 0) timeline.forEach(item => { const match=(item.time||"").match(/^(\d{1,2}):/); if(match){const hr=parseInt(match[1],10);if(hr>=0&&hr<24)slots[hr].mins+=item.duration??0;} });
  const visibleSlots = slots.filter((_,i)=>i>=6&&i<=21);
  const maxMins = Math.max(...visibleSlots.map(s=>s.mins),1);

  const handlePrint = () => {
    const w = window.open("","_blank");
    w.document.write(generatePrintHTML(empName,emp?.role,emp?.department,period,activeTime,actPct,reportData||{},screenshots,tasks));
    w.document.close(); w.focus(); setTimeout(()=>w.print(),700);
  };
  const handleDownload = () => {
    const html = generatePrintHTML(empName,emp?.role,emp?.department,period,activeTime,actPct,reportData||{},screenshots,tasks);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html],{type:"text/html"}));
    a.download = `report_${empName.replace(/\s+/g,"_")}_${period}.html`; a.click();
  };
  const handleCSV = () => {
    const rows = [["Time","App","Duration","Activity%","Description"]];
    timeline.forEach(t => rows.push([t.time||"",t.app||"",t.duration||"",t.pct||0,t.activity||""]));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.map(r=>r.map(v=>`"${v}"`).join(",")).join("\n")],{type:"text/csv"}));
    a.download = `activity_${empName.replace(/\s+/g,"_")}_${period}.csv`; a.click();
  };

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 0",flexDirection:"column",gap:14 }}>
      <div style={{ width:32,height:32,border:`2px solid ${T.border}`,borderTopColor:T.indigo,borderRadius:"50%",animation:"spin .75s linear infinite" }}/>
      <span style={{ color:T.muted,fontSize:13 }}>Loading {empName}'s report…</span>
    </div>
  );

  /* ── Responsive layout helpers ── */
  const twoCol  = isMobile ? "1fr" : "1fr 1fr";
  const kpiCols = isMobile ? "repeat(3,1fr)" : "repeat(5,1fr)";
  const ssMinW  = isMobile ? "120px" : "150px";

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:0,animation:"fadeUp .3s ease" }}>
      <div style={{ background:T.s1,border:`1px solid ${T.border}`,borderRadius:20,overflow:"hidden" }}>
        <div style={{ height:3,background:`linear-gradient(90deg,${T.indigo},${T.cyan},${T.rose},${T.amber})` }}/>

        {/* ── HEADER ── */}
        <div style={{ padding: isMobile?"16px 14px 0":"22px 26px 0", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:18 }}>
            <div style={{ display:"flex",alignItems:"center",gap:isMobile?10:16,flexWrap:"wrap" }}>
              <Avatar name={empName} size={isMobile?48:64}/>
              <div>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap" }}>
                  <span style={{ fontSize:isMobile?18:24,fontWeight:800,color:T.text,letterSpacing:"-0.03em" }}>{empName}</span>
                  <span style={{ padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,
                    background:isOnline?T.greenDim:T.redDim,border:`1px solid ${isOnline?T.greenB:T.redB}`,
                    color:isOnline?T.green:T.red,display:"flex",alignItems:"center",gap:5 }}>
                    <span style={{ width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block" }}/>
                    {isOnline?"Online":"Offline"}
                  </span>
                  <span style={{ padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:T.indigoDim,border:`1px solid ${T.indigoB}`,color:T.indigo }}>{period}</span>
                </div>
                <div style={{ display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8 }}>
                  {emp?.role&&<span style={{ fontSize:12,color:T.muted }}>{emp.role}</span>}
                  {emp?.department&&<><span style={{ fontSize:10,color:T.dim }}>·</span><span style={{ fontSize:12,color:T.indigo,fontWeight:600 }}>{emp.department}</span></>}
                  {!isMobile&&emp?.email&&<><span style={{ fontSize:10,color:T.dim }}>·</span><span style={{ fontSize:11,color:T.dim }}>{emp.email}</span></>}
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",alignItems:"flex-start",width:isMobile?"100%":"auto" }}>
              <button onClick={onBack} style={{ padding:"8px 14px",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:"transparent",border:`1px solid ${T.border2}`,color:T.muted }}>← Back</button>
              {!isMobile && <button onClick={handleCSV} style={{ padding:"8px 14px",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:"transparent",border:`1px solid ${T.border2}`,color:T.muted }}>CSV</button>}
              <button onClick={handleDownload} style={{ padding:"8px 14px",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:T.indigoDim,border:`1px solid ${T.indigoB}`,color:T.indigo }}>⬇ Download</button>
              <button onClick={handlePrint} style={{ padding:"8px 14px",borderRadius:9,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",background:T.greenDim,border:`1px solid ${T.greenB}`,color:T.green }}>🖨 Print</button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display:"grid",gridTemplateColumns:kpiCols,borderTop:`1px solid ${T.border}` }}>
            {[
              { l:"Active Time", v:activeTime,              c:T.indigo         },
              { l:"Activity %",  v:`${actPct}%`,            c:actColor(actPct) },
              { l:"Tasks Done",  v:`${doneCount}/${tasks.length}`, c:T.green  },
              { l:"Screenshots", v:screenshots.length,      c:T.cyan           },
              { l:"Apps Used",   v:topApps.length,          c:T.purple         },
            ].filter((_,i) => !isMobile || i < 3).map((s,i,arr)=>(
              <div key={i} style={{ padding:isMobile?"12px 8px":"16px 12px",
                borderRight:i<arr.length-1?`1px solid ${T.border}`:"none",textAlign:"center" }}>
                <div style={{ fontSize:9,color:T.dim,textTransform:"uppercase",letterSpacing:".08em",marginBottom:7,fontWeight:600 }}>{s.l}</div>
                <div style={{ fontSize:isMobile?18:24,fontWeight:800,color:s.c,letterSpacing:"-0.02em" }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* Mobile: extra KPIs */}
          {isMobile && (
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",borderTop:`1px solid ${T.border}` }}>
              {[
                { l:"Screenshots", v:screenshots.length, c:T.cyan   },
                { l:"Apps Used",   v:topApps.length,     c:T.purple },
              ].map((s,i)=>(
                <div key={i} style={{ padding:"12px 8px",
                  borderRight:i===0?`1px solid ${T.border}`:"none",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:T.dim,textTransform:"uppercase",letterSpacing:".08em",marginBottom:7,fontWeight:600 }}>{s.l}</div>
                  <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── WORK HOURS + PERFORMANCE ── */}
        <div style={{ display:"grid",gridTemplateColumns:twoCol,borderBottom:`1px solid ${T.border}` }}>
          <div style={{ padding:isMobile?"16px 14px":"20px 24px",borderRight:isMobile?"none":`1px solid ${T.border}`,borderBottom:isMobile?`1px solid ${T.border}`:"none" }}>
            <div style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16 }}>Work Hours</div>
            <div style={{ display:"flex",alignItems:"flex-end",gap:2,height:72 }}>
              {visibleSlots.map((slot,i)=>{
                const pct=(slot.mins/maxMins)*100;
                const barColor=slot.mins>=50?T.green:slot.mins>=20?T.amber:T.indigo;
                return(
                  <div key={i} title={`${String(slot.hour).padStart(2,"0")}:00 — ${slot.mins>0?fmtMins(slot.mins)||slot.mins+"m":"No data"}`}
                    style={{ flex:1,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
                    <div style={{ width:"100%",height:`${Math.max(slot.mins>0?pct:2,2)}%`,
                      background:slot.mins>0?barColor:T.border,borderRadius:"3px 3px 0 0",
                      opacity:slot.mins>0?1:0.25,transition:"height .8s cubic-bezier(.4,0,.2,1)" }}/>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex",gap:2,marginTop:3 }}>
              {visibleSlots.map((slot,i)=>(
                <div key={i} style={{ flex:1,fontSize:7,color:slot.mins>0?T.muted:T.dim,textAlign:"center",fontFamily:"monospace" }}>
                  {slot.hour%3===0?String(slot.hour).padStart(2,"0"):""}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:isMobile?"16px 14px":"20px 24px" }}>
            <div style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em",marginBottom:16 }}>Performance</div>
            {[
              { l:"Activity Rate",    pct:actPct,                                             c:actColor(actPct) },
              { l:"Time Utilization", pct:Math.round(Math.min(activeMins,480)/480*100),       c:T.indigo         },
              { l:"Task Completion",  pct:taskPct,                                             c:T.green          },
              { l:"App Diversity",    pct:Math.min(Math.round((topApps.length/10)*100),100), c:T.cyan           },
            ].map(m=>(
              <div key={m.l} style={{ marginBottom:14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                  <span style={{ fontSize:11,color:T.muted }}>{m.l}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:m.c }}>{m.pct}%</span>
                </div>
                <PBar pct={m.pct} color={m.c} height={5}/>
              </div>
            ))}
          </div>
        </div>

        {/* ── TOP APPS + TASK SUMMARY ── */}
        <div style={{ display:"grid",gridTemplateColumns:twoCol,borderBottom:`1px solid ${T.border}` }}>
          <div style={{ padding:isMobile?"16px 14px":"20px 24px",borderRight:isMobile?"none":`1px solid ${T.border}`,borderBottom:isMobile?`1px solid ${T.border}`:"none" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <span style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em" }}>Top Apps</span>
              <span style={{ fontSize:10,color:T.dim,background:T.s2,padding:"1px 8px",borderRadius:6,border:`1px solid ${T.border}` }}>{topApps.length}</span>
            </div>
            {topApps.length===0
              ? <div style={{ textAlign:"center",padding:"28px 0",color:T.dim,fontSize:12 }}>No app data</div>
              : topApps.slice(0,7).map((app,i)=>{
                  const color=appColor(app.name);
                  return(
                    <div key={i} style={{ display:"flex",alignItems:"center",gap:9,padding:"7px 0",borderBottom:i<Math.min(topApps.length,7)-1?`1px solid ${T.border}`:"none" }}>
                      <span style={{ fontSize:9,color:T.dim,width:14,textAlign:"center",flexShrink:0 }}>#{i+1}</span>
                      <AppIcon name={app.name} size={22}/>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:11.5,fontWeight:700,color:T.sub,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{app.name}</div>
                        <PBar pct={app.pct||0} color={color} height={3}/>
                      </div>
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        {app.time&&<div style={{ fontSize:9,color:T.dim }}>{app.time}</div>}
                        <div style={{ fontSize:12,fontWeight:800,color }}>{app.pct}%</div>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          <div style={{ padding:isMobile?"16px 14px":"20px 24px" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <span style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em" }}>Task Summary</span>
              <span style={{ fontSize:10,color:T.dim,background:T.s2,padding:"1px 8px",borderRadius:6,border:`1px solid ${T.border}` }}>{tasks.length}</span>
            </div>
            {tasks.length===0
              ? <div style={{ textAlign:"center",padding:"28px 0",color:T.dim,fontSize:12 }}>No tasks</div>
              : <>
                  <div style={{ marginBottom:14,padding:"10px 12px",background:T.s0,border:`1px solid ${T.border}`,borderRadius:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                      <span style={{ fontSize:11,color:T.muted }}>Completion</span>
                      <span style={{ fontSize:12,fontWeight:700,color:actColor(taskPct) }}>{doneCount}/{tasks.length} ({taskPct}%)</span>
                    </div>
                    <PBar pct={taskPct} color={actColor(taskPct)} height={6}/>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6 }}>
                    {Object.entries(STATUS_TASK).map(([k,v])=>{
                      const n=tasks.filter(t=>t.status===k).length;
                      return(
                        <div key={k} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:T.s0,borderRadius:8,border:`1px solid ${T.border}` }}>
                          <span style={{ fontSize:10,color:T.muted }}>{v.label}</span>
                          <span style={{ fontSize:16,fontWeight:800,color:n>0?v.color:T.dim }}>{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
            }
          </div>
        </div>

        {/* ── ACTIVITY TIMELINE ── */}
        {timeline.length > 0 && (
          <div style={{ padding:isMobile?"16px 14px":"20px 24px",borderBottom:`1px solid ${T.border}`,overflowX:"auto" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <span style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em" }}>Activity Timeline</span>
              <span style={{ fontSize:10,color:T.dim,background:T.s2,padding:"1px 8px",borderRadius:6,border:`1px solid ${T.border}` }}>{timeline.length} entries</span>
            </div>
            <div style={{ background:T.s0,borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden",minWidth:isMobile?500:"auto" }}>
              <div style={{ display:"grid",gridTemplateColumns:"65px 140px 55px 1fr 50px",gap:10,padding:"8px 14px",background:T.bg,borderBottom:`1px solid ${T.border}` }}>
                {["Time","App","Dur","Activity","Score"].map(h=>(
                  <div key={h} style={{ fontSize:9,fontWeight:700,color:T.dim,textTransform:"uppercase",letterSpacing:".08em" }}>{h}</div>
                ))}
              </div>
              {timeline.slice(0,12).map((item,i)=>{
                const col=appColor(item.app); const pct=item.pct||0; const ac=actColor(pct);
                return(
                  <div key={i} style={{ display:"grid",gridTemplateColumns:"65px 140px 55px 1fr 50px",gap:10,padding:"9px 14px",borderBottom:i<Math.min(timeline.length,12)-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
                    <span style={{ fontSize:11,color:T.muted }}>{item.time}</span>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <AppIcon name={item.app} size={16}/>
                      <span style={{ fontSize:11,fontWeight:600,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{item.app}</span>
                    </div>
                    <span style={{ fontSize:11,color:T.muted }}>{item.duration}m</span>
                    <div style={{ height:14,background:T.bg,borderRadius:4,overflow:"hidden",border:`1px solid ${T.border}` }}>
                      <div style={{ height:"100%",width:`${Math.min(pct,100)}%`,background:`${col}55`,borderRadius:4 }}/>
                    </div>
                    <span style={{ fontSize:12,fontWeight:800,color:ac }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ALL TASKS ── */}
        {tasks.length > 0 && (
          <div style={{ padding:isMobile?"16px 14px":"20px 24px",borderBottom:`1px solid ${T.border}`,overflowX:"auto" }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
              <span style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em" }}>All Tasks</span>
              <span style={{ fontSize:10,color:T.dim,background:T.s2,padding:"1px 8px",borderRadius:6,border:`1px solid ${T.border}` }}>{tasks.length}</span>
            </div>
            <div style={{ background:T.s0,borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden",minWidth:isMobile?480:"auto" }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 110px 80px 85px",gap:10,padding:"8px 14px",background:T.bg,borderBottom:`1px solid ${T.border}` }}>
                {["Task","Status","Priority","Due"].map(h=>(
                  <div key={h} style={{ fontSize:9,fontWeight:700,color:T.dim,textTransform:"uppercase",letterSpacing:".08em" }}>{h}</div>
                ))}
              </div>
              {tasks.map((task,i)=>{
                const st=STATUS_TASK[task.status]||STATUS_TASK.pending;
                const pr=PRIORITY_TASK[task.priority]||PRIORITY_TASK.medium;
                const over=isOverdue(task.due_date,task.status);
                return(
                  <div key={task._id||i} style={{ display:"grid",gridTemplateColumns:"1fr 110px 80px 85px",gap:10,padding:"10px 14px",borderBottom:i<tasks.length-1?`1px solid ${T.border}`:"none",alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:12,fontWeight:600,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:task.status==="completed"?"line-through":"none",opacity:task.status==="completed"?0.55:1 }}>{task.title}</div>
                      {task.description&&<div style={{ fontSize:10,color:T.muted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{task.description}</div>}
                    </div>
                    <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:20,fontSize:9,fontWeight:700,background:st.bg,border:`1px solid ${st.border}`,color:st.color,whiteSpace:"nowrap" }}>{st.label}</span>
                    <span style={{ fontSize:11,color:pr.color,fontWeight:600 }}>{pr.label}</span>
                    <span style={{ fontSize:10,fontWeight:over?700:400,color:over?T.red:T.muted }}>{task.due_date?fmtDate(task.due_date):"—"}{over?" ⚠":""}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── SCREENSHOTS ── */}
        <div style={{ padding:isMobile?"16px 14px":"20px 24px" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14 }}>
            <span style={{ fontSize:10,fontWeight:700,color:T.indigo,textTransform:"uppercase",letterSpacing:".1em" }}>Screenshots</span>
            <span style={{ fontSize:10,color:T.dim,background:T.s2,padding:"1px 8px",borderRadius:6,border:`1px solid ${T.border}` }}>{screenshots.length}</span>
          </div>
          {screenshots.length===0
            ? <div style={{ textAlign:"center",padding:"32px 0",color:T.dim,fontSize:13 }}>
                <div style={{ fontSize:28,marginBottom:10 }}>📷</div>
                No screenshots captured
              </div>
            : <div style={{ display:"grid",gridTemplateColumns:`repeat(auto-fill,minmax(${ssMinW},1fr))`,gap:9 }}>
                {screenshots.map((sc,i)=>(
                  <ShotCard key={sc._id||i} sc={sc} onClick={(sc,src)=>{setLightSc(sc);setLightSrc(src);}}/>
                ))}
              </div>
          }
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 20px",background:T.bg,borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8 }}>
          <span style={{ fontSize:10,color:T.dim }}>WorkTrack Pro · Confidential</span>
          <span style={{ fontSize:10,color:T.dim }}>{empName} · {period}</span>
          <span style={{ fontSize:10,color:T.dim }}>{new Date().toLocaleDateString("en-PK")}</span>
        </div>
      </div>

      {/* Lightbox */}
      {lightSrc&&(
        <div onClick={()=>{setLightSc(null);setLightSrc(null);}}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.96)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
          <button onClick={()=>{setLightSc(null);setLightSrc(null);}}
            style={{ position:"absolute",top:20,right:20,width:36,height:36,borderRadius:8,background:T.s1,border:`1px solid ${T.border2}`,color:T.text,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center" }}>×</button>
          <div onClick={e=>e.stopPropagation()}>
            <img src={lightSrc} alt="" style={{ maxWidth:"88vw",maxHeight:"80vh",borderRadius:12,display:"block",boxShadow:"0 24px 80px rgba(0,0,0,.8)" }} onError={()=>setLightSrc(null)}/>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════ */
export default function Reports() {
  const width    = useWindowWidth();
  const isMobile = width < 640;

  const [employees,   setEmployees]   = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error,       setError]       = useState("");
  const [period,      setPeriod]      = useState("daily");
  const [selectedId,  setSelectedId]  = useState("");
  const [search,      setSearch]      = useState("");
  const [dropOpen,    setDropOpen]    = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", fn); return () => document.removeEventListener("mousedown", fn);
  }, []);

  // ✅ fetch → API
  const fetchEmployees = useCallback(async () => {
    setLoadingList(true); setError("");
    try {
      const res = await API.get("/employees/activity");
      const d   = res.data;
      setEmployees(Array.isArray(d) ? d : d.employees||d.data||[]);
    } catch(e) { setError(e?.response?.data?.message || e.message); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const selectedEmp = employees.find(e => (e._id||e.id) === selectedId);
  const selName     = selectedEmp ? `${selectedEmp.firstName||""} ${selectedEmp.lastName||""}`.trim() : "";

  const filteredEmps = employees.filter(e => {
    const n = `${e.firstName||""} ${e.lastName||""}`.trim().toLowerCase();
    return !search || n.includes(search.toLowerCase()) ||
      (e.department||"").toLowerCase().includes(search.toLowerCase()) ||
      (e.role||"").toLowerCase().includes(search.toLowerCase());
  });

  const depts     = [...new Set(filteredEmps.map(e=>e.department).filter(Boolean))];
  const grouped   = depts.reduce((acc,d)=>{acc[d]=filteredEmps.filter(e=>e.department===d);return acc;},{});
  const ungrouped = filteredEmps.filter(e=>!e.department);

  function EmpOption({ emp }) {
    const n  = `${emp.firstName||""} ${emp.lastName||""}`.trim()||emp.name||"Unknown";
    const id = emp._id||emp.id;
    const on = emp.status && emp.status !== "Offline";
    return (
      <div onClick={()=>{setSelectedId(id);setDropOpen(false);setSearch("");}}
        style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",
          background:selectedId===id?T.indigoDim:"transparent",
          borderLeft:`2px solid ${selectedId===id?T.indigo:"transparent"}`,transition:"all .1s" }}
        onMouseEnter={e=>{if(selectedId!==id)e.currentTarget.style.background=T.s0;}}
        onMouseLeave={e=>{if(selectedId!==id)e.currentTarget.style.background="transparent";}}>
        <Avatar name={n} size={32}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{n}</div>
          <div style={{ fontSize:10,color:T.muted }}>{emp.role}{emp.department&&` · ${emp.department}`}</div>
        </div>
        <span style={{ width:6,height:6,borderRadius:"50%",background:on?T.green:T.dim,flexShrink:0 }}/>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",color:T.sub }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        input::placeholder{color:#3a3a42!important;}
        @keyframes spin   {to{transform:rotate(360deg)}}
        @keyframes sPulse {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.85)}}
        @keyframes fadeUp {from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes dropIn {from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0c0c0f}
        ::-webkit-scrollbar-thumb{background:#2a2a30;border-radius:4px}
        select option{background:#111114;color:#f0f0f2}
      `}</style>

      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:20,flexWrap:"wrap" }}>
        <div style={{ width:36,height:36,borderRadius:11,background:T.indigoDim,border:`1px solid ${T.indigoB}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke={T.indigo} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize:isMobile?16:19,fontWeight:800,color:T.text,letterSpacing:"-0.02em",lineHeight:1 }}>Employee Reports</div>
          {!isMobile && <div style={{ fontSize:11,color:T.dim,marginTop:3 }}>Full one-page report per employee</div>}
        </div>
        <div style={{ flex:1,height:1,background:`linear-gradient(90deg,${T.border},transparent)`,marginLeft:8,minWidth:20 }}/>
        <button onClick={fetchEmployees}
          style={{ padding:"8px 14px",borderRadius:10,border:`1px solid ${T.border2}`,background:T.s1,color:T.muted,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:6 }}>
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ animation:loadingList?"spin .8s linear infinite":"none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div style={{ display:"flex",gap:10,marginBottom:20,alignItems:"center",flexWrap:"wrap" }}>
        {/* Dropdown */}
        <div ref={dropRef} style={{ position:"relative",flex:1,minWidth:isMobile?"100%":280 }}>
          <button onClick={()=>setDropOpen(o=>!o)}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:13,background:T.s1,border:`1px solid ${dropOpen?T.indigoB:T.border2}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"border-color .15s" }}>
            {selectedEmp?(
              <>
                <Avatar name={selName} size={28}/>
                <div style={{ flex:1,textAlign:"left",minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{selName}</div>
                  <div style={{ fontSize:10,color:T.muted }}>{selectedEmp.role}{selectedEmp.department&&` · ${selectedEmp.department}`}</div>
                </div>
              </>
            ):(
              <>
                <div style={{ width:28,height:28,borderRadius:"50%",background:T.s2,border:`1px solid ${T.border}`,flexShrink:0 }}/>
                <span style={{ flex:1,textAlign:"left",fontSize:13,color:T.dim }}>
                  {loadingList?"Loading…":`Select employee (${employees.length})…`}
                </span>
              </>
            )}
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={T.dim} strokeWidth={2.5}
              style={{ transform:dropOpen?"rotate(180deg)":"none",transition:"transform .2s",flexShrink:0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {dropOpen&&(
            <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,right:0,zIndex:200,background:T.s1,border:`1px solid ${T.border2}`,borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,.7)",animation:"dropIn .15s ease",overflow:"hidden" }}>
              <div style={{ padding:"10px 12px",borderBottom:`1px solid ${T.border}` }}>
                <input value={search} onChange={e=>setSearch(e.target.value)}
                  placeholder="Search…" autoFocus
                  style={{ width:"100%",padding:"8px 12px",borderRadius:9,background:T.s0,border:`1px solid ${T.border}`,color:T.text,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none" }}/>
              </div>
              <div style={{ maxHeight:300,overflowY:"auto" }}>
                {filteredEmps.length===0
                  ?<div style={{ padding:"20px",textAlign:"center",color:T.dim,fontSize:12 }}>No employees found</div>
                  :<>
                    {depts.map(dept=>(
                      <div key={dept}>
                        <div style={{ padding:"7px 14px 3px",fontSize:9,color:T.dim,textTransform:"uppercase",letterSpacing:".09em",fontWeight:700,background:T.bg }}>{dept}</div>
                        {grouped[dept].map(emp=><EmpOption key={emp._id||emp.id} emp={emp}/>)}
                      </div>
                    ))}
                    {ungrouped.map(emp=><EmpOption key={emp._id||emp.id} emp={emp}/>)}
                  </>
                }
              </div>
            </div>
          )}
        </div>

        {/* Period selector */}
        <div style={{ display:"flex",gap:2,background:T.s1,border:`1px solid ${T.border}`,borderRadius:13,padding:3,flexShrink:0 }}>
          {["daily","weekly","monthly"].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)}
              style={{ padding:isMobile?"7px 10px":"8px 16px",borderRadius:10,fontSize:isMobile?11:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",background:period===p?T.indigoDim:"transparent",border:`1px solid ${period===p?T.indigoB:"transparent"}`,color:period===p?T.indigo:T.muted,textTransform:"capitalize" }}>
              {isMobile?p.slice(0,1).toUpperCase()+p.slice(1,3):p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error&&<div style={{ padding:"10px 16px",borderRadius:11,marginBottom:14,background:T.redDim,border:`1px solid ${T.redB}`,fontSize:12,color:T.red }}>⚠ {error}</div>}

      {/* Empty state */}
      {!selectedId ? (
        <div style={{ background:T.s1,border:`1px solid ${T.border}`,borderRadius:20,padding:isMobile?"40px 16px":"60px 0",textAlign:"center" }}>
          <div style={{ width:56,height:56,borderRadius:16,background:T.indigoDim,border:`1px solid ${T.indigoB}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={T.indigo} strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div style={{ fontSize:17,fontWeight:800,color:T.text,marginBottom:6 }}>Select an Employee</div>
          <div style={{ fontSize:13,color:T.muted,marginBottom:24 }}>Complete one-page report with work hours, apps, tasks & screenshots</div>
          {employees.length > 0 && (
            <div style={{ display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",maxWidth:600,margin:"0 auto",padding:"0 16px" }}>
              {employees.slice(0,isMobile?4:8).map(e=>{
                const n=`${e.firstName||""} ${e.lastName||""}`.trim()||e.name||"?";
                const id=e._id||e.id;
                const on=e.status&&e.status!=="Offline";
                return(
                  <button key={id} onClick={()=>setSelectedId(id)}
                    style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:T.s0,border:`1px solid ${T.border}`,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=T.indigoB;e.currentTarget.style.background=T.indigoDim;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.s0;}}>
                    <Avatar name={n} size={24}/>
                    <span style={{ fontSize:12,fontWeight:600,color:T.sub }}>{n}</span>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:on?T.green:T.dim,flexShrink:0 }}/>
                  </button>
                );
              })}
              {employees.length>(isMobile?4:8)&&<div style={{ fontSize:11,color:T.dim,alignSelf:"center" }}>+{employees.length-(isMobile?4:8)} more</div>}
            </div>
          )}
        </div>
      ) : (
        <EmployeeReport
          key={`${selectedId}_${period}`}
          empId={selectedId}
          period={period.charAt(0).toUpperCase()+period.slice(1)}
          onBack={()=>setSelectedId("")}
        />
      )}
    </div>
  );
}
