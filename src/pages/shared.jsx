import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════
   CONSTANTS & DATA
═══════════════════════════════════════════════════ */
export const DEPARTMENTS = ["Engineering","Design","QA","DevOps","HR","Marketing","Finance"];
export const ROLES = {
  Engineering:["Frontend Dev","Backend Dev","Full Stack Dev","Tech Lead","Mobile Dev","AI/ML Engineer"],
  Design:["UI Designer","UX Designer","Graphic Designer","Design Lead","Motion Designer","Brand Designer"],
  QA:["QA Engineer","QA Lead","Automation Engineer","Performance Tester","Security Tester"],
  DevOps:["DevOps Engineer","Cloud Architect","SRE","Security Engineer","Platform Engineer"],
  HR:["HR Manager","Recruiter","HR Executive","Payroll Officer","L&D Specialist"],
  Marketing:["Marketing Manager","Content Writer","SEO Specialist","Social Media Manager","Growth Hacker"],
  Finance:["Accountant","Finance Manager","Financial Analyst","Audit Officer","CFO"],
};
export const STATUS_OPTIONS   = ["Active","On Leave","Remote","Suspended"];
export const TASK_PRIORITIES  = ["Critical","High","Medium","Low"];
export const TASK_STATUSES    = ["Pending","In Progress","In Review","Completed","Blocked"];
export const PERMS_LIST = ["view_reports","manage_tasks","admin","manage_employees","billing","view_salary","export_data","audit_logs"];

export const DEPT_META = {
  Engineering:{color:"#4A9FFF",light:"rgba(74,159,255,0.12)",icon:"⚙"},
  Design:     {color:"#3ECFA8",light:"rgba(62,207,168,0.12)", icon:"✦"},
  QA:         {color:"#B48FFF",light:"rgba(180,143,255,0.12)",icon:"◈"},
  DevOps:     {color:"#FF6B6B",light:"rgba(255,107,107,0.12)",icon:"◉"},
  HR:         {color:"#FFAB40",light:"rgba(255,171,64,0.12)", icon:"◎"},
  Marketing:  {color:"#56CFE1",light:"rgba(86,207,225,0.12)", icon:"◇"},
  Finance:    {color:"#68D391",light:"rgba(104,211,145,0.12)",icon:"◆"},
};
export const STATUS_META = {
  Active:     {bg:"rgba(62,207,168,.10)", border:"rgba(62,207,168,.25)",  c:"#3ECFA8", dot:"#3ECFA8"},
  "On Leave": {bg:"rgba(255,171,64,.10)", border:"rgba(255,171,64,.25)",  c:"#FFAB40", dot:"#FFAB40"},
  Remote:     {bg:"rgba(74,159,255,.10)", border:"rgba(74,159,255,.25)",  c:"#4A9FFF", dot:"#4A9FFF"},
  Suspended:  {bg:"rgba(255,107,107,.10)",border:"rgba(255,107,107,.25)", c:"#FF6B6B", dot:"#FF6B6B"},
};
export const PRIO_META = {
  Critical:{bg:"rgba(220,38,38,.12)",  border:"rgba(220,38,38,.3)",   c:"#FF4444"},
  High:    {bg:"rgba(255,107,107,.12)",border:"rgba(255,107,107,.3)", c:"#FF6B6B"},
  Medium:  {bg:"rgba(255,171,64,.12)", border:"rgba(255,171,64,.3)",  c:"#FFAB40"},
  Low:     {bg:"rgba(74,159,255,.12)", border:"rgba(74,159,255,.3)",  c:"#4A9FFF"},
};
export const TASK_META = {
  Pending:      {bg:"rgba(74,159,255,.10)", border:"rgba(74,159,255,.25)",  c:"#4A9FFF"},
  "In Progress":{bg:"rgba(255,171,64,.10)", border:"rgba(255,171,64,.25)",  c:"#FFAB40"},
  "In Review":  {bg:"rgba(180,143,255,.10)",border:"rgba(180,143,255,.25)", c:"#B48FFF"},
  Completed:    {bg:"rgba(62,207,168,.10)", border:"rgba(62,207,168,.25)",  c:"#3ECFA8"},
  Blocked:      {bg:"rgba(255,107,107,.10)",border:"rgba(255,107,107,.25)", c:"#FF6B6B"},
};

export const AVATAR_PALETTE = ["#1E4D8C","#0A5C4A","#7B3FA0","#B45309","#9D1F1F","#1E5F74","#3D5A2E","#6B3D8A"];

export const SEED_EMPLOYEES = [
  {id:1,name:"Ali Raza",email:"ali.raza@co.com",phone:"0301-1234567",dept:"Engineering",role:"Full Stack Dev",status:"Active",joinDate:"2022-03-15",salary:"85000",permissions:["view_reports","manage_tasks"],notes:"React & Node specialist. Strong ownership culture.",performance:92,tasks:[]},
  {id:2,name:"Sara Khan",email:"sara.khan@co.com",phone:"0302-2345678",dept:"Design",role:"UI Designer",status:"Active",joinDate:"2021-07-20",salary:"72000",permissions:["view_reports"],notes:"Award-winning portfolio. Leads design system.",performance:87,tasks:[]},
  {id:3,name:"Bilal Ahmed",email:"bilal@co.com",phone:"0303-3456789",dept:"DevOps",role:"DevOps Engineer",status:"Remote",joinDate:"2020-11-01",salary:"95000",permissions:["view_reports","manage_tasks","admin"],notes:"Remote contract until Q3. Infrastructure lead.",performance:95,tasks:[]},
  {id:4,name:"Umar Farooq",email:"umar@co.com",phone:"0304-4567890",dept:"QA",role:"QA Lead",status:"Active",joinDate:"2023-01-10",salary:"68000",permissions:["view_reports"],notes:"",performance:78,tasks:[]},
  {id:5,name:"Ayesha Naz",email:"ayesha@co.com",phone:"0305-5678901",dept:"HR",role:"HR Manager",status:"On Leave",joinDate:"2019-06-05",salary:"78000",permissions:["view_reports","manage_tasks"],notes:"Maternity leave until August 2024.",performance:88,tasks:[]},
  {id:6,name:"Raza Malik",email:"raza@co.com",phone:"0306-6789012",dept:"Engineering",role:"Backend Dev",status:"Active",joinDate:"2022-09-12",salary:"80000",permissions:["view_reports"],notes:"",performance:82,tasks:[]},
  {id:7,name:"Fatima Zahra",email:"fatima@co.com",phone:"0307-7890123",dept:"Marketing",role:"Content Writer",status:"Active",joinDate:"2023-04-01",salary:"58000",permissions:["view_reports"],notes:"",performance:74,tasks:[]},
  {id:8,name:"Hamza Sheikh",email:"hamza@co.com",phone:"0308-8901234",dept:"Finance",role:"Financial Analyst",status:"Active",joinDate:"2021-11-15",salary:"90000",permissions:["view_reports","view_salary"],notes:"CFA Level 2 candidate.",performance:89,tasks:[]},
];

/* ═══════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════ */
export const genId = () => Date.now() + Math.floor(Math.random()*9999);
export const ini   = n => (n||"?").split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2);
export const avBg  = name => AVATAR_PALETTE[(name||"").charCodeAt(0)%AVATAR_PALETTE.length];

/* ═══════════════════════════════════════════════════
   STYLE TOKENS
═══════════════════════════════════════════════════ */
export const T = {
  inp: {
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.08)",
    borderRadius:9,padding:"9px 13px",
    color:"#E2E8F8",fontSize:12,outline:"none",
    width:"100%",fontFamily:"inherit",
    transition:"border-color .15s, background .15s",
  },
  card:{background:"#0F1623",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,overflow:"hidden"},
  section:{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:11,overflow:"hidden"},
};

/* ═══════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════ */
export const Pill = ({label, meta, size="sm"}) => {
  const m = meta||{bg:"rgba(255,255,255,.07)",border:"rgba(255,255,255,.12)",c:"#8892B0"};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:size==="xs"?9:10,fontWeight:700,padding:size==="xs"?"2px 7px":"3px 10px",borderRadius:20,background:m.bg,border:`1px solid ${m.border}`,color:m.c,letterSpacing:.3,whiteSpace:"nowrap"}}>{label}</span>;
};

export const Dot = ({color,size=7,pulse=false}) => (
  <span style={{width:size,height:size,borderRadius:"50%",background:color,display:"inline-block",flexShrink:0,animation:pulse?"pulse 2s ease-in-out infinite":"none"}}/>
);

export const Av = ({name,size=36,dept}) => {
  const bg = avBg(name||"?");
  const dc = dept&&DEPT_META[dept]?.color;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:bg,color:"#fff",fontSize:size*.28,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",letterSpacing:.5,border:`2px solid ${dc||bg}30`,position:"relative"}}>
      {ini(name)}
    </div>
  );
};

export const Lbl = ({children,required}) => (
  <div style={{fontSize:10,color:"#4A5580",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>
    {children}{required&&<span style={{color:"#FF6B6B",marginLeft:3}}>*</span>}
  </div>
);

export const Inp = ({error,...props}) => (
  <input {...props} style={{...T.inp,borderColor:error?"#FF6B6B":"rgba(255,255,255,0.08)",...(props.style||{})}}
    onFocus={e=>{e.target.style.borderColor=error?"#FF6B6B":"rgba(74,159,255,.5)";e.target.style.background="rgba(255,255,255,0.06)";}}
    onBlur={e=>{e.target.style.borderColor=error?"#FF6B6B":"rgba(255,255,255,0.08)";e.target.style.background="rgba(255,255,255,0.04)";}}/>
);

export const Sel = ({children,...props}) => (
  <select {...props} style={{...T.inp,cursor:"pointer",...(props.style||{})}}
    onFocus={e=>{e.target.style.borderColor="rgba(74,159,255,.5)";}}
    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,0.08)";}}>
    {children}
  </select>
);

export const FRow = ({children,cols=2}) => (
  <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap:12}}>{children}</div>
);

export const F = ({label,required,error,children}) => (
  <div style={{display:"flex",flexDirection:"column"}}>
    <Lbl required={required}>{label}</Lbl>
    {children}
    {error&&<span style={{fontSize:10,color:"#FF6B6B",marginTop:4,fontWeight:500}}>{error}</span>}
  </div>
);

export const Divider = ({label}) => (
  <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0"}}>
    <div style={{flex:1,height:"1px",background:"rgba(255,255,255,.06)"}}/>
    {label&&<span style={{fontSize:10,color:"#3A4260",fontWeight:700,textTransform:"uppercase",letterSpacing:.7,whiteSpace:"nowrap"}}>{label}</span>}
    <div style={{flex:1,height:"1px",background:"rgba(255,255,255,.06)"}}/>
  </div>
);

export const SBtn = ({children,onClick,color="#4A9FFF",outline=false,style={}}) => (
  <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 16px",border:`1px solid ${outline?color+"50":"transparent"}`,borderRadius:9,background:outline?"transparent":`linear-gradient(135deg,${color}CC,${color})`,color:outline?color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s",letterSpacing:.2,...style}}
    onMouseEnter={e=>{e.currentTarget.style.opacity=".85";e.currentTarget.style.transform="translateY(-1px)";}}
    onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.transform="translateY(0)";}}>
    {children}
  </button>
);

export const IBtn = ({icon,color,title,onClick,style={}}) => (
  <button title={title} onClick={onClick}
    style={{display:"flex",alignItems:"center",justifyContent:"center",width:30,height:30,borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.07)",color,cursor:"pointer",transition:"all .15s",...style}}
    onMouseEnter={e=>{e.currentTarget.style.background=color+"18";e.currentTarget.style.borderColor=color+"50";}}
    onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.07)";}}>
    {icon}
  </button>
);

export const ProgressBar = ({pct,color="#3ECFA8",height=4,label}) => (
  <div>
    {label&&<div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
      <span style={{fontSize:10,color:"#4A5580"}}>{label}</span>
      <span style={{fontSize:10,fontWeight:700,color}}>{pct}%</span>
    </div>}
    <div style={{height,background:"rgba(255,255,255,.06)",borderRadius:height,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:height,transition:"width .5s ease"}}/>
    </div>
  </div>
);

export const Toast = ({msg,type,onDone}) => {
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t);},[]);
  const ok=type==="success";
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",alignItems:"center",gap:10,
      background:ok?"rgba(62,207,168,.12)":"rgba(255,107,107,.12)",
      border:`1px solid ${ok?"rgba(62,207,168,.3)":"rgba(255,107,107,.3)"}`,
      borderRadius:12,padding:"12px 18px",fontSize:12,color:ok?"#3ECFA8":"#FF6B6B",
      fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,.4)",animation:"toastIn .25s ease"}}>
      <div style={{width:20,height:20,borderRadius:"50%",background:ok?"rgba(62,207,168,.2)":"rgba(255,107,107,.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {ok?<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
           :<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
      </div>
      {msg}
    </div>
  );
};

export const Confirm = ({msg,onConfirm,onCancel}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:1200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
    <div style={{background:"#0F1623",border:"1px solid rgba(255,107,107,.2)",borderRadius:14,padding:24,maxWidth:360,width:"90%",animation:"modalIn .2s ease"}}>
      <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,107,107,.1)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:"#F0F4FF",marginBottom:6}}>Confirm Delete</div>
      <div style={{fontSize:12,color:"#5A6580",marginBottom:20,lineHeight:1.6}}>{msg}</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <SBtn onClick={onCancel} outline color="#5A6580">Cancel</SBtn>
        <SBtn onClick={onConfirm} color="#FF6B6B">Delete</SBtn>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════ */
export const IC = {
  People:  p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  List:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Task:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  Eye:     p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Edit:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:   p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Lock:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Search:  p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Table:   p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/></svg>,
  Grid:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Clock:   p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  X:       p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check:   p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Chevron: p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
  Activity:p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Mail:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  Phone:   p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.38 2 2 0 0 1 3.59 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  Award:   p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  Home:    p=><svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};

export const Icon = (name,size=14,color="currentColor") => {
  const C = IC[name];
  return C ? <C width={size} height={size} style={{color,flexShrink:0}}/> : null;
};

/* ═══════════════════════════════════════════════════
   GLOBAL STYLES — inject once
═══════════════════════════════════════════════════ */
export const GlobalStyles = () => {
  useEffect(() => {
    if (document.getElementById("em-global-styles")) return;
    const s = document.createElement("style");
    s.id = "em-global-styles";
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
      @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      @keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @keyframes toastIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes tabSlide{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      .em-root *{box-sizing:border-box;}
      .em-root{font-family:'Outfit',sans-serif;color:#D0D8F0;background:#070C18;min-height:100vh;}
      .em-root select option{background:#0F1623;color:#D0D8F0;}
      ::-webkit-scrollbar{width:4px;height:4px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.09);border-radius:3px}
      input[type=range]{height:4px;}
    `;
    document.head.appendChild(s);
  }, []);
  return null;
};