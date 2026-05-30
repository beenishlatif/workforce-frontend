import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Activity, Clock, Zap, RefreshCw, Search,
  Calendar, ChevronDown, ShieldAlert, BarChart2,
  X, TrendingUp, Layers, Monitor
} from "lucide-react";
import API from "../api/axios.js";

const prodColor = p => p >= 70 ? "#4ade80" : p >= 40 ? "#fbbf24" : "#f87171";
function fmtMins(m) {
  if (!m || m <= 0) return "0m";
  const h = Math.floor(m / 60), mn = m % 60;
  return h === 0 ? `${mn}m` : mn === 0 ? `${h}h` : `${h}h ${mn}m`;
}

const BLOCKED = ["youtube","facebook","tiktok","instagram","twitter","netflix","whatsapp","snapchat","reddit"];
const isBlocked = (app="",title="") => BLOCKED.some(b=>(app+" "+title).toLowerCase().includes(b));

const APP_COLORS = {
  "Chrome":"#4285f4","Google Chrome":"#4285f4","Firefox":"#ff7139",
  "VS Code":"#007acc","Visual Studio Code":"#007acc","Figma":"#f24e1e",
  "Slack":"#e01e5a","Discord":"#5865f2","Zoom":"#2d8cff",
  "Outlook":"#0078d4","Gmail":"#ea4335","Notion":"#aaaaaa",
  "GitHub":"#8b949e","Postman":"#ff6c37","YouTube":"#ff0000","Spotify":"#1db954",
};
const PAL = ["#f43f5e","#fb923c","#facc15","#4ade80","#22d3ee","#818cf8","#e879f9","#f472b6"];
function appColor(n) {
  if (!n) return "#818cf8";
  if (APP_COLORS[n]) return APP_COLORS[n];
  let h = 0; for (let i = 0; i < n.length; i++) h = (h*31+n.charCodeAt(i))%PAL.length;
  return PAL[h];
}

function getCategory(app="", title="") {
  if (isBlocked(app,title)) return "distracting";
  const n = (app+" "+title).toLowerCase();
  if (["code","vs code","figma","postman","github","notion","jira","terminal","intellij","word","excel"].some(p=>n.includes(p))) return "productive";
  if (["slack","teams","discord","zoom","outlook","gmail","telegram"].some(p=>n.includes(p))) return "neutral";
  return "neutral";
}
const CAT_CFG = {
  productive:  { color:"#4ade80", bg:"rgba(74,222,128,0.1)",  border:"rgba(74,222,128,0.25)",  label:"Productive"  },
  distracting: { color:"#f87171", bg:"rgba(248,113,113,0.1)", border:"rgba(248,113,113,0.25)", label:"Distracting" },
  neutral:     { color:"#a78bfa", bg:"rgba(167,139,250,0.1)", border:"rgba(167,139,250,0.25)", label:"Neutral"     },
};

function AppIcon({ name, size=30 }) {
  const color  = appColor(name);
  const letter = (name||"?")[0].toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:7,background:`${color}20`,border:`1px solid ${color}35`,
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.42,fontWeight:800,color,flexShrink:0}}>
      {letter}
    </div>
  );
}

function DetailModal({ record, onClose }) {
  const cat = getCategory(record.app, record.activity);
  const cfg = CAT_CFG[cat];
  const color = appColor(record.app);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.88)",
      backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0c0d12",border:`1px solid ${color}30`,
        borderRadius:22,width:"100%",maxWidth:520,overflow:"hidden"}}>
        <div style={{background:`linear-gradient(135deg,${color}18,${color}06)`,borderBottom:`1px solid ${color}20`,
          padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <AppIcon name={record.app} size={44}/>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{record.app||"Unknown"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>Activity Detail</div>
            </div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:9,border:"1px solid rgba(255,255,255,0.08)",
            background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",
            cursor:"pointer",color:"#fff"}}><X size={14}/></button>
        </div>
        <div style={{padding:"20px 24px"}}>
          {record.activity && (
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",
              borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:5,textTransform:"uppercase",letterSpacing:".07em"}}>Window</div>
              <div style={{fontSize:13,color:"#fff",fontWeight:500}}>{record.activity}</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
            {[
              {label:"Time",        val:record.time,               icon:<Clock size={13}/>    },
              {label:"Duration",    val:fmtMins(record.duration||1),icon:<Activity size={13}/>},
              {label:"Productivity",val:`${record.pct||0}%`,       icon:<BarChart2 size={13}/>,color:prodColor(record.pct||0)},
              {label:"Category",    val:cfg.label,                  icon:<Layers size={13}/>,  color:cfg.color},
            ].map((item,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"10px 14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,0.35)",marginBottom:6}}>
                  {item.icon}<span style={{fontSize:10,textTransform:"uppercase",letterSpacing:".07em"}}>{item.label}</span>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:item.color||"#fff"}}>{item.val||"—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function groupByDate(records) {
  const groups = {};
  records.forEach(r => {
    const d   = new Date(r.createdAt||Date.now());
    const key = isNaN(d)?"Unknown":d.toISOString().split("T")[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  const now = new Date();
  return Object.entries(groups).sort(([a],[b])=>b.localeCompare(a)).map(([dateStr,items])=>{
    const d       = new Date(dateStr);
    const isToday = d.toDateString()===now.toDateString();
    const isYest  = new Date(now.getFullYear(),now.getMonth(),now.getDate()-1).toDateString()===d.toDateString();
    return { dateLabel: isToday?"Today":isYest?"Yesterday":d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}), items };
  });
}

export default function ActivityLog() {
  const { token } = useAuth();

  const [activities, setActivities] = useState([]);
  const [stats,      setStats]      = useState({ totalMins:0, avgPct:0, totalApps:0, topApps:[] });
  const [loading,    setLoading]    = useState(true);
  const [fetching,   setFetching]   = useState(false);
  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [dateRange,  setDateRange]  = useState("today");
  const [selRecord,  setSelRecord]  = useState(null);
  const [error,      setError]      = useState(null);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      // ✅ fetch ki jagah API use ho raha hai
      const res = await API.get(`/emp/activity?range=${dateRange}&limit=200`);
      setActivities(res.data.activities || []);
      setStats(res.data.stats || { totalMins:0, avgPct:0, totalApps:0, topApps:[] });
      setError(null);
    } catch(e) {
      setError(e.message);
    }
    setFetching(false);
    setLoading(false);
  }, [dateRange, token]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60000);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = activities.filter(a => {
    const matchSearch = !search||(a.app||"").toLowerCase().includes(search.toLowerCase())||(a.activity||"").toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter==="all"||getCategory(a.app,a.activity)===catFilter;
    return matchSearch && matchCat;
  });

  const dateLabel = {today:"Today",yesterday:"Yesterday",week:"This Week",month:"This Month",all:"All Time"}[dateRange];

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh",padding:"clamp(16px,4vw,28px) clamp(12px,4vw,32px)",fontFamily:"'Outfit',sans-serif",color:"#fff"}}>
      <style>{CSS}</style>
      {selRecord && <DetailModal record={selRecord} onClose={()=>setSelRecord(null)}/>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(129,140,248,0.15)",border:"1px solid rgba(129,140,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Activity size={17} color="#818cf8"/>
            </div>
            <h1 style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em"}}>Activity Log</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:46}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,opacity:.4}}>{fetching?"Refreshing...":`${activities.length} records · ${dateLabel}`}</span>
            {error && <span style={{fontSize:10,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"2px 8px",borderRadius:6}}>⚠ {error}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <Search size={12} color="#4b5563" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            <input placeholder="Search apps..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,paddingLeft:30,width:170}}/>
          </div>
          <div style={{position:"relative"}}>
            <select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={S.sel}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={11} color="#6b7280" style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
          <button onClick={fetchData} style={S.btn}>
            <RefreshCw size={13} style={{animation:fetching?"spin 1s linear infinite":"none"}}/> Refresh
          </button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:24}}>
        {[
          {icon:<Clock size={18}/>,    bg:"#3b82f6",label:"Active Time",      val:fmtMins(stats.totalMins), sub:dateLabel},
          {icon:<BarChart2 size={18}/>,bg:"#10b981",label:"Avg Productivity", val:`${stats.avgPct}%`,       vc:prodColor(stats.avgPct)},
          {icon:<Monitor size={18}/>,  bg:"#8b5cf6",label:"Apps Used",        val:stats.totalApps,          sub:"unique apps"},
          {icon:<Zap size={18}/>,      bg:"#f59e0b",label:"Activities",       val:activities.length,        sub:dateLabel},
        ].map((m,i)=>(
          <div key={i} className="metric-card" style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 20px"}}>
            <div style={{width:40,height:40,borderRadius:11,background:m.bg+"20",border:`1px solid ${m.bg}30`,display:"flex",alignItems:"center",justifyContent:"center",color:m.bg,marginBottom:12}}>{m.icon}</div>
            <div style={{fontSize:10,opacity:.4,marginBottom:4,textTransform:"uppercase",letterSpacing:".07em"}}>{m.label}</div>
            <div style={{fontSize:28,fontWeight:800,color:m.vc||"#fff",lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:10,opacity:.25}}>{m.sub||""}</div>
          </div>
        ))}
      </div>

      {stats.topApps?.length > 0 && (
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"14px 20px",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <TrendingUp size={13} color="#6b7280"/>
            <span style={{fontSize:10,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".08em"}}>Top Apps — {dateLabel}</span>
            <div style={{flex:1,height:1,background:"#1a1d2e"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:9}}>
            {stats.topApps.map(({name,mins},idx)=>{
              const color = appColor(name);
              const pct   = Math.round((mins/stats.topApps[0].mins)*100);
              return (
                <div key={name} style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.2)",width:14,textAlign:"right"}}>{idx+1}</span>
                  <AppIcon name={name} size={24}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                      <span style={{fontSize:12,fontWeight:600}}>{name}</span>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{fmtMins(mins)}</span>
                    </div>
                    <div style={{height:4,background:"#1f2937",borderRadius:4}}>
                      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"12px 16px",marginBottom:20}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[
            {key:"all",         label:"All",         count:activities.length,                                                                 color:"#818cf8"},
            {key:"productive",  label:"Productive",  count:activities.filter(a=>getCategory(a.app,a.activity)==="productive").length,          color:"#4ade80"},
            {key:"neutral",     label:"Neutral",     count:activities.filter(a=>getCategory(a.app,a.activity)==="neutral").length,             color:"#a78bfa"},
            {key:"distracting", label:"Distracting", count:activities.filter(a=>getCategory(a.app,a.activity)==="distracting").length,         color:"#f87171"},
          ].map(tab=>{
            const isA = catFilter===tab.key;
            return (
              <button key={tab.key} onClick={()=>setCatFilter(tab.key)}
                style={{display:"flex",alignItems:"center",gap:7,padding:"6px 12px",borderRadius:10,
                  border:`1px solid ${isA?tab.color+"60":"#1f2937"}`,background:isA?`${tab.color}15`:"rgba(255,255,255,0.02)",
                  cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:tab.color}}/>
                <span style={{fontSize:12,fontWeight:600,color:isA?"#fff":"rgba(255,255,255,0.5)"}}>{tab.label}</span>
                <span style={{fontSize:9,padding:"1px 7px",borderRadius:8,background:isA?`${tab.color}30`:"#1a1d2e",color:isA?tab.color:"rgba(255,255,255,0.3)",fontWeight:700}}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <RefreshCw size={22} color="#1f2937" style={{display:"block",margin:"0 auto 10px",animation:"spin 1s linear infinite"}}/>
          <div style={{fontSize:13,opacity:.3}}>Loading your activity...</div>
        </div>
      ) : filtered.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 0",background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14}}>
          <Activity size={32} color="#1f2937" style={{display:"block",margin:"0 auto 12px"}}/>
          <div style={{fontSize:14,opacity:.3}}>No activity found</div>
        </div>
      ) : (
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"2.5fr 2fr 1fr 1fr 1.2fr 90px",padding:"11px 20px",overflowX:"auto",
            borderBottom:"1px solid #1f2937",background:"rgba(255,255,255,0.02)"}}>
            {["Application","Window / Activity","Duration","Productivity","Category","Time"].map(h=>(
              <div key={h} style={{fontSize:10,opacity:.35,textTransform:"uppercase",letterSpacing:".07em",fontWeight:700}}>{h}</div>
            ))}
          </div>
          {groupByDate(filtered).map(({dateLabel:dl,items})=>(
            <div key={dl}>
              <div style={{padding:"7px 20px",background:"rgba(255,255,255,0.015)",borderBottom:"1px solid rgba(30,34,53,0.5)",display:"flex",alignItems:"center",gap:10}}>
                <Calendar size={10} color="#4b5563"/>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontWeight:700,textTransform:"uppercase",letterSpacing:".08em"}}>{dl}</span>
                <div style={{flex:1,height:1,background:"#1a1d2e"}}/>
                <span style={{fontSize:10,color:"rgba(255,255,255,0.2)"}}>{items.length} entries</span>
              </div>
              {items.map((rec,i)=>{
                const cat = getCategory(rec.app,rec.activity);
                const cfg = CAT_CFG[cat];
                const pct = rec.pct||0;
                return (
                  <div key={rec._id||i} className="act-row" onClick={()=>setSelRecord(rec)}
                    style={{display:"grid",gridTemplateColumns:"2.5fr 2fr 1fr 1fr 1.2fr 90px",padding:"13px 20px",
                      borderBottom:i<items.length-1?"1px solid rgba(30,34,53,0.5)":"none",cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <AppIcon name={rec.app} size={32}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:700}}>{rec.app||"Unknown"}</div>
                        {cat==="distracting"&&<div style={{fontSize:9,color:"#f87171",display:"inline-flex",alignItems:"center",gap:3,background:"rgba(248,113,113,0.1)",padding:"1px 6px",borderRadius:4,marginTop:2}}><ShieldAlert size={8}/> Blocked</div>}
                      </div>
                    </div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.45)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",paddingRight:8}}>{rec.activity||"—"}</div>
                    <div style={{display:"flex",alignItems:"center",fontSize:13,fontWeight:600,color:rec.duration>60?"#fff":"rgba(255,255,255,0.6)"}}>{fmtMins(rec.duration||1)}</div>
                    <div style={{display:"flex",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:prodColor(pct),marginBottom:3}}>{pct}%</div>
                        <div style={{width:55,height:3,background:"#1f2937",borderRadius:4}}>
                          <div style={{width:`${pct}%`,height:"100%",background:prodColor(pct),borderRadius:4}}/>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center"}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:cfg.bg,border:`1px solid ${cfg.border}`,color:cfg.color}}>
                        <span style={{width:5,height:5,borderRadius:"50%",background:cfg.color}}/>{cfg.label}
                      </span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",fontSize:12,color:"rgba(255,255,255,0.3)"}}>
                      <Clock size={10} style={{marginRight:4}}/>{rec.time||"—"}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S = {
  sel:  {padding:"8px 28px 8px 12px",borderRadius:9,border:"1px solid #1f2937",background:"#111827",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",appearance:"none",outline:"none"},
  btn:  {display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #1f2937",background:"#111827",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"},
  input:{padding:"8px 12px",borderRadius:9,border:"1px solid #1f2937",background:"#111827",color:"#fff",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none"},
};
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  select option{background:#111827;color:#fff;}
  input::placeholder{color:rgba(255,255,255,0.2)!important;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .metric-card{transition:transform 0.2s,border-color 0.2s;}
  .metric-card:hover{transform:translateY(-2px);border-color:#27272a!important;}
  .act-row:hover{background:rgba(255,255,255,0.025)!important;}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0a0f;}::-webkit-scrollbar-thumb{background:#1f2937;border-radius:4px;}
`;