import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Clock, RefreshCw, ChevronDown, TrendingUp, Coffee, Zap, Calendar, BarChart2 } from "lucide-react";

const BASE = "http://localhost:5000";
const prodColor = p => p>=70?"#4ade80":p>=40?"#fbbf24":"#f87171";
function fmtMins(m) { if(!m||m<=0)return"0m"; const h=Math.floor(m/60),mn=m%60; return h===0?`${mn}m`:mn===0?`${h}h`:`${h}h ${mn}m`; }

export default function WorkHours() {
  const { token } = useAuth();  // ✅ useAuth se token lo

  const [hourly,    setHourly]    = useState(Array(24).fill(0));
  const [daily,     setDaily]     = useState([]);
  const [stats,     setStats]     = useState({ totalMins:0, workMins:0, afterMins:0, avgPct:0 });
  const [loading,   setLoading]   = useState(true);
  const [fetching,  setFetching]  = useState(false);
  const [dateRange, setDateRange] = useState("today");
  const [error,     setError]     = useState(null);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const r = await fetch(`${BASE}/api/emp/workhours?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setHourly(data.hourly || Array(24).fill(0));
      setDaily(data.daily   || []);
      setStats(data.stats   || { totalMins:0, workMins:0, afterMins:0, avgPct:0 });
      setError(null);
    } catch(e) {
      setError(e.message);
    }
    setFetching(false);
    setLoading(false);
  }, [dateRange, token]);

  useEffect(() => { fetchData(); const id=setInterval(fetchData,60000); return ()=>clearInterval(id); }, [fetchData]);

  const maxMins  = Math.max(...hourly, 1);
  const maxWeek  = Math.max(...daily.map(d=>d.mins), 1);
  const today    = new Date();
  const dateLabel= {today:"Today",yesterday:"Yesterday",week:"This Week",all:"All Time"}[dateRange];

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh",padding:"28px 32px",fontFamily:"'Outfit',sans-serif",color:"#fff"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Clock size={17} color="#34d399"/>
            </div>
            <h1 style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em"}}>Work Hours</h1>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:46}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:"#4ade80",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:11,opacity:.4}}>{fetching?"Refreshing...":`${fmtMins(stats.totalMins)} logged · ${dateLabel}`}</span>
            {error&&<span style={{fontSize:10,color:"#f87171",background:"rgba(248,113,113,0.1)",padding:"2px 8px",borderRadius:6}}>⚠ {error}</span>}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{position:"relative"}}>
            <select value={dateRange} onChange={e=>setDateRange(e.target.value)} style={S.sel}>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={11} color="#6b7280" style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
          <button onClick={fetchData} style={S.btn}>
            <RefreshCw size={13} style={{animation:fetching?"spin 1s linear infinite":"none"}}/> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
        {[
          {icon:<Clock size={18}/>,    bg:"#3b82f6",label:"Total Time",      val:fmtMins(stats.totalMins), sub:dateLabel},
          {icon:<Zap size={18}/>,      bg:"#10b981",label:"Work Hours",      val:fmtMins(stats.workMins),  sub:"9AM – 6PM"},
          {icon:<Coffee size={18}/>,   bg:"#f59e0b",label:"After Hours",     val:fmtMins(stats.afterMins), vc:stats.afterMins>60?"#fbbf24":"#fff"},
          {icon:<BarChart2 size={18}/>,bg:"#8b5cf6",label:"Avg Productivity",val:`${stats.avgPct}%`,       vc:prodColor(stats.avgPct)},
        ].map((m,i)=>(
          <div key={i} className="metric-card" style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 20px"}}>
            <div style={{width:40,height:40,borderRadius:11,background:m.bg+"20",border:`1px solid ${m.bg}30`,display:"flex",alignItems:"center",justifyContent:"center",color:m.bg,marginBottom:12}}>{m.icon}</div>
            <div style={{fontSize:10,opacity:.4,marginBottom:4,textTransform:"uppercase",letterSpacing:".07em"}}>{m.label}</div>
            <div style={{fontSize:26,fontWeight:800,color:m.vc||"#fff",lineHeight:1,marginBottom:4}}>{m.val}</div>
            <div style={{fontSize:10,opacity:.25}}>{m.sub||""}</div>
          </div>
        ))}
      </div>

      {/* Hourly Chart */}
      <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"20px 24px",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <TrendingUp size={14} color="#6b7280"/>
          <span style={{fontSize:13,fontWeight:700}}>Hourly Activity — {dateLabel}</span>
          <div style={{flex:1,height:1,background:"#1a1d2e"}}/>
          <div style={{display:"flex",gap:12,fontSize:10,color:"rgba(255,255,255,0.35)"}}>
            <span><span style={{display:"inline-block",width:8,height:8,background:"#818cf8",borderRadius:2,marginRight:4}}/>Work hours</span>
            <span><span style={{display:"inline-block",width:8,height:8,background:"#fbbf24",borderRadius:2,marginRight:4}}/>After hours</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"flex-end",gap:4,height:140,overflowX:"auto",paddingBottom:8}}>
          {hourly.map((mins,i)=>{
            const isWork = i>=9&&i<18;
            const pct    = maxMins>0?(mins/maxMins)*100:0;
            const isNow  = today.getHours()===i&&dateRange==="today";
            const label  = i===0?"12AM":i<12?`${i}AM`:i===12?"12PM":`${i-12}PM`;
            return (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:28,flex:"0 0 28px"}}>
                {mins>0&&<div style={{fontSize:8,color:"rgba(255,255,255,0.4)",whiteSpace:"nowrap"}}>{fmtMins(mins)}</div>}
                <div style={{width:"100%",flex:1,display:"flex",alignItems:"flex-end"}}>
                  <div style={{width:"100%",height:`${Math.max(pct,mins>0?4:0)}%`,minHeight:mins>0?4:0,
                    background:isNow?"#4ade80":isWork?"#818cf8":"#fbbf24",
                    borderRadius:"4px 4px 0 0",transition:"height 0.4s",
                    boxShadow:isNow?"0 0 8px rgba(74,222,128,0.5)":"none",opacity:isWork?1:0.6}}/>
                </div>
                <div style={{fontSize:8,color:isNow?"#4ade80":"rgba(255,255,255,0.25)",whiteSpace:"nowrap",fontWeight:isNow?700:400}}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Chart */}
      {daily.length>0&&(
        <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"20px 24px",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
            <Calendar size={14} color="#6b7280"/>
            <span style={{fontSize:13,fontWeight:700}}>Daily Breakdown</span>
            <div style={{flex:1,height:1,background:"#1a1d2e"}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${daily.length},1fr)`,gap:8}}>
            {daily.map((day,i)=>{
              const pct     = maxWeek>0?(day.mins/maxWeek)*100:0;
              const d       = new Date(day.date);
              const isToday = d.toDateString()===today.toDateString();
              const dayName = d.toLocaleDateString("en-US",{weekday:"short"});
              return (
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{fontSize:11,fontWeight:700,color:prodColor(day.avgPct)}}>{day.avgPct}%</div>
                  <div style={{width:"100%",height:80,display:"flex",alignItems:"flex-end",background:"rgba(255,255,255,0.02)",borderRadius:8,overflow:"hidden",position:"relative"}}>
                    <div style={{width:"100%",height:`${Math.max(pct,day.mins>0?6:0)}%`,minHeight:day.mins>0?6:0,
                      background:isToday?"#4ade80":"#818cf8",opacity:isToday?1:0.7,transition:"height 0.5s"}}/>
                    {isToday&&<div style={{position:"absolute",inset:0,border:"1px solid rgba(74,222,128,0.4)",borderRadius:8,pointerEvents:"none"}}/>}
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:isToday?"#4ade80":"rgba(255,255,255,0.6)"}}>{dayName}</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",fontWeight:600}}>{fmtMins(day.mins)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Session Breakdown */}
      <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"20px 24px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <Clock size={14} color="#6b7280"/>
          <span style={{fontSize:13,fontWeight:700}}>Session Breakdown</span>
          <div style={{flex:1,height:1,background:"#1a1d2e"}}/>
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:"30px 0",opacity:.3}}>
            <RefreshCw size={18} style={{display:"block",margin:"0 auto 8px",animation:"spin 1s linear infinite"}}/>
          </div>
        ) : hourly.filter(m=>m>0).length===0 ? (
          <div style={{textAlign:"center",padding:"20px 0",opacity:.3,fontSize:13}}>No sessions for this period</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {hourly.map((mins,i)=>{
              if (!mins) return null;
              const isWork = i>=9&&i<18;
              const label  = i===0?"12 AM":i<12?`${i} AM`:i===12?"12 PM":`${i-12} PM`;
              const barPct = maxMins>0?Math.round((mins/maxMins)*100):0;
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:52,fontSize:11,color:"rgba(255,255,255,0.4)",textAlign:"right",flexShrink:0}}>{label}</div>
                  <div style={{flex:1,height:24,background:"rgba(255,255,255,0.03)",borderRadius:6,overflow:"hidden",position:"relative"}}>
                    <div style={{height:"100%",width:`${barPct}%`,background:isWork?"rgba(129,140,248,0.5)":"rgba(251,191,36,0.3)",
                      borderRadius:6,display:"flex",alignItems:"center",paddingLeft:8,transition:"width 0.4s"}}>
                      {barPct>20&&<span style={{fontSize:10,color:"#fff",fontWeight:600,opacity:.8}}>{fmtMins(mins)}</span>}
                    </div>
                    {barPct<=20&&<span style={{position:"absolute",left:`${barPct+2}%`,top:"50%",transform:"translateY(-50%)",fontSize:10,color:"rgba(255,255,255,0.4)"}}>{fmtMins(mins)}</span>}
                  </div>
                  {!isWork&&<span style={{fontSize:9,color:"#fbbf24",background:"rgba(251,191,36,0.1)",padding:"2px 5px",borderRadius:4,flexShrink:0}}>OT</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  sel:{padding:"8px 28px 8px 12px",borderRadius:9,border:"1px solid #1f2937",background:"#111827",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"'Outfit',sans-serif",appearance:"none",outline:"none"},
  btn:{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #1f2937",background:"#111827",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"},
};
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  select option{background:#111827;color:#fff;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .metric-card{transition:transform 0.2s,border-color 0.2s;}
  .metric-card:hover{transform:translateY(-2px);border-color:#27272a!important;}
  ::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:#0a0a0f;}::-webkit-scrollbar-thumb{background:#1f2937;border-radius:4px;}
`;