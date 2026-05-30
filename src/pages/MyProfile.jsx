import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Phone, MapPin, Building2, Briefcase, Calendar, Edit2, Save, X, RefreshCw, Clock, BarChart2, Activity, CheckCircle } from "lucide-react";

const BASE = "https://workforce-backend-dusky.vercel.app";
const prodColor = p=>p>=70?"#4ade80":p>=40?"#fbbf24":"#f87171";
function fmtMins(m){if(!m||m<=0)return"0m";const h=Math.floor(m/60),mn=m%60;return h===0?`${mn}m`:mn===0?`${h}h`:`${h}h ${mn}m`;}
const GRADS=["linear-gradient(135deg,#3b82f6,#1d4ed8)","linear-gradient(135deg,#10b981,#065f46)","linear-gradient(135deg,#8b5cf6,#4c1d95)","linear-gradient(135deg,#f59e0b,#92400e)","linear-gradient(135deg,#ec4899,#831843)"];
function ini(name){return(name||"??").split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);}
const STATUS_CFG={Online:{color:"#4ade80",bg:"rgba(74,222,128,0.1)",border:"rgba(74,222,128,0.25)"},Idle:{color:"#fbbf24",bg:"rgba(251,191,36,0.1)",border:"rgba(251,191,36,0.25)"},Offline:{color:"#f87171",bg:"rgba(248,113,113,0.1)",border:"rgba(248,113,113,0.25)"}};

export default function MyProfile() {
  const { token } = useAuth();  // ✅ useAuth se token lo

  const [profile,  setProfile]  = useState(null);
  const [tasks,    setTasks]    = useState([]);
  const [stats,    setStats]    = useState({ totalMins:0, avgPct:0, activities:0 });
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [editData, setEditData] = useState({});
  const [error,    setError]    = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [rp, rd] = await Promise.all([
        fetch(`${BASE}/api/emp/profile`,   { headers }),
        fetch(`${BASE}/api/emp/dashboard`, { headers }),
      ]);

      if (rp.ok) { const d=await rp.json(); setProfile(d); setEditData(d); }
      if (rd.ok) {
        const d = await rd.json();
        setTasks(d.recentTasks||[]);
        setStats({
          totalMins:   d.stats?.totalMins  ||0,
          avgPct:      d.stats?.avgPct     ||0,
          activities:  d.recentActivity?.length||0,
        });
      }
      setError(null);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }, [token]);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/api/emp/profile`, {
        method: "PUT",
        headers: { Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body: JSON.stringify(editData),
      });
      if (r.ok) { const d=await r.json(); setProfile(d); setSaved(true); setTimeout(()=>setSaved(false),2500); }
      setEditing(false);
    } catch(e) { alert("Save failed: "+e.message); }
    setSaving(false);
  };

  if (loading) return (
    <div style={{background:"#0a0a0f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <RefreshCw size={24} color="#1f2937" style={{display:"block",margin:"0 auto 12px",animation:"spin 1s linear infinite"}}/>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.3)"}}>Loading profile...</div>
      </div>
    </div>
  );

  const p      = profile||{};
  const name   = `${p.firstName||""} ${p.lastName||""}`.trim()||"Employee";
  const grad   = GRADS[(name.charCodeAt(0)||0)%GRADS.length];
  const status = p.status||"Offline";
  const sCfg   = STATUS_CFG[status]||STATUS_CFG.Offline;
  const doneTasks = tasks.filter(t=>t.status==="completed").length;
  const PRIORITY_C={low:"#4ade80",medium:"#fbbf24",high:"#fb923c",urgent:"#f87171"};
  const STATUS_C={pending:"#fbbf24",in_progress:"#818cf8",in_review:"#06b6d4",completed:"#4ade80",blocked:"#f87171"};

  return (
    <div style={{background:"#0a0a0f",minHeight:"100vh",padding:"clamp(16px,4vw,28px) clamp(12px,4vw,32px)",fontFamily:"'Outfit',sans-serif",color:"#fff"}}>
      <style>{CSS}</style>

      {saved&&(
        <div style={{position:"fixed",top:20,right:20,zIndex:999,background:"rgba(74,222,128,0.15)",border:"1px solid rgba(74,222,128,0.4)",borderRadius:12,padding:"10px 18px",display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#4ade80",fontFamily:"'Outfit',sans-serif"}}>
          <CheckCircle size={15}/> Profile saved!
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <div style={{width:36,height:36,borderRadius:10,background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <User size={17} color="#a78bfa"/>
            </div>
            <h1 style={{fontSize:22,fontWeight:800,letterSpacing:"-0.02em"}}>My Profile</h1>
          </div>
          {error&&<div style={{fontSize:10,color:"#f87171",marginLeft:46}}>⚠ {error}</div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          {editing?(
            <>
              <button onClick={()=>{setEditing(false);setEditData(p);}} style={{...S.btn,borderColor:"rgba(248,113,113,0.3)",color:"#f87171"}}>
                <X size={13}/> Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{...S.btn,borderColor:"rgba(74,222,128,0.4)",background:"rgba(74,222,128,0.1)",color:"#4ade80"}}>
                {saving?<RefreshCw size={13} style={{animation:"spin 1s linear infinite"}}/>:<Save size={13}/>}
                {saving?"Saving...":"Save"}
              </button>
            </>
          ):(
            <button onClick={()=>setEditing(true)} style={S.btn}><Edit2 size={13}/> Edit Profile</button>
          )}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,alignItems:"start"}}>

        {/* LEFT */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Profile Card */}
          <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:16,overflow:"hidden"}}>
            <div style={{height:80,background:grad}}/>
            <div style={{padding:"0 20px 20px",marginTop:-36}}>
              <div style={{width:64,height:64,borderRadius:16,background:grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",border:"3px solid #0f1117",marginBottom:12,position:"relative"}}>
                {ini(name)}
                <span style={{position:"absolute",bottom:2,right:2,width:13,height:13,borderRadius:"50%",background:sCfg.color,border:"2px solid #0f1117"}}/>
              </div>
              <div style={{fontSize:17,fontWeight:800,marginBottom:6}}>{name}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:sCfg.bg,border:`1px solid ${sCfg.border}`,color:sCfg.color}}>
                  <span style={{width:5,height:5,borderRadius:"50%",background:sCfg.color}}/>{status}
                </span>
                {p.department&&<span style={{fontSize:11,background:"#111827",padding:"3px 9px",borderRadius:6,border:"1px solid #1f2937",display:"flex",alignItems:"center",gap:4}}><Building2 size={9} color="#818cf8"/>{p.department}</span>}
              </div>
              {[
                {icon:<Mail size={12}/>,      val:p.email},
                {icon:<Phone size={12}/>,     val:p.phone},
                {icon:<MapPin size={12}/>,    val:[p.city,p.country].filter(Boolean).join(", ")},
                {icon:<Briefcase size={12}/>, val:p.role},
                {icon:<Calendar size={12}/>,  val:p.joinDate?`Joined ${p.joinDate}`:null},
              ].filter(r=>r.val).map((row,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:9,marginBottom:8,color:"rgba(255,255,255,0.5)"}}>
                  <span style={{color:"rgba(255,255,255,0.25)",flexShrink:0}}>{row.icon}</span>
                  <span style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.val}</span>
                </div>
              ))}
              {p.empId&&(
                <div style={{marginTop:8,padding:"6px 10px",background:"rgba(129,140,248,0.08)",borderRadius:8,border:"1px solid rgba(129,140,248,0.2)"}}>
                  <span style={{fontSize:10,color:"rgba(129,140,248,0.7)"}}>ID: </span>
                  <span style={{fontSize:11,fontWeight:700,color:"#a78bfa"}}>{p.empId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Task Summary */}
          <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px 20px"}}>
            <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".08em",marginBottom:14}}>Task Summary</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:12}}>
              {[
                {label:"Total",val:tasks.length,     color:"#818cf8"},
                {label:"Done", val:doneTasks,         color:"#4ade80"},
                {label:"Active",val:tasks.length-doneTasks,color:"#fbbf24"},
              ].map((t,i)=>(
                <div key={i} style={{textAlign:"center",background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"10px 6px",border:"1px solid #1f2937"}}>
                  <div style={{fontSize:20,fontWeight:800,color:t.color}}>{t.val}</div>
                  <div style={{fontSize:10,opacity:.4,marginTop:2}}>{t.label}</div>
                </div>
              ))}
            </div>
            {tasks.length>0&&(
              <div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:5,opacity:.5}}>
                  <span>Completion</span>
                  <span>{Math.round((doneTasks/tasks.length)*100)}%</span>
                </div>
                <div style={{height:4,background:"#1f2937",borderRadius:4}}>
                  <div style={{height:"100%",width:`${Math.round((doneTasks/tasks.length)*100)}%`,background:"#4ade80",borderRadius:4}}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Today Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:12}}>
            {[
              {icon:<Clock size={18}/>,    bg:"#3b82f6",label:"Active Today", val:fmtMins(stats.totalMins)},
              {icon:<BarChart2 size={18}/>,bg:"#10b981",label:"Productivity", val:`${stats.avgPct}%`,vc:prodColor(stats.avgPct)},
              {icon:<Activity size={18}/>, bg:"#8b5cf6",label:"Activities",   val:stats.activities,sub:"today"},
            ].map((m,i)=>(
              <div key={i} className="metric-card" style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"16px"}}>
                <div style={{width:36,height:36,borderRadius:10,background:m.bg+"20",border:`1px solid ${m.bg}30`,display:"flex",alignItems:"center",justifyContent:"center",color:m.bg,marginBottom:10}}>{m.icon}</div>
                <div style={{fontSize:10,opacity:.4,marginBottom:3,textTransform:"uppercase",letterSpacing:".06em"}}>{m.label}</div>
                <div style={{fontSize:22,fontWeight:800,color:m.vc||"#fff",lineHeight:1}}>{m.val}</div>
                {m.sub&&<div style={{fontSize:10,opacity:.25,marginTop:3}}>{m.sub}</div>}
              </div>
            ))}
          </div>

          {/* Edit / View Info */}
          <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"20px 24px"}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:18}}>{editing?"Edit Information":"Personal Information"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
              {[
                {label:"First Name",     key:"firstName"},
                {label:"Last Name",      key:"lastName"},
                {label:"Email",          key:"email",   type:"email"},
                {label:"Phone",          key:"phone",   type:"tel"},
                {label:"City",           key:"city"},
                {label:"Country",        key:"country"},
              ].map(field=>(
                <div key={field.key}>
                  <div style={{fontSize:10,opacity:.4,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>{field.label}</div>
                  {editing?(
                    <input type={field.type||"text"} value={editData[field.key]||""} onChange={e=>setEditData(prev=>({...prev,[field.key]:e.target.value}))}
                      style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid #374151",background:"#111827",color:"#fff",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none"}}/>
                  ):(
                    <div style={{fontSize:13,color:p[field.key]?"#fff":"rgba(255,255,255,0.2)",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{p[field.key]||"—"}</div>
                  )}
                </div>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <div style={{fontSize:10,opacity:.4,marginBottom:5,textTransform:"uppercase",letterSpacing:".06em"}}>About</div>
              {editing?(
                <textarea value={editData.description||""} rows={3} onChange={e=>setEditData(prev=>({...prev,description:e.target.value}))}
                  style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #374151",background:"#111827",color:"#fff",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",resize:"vertical"}}/>
              ):(
                <div style={{fontSize:13,color:p.description?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.2)",padding:"8px 0",lineHeight:1.6}}>{p.description||"No description added."}</div>
              )}
            </div>
          </div>

          {/* Recent Tasks */}
          {tasks.length>0&&(
            <div style={{background:"#0f1117",border:"1px solid #1a1d2e",borderRadius:14,padding:"20px 24px"}}>
              <div style={{fontSize:13,fontWeight:700,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <Activity size={14} color="#6b7280"/> Recent Tasks
                <div style={{flex:1,height:1,background:"#1a1d2e"}}/>
                <span style={{fontSize:10,opacity:.3}}>{tasks.length} total</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {tasks.slice(0,5).map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"rgba(255,255,255,0.02)",borderRadius:10,border:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{width:4,height:36,borderRadius:4,background:PRIORITY_C[t.priority]||"#818cf8",flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</div>
                      {t.due_date&&<div style={{fontSize:10,opacity:.4,marginTop:2}}>Due: {new Date(t.due_date).toLocaleDateString()}</div>}
                    </div>
                    <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:`${STATUS_C[t.status]||"#818cf8"}18`,color:STATUS_C[t.status]||"#818cf8",border:`1px solid ${STATUS_C[t.status]||"#818cf8"}30`,whiteSpace:"nowrap",fontWeight:600}}>
                      {(t.status||"pending").replace("_"," ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  btn:{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:9,border:"1px solid #1f2937",background:"#111827",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"},
};
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  @keyframes spin{to{transform:rotate(360deg);}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  .metric-card{transition:transform 0.2s,border-color 0.2s;}
  .metric-card:hover{transform:translateY(-2px);border-color:#27272a!important;}
  input:focus,textarea:focus{border-color:#374151!important;box-shadow:0 0 0 2px rgba(129,140,248,0.15);}
  ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0a0f;}::-webkit-scrollbar-thumb{background:#1f2937;border-radius:4px;}
`;