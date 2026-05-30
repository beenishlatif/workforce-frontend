import { useState, useEffect } from "react";
import { useBlockedApps } from "../App";
import API from "../api/axios.js"; // ✅ Same axios instance

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

/* ── Design tokens ── */
const T = {
  bg:"#080809",s0:"#0c0c0f",s1:"#111114",s2:"#18181c",
  border:"#1f1f24",border2:"#2a2a30",text:"#f0f0f2",sub:"#c4c4cc",
  muted:"#6b6b78",dim:"#3a3a42",
  indigo:"#818cf8",indigoD:"rgba(129,140,248,0.1)",indigoB:"rgba(129,140,248,0.22)",
  green:"#4ade80",greenD:"rgba(74,222,128,0.08)",greenB:"rgba(74,222,128,0.2)",
  amber:"#fbbf24",amberD:"rgba(251,191,36,0.08)",amberB:"rgba(251,191,36,0.2)",
  red:"#f87171",redD:"rgba(248,113,113,0.08)",redB:"rgba(248,113,113,0.2)",
  cyan:"#22d3ee",
};

/* ── SVG icon primitives ── */
const Ico = ({ path, size = 16, color = "currentColor", multi = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {multi ? path.map((p, i) => <path key={i} d={p} />) : <path d={path} />}
  </svg>
);

const ICONS = {
  general:    ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  monitoring: ["M22 12h-4l-3 9L9 3l-3 9H2"],
  security:   ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  appcontrol: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"],
  danger:     ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  save:       ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z","M17 21v-8H7v8","M7 3v5h8"],
  check:      "M20 6L9 17l-5-5",
  settings:   ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z","M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"],
  clock:      ["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20","M12 6v6l4 2"],
  camera:     ["M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z","M12 13m-4 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0"],
  bell:       ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 0 1-3.46 0"],
  key:        ["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"],
  trash:      ["M3 6h18","M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  refresh:    ["M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"],
  shield:     ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"],
  database:   ["M12 2C8.13 2 5 3.34 5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5c0-1.66-3.13-3-7-3z","M5 5c0 1.66 3.13 3 7 3s7-1.34 7-3","M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"],
  user:       ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2","M12 11a4 4 0 1 0 0-8 4 4 0 1 0 0 8z"],
  mail:       ["M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z","M22 6l-10 7L2 6"],
  lock:       ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z","M7 11V7a5 5 0 0 1 10 0v4"],
  unlock:     ["M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z","M7 11V7a5 5 0 0 1 9.9-1"],
  plus:       "M12 5v14M5 12h14",
  edit:       ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  x:          "M18 6L6 18M6 6l12 12",
  menu:       "M3 12h18M3 6h18M3 18h18",
  chevronL:   "M15 18l-6-6 6-6",
};

/* ── Reusable UI pieces ── */
function Toggle({ on, onChange, disabled }) {
  return (
    <div onClick={disabled ? undefined : onChange}
      style={{ width:40,height:22,borderRadius:11,position:"relative",
        cursor:disabled?"not-allowed":"pointer",flexShrink:0,
        background:on?T.green:T.s2,border:`1px solid ${on?T.greenB:T.border2}`,
        transition:"all .2s",opacity:disabled?.4:1,
        boxShadow:on?`0 0 10px ${T.green}33`:"none" }}>
      <div style={{ width:16,height:16,borderRadius:"50%",background:"#fff",
        position:"absolute",top:2,left:on?20:2,transition:"left .2s",
        boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }}/>
    </div>
  );
}

function Pill({ on, onLabel="Enabled", offLabel="Disabled" }) {
  return (
    <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,fontWeight:700,
      letterSpacing:"0.06em",textTransform:"uppercase",
      background:on?T.greenD:T.redD,border:`1px solid ${on?T.greenB:T.redB}`,
      color:on?T.green:T.red }}>
      {on?onLabel:offLabel}
    </span>
  );
}

function SectionHead({ icon, label, sub, accent=T.indigo }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:22,
      paddingBottom:16,borderBottom:`1px solid ${T.border}` }}>
      <div style={{ width:36,height:36,borderRadius:10,flexShrink:0,
        background:`${accent}15`,border:`1px solid ${accent}28`,
        display:"flex",alignItems:"center",justifyContent:"center",color:accent }}>
        <Ico path={icon} size={16} multi={Array.isArray(icon)}/>
      </div>
      <div>
        <div style={{ fontSize:13,fontWeight:700,color:T.text }}>{label}</div>
        {sub&&<div style={{ fontSize:11,color:T.muted,marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SettingRow({ label, sub, right, last, stack }) {
  return (
    <div style={{ display:"flex",
      alignItems: stack ? "flex-start" : "center",
      flexDirection: stack ? "column" : "row",
      justifyContent:"space-between",
      gap: stack ? 10 : 16,
      padding:"14px 0",
      borderBottom:last?"none":`1px solid ${T.border}` }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:500,color:T.sub }}>{label}</div>
        {sub&&<div style={{ fontSize:11,color:T.muted,marginTop:3 }}>{sub}</div>}
      </div>
      <div style={{ display:"flex",alignItems:"center",gap:10,
        flexShrink:0, width: stack ? "100%" : "auto" }}>
        {right}
      </div>
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:T.s1,border:`1px solid ${T.border}`,borderRadius:16,
      padding:"22px 20px",...style }}>
      {children}
    </div>
  );
}

function Input({ type="text", value, onChange, placeholder, style={} }) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{ fontSize:12,padding:"8px 12px",borderRadius:9,
        border:`1px solid ${T.border2}`,background:T.s0,color:T.text,
        fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",
        transition:"border-color .15s",...style }}
      onFocus={e=>e.target.style.borderColor=T.indigoB}
      onBlur={e=>e.target.style.borderColor=T.border2}/>
  );
}

function Select({ value, onChange, options, style={} }) {
  return (
    <div style={{ position:"relative", width:"100%" }}>
      <select value={value} onChange={onChange}
        style={{ fontSize:12,padding:"8px 28px 8px 12px",borderRadius:9,
          border:`1px solid ${T.border2}`,background:T.s0,color:T.text,
          fontFamily:"'DM Sans',sans-serif",outline:"none",appearance:"none",
          cursor:"pointer",width:"100%",...style }}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.dim}
        strokeWidth="2.5" style={{ position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}>
        <path d="M6 9l6 6 6-6"/>
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   APP CONTROL TAB
══════════════════════════════════════════════════════════════ */

function AppModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(
    initial ? { name: initial.name, reason: initial.reason || "", type: initial.type }
            : { name: "", identifier: "", type: "website", reason: "" }
  );
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const inp = {
    fontSize:13,padding:"9px 12px",borderRadius:9,
    border:`1px solid ${T.border2}`,background:T.s2,color:T.text,
    outline:"none",width:"100%",fontFamily:"'DM Sans',sans-serif",
  };
  const lbl = {
    fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
    letterSpacing:"0.09em",display:"block",marginBottom:6,
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,0.75)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={onClose}>
      <div style={{ background:T.s1,border:`1px solid ${T.border}`,borderRadius:18,
        padding:24,width:"100%",maxWidth:440 }}
        onClick={e=>e.stopPropagation()}>

        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22 }}>
          <span style={{ fontSize:15,fontWeight:700,color:T.text }}>
            {initial ? "Edit Entry" : "Block App / Website"}
          </span>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:T.muted,padding:4 }}>
            <Ico path={ICONS.x} size={16} color={T.muted}/>
          </button>
        </div>

        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div>
            <label style={lbl}>Display Name *</label>
            <input style={inp} value={form.name}
              onChange={e=>set("name",e.target.value)} placeholder="e.g. YouTube"/>
          </div>

          {!initial && (
            <div>
              <label style={lbl}>
                {form.type==="internal" ? "Route Identifier *" : "Domain / URL *"}
              </label>
              <input style={inp} value={form.identifier}
                onChange={e=>set("identifier",e.target.value)}
                placeholder={form.type==="internal" ? "/employee/screenshots" : "youtube.com"}/>
              <div style={{ fontSize:10,color:T.dim,marginTop:4 }}>
                {form.type==="internal"
                  ? "Enter the route that appears in the URL, e.g. /employee/activity"
                  : "Domain only, e.g. facebook.com"}
              </div>
            </div>
          )}

          <div>
            <label style={lbl}>Type</label>
            <div style={{ display:"flex",gap:8 }}>
              {["website","internal"].map(t=>(
                <button key={t} onClick={()=>set("type",t)}
                  style={{ flex:1,padding:"8px 0",borderRadius:9,fontSize:12,fontWeight:600,
                    cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
                    border:`1px solid ${form.type===t?T.indigoB:T.border2}`,
                    background:form.type===t?T.indigoD:T.s2,
                    color:form.type===t?T.indigo:T.muted }}>
                  {t==="website"?"🌐 Website":"🖥 Internal Page"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Reason (optional)</label>
            <input style={inp} value={form.reason}
              onChange={e=>set("reason",e.target.value)} placeholder="e.g. Not work related"/>
          </div>

          <button onClick={()=>onSave(form)}
            style={{ padding:"11px 0",borderRadius:11,fontSize:13,fontWeight:700,
              cursor:"pointer",fontFamily:"'DM Sans',sans-serif",
              background:T.redD,border:`1px solid ${T.redB}`,color:T.red,width:"100%",marginTop:4 }}>
            {initial ? "Save Changes" : "🔒 Block App"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppControlTab({ isMobile }) {
  const { blockedApps, stats, loading, addApp, toggleApp, editApp, deleteApp } = useBlockedApps();

  const [showModal,  setShowModal]  = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [toast,      setToast]      = useState(null);
  const [busy,       setBusy]       = useState({});

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  };

  const handleAdd = async (form) => {
    try {
      await addApp(form);
      setShowModal(false);
      showToast(`"${form.name}" has been blocked`);
    } catch(e) {
      showToast(e?.response?.data?.message || "An error occurred","error");
    }
  };

  const handleEdit = async (form) => {
    try {
      await editApp(editTarget._id, form);
      setEditTarget(null);
      showToast("Entry updated successfully");
    } catch {
      showToast("Update failed","error");
    }
  };

  const handleToggle = async (app) => {
    setBusy(p=>({...p,[app._id]:true}));
    try {
      await toggleApp(app._id);
      showToast(`"${app.name}" ${app.isBlocked?"unblocked":"blocked"}`);
    } catch {
      showToast("Status change failed","error");
    } finally {
      setBusy(p=>({...p,[app._id]:false}));
    }
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Permanently delete "${app.name}"?`)) return;
    try {
      await deleteApp(app._id);
      showToast(`"${app.name}" removed`);
    } catch {
      showToast("Delete failed","error");
    }
  };

  const filtered = blockedApps.filter(a => {
    const s = search.toLowerCase();
    const matchS = a.name.toLowerCase().includes(s) || a.identifier.includes(s);
    const matchF =
      filter==="all"      ? true :
      filter==="blocked"  ? a.isBlocked :
      filter==="allowed"  ? !a.isBlocked :
      filter==="website"  ? a.type==="website" :
      filter==="internal" ? a.type==="internal" : true;
    return matchS && matchF;
  });

  if (loading) return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"center",
      minHeight:"200px",gap:12,flexDirection:"column" }}>
      <div style={{ width:28,height:28,border:`2px solid ${T.border}`,
        borderTopColor:T.red,borderRadius:"50%",animation:"spin .75s linear infinite"}}/>
      <span style={{ color:T.muted,fontSize:12 }}>Loading…</span>
    </div>
  );

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .25s ease" }}>

      {toast && (
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 16px",
          borderRadius:10,fontSize:12,fontWeight:600,
          background:T.s0,border:`1px solid ${toast.type==="error"?T.redB:T.greenB}`,
          color:toast.type==="error"?T.red:T.green }}>
          <Ico path={toast.type==="error"?ICONS.danger[0]:ICONS.check} size={13}
            color={toast.type==="error"?T.red:T.green}/>
          {toast.msg}
        </div>
      )}

      {showModal  && <AppModal onClose={()=>setShowModal(false)}  onSave={handleAdd}/>}
      {editTarget && <AppModal onClose={()=>setEditTarget(null)} onSave={handleEdit} initial={editTarget}/>}

      {/* Stats */}
      <div style={{ display:"grid",
        gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
        gap:10 }}>
        {[
          { label:"Total",    val:stats.total,    color:T.indigo },
          { label:"Blocked",  val:stats.active,   color:T.red    },
          { label:"Websites", val:stats.websites, color:T.amber  },
          { label:"Pages",    val:stats.internal, color:T.cyan   },
        ].map(s=>(
          <div key={s.label} style={{ background:T.s0,border:`1px solid ${T.border}`,
            borderRadius:12,padding:"14px 16px" }}>
            <div style={{ fontSize:9,textTransform:"uppercase",letterSpacing:"0.09em",
              fontWeight:700,color:T.dim,marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:24,fontWeight:800,color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter + Add */}
      <div style={{ display:"flex",gap:8,flexDirection:"column" }}>
        <div style={{ display:"flex",gap:8,flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search app or domain…"
            style={{ flex:1,minWidth:0,fontSize:12,padding:"8px 12px",borderRadius:9,
              border:`1px solid ${T.border2}`,background:T.s1,color:T.text,
              fontFamily:"'DM Sans',sans-serif",outline:"none" }}/>
          <button onClick={()=>setShowModal(true)}
            style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",
              borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,
              fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",
              background:T.redD,border:`1px solid ${T.redB}`,color:T.red }}>
            <Ico path={ICONS.plus} size={13} color={T.red}/>
            Block App
          </button>
        </div>

        {/* Filter chips — scrollable on mobile */}
        <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:2,
          scrollbarWidth:"none" }}>
          {["all","blocked","allowed","website","internal"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{ padding:"6px 12px",borderRadius:8,fontSize:10,fontWeight:600,
                cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize",
                whiteSpace:"nowrap",flexShrink:0,
                border:`1px solid ${filter===f?T.indigoB:T.border}`,
                background:filter===f?T.indigoD:T.s1,
                color:filter===f?T.indigo:T.muted }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <Card style={{ padding:0,overflow:"hidden" }}>
        {/* Desktop header */}
        {!isMobile && (
          <div style={{ display:"grid",
            gridTemplateColumns:"2fr 2fr 80px 80px 100px",
            padding:"10px 20px",background:T.s2,borderBottom:`1px solid ${T.border}` }}>
            {["Name","Identifier","Type","Status","Actions"].map(h=>(
              <span key={h} style={{ fontSize:9,fontWeight:700,color:T.dim,
                textTransform:"uppercase",letterSpacing:"0.09em" }}>{h}</span>
            ))}
          </div>
        )}

        {filtered.length===0 ? (
          <div style={{ padding:"40px 20px",textAlign:"center" }}>
            <div style={{ fontSize:28,marginBottom:8 }}>🔓</div>
            <p style={{ color:T.muted,fontSize:13 }}>No entries found</p>
            <p style={{ color:T.dim,fontSize:11,marginTop:4 }}>
              {search ? "Try a different search term" : 'Click "Block App" to add your first entry'}
            </p>
          </div>
        ) : (
          filtered.map((app, idx) => (
            isMobile ? (
              /* ── Mobile card row ── */
              <div key={app._id}
                style={{ padding:"14px 16px",
                  borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none" }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8 }}>
                  <div style={{ flex:1,minWidth:0,marginRight:12 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:T.text,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {app.name}
                    </div>
                    <div style={{ fontSize:10,color:T.muted,fontFamily:"monospace",marginTop:2,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                      {app.identifier}
                    </div>
                    {app.reason && (
                      <div style={{ fontSize:10,color:T.dim,marginTop:2 }}>{app.reason}</div>
                    )}
                  </div>
                  <div style={{ display:"flex",gap:5,flexShrink:0 }}>
                    <button onClick={()=>handleToggle(app)} disabled={busy[app._id]}
                      title={app.isBlocked?"Unblock":"Block"}
                      style={{ width:30,height:30,borderRadius:8,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        border:`1px solid ${app.isBlocked?T.greenB:T.redB}`,
                        background:app.isBlocked?T.greenD:T.redD,
                        opacity:busy[app._id]?.5:1 }}>
                      <Ico path={app.isBlocked?ICONS.unlock:ICONS.lock} size={13}
                        color={app.isBlocked?T.green:T.red} multi/>
                    </button>
                    <button onClick={()=>setEditTarget(app)} title="Edit"
                      style={{ width:30,height:30,borderRadius:8,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        border:`1px solid ${T.indigoB}`,background:T.indigoD }}>
                      <Ico path={ICONS.edit} size={13} color={T.indigo} multi/>
                    </button>
                    <button onClick={()=>handleDelete(app)} title="Delete"
                      style={{ width:30,height:30,borderRadius:8,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        border:`1px solid ${T.redB}`,background:T.redD }}>
                      <Ico path={ICONS.trash} size={13} color={T.red} multi/>
                    </button>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                  <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,fontWeight:700,
                    letterSpacing:"0.06em",textTransform:"uppercase",
                    background:app.type==="website"?T.amberD:"rgba(34,211,238,0.08)",
                    border:`1px solid ${app.type==="website"?T.amberB:"rgba(34,211,238,0.2)"}`,
                    color:app.type==="website"?T.amber:T.cyan }}>
                    {app.type==="website"?"Web":"Page"}
                  </span>
                  <Pill on={app.isBlocked} onLabel="Blocked" offLabel="Allowed"/>
                </div>
              </div>
            ) : (
              /* ── Desktop row ── */
              <div key={app._id}
                style={{ display:"grid",gridTemplateColumns:"2fr 2fr 80px 80px 100px",
                  padding:"13px 20px",alignItems:"center",
                  borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",
                  transition:"background .12s" }}
                onMouseEnter={e=>e.currentTarget.style.background=T.s2}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>

                <div>
                  <div style={{ fontSize:13,fontWeight:600,color:T.text }}>{app.name}</div>
                  {app.reason && <div style={{ fontSize:10,color:T.dim,marginTop:2 }}>{app.reason}</div>}
                </div>

                <div style={{ fontSize:11,color:T.muted,fontFamily:"monospace",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:8 }}>
                  {app.identifier}
                </div>

                <span style={{ fontSize:9,padding:"2px 8px",borderRadius:20,fontWeight:700,
                  letterSpacing:"0.06em",textTransform:"uppercase",width:"fit-content",
                  background:app.type==="website"?T.amberD:"rgba(34,211,238,0.08)",
                  border:`1px solid ${app.type==="website"?T.amberB:"rgba(34,211,238,0.2)"}`,
                  color:app.type==="website"?T.amber:T.cyan }}>
                  {app.type==="website"?"Web":"Page"}
                </span>

                <Pill on={app.isBlocked} onLabel="Blocked" offLabel="Allowed"/>

                <div style={{ display:"flex",gap:5 }}>
                  <button onClick={()=>handleToggle(app)} disabled={busy[app._id]}
                    title={app.isBlocked?"Unblock":"Block"}
                    style={{ width:28,height:28,borderRadius:7,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      border:`1px solid ${app.isBlocked?T.greenB:T.redB}`,
                      background:app.isBlocked?T.greenD:T.redD,
                      opacity:busy[app._id]?.5:1 }}>
                    <Ico path={app.isBlocked?ICONS.unlock:ICONS.lock} size={12}
                      color={app.isBlocked?T.green:T.red} multi/>
                  </button>
                  <button onClick={()=>setEditTarget(app)} title="Edit"
                    style={{ width:28,height:28,borderRadius:7,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      border:`1px solid ${T.indigoB}`,background:T.indigoD }}>
                    <Ico path={ICONS.edit} size={12} color={T.indigo} multi/>
                  </button>
                  <button onClick={()=>handleDelete(app)} title="Delete"
                    style={{ width:28,height:28,borderRadius:7,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      border:`1px solid ${T.redB}`,background:T.redD }}>
                    <Ico path={ICONS.trash} size={12} color={T.red} multi/>
                  </button>
                </div>
              </div>
            )
          ))
        )}
      </Card>

      <div style={{ fontSize:10,color:T.dim,textAlign:"right" }}>
        {filtered.length} / {blockedApps.length} entries
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function SystemSettings() {
  const width    = useWindowWidth();
  const isMobile = width < 640;

  const [activeTab,  setActiveTab]  = useState("general");
  const [mobileMenu, setMobileMenu] = useState(false); // mobile tab drawer
  const [settings,   setSettings]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [pwdMsg,     setPwdMsg]     = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3500);
  };

  /* ── Fetch settings via axios ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/settings");
        setSettings(res.data);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const update = (key, val) => setSettings(p => ({ ...p, [key]: val }));

  /* ── Save settings via axios ── */
  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await API.put("/settings", settings);
      setSettings(res.data);
      showToast("Settings saved successfully");
    } catch { showToast("Failed to save settings","error"); }
    finally { setSaving(false); }
  };

  /* ── Change password via axios ── */
  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd) { setPwdMsg("Please fill in both fields"); return; }
    setPwdLoading(true); setPwdMsg("");
    try {
      await API.post("/settings/change-password", {
        currentPassword: currentPwd, newPassword: newPwd,
      });
      setPwdMsg("success"); setCurrentPwd(""); setNewPwd("");
    } catch(e) {
      setPwdMsg(e?.response?.data?.message || "Current password is incorrect");
    } finally { setPwdLoading(false); }
  };

  /* ── Danger zone actions via axios ── */
  const deleteAllScreenshots = async () => {
    if (!window.confirm("Permanently delete all screenshots?")) return;
    try {
      const res = await API.delete("/settings/screenshots/all");
      showToast(`${res.data.deleted||0} screenshots deleted`);
    } catch { showToast("Delete failed","error"); }
  };

  const resetAllAlerts = async () => {
    if (!window.confirm("Clear all alert history?")) return;
    try {
      const res = await API.delete("/settings/alerts/all");
      showToast(`${res.data.deleted||0} alerts cleared`);
    } catch { showToast("Reset failed","error"); }
  };

  const TABS = [
    { key:"general",    label:"General",        icon:ICONS.general    },
    { key:"monitoring", label:"Monitoring",      icon:ICONS.monitoring },
    { key:"security",   label:"Data & Security", icon:ICONS.security   },
    { key:"appcontrol", label:"App Control",     icon:ICONS.appcontrol, accent:T.red },
  ];

  const activeTabMeta = TABS.find(t => t.key === activeTab);

  if (loading) return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",
      justifyContent:"center",minHeight:"60vh",flexDirection:"column",gap:14 }}>
      <style>{CSS}</style>
      <div style={{ width:32,height:32,border:`2px solid ${T.border}`,
        borderTopColor:T.indigo,borderRadius:"50%",animation:"spin .75s linear infinite" }}/>
      <span style={{ color:T.muted,fontSize:13 }}>Loading settings…</span>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",color:T.sub,
      display:"flex",flexDirection:"column",gap:isMobile?14:20 }}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed",top:16,right:16,left:isMobile?16:"auto",zIndex:9999,
          display:"flex",alignItems:"center",gap:10,padding:"12px 18px",
          borderRadius:12,fontSize:13,fontWeight:600,background:T.s1,
          border:`1px solid ${toast.type==="error"?T.redB:T.greenB}`,
          color:toast.type==="error"?T.red:T.green,
          boxShadow:"0 16px 40px rgba(0,0,0,0.5)",animation:"slideIn .25s ease" }}>
          <Ico path={toast.type==="error"?ICONS.danger[0]:ICONS.check} size={14}
            color={toast.type==="error"?T.red:T.green}/>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:isMobile?36:42,height:isMobile?36:42,borderRadius:12,background:T.indigoD,
            border:`1px solid ${T.indigoB}`,display:"flex",alignItems:"center",
            justifyContent:"center",color:T.indigo,flexShrink:0 }}>
            <Ico path={ICONS.settings} size={isMobile?16:18} multi/>
          </div>
          <div>
            <div style={{ fontSize:isMobile?16:20,fontWeight:800,color:T.text,
              letterSpacing:"-0.025em",lineHeight:1 }}>
              {isMobile ? "Settings" : "System Settings"}
            </div>
            {!isMobile && (
              <div style={{ fontSize:11,color:T.muted,marginTop:4 }}>
                Company preferences, monitoring, security and app control
              </div>
            )}
          </div>
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          {activeTab !== "appcontrol" && (
            <button onClick={saveSettings} disabled={saving}
              style={{ display:"flex",alignItems:"center",gap:isMobile?0:8,
                padding: isMobile?"9px":"10px 20px",
                borderRadius:11,fontSize:13,fontWeight:700,
                cursor:saving?"not-allowed":"pointer",
                fontFamily:"'DM Sans',sans-serif",transition:"all .15s",opacity:saving?.7:1,
                background:T.indigoD,border:`1px solid ${T.indigoB}`,color:T.indigo }}>
              <Ico path={saving?ICONS.refresh:ICONS.save} size={14} color={T.indigo} multi={!saving}/>
              {!isMobile && <span>{saving?"Saving…":"Save Changes"}</span>}
            </button>
          )}

          {/* Mobile: tab menu button */}
          {isMobile && (
            <button onClick={()=>setMobileMenu(p=>!p)}
              style={{ display:"flex",alignItems:"center",gap:6,padding:"9px 12px",
                borderRadius:9,fontSize:12,fontWeight:600,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",
                background:T.s1,border:`1px solid ${T.border}`,color:T.muted }}>
              <Ico path={ICONS.menu} size={15} color={T.muted}/>
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile: Active Tab Pill ── */}
      {isMobile && (
        <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 14px",
          borderRadius:10,background:T.s1,border:`1px solid ${activeTabMeta?.accent||T.indigo}28`,
          color:activeTabMeta?.accent||T.indigo,fontSize:12,fontWeight:600 }}>
          <Ico path={activeTabMeta?.icon||ICONS.settings} size={14}
            color={activeTabMeta?.accent||T.indigo} multi={Array.isArray(activeTabMeta?.icon)}/>
          {activeTabMeta?.label}
          <span style={{ marginLeft:"auto",fontSize:10,color:T.muted }}>tap ≡ to switch</span>
        </div>
      )}

      {/* ── Mobile Tab Dropdown ── */}
      {isMobile && mobileMenu && (
        <div style={{ background:T.s1,border:`1px solid ${T.border}`,borderRadius:14,
          overflow:"hidden",animation:"fadeUp .15s ease",zIndex:100 }}>
          {TABS.map((t,i)=>(
            <button key={t.key} onClick={()=>{setActiveTab(t.key);setMobileMenu(false);}}
              style={{ display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"13px 16px",cursor:"pointer",textAlign:"left",
                fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,
                background:activeTab===t.key?`${t.accent||T.indigo}10`:"transparent",
                color:activeTab===t.key?(t.accent||T.indigo):T.sub,
                border:"none",borderBottom:i<TABS.length-1?`1px solid ${T.border}`:"none" }}>
              <Ico path={t.icon} size={15} color={activeTab===t.key?(t.accent||T.indigo):T.muted}
                multi={Array.isArray(t.icon)}/>
              {t.label}
              {activeTab===t.key && (
                <span style={{ marginLeft:"auto",width:6,height:6,borderRadius:"50%",
                  background:t.accent||T.indigo,flexShrink:0 }}/>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Desktop Tabs ── */}
      {!isMobile && (
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 18px",
                borderRadius:11,fontSize:12,fontWeight:500,cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",transition:"all .15s",border:"1px solid",
                borderColor:activeTab===t.key?`${t.accent||T.indigo}35`:T.border,
                background:activeTab===t.key?`${t.accent||T.indigo}10`:T.s1,
                color:activeTab===t.key?(t.accent||T.indigo):T.muted }}>
              <Ico path={t.icon} size={14} color={activeTab===t.key?(t.accent||T.indigo):T.muted}
                multi={Array.isArray(t.icon)}/>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════
          GENERAL TAB
      ══════════════════════════════════════ */}
      {activeTab==="general" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .25s ease" }}>
          <Card>
            <SectionHead icon={ICONS.user} label="Company Information"
              sub="Basic details about your organisation"/>
            <div style={{ display:"grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap:14 }}>
              {[
                {label:"Company Name",key:"companyName",type:"text"},
                {label:"Admin Email",key:"adminEmail",type:"email"}
              ].map(f=>(
                <div key={f.key}>
                  <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                    letterSpacing:"0.09em",marginBottom:7 }}>{f.label}</div>
                  <Input type={f.type} value={settings?.[f.key]||""}
                    onChange={e=>update(f.key,e.target.value)} placeholder={f.label}/>
                </div>
              ))}
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                  letterSpacing:"0.09em",marginBottom:7 }}>Timezone</div>
                <Select value={settings?.timezone||"PKT (UTC+5)"}
                  onChange={e=>update("timezone",e.target.value)}
                  options={[
                    {value:"PKT (UTC+5)",label:"PKT (UTC+5)"},
                    {value:"UTC",label:"UTC"},
                    {value:"EST",label:"EST (UTC-5)"},
                    {value:"IST",label:"IST (UTC+5:30)"},
                  ]}/>
              </div>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                  letterSpacing:"0.09em",marginBottom:7 }}>Working Days</div>
                <Select value={settings?.workingDays||"Mon - Fri"}
                  onChange={e=>update("workingDays",e.target.value)}
                  options={[
                    {value:"Mon - Fri",label:"Monday – Friday"},
                    {value:"Mon - Sat",label:"Monday – Saturday"},
                  ]}/>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHead icon={ICONS.clock} label="Work Hours"
              sub="Define the standard start and end times"/>
            <div style={{ display:"grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap:14 }}>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                  letterSpacing:"0.09em",marginBottom:7 }}>Start Time</div>
                <Input type="time" value={settings?.workStart||"09:00"}
                  onChange={e=>update("workStart",e.target.value)}/>
              </div>
              <div>
                <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                  letterSpacing:"0.09em",marginBottom:7 }}>End Time</div>
                <Input type="time" value={settings?.workEnd||"18:00"}
                  onChange={e=>update("workEnd",e.target.value)}/>
              </div>
            </div>

            {settings?.workStart && settings?.workEnd && (
              <div style={{ marginTop:20,padding:"14px 16px",background:T.s0,
                borderRadius:11,border:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10,color:T.dim,marginBottom:10,
                  textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600 }}>
                  Work Window Preview
                </div>
                <div style={{ position:"relative",height:20,background:T.border,
                  borderRadius:6,overflow:"hidden" }}>
                  {(()=>{
                    const toH = t => { const [h,m]=t.split(":").map(Number); return h+m/60; };
                    const start = toH(settings.workStart||"09:00");
                    const end   = toH(settings.workEnd||"18:00");
                    return (
                      <div style={{ position:"absolute",left:`${(start/24)*100}%`,
                        width:`${((end-start)/24)*100}%`,height:"100%",
                        background:`linear-gradient(90deg,${T.indigo}88,${T.indigo})`,
                        borderRadius:4,boxShadow:`0 0 12px ${T.indigo}55` }}/>
                    );
                  })()}
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:9,
                  color:T.dim,marginTop:6,fontFamily:"monospace" }}>
                  {["00","04","08","12","16","20","24"].map(h=><span key={h}>{h}:00</span>)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
          MONITORING TAB
      ══════════════════════════════════════ */}
      {activeTab==="monitoring" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .25s ease" }}>
          <Card>
            <SectionHead icon={ICONS.camera} label="Screenshot Capture"
              sub="Configure how and when employee screens are captured" accent={T.cyan}/>
            <SettingRow label="Screenshot Capture"
              sub="Automatically take screenshots during work hours"
              stack={isMobile}
              right={
                <>
                  <Pill on={settings?.screenshotEnabled}/>
                  <Toggle on={settings?.screenshotEnabled}
                    onChange={()=>update("screenshotEnabled",!settings?.screenshotEnabled)}/>
                </>
              }/>
            <SettingRow label="Capture Interval" sub="How frequently screenshots are taken"
              stack={isMobile}
              right={
                <Select value={settings?.screenshotInterval||"30"}
                  onChange={e=>update("screenshotInterval",e.target.value)}
                  options={[
                    {value:"10",label:"Every 10 seconds"},
                    {value:"30",label:"Every 30 seconds"},
                    {value:"60",label:"Every 1 minute"},
                    {value:"300",label:"Every 5 minutes"},
                  ]}/>
              }/>
            <SettingRow label="Track Active Application"
              sub="Record which app the employee is currently using"
              stack={isMobile}
              right={
                <Toggle on={settings?.trackActiveApp}
                  onChange={()=>update("trackActiveApp",!settings?.trackActiveApp)}/>
              }/>
            <SettingRow label="Idle Time Detection"
              sub="Mark employee as idle after 10 minutes of inactivity"
              stack={isMobile} last
              right={
                <Toggle on={settings?.idleDetection}
                  onChange={()=>update("idleDetection",!settings?.idleDetection)}/>
              }/>
          </Card>

          <Card>
            <SectionHead icon={ICONS.bell} label="Notifications & Alerts"
              sub="Control when and where alert notifications are sent" accent={T.amber}/>
            <SettingRow label="Blocked App Alerts"
              sub="Send an alert when a restricted application is used"
              stack={isMobile}
              right={
                <>
                  <Pill on={settings?.blockedAppAlerts} onLabel="Active" offLabel="Muted"/>
                  <Toggle on={settings?.blockedAppAlerts}
                    onChange={()=>update("blockedAppAlerts",!settings?.blockedAppAlerts)}/>
                </>
              }/>
            <SettingRow label="Low Productivity Alerts"
              sub="Trigger when productivity drops below 40%"
              stack={isMobile}
              right={
                <>
                  <Pill on={settings?.lowProdAlerts} onLabel="Active" offLabel="Muted"/>
                  <Toggle on={settings?.lowProdAlerts}
                    onChange={()=>update("lowProdAlerts",!settings?.lowProdAlerts)}/>
                </>
              }/>
            <SettingRow label="Alert Email Address"
              sub="Destination email for all alert notifications"
              stack={isMobile} last
              right={
                <Input type="email" value={settings?.alertEmail||""}
                  onChange={e=>update("alertEmail",e.target.value)}
                  placeholder="alerts@company.com"/>
              }/>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════
          SECURITY TAB
      ══════════════════════════════════════ */}
      {activeTab==="security" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14,animation:"fadeUp .25s ease" }}>
          <Card>
            <SectionHead icon={ICONS.database} label="Data & Storage"
              sub="Control retention policies and storage usage" accent={T.cyan}/>
            <SettingRow label="Auto-Delete Screenshots"
              sub="Automatically remove screenshots after a set period"
              stack={isMobile}
              right={
                <>
                  <Pill on={settings?.autoDelete} onLabel="Auto" offLabel="Manual"/>
                  <Toggle on={settings?.autoDelete}
                    onChange={()=>update("autoDelete",!settings?.autoDelete)}/>
                </>
              }/>
            <SettingRow label="Retention Period"
              sub="How long screenshots are kept before deletion"
              stack={isMobile}
              right={
                <Select value={settings?.deleteAfterDays||"7"}
                  onChange={e=>update("deleteAfterDays",e.target.value)}
                  options={[
                    {value:"1",label:"24 hours"},
                    {value:"7",label:"7 days"},
                    {value:"30",label:"30 days"},
                  ]}/>
              }/>
            <div style={{ marginTop:6,paddingTop:14,borderTop:`1px solid ${T.border}` }}>
              <div style={{ display:"flex",justifyContent:"space-between",
                alignItems:"center",marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:13,fontWeight:500,color:T.sub }}>Storage Used</div>
                  <div style={{ fontSize:11,color:T.muted,marginTop:3 }}>2.4 GB of 10 GB used</div>
                </div>
                <span style={{ fontSize:11,fontWeight:700,color:T.cyan,
                  background:"rgba(34,211,238,0.08)",border:"1px solid rgba(34,211,238,0.2)",
                  padding:"3px 10px",borderRadius:7 }}>24%</span>
              </div>
              <div style={{ height:7,borderRadius:4,background:T.border,overflow:"hidden" }}>
                <div style={{ height:"100%",width:"24%",borderRadius:4,
                  background:`linear-gradient(90deg,${T.cyan}88,${T.cyan})`,
                  boxShadow:`0 0 8px ${T.cyan}55` }}/>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHead icon={ICONS.shield} label="Security" accent={T.amber}
              sub="Session management and employee consent"/>
            <SettingRow label="Session Timeout"
              sub="Auto-logout after a period of inactivity"
              stack={isMobile}
              right={
                <Select value={settings?.sessionTimeout||"1"}
                  onChange={e=>update("sessionTimeout",e.target.value)}
                  options={[
                    {value:"0.5",label:"30 minutes"},
                    {value:"1",label:"1 hour"},
                    {value:"4",label:"4 hours"},
                  ]}/>
              }/>
            <SettingRow label="Employee Consent Notice"
              sub="Show monitoring consent on employee login"
              stack={isMobile} last
              right={
                <>
                  <Pill on={settings?.consentNotice}/>
                  <Toggle on={settings?.consentNotice}
                    onChange={()=>update("consentNotice",!settings?.consentNotice)}/>
                </>
              }/>
          </Card>

          <Card>
            <SectionHead icon={ICONS.key} label="Change Admin Password"
              sub="Update the password for your admin account" accent={T.indigo}/>
            <div style={{ display:"flex",
              flexDirection: isMobile ? "column" : "row",
              gap:10,flexWrap:"wrap",alignItems:"flex-end" }}>
              <div style={{ flex:1,minWidth: isMobile ? "100%" : 160 }}>
                <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                  letterSpacing:"0.09em",marginBottom:7 }}>Current Password</div>
                <Input type="password" value={currentPwd}
                  onChange={e=>setCurrentPwd(e.target.value)} placeholder="••••••••"/>
              </div>
              <div style={{ flex:1,minWidth: isMobile ? "100%" : 160 }}>
                <div style={{ fontSize:10,fontWeight:700,color:T.dim,textTransform:"uppercase",
                  letterSpacing:"0.09em",marginBottom:7 }}>New Password</div>
                <Input type="password" value={newPwd}
                  onChange={e=>setNewPwd(e.target.value)} placeholder="••••••••"/>
              </div>
              <button onClick={handleChangePassword} disabled={pwdLoading}
                style={{ padding:"9px 20px",borderRadius:9,fontSize:12,fontWeight:700,
                  cursor:pwdLoading?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",
                  background:T.indigoD,border:`1px solid ${T.indigoB}`,color:T.indigo,
                  opacity:pwdLoading?.6:1,flexShrink:0,
                  width: isMobile ? "100%" : "auto" }}>
                {pwdLoading?"Updating…":"Update Password"}
              </button>
            </div>
            {pwdMsg && (
              <div style={{ marginTop:12,display:"flex",alignItems:"center",gap:7,
                fontSize:12,fontWeight:600,
                color:pwdMsg==="success"?T.green:T.red }}>
                <Ico path={pwdMsg==="success"?ICONS.check:ICONS.danger[0]} size={13}
                  color={pwdMsg==="success"?T.green:T.red}/>
                {pwdMsg==="success"?"Password changed successfully":pwdMsg}
              </div>
            )}
          </Card>

          {/* Danger Zone */}
          <div style={{ borderRadius:16,border:`1px solid ${T.redB}`,
            background:"rgba(248,113,113,0.03)",overflow:"hidden" }}>
            <div style={{ padding:"14px 20px",borderBottom:`1px solid ${T.redB}`,
              display:"flex",alignItems:"center",gap:10,
              background:"rgba(248,113,113,0.05)" }}>
              <Ico path={ICONS.danger} size={15} color={T.red} multi/>
              <span style={{ fontSize:11,fontWeight:700,color:T.red,
                textTransform:"uppercase",letterSpacing:"0.1em" }}>Danger Zone</span>
            </div>
            <div style={{ padding:"4px 20px" }}>
              <SettingRow label="Delete All Screenshots"
                sub="Permanently remove every stored screenshot"
                stack={isMobile}
                right={
                  <button onClick={deleteAllScreenshots}
                    style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",
                      borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",width: isMobile ? "100%" : "auto",
                      justifyContent:"center",
                      background:T.redD,border:`1px solid ${T.redB}`,color:T.red }}>
                    <Ico path={ICONS.trash} size={13} color={T.red} multi/>
                    Delete All
                  </button>
                }/>
              <SettingRow label="Reset All Alerts"
                sub="Clear the entire alert history permanently"
                stack={isMobile} last
                right={
                  <button onClick={resetAllAlerts}
                    style={{ display:"flex",alignItems:"center",gap:6,padding:"8px 16px",
                      borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",
                      fontFamily:"'DM Sans',sans-serif",width: isMobile ? "100%" : "auto",
                      justifyContent:"center",
                      background:T.redD,border:`1px solid ${T.redB}`,color:T.red }}>
                    <Ico path={ICONS.refresh} size={13} color={T.red} multi/>
                    Reset
                  </button>
                }/>
            </div>
          </div>
        </div>
      )}

      {/* App Control Tab */}
      {activeTab==="appcontrol" && <AppControlTab isMobile={isMobile}/>}

    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }
  input::placeholder { color: #3a3a42 !important; }
  select option { background: #111114; color: #f0f0f2; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0c0c0f; }
  ::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 4px; }
  .hide-scroll::-webkit-scrollbar { display: none; }
`;
