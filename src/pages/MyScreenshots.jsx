import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Camera, RefreshCw, Search, ChevronDown, Shield, ShieldAlert, X, Clock, Calendar, BarChart2, AlertOctagon, ImageIcon, MonitorPlay } from "lucide-react";

const BASE = "https://workforce-backend-dusky.vercel.app";
const prodColor = p => p>=70?"#4ade80":p>=40?"#fbbf24":"#f87171";

function filterDate(arr, range) {
  if (range==="all") return arr;
  const now = new Date();
  return arr.filter(s => {
    const d = new Date(s.createdAt||s.date);
    if (isNaN(d)) return true;
    if (range==="today")     return d.toDateString()===now.toDateString();
    if (range==="yesterday") { const y=new Date(now); y.setDate(now.getDate()-1); return d.toDateString()===y.toDateString(); }
    if (range==="week")      { const w=new Date(now); w.setDate(now.getDate()-7); return d>=w; }
    if (range==="month")     return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
    return true;
  });
}

function Img({ src, style }) {
  const [err, setErr] = useState(false);
  const imgSrc = !src ? null : src.startsWith("data:")||src.startsWith("http")||src.startsWith("/") ? src : `data:image/jpeg;base64,${src}`;
  if (!imgSrc||err) return (
    <div style={{...style,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,background:"#0d0d10"}}>
      <Camera size={18} color="#27272a"/><span style={{fontSize:9,color:"#3f3f46"}}>No image</span>
    </div>
  );
  return <img src={imgSrc} alt="" style={style} onError={()=>setErr(true)}/>;
}

function ViewerModal({ shot, onClose }) {
  const blocked = shot.isBlocked;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.92)",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:20,width:"100%",maxWidth:900,overflow:"hidden"}}>
        <div style={{padding:"16px 22px",borderBottom:"1px solid #1f2937",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Camera size={16} color="#818cf8"/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>{shot.app||"Unknown"}</div>
              {shot.windowTitle&&<div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:1}}>{shot.windowTitle}</div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,
              background:blocked?"rgba(248,113,113,0.1)":"rgba(74,222,128,0.1)",
              border:blocked?"1px solid rgba(248,113,113,0.3)":"1px solid rgba(74,222,128,0.3)",
              color:blocked?"#f87171":"#4ade80"}}>
              {blocked?<ShieldAlert size={9}/>:<Shield size={9}/>}{blocked?"Blocked":"Clean"}
            </span>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:8,border:"1px solid #1f2937",background:"#111827",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff"}}>
              <X size={14}/>
            </button>
          </div>
        </div>
        <div style={{background:"#060609",padding:16}}>
          <Img src={shot.imageUrl} style={{width:"100%",maxHeight:500,objectFit:"contain",display:"block",borderRadius:10}}/>
        </div>
        <div style={{padding:"12px 22px",borderTop:"1px solid #1f2937",display:"flex",gap:20,flexWrap:"wrap"}}>
          {[
            {label:"Date",val:shot.date||"—"},
            {label:"Time",val:shot.time||"—"},
            {label:"Productivity",val:`${shot.productivity||0}%`,color:prodColor(shot.productivity||0)},
          ].map((item,i)=>(
            <div key={i}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:2,textTransform:"uppercase",letterSpacing:".06em"}}>{item.label}</div>
              <div style={{fontSize:13,fontWeight:700,color:item.color||"#fff"}}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MyScreenshots() {
  const { token } = useAuth();  // ✅ useAuth se token lo

  const [shots,     setShots]     = useState([]);
  const [stats,     setStats]     = useState({ total:0, blocked:0, clean:0, avgProd:0 });
  const [loading,   setLoading]   = useState(true);
  const [fetching,  setFetching]  = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [viewShot,  setViewShot]  = useState(null);
  const [error,     setError]     = useState(null);

  const fetchShots = useCallback(async () => {
    setFetching(true);
    try {
      const r = await fetch(`${BASE}/api/emp/screenshots?range=${dateRange}&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setShots(data.screenshots || []);
      setStats(data.stats || { total:0, blocked:0, clean:0, avgProd:0 });
      setError(null);
    } catch(e) {
      setError(e.message);
    }
    setFetching(false);
    setLoading(false);
  }, [dateRange, token]);

  useEffect(() => { fetchShots(); const id=setInterval(fetchShots,60000); return ()=>clearInterval(id); }, [fetchShots]);

  const displayed = shots
    .filter(s => !search||(s.app||"").toLowerCase().includes(search.toLowerCase())||(s.windowTitle||"").toLowerCase().includes(search.toLowerCase()))
    .filter(s => filter==="all"?true:filter==="blocked"?s.isBlocked:!s.isBlocked);

  const dateLabel = {all:"All Time",today:"Today",yesterday:"Yesterday",week:"This Week",month:"This Month"}[dateRange];

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh",padding:"clamp(16px,4vw,28px) clamp(12px,4vw,32px)",fontFamily:"'Outfit',sans-serif",color:"#fff"}}>
      <style>{CSS}</style>
      {viewShot && <ViewerModal shot={viewShot} onClose={()=>setViewShot(null)}/>}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <MonitorPlay size={17} color="#818cf8"/>
            </div>
            <h1 style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em"}}>My Screenshots</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:46}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,opacity:.4}}>{fetching?"Refreshing...":`${shots.length} screenshots · ${dateLabel}`}</span>
            {error&&<span style={{fontSize:10,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"2px 8px",borderRadius:6}}>⚠ {error}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <Search size={12} color="#4b5563" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            <input placeholder="Search app..." value={search} onChange={e=>setSearch(e.target.value)} style={{...S.input,paddingLeft:30,width:170}}/>
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
          <button onClick={fetchShots} style={S.btn}>
            <RefreshCw size={13} style={{animation:fetching?"spin 1s linear infinite":"none"}}/> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:24}}>
        {[
          {icon:<ImageIcon size={18}/>,   bg:"#3b82f6",label:"Total",       val:stats.total,    sub:dateLabel},
          {icon:<BarChart2 size={18}/>,   bg:"#10b981",label:"Avg Productivity",val:`${stats.avgProd}%`,vc:prodColor(stats.avgProd)},
          {icon:<Shield size={18}/>,      bg:"#4ade80",label:"Clean",        val:stats.clean,    sub:"screenshots"},
          {icon:<AlertOctagon size={18}/>,bg:"#ef4444",label:"Blocked",      val:stats.blocked,  vc:stats.blocked>0?"#f87171":"#fff",sub:"flagged"},
        ].map((m,i)=>(
          <div key={i} className="metric-card" style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 20px"}}>
            <div style={{width:40,height:40,borderRadius:11,background:m.bg+"20",border:`1px solid ${m.bg}30`,display:"flex",alignItems:"center",justifyContent:"center",color:m.bg,marginBottom:12}}>{m.icon}</div>
            <div style={{fontSize:10,opacity:.4,marginBottom:4,textTransform:"uppercase",letterSpacing:".07em"}}>{m.label}</div>
            <div style={{fontSize:28,fontWeight:800,color:m.vc||"#fff",lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:10,opacity:.25}}>{m.sub||""}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {[
          {key:"all",    label:"All Screenshots",count:shots.length,        color:"#818cf8"},
          {key:"clean",  label:"Clean Only",      count:stats.clean,         color:"#4ade80"},
          {key:"blocked",label:"Blocked",          count:stats.blocked,       color:"#f87171"},
        ].map(tab=>{
          const isA=filter===tab.key;
          return (
            <button key={tab.key} onClick={()=>setFilter(tab.key)}
              style={{display:"flex",alignItems:"center",gap:7,padding:"6px 14px",borderRadius:10,
                border:`1px solid ${isA?tab.color+"60":"#1f2937"}`,background:isA?`${tab.color}15`:"rgba(255,255,255,0.02)",
                cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:tab.color}}/>
              <span style={{fontSize:12,fontWeight:600,color:isA?"#fff":"rgba(255,255,255,0.5)"}}>{tab.label}</span>
              <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:8,background:isA?`${tab.color}30`:"#1a1d2e",color:isA?tab.color:"rgba(255,255,255,0.3)"}}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <RefreshCw size={22} color="#1f2937" style={{display:"block",margin:"0 auto 10px",animation:"spin 1s linear infinite"}}/>
          <div style={{fontSize:13,opacity:.3}}>Loading your screenshots...</div>
        </div>
      ) : displayed.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 0",background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14}}>
          <Camera size={32} color="#1f2937" style={{display:"block",margin:"0 auto 12px"}}/>
          <div style={{fontSize:14,opacity:.3}}>No screenshots found</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
          {displayed.map((s,i)=>(
            <div key={s._id||i} className="shot-card" onClick={()=>setViewShot(s)}
              style={{background:"#0f1117",borderRadius:14,overflow:"hidden",cursor:"pointer",
                border:`1px solid ${s.isBlocked?"rgba(248,113,113,0.25)":"#1a1d2e"}`,transition:"all 0.2s"}}>
              <div style={{position:"relative"}}>
                <Img src={s.imageUrl} style={{width:"100%",height:130,objectFit:"cover",display:"block"}}/>
                <div style={{position:"absolute",top:7,left:7,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,color:prodColor(s.productivity||0)}}>
                  {s.productivity||0}%
                </div>
                <div style={{position:"absolute",top:7,right:7}}>
                  <span style={{fontSize:8,fontWeight:700,padding:"2px 7px",borderRadius:6,display:"flex",alignItems:"center",gap:3,
                    background:s.isBlocked?"rgba(248,113,113,0.18)":"rgba(74,222,128,0.15)",
                    color:s.isBlocked?"#f87171":"#4ade80",border:`1px solid ${s.isBlocked?"rgba(248,113,113,0.3)":"rgba(74,222,128,0.25)"}`}}>
                    {s.isBlocked?<ShieldAlert size={7}/>:<Shield size={7}/>}{s.isBlocked?"BLOCKED":"CLEAN"}
                  </span>
                </div>
              </div>
              <div style={{padding:"10px 12px"}}>
                <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{s.app||"Unknown"}</div>
                {s.windowTitle&&<div style={{fontSize:10,color:"rgba(255,255,255,0.3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:6}}>{s.windowTitle}</div>}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(255,255,255,0.3)"}}>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><Calendar size={8}/>{s.date||"—"}</span>
                  <span style={{display:"flex",alignItems:"center",gap:3}}><Clock size={8}/>{s.time||"—"}</span>
                </div>
              </div>
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
  .shot-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.6);}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0a0f;}::-webkit-scrollbar-thumb{background:#1f2937;border-radius:4px;}
`;