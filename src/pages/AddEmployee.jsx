import { useState, useRef } from "react";
import {
  User, Mail, Lock, Phone, MapPin, Building2, Briefcase,
  DollarSign, Calendar, ChevronDown, UserPlus, Eye, EyeOff,
  Globe, AlertCircle, Loader2, CheckCircle2, CheckCircle
} from "lucide-react";
import API from "../api/axios.js";

/* ── Responsive hook ── */
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useState(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  });
  return width;
}

function useResponsiveWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  const { useEffect } = require !== undefined
    ? { useEffect: (fn) => { } }
    : {};
  return width;
}

const DEPARTMENTS = ["Engineering","Design","Marketing","Sales","HR","Finance","Operations","Legal"];
const ROLES       = ["Intern","Junior","Mid-level","Senior","Lead","Manager","Director","C-Level"];
const CURRENCIES  = ["PKR","USD","EUR","GBP","AED"];
const CITIES      = ["Karachi","Lahore","Islamabad","Faisalabad","Rawalpindi","Multan","Peshawar","Quetta","Other"];

const STATUS_OPTS = [
  { label: "Active",  bg: "#052e16", color: "#4ade80", dot: "#22c55e" },
  { label: "Remote",  bg: "#0c1a3a", color: "#60a5fa", dot: "#3b82f6" },
];

const URDU_REGEX    = /[\u0600-\u06FF]/;
const ARABIC_DIGITS = /[٠-٩]/;

const DISPOSABLE_DOMAINS = [
  "mailinator.com","guerrillamail.com","tempmail.com","throwaway.email",
  "yopmail.com","trashmail.com","sharklasers.com","guerrillamailblock.com",
  "grr.la","guerrillamail.info","guerrillamail.biz","guerrillamail.de",
  "guerrillamail.net","guerrillamail.org","spam4.me","maildrop.cc",
  "dispostable.com","fakeinbox.com","getairmail.com","mailnull.com",
  "spamgourmet.com","spamgourmet.net","spamgourmet.org","trashmail.at",
  "trashmail.io","trashmail.me","trashmail.net","wegwerfmail.de",
  "wegwerfmail.net","wegwerfmail.org","spambox.us","filzmail.com",
  "throwam.com","discard.email","spamherelots.com","tempr.email",
  "zetmail.com","moakt.com","emlpro.com","emltmp.com","tempinbox.com",
  "tempemail.net","mytemp.email","temp-mail.org","10minutemail.com",
  "10minutemail.net","10minemail.com","minutemailbox.com","mohmal.com",
  "mailtemp.info","emailondeck.com","crazymailing.com","spamfree24.org",
];

function genId() { return "EMP-" + Math.floor(1000 + Math.random() * 9000); }

function completeness(form) {
  const keys = ["firstName","lastName","email","password","phone","department","role","salary","joinDate","city","address","bio"];
  const filled = keys.filter(k => form[k] && form[k].toString().trim() !== "").length;
  return Math.round((filled / keys.length) * 100);
}

async function validateEmailReal(email) {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address";
  const domain = trimmed.split("@")[1];
  if (DISPOSABLE_DOMAINS.includes(domain)) return "Disposable/temporary emails are not allowed";
  try {
    const res = await API.post("/verify-email", { email: trimmed });
    if (!res.data.valid) return "Email does not exist — please enter a real email address";
    return "";
  } catch { return ""; }
}

function validateOne(key, val) {
  if (!val || val.trim() === "") {
    const req = ["firstName","lastName","email","password","phone","department","role","salary","joinDate"];
    return req.includes(key) ? getLabel(key) + " is required" : "";
  }
  if (URDU_REGEX.test(val)) return "Please enter in English only";
  switch (key) {
    case "firstName":
    case "lastName":
      if (/[0-9]/.test(val))            return "Name cannot contain numbers";
      if (/[^a-zA-Z\s\-\']/.test(val)) return "Name can only contain letters";
      return "";
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email address";
      const domain = val.trim().toLowerCase().split("@")[1];
      if (DISPOSABLE_DOMAINS.includes(domain)) return "Disposable/temporary emails are not allowed";
      return "";
    case "password":
      if (val.length < 6) return "Minimum 6 characters required";
      return "";
    case "phone":
      if (ARABIC_DIGITS.test(val))          return "Use standard digits (0–9) only";
      if (/[a-zA-Z]/.test(val))             return "Phone cannot contain letters";
      if (/[^\d\s\+\-\(\)]/.test(val))      return "Invalid characters";
      if (val.replace(/\D/g,"").length < 7) return "Phone number too short";
      return "";
    case "salary":
      if (ARABIC_DIGITS.test(val))                                    return "Use English digits only";
      if (!/^\d+(\.\d+)?$/.test(val.replace(/,/g,"")))               return "Salary must be a valid number";
      if (parseFloat(val.replace(/,/g,"")) <= 0)                      return "Salary must be greater than 0";
      return "";
    default: return "";
  }
}

function getLabel(key) {
  const map = {
    firstName:"First name", lastName:"Last name", email:"Email", password:"Password",
    phone:"Phone", department:"Department", role:"Role", salary:"Salary",
    joinDate:"Joining date", city:"City", country:"Country", address:"Address", bio:"Bio"
  };
  return map[key] || key;
}

const T = {
  bg:"#0b0d13", surface:"#13151e", surface2:"#1a1d28", surface3:"#1f2230",
  border:"#252836", borderHover:"#32364a", borderFocus:"#5b5fc7",
  text:"#e8e9f0", textSub:"#a0a3b1", textMuted:"#5a5e72",
  accent:"#5b5fc7", accentLight:"#6366f1", accentBg:"#1a1b35", accentBorder:"#35386b",
  errorBg:"#1e1a10", errorBorder:"#4a3a10", errorText:"#c9a227", errorIcon:"#b8921f",
  successColor:"#34a668", successBg:"#0d2318", inputBg:"#10121a",
};

/* ── Reusable components (same as original) ── */
function Field({ label, required, error, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{
        display:"flex", alignItems:"center", gap:5,
        fontSize:10.5, fontWeight:600, letterSpacing:".07em",
        textTransform:"uppercase", color:T.textMuted, marginBottom:6
      }}>
        {label}
        {required && (
          <span style={{ fontSize:9, fontWeight:700, color:T.accentLight, background:T.accentBg, padding:"1px 5px", borderRadius:3, letterSpacing:".04em" }}>REQ</span>
        )}
      </label>
      {children}
      {error && (
        <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5, padding:"5px 8px", borderRadius:6, background:T.errorBg, border:`1px solid ${T.errorBorder}` }}>
          <AlertCircle size={10} color={T.errorIcon} strokeWidth={2.5}/>
          <span style={{ fontSize:11, color:T.errorText, fontWeight:500 }}>{error}</span>
        </div>
      )}
    </div>
  );
}

function Inp({ icon, placeholder, value, onChange, onBlur, error, isValid, type="text", extraRight=null, inputmode, disabled }) {
  const borderColor = error ? T.errorBorder : isValid ? "#1e4a30" : T.border;
  const bg          = error ? T.errorBg     : T.inputBg;
  return (
    <div style={{ position:"relative" }}>
      {icon && (
        <div style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, zIndex:1, display:"flex", alignItems:"center" }}>
          {icon}
        </div>
      )}
      <input
        type={type} placeholder={placeholder} value={value}
        inputMode={inputmode} disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        style={{
          width:"100%", padding:"9px 12px",
          paddingLeft: icon ? 34 : 12,
          paddingRight: (extraRight || isValid) ? 34 : 12,
          fontSize:13, fontFamily:"inherit", borderRadius:8,
          border:`1px solid ${borderColor}`,
          background:bg, color:T.text, outline:"none",
          transition:"border .15s, box-shadow .15s", lineHeight:1.4,
          opacity:disabled ? 0.6 : 1,
          cursor:disabled ? "not-allowed" : "text",
        }}
        onFocus={e => { e.target.style.borderColor=T.borderFocus; e.target.style.boxShadow="0 0 0 3px rgba(91,95,199,.12)"; }}
        onBlurCapture={e => { e.target.style.boxShadow="none"; }}
      />
      {isValid && !error && !extraRight && (
        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center" }}>
          <CheckCircle size={13} color={T.successColor}/>
        </div>
      )}
      {extraRight}
    </div>
  );
}

function Sel({ icon, value, onChange, onBlur, options, placeholder, error, isValid, style:sx={} }) {
  const borderColor = error ? T.errorBorder : isValid ? "#1e4a30" : T.border;
  return (
    <div style={{ position:"relative", ...sx }}>
      {icon && (
        <div style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:T.textMuted, zIndex:1, display:"flex", alignItems:"center" }}>
          {icon}
        </div>
      )}
      <select value={value} onChange={e => onChange(e.target.value)} onBlur={onBlur}
        style={{
          width:"100%", padding:"9px 32px 9px",
          paddingLeft: icon ? 34 : 12,
          fontSize:13, fontFamily:"inherit", borderRadius:8,
          border:`1px solid ${borderColor}`,
          background:T.inputBg, color:value ? T.text : T.textMuted,
          outline:"none", appearance:"none", WebkitAppearance:"none",
          cursor:"pointer", transition:"border .15s", lineHeight:1.4,
        }}
        onFocus={e => { e.target.style.borderColor=T.borderFocus; e.target.style.boxShadow="0 0 0 3px rgba(91,95,199,.12)"; }}
        onBlurCapture={e => { e.target.style.boxShadow="none"; }}>
        {placeholder && <option value="" style={{ background:T.surface }}>{placeholder}</option>}
        {options.map(o => <option key={o} value={o} style={{ background:T.surface }}>{o}</option>)}
      </select>
      <ChevronDown size={12} color={T.textMuted} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
    </div>
  );
}

function SecHead({ icon, label }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12, marginTop:6 }}>
      <div style={{ width:28, height:28, borderRadius:8, background:T.accentBg, border:`1px solid ${T.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accentLight, flexShrink:0 }}>
        {icon}
      </div>
      <span style={{ fontSize:10.5, fontWeight:700, color:T.textSub, letterSpacing:".12em", textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1, height:1, background:T.border }}/>
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px 18px 4px", marginBottom:20, boxShadow:"0 1px 8px rgba(0,0,0,.25)" }}>
      {children}
    </div>
  );
}

/* ── Responsive Grid2 — 1col on mobile, 2col on wider ── */
function Grid2({ children, isMobile }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:14 }}>
      {children}
    </div>
  );
}

/* ── Preview Card ── */
function PreviewCard({ form, pct }) {
  const statusOpt = STATUS_OPTS.find(s => s.label === form.status) || STATUS_OPTS[0];
  const initials  = (form.firstName?.[0] || "") + (form.lastName?.[0] || "");
  return (
    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden", boxShadow:"0 4px 24px rgba(0,0,0,.35)" }}>
      <div style={{ padding:"22px 16px 16px", textAlign:"center", borderBottom:`1px solid ${T.border}`, background:`linear-gradient(160deg, ${T.surface2} 0%, ${T.surface} 100%)` }}>
        <div style={{ position:"relative", width:52, height:52, margin:"0 auto 13px" }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg, ${T.accentLight}, #4338ca)`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 18px rgba(99,102,241,.25)" }}>
            {initials
              ? <span style={{ fontSize:18, fontWeight:700, color:"#fff", letterSpacing:"-.01em" }}>{initials.toUpperCase()}</span>
              : <User size={20} color="rgba(255,255,255,.35)"/>
            }
          </div>
          <span style={{ position:"absolute", bottom:1, right:1, width:11, height:11, borderRadius:"50%", background:statusOpt.dot, border:`2px solid ${T.surface}`, display:"block" }}/>
        </div>
        <div style={{ fontSize:14.5, fontWeight:700, color:form.firstName||form.lastName?T.text:T.border, marginBottom:3, letterSpacing:"-.01em" }}>
          {form.firstName||form.lastName ? `${form.firstName} ${form.lastName}`.trim() : "Full Name"}
        </div>
        <div style={{ fontSize:11, color:T.textMuted, marginBottom:12, letterSpacing:".02em" }}>
          {form.role||form.department ? [form.role,form.department].filter(Boolean).join(" · ") : "Role · Department"}
        </div>
        <div style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:600, background:statusOpt.bg, color:statusOpt.color, border:`1px solid ${statusOpt.dot}33` }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:statusOpt.dot, display:"inline-block" }}/>
          {form.status}
        </div>
      </div>

      <div style={{ padding:"10px 14px" }}>
        {[
          { icon:<Mail size={11}/>,       label:"Email",  val:form.email    || "—" },
          { icon:<Phone size={11}/>,       label:"Phone",  val:form.phone    || "—" },
          { icon:<MapPin size={11}/>,      label:"City",   val:form.city     || "—" },
          { icon:<DollarSign size={11}/>,  label:"Salary", val:form.salary ? `${form.currency} ${form.salary}` : "—" },
          { icon:<Calendar size={11}/>,    label:"Join",   val:form.joinDate || "—" },
        ].map(row => (
          <div key={row.label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11.5, padding:"6px 0", borderBottom:`1px solid ${T.surface2}` }}>
            <span style={{ color:T.textMuted, flexShrink:0, display:"flex", alignItems:"center" }}>{row.icon}</span>
            <span style={{ color:T.textMuted, width:44, flexShrink:0, fontSize:10.5 }}>{row.label}</span>
            <span style={{ color:T.textSub, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11.5 }}>{row.val}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop:`1px solid ${T.border}`, padding:"10px 14px 13px", background:T.surface2 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
          <span style={{ fontSize:9.5, color:T.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:".08em" }}>Profile Completeness</span>
          <span style={{ fontSize:10.5, color:pct===100?T.successColor:T.accentLight, fontWeight:700 }}>{pct}%</span>
        </div>
        <div style={{ height:3, background:T.border, borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:pct===100?`linear-gradient(90deg,${T.successColor},#22c55e)`:`linear-gradient(90deg,${T.accent},${T.accentLight})`, borderRadius:4, transition:"width .4s ease" }}/>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════ */
export default function AddEmployee() {
  const [width, setWidth] = useState(window.innerWidth);
  useState(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  });

  const { useEffect } = { useEffect: (fn, deps) => { } }; // placeholder — real hook below
  const [w, setW] = useState(window.innerWidth);

  // ── real responsive state ──
  const [screenW, setScreenW] = useState(window.innerWidth);
  useState(() => {
    const fn = () => setScreenW(window.innerWidth);
    window.addEventListener("resize", fn);
  });

  const isMobile  = screenW < 640;
  const isTablet  = screenW >= 640 && screenW < 1024;
  const showSide  = screenW >= 900; // preview card as sidebar

  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [submitted,     setSubmitted]     = useState(false);
  const [apiError,      setApiError]      = useState("");
  const [touched,       setTouched]       = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const emailCheckRef = useRef(null);

  const [form, setForm] = useState({
    empId:genId(), firstName:"", lastName:"", email:"", password:"",
    phone:"", city:"", address:"", country:"Pakistan",
    department:"", role:"", status:"Active",
    salary:"", currency:"PKR", joinDate:"", bio:"",
  });

  const [errors, setErrors] = useState({});

  const handleEmailBlur = async (val) => {
    const emailVal = val ?? form.email;
    setTouched(prev => ({ ...prev, email:true }));
    const syncErr = validateOne("email", emailVal);
    if (syncErr) { setErrors(prev => ({ ...prev, email:syncErr })); return; }
    setErrors(prev => ({ ...prev, email:"" }));
    setEmailChecking(true);
    if (emailCheckRef.current) clearTimeout(emailCheckRef.current);
    emailCheckRef.current = setTimeout(async () => {
      const smtpErr = await validateEmailReal(emailVal);
      setErrors(prev => ({ ...prev, email:smtpErr }));
      setEmailChecking(false);
    }, 300);
  };

  const touchField = (key, val) => {
    if (key === "email") { handleEmailBlur(val ?? form.email); return; }
    const err = validateOne(key, val ?? form[key]);
    setErrors(prev => ({ ...prev, [key]:err }));
    setTouched(prev => ({ ...prev, [key]:true }));
  };

  const set = (key, val) => {
    if (key === "salary")                          val = val.replace(/[^\d.]/g, "");
    if (key === "phone")                           val = val.replace(/[a-zA-Z]/g, "");
    if (key === "firstName" || key === "lastName") val = val.replace(/[0-9]/g, "");
    setForm(prev => ({ ...prev, [key]:val }));
    if (key === "email") { setErrors(prev => ({ ...prev, email:"" })); return; }
    if (touched[key]) { const err = validateOne(key, val); setErrors(prev => ({ ...prev, [key]:err })); }
  };

  const validateAll = () => {
    const required = ["firstName","lastName","email","password","phone","department","role","salary","joinDate"];
    const newErrors = {}; let valid = true;
    required.forEach(key => { const err = validateOne(key, form[key]); if (err) { newErrors[key]=err; valid=false; } });
    ["bio","city","country","address"].forEach(key => { if (form[key]) { const err = validateOne(key, form[key]); if (err) { newErrors[key]=err; valid=false; } } });
    if (errors.email) { newErrors.email=errors.email; valid=false; }
    setErrors(newErrors);
    setTouched(Object.fromEntries([...Object.keys(newErrors), ...required].map(k => [k, true])));
    return valid;
  };

  const handleSubmit = async () => {
    if (emailChecking) { setApiError("Please wait — email is being verified..."); return; }
    if (!validateAll()) { setApiError("Please fix the errors above before submitting."); return; }
    setLoading(true); setApiError("");
    try {
      await API.post("/employees", form);
      setSubmitted(true);
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setSubmitted(false); setApiError(""); setErrors({}); setTouched({});
    setEmailChecking(false);
    if (emailCheckRef.current) clearTimeout(emailCheckRef.current);
    setForm({ empId:genId(), firstName:"", lastName:"", email:"", password:"", phone:"", city:"", address:"", country:"Pakistan", department:"", role:"", status:"Active", salary:"", currency:"PKR", joinDate:"", bio:"" });
  };

  const isValidF = (key) => touched[key] && !errors[key] && form[key]?.trim() !== "";
  const pct      = completeness(form);

  /* ── Success screen ── */
  if (submitted) return (
    <div style={{ fontFamily:"'Inter', sans-serif", background:T.bg, minHeight:"100vh" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", padding:16 }}>
        <div style={{ textAlign:"center", padding: isMobile ? "32px 24px" : "48px 56px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,.5)", width:"100%", maxWidth:440 }}>
          <div style={{ width:68, height:68, borderRadius:"50%", margin:"0 auto 20px", background:T.successBg, border:"1px solid #1a4a2e", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CheckCircle2 size={30} color={T.successColor}/>
          </div>
          <div style={{ fontSize:19, fontWeight:700, color:T.text, marginBottom:8 }}>Employee Registered</div>
          <div style={{ fontSize:11.5, color:T.accentLight, fontWeight:600, letterSpacing:".08em", background:T.accentBg, display:"inline-block", padding:"3px 12px", borderRadius:20, border:`1px solid ${T.accentBorder}` }}>{form.empId}</div>
          <div style={{ fontSize:16, color:T.text, fontWeight:600, marginTop:14, marginBottom:4 }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize:12.5, color:T.textMuted }}>{form.role} · {form.department}</div>
          <button onClick={resetForm} style={{ marginTop:28, padding:"9px 22px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSub, fontSize:13, fontFamily:"inherit", cursor:"pointer", fontWeight:500 }}>
            + Add another employee
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Inter', -apple-system, sans-serif", color:T.text, background:T.bg, minHeight:"100vh", padding: isMobile ? "16px 14px" : "24px" }}>

      {/* ── Page header ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:26, flexWrap:"wrap" }}>
        <div style={{ width:30, height:30, borderRadius:8, background:T.accentBg, border:`1px solid ${T.accentBorder}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accentLight, flexShrink:0 }}>
          <UserPlus size={14} strokeWidth={2}/>
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:T.textSub, letterSpacing:".1em", textTransform:"uppercase" }}>Add Employee</span>
        <div style={{ flex:1, height:1, background:T.border, minWidth:20 }}/>
        <span style={{ fontSize:11, fontWeight:600, color:T.textMuted, background:T.surface2, padding:"4px 10px", borderRadius:6, letterSpacing:".05em", border:`1px solid ${T.border}` }}>{form.empId}</span>
      </div>

      {apiError && (
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18, padding:"11px 14px", borderRadius:9, background:T.errorBg, border:`1px solid ${T.errorBorder}`, fontSize:13, color:T.errorText }}>
          <AlertCircle size={14} color={T.errorIcon}/>
          <span style={{ flex:1 }}>{apiError}</span>
          <button onClick={() => setApiError("")} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
        </div>
      )}

      {/* ── Layout: sidebar on wide, stacked on narrow ── */}
      <div style={{ display:"grid", gridTemplateColumns: showSide ? "1fr 258px" : "1fr", gap:22, alignItems:"start" }}>

        {/* ── LEFT: Form ── */}
        <div>
          <SecHead icon={<User size={13}/>} label="Personal Information"/>
          <Card>
            <Grid2 isMobile={isMobile}>
              <Field label="First Name" required error={errors.firstName}>
                <Inp icon={<User size={12}/>} placeholder="Ali"
                  value={form.firstName} onChange={v => set("firstName", v)}
                  onBlur={() => touchField("firstName")}
                  error={errors.firstName} isValid={isValidF("firstName")}/>
              </Field>
              <Field label="Last Name" required error={errors.lastName}>
                <Inp icon={<User size={12}/>} placeholder="Hassan"
                  value={form.lastName} onChange={v => set("lastName", v)}
                  onBlur={() => touchField("lastName")}
                  error={errors.lastName} isValid={isValidF("lastName")}/>
              </Field>
            </Grid2>
            <Grid2 isMobile={isMobile}>
              <Field label="Email Address" required error={errors.email}>
                <div style={{ position:"relative" }}>
                  <Inp icon={<Mail size={12}/>} placeholder="ali@company.com" type="email"
                    value={form.email} onChange={v => set("email", v)}
                    onBlur={() => touchField("email")}
                    error={errors.email} isValid={isValidF("email") && !emailChecking}
                    extraRight={emailChecking ? (
                      <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center" }}>
                        <Loader2 size={13} color={T.accentLight} style={{ animation:"spin .75s linear infinite" }}/>
                      </div>
                    ) : null}
                  />
                </div>
                {emailChecking && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5, padding:"5px 8px", borderRadius:6, background:T.accentBg, border:`1px solid ${T.accentBorder}` }}>
                    <Loader2 size={10} color={T.accentLight} style={{ animation:"spin .75s linear infinite" }}/>
                    <span style={{ fontSize:11, color:T.accentLight, fontWeight:500 }}>Verifying email via SMTP...</span>
                  </div>
                )}
              </Field>
              <Field label="Password" required error={errors.password}>
                <Inp icon={<Lock size={12}/>} placeholder="Min 6 characters"
                  type={showPwd ? "text" : "password"}
                  value={form.password} onChange={v => set("password", v)}
                  onBlur={() => touchField("password")}
                  error={errors.password} isValid={isValidF("password")}
                  extraRight={
                    <button onClick={() => setShowPwd(p => !p)}
                      style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", padding:0, color:T.textMuted }}>
                      {showPwd ? <EyeOff size={13}/> : <Eye size={13}/>}
                    </button>
                  }
                />
              </Field>
            </Grid2>
            <Field label="Phone Number" required error={errors.phone}>
              <Inp icon={<Phone size={12}/>} placeholder="+92 300 0000000" type="tel"
                value={form.phone} onChange={v => set("phone", v)}
                onBlur={() => touchField("phone")}
                error={errors.phone} isValid={isValidF("phone")}/>
            </Field>
            <Field label="Bio" error={errors.bio}>
              <textarea value={form.bio} placeholder="Brief introduction about this employee..."
                onChange={e => set("bio", e.target.value)}
                onBlur={() => touchField("bio")}
                style={{ width:"100%", minHeight:76, resize:"vertical", padding:"9px 12px", fontSize:13, fontFamily:"inherit", borderRadius:8, lineHeight:1.6, outline:"none", border:`1px solid ${errors.bio?T.errorBorder:T.border}`, background:errors.bio?T.errorBg:T.inputBg, color:T.text, transition:"border .15s" }}/>
            </Field>
          </Card>

          <SecHead icon={<MapPin size={13}/>} label="Location"/>
          <Card>
            <Grid2 isMobile={isMobile}>
              <Field label="City" error={errors.city}>
                <Sel icon={<MapPin size={12}/>} value={form.city}
                  onChange={v => set("city", v)} onBlur={() => touchField("city")}
                  options={CITIES} placeholder="Select city"
                  error={errors.city} isValid={isValidF("city")}/>
              </Field>
              <Field label="Country" error={errors.country}>
                <Inp icon={<Globe size={12}/>} placeholder="Pakistan"
                  value={form.country} onChange={v => set("country", v)}
                  onBlur={() => touchField("country")}
                  error={errors.country} isValid={isValidF("country")}/>
              </Field>
            </Grid2>
            <Field label="Address" error={errors.address}>
              <Inp icon={<MapPin size={12}/>} placeholder="Street, Area, Postal Code"
                value={form.address} onChange={v => set("address", v)}
                onBlur={() => touchField("address")}
                error={errors.address} isValid={isValidF("address")}/>
            </Field>
          </Card>

          <SecHead icon={<Briefcase size={13}/>} label="Work Details"/>
          <Card>
            <Grid2 isMobile={isMobile}>
              <Field label="Department" required error={errors.department}>
                <Sel icon={<Building2 size={12}/>} value={form.department}
                  onChange={v => set("department", v)} onBlur={() => touchField("department")}
                  options={DEPARTMENTS} placeholder="Select department"
                  error={errors.department} isValid={isValidF("department")}/>
              </Field>
              <Field label="Role" required error={errors.role}>
                <Sel icon={<Briefcase size={12}/>} value={form.role}
                  onChange={v => set("role", v)} onBlur={() => touchField("role")}
                  options={ROLES} placeholder="Select role"
                  error={errors.role} isValid={isValidF("role")}/>
              </Field>
            </Grid2>
            <Field label="Employment Status">
              <div style={{ display:"flex", gap:7, flexWrap:"wrap", paddingBottom:4 }}>
                {STATUS_OPTS.map(opt => (
                  <button key={opt.label} onClick={() => set("status", opt.label)}
                    style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit", transition:"all .15s", border:`1px solid ${form.status===opt.label?opt.dot+"55":T.border}`, background:form.status===opt.label?opt.bg:T.surface2, color:form.status===opt.label?opt.color:T.textMuted, display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:6, height:6, borderRadius:"50%", background:form.status===opt.label?opt.dot:T.borderHover, display:"inline-block", flexShrink:0 }}/>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </Card>

          <SecHead icon={<DollarSign size={13}/>} label="Compensation"/>
          <Card>
            <Grid2 isMobile={isMobile}>
              <Field label="Monthly Salary" required error={errors.salary}>
                <div style={{ display:"flex", gap:8 }}>
                  <div style={{ width:82, flexShrink:0 }}>
                    <Sel value={form.currency} onChange={v => set("currency", v)} options={CURRENCIES}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <Inp icon={<DollarSign size={12}/>} placeholder="75,000"
                      value={form.salary} onChange={v => set("salary", v)}
                      onBlur={() => touchField("salary")}
                      error={errors.salary} isValid={isValidF("salary")} inputmode="numeric"/>
                  </div>
                </div>
                {errors.salary && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:5, padding:"5px 8px", borderRadius:6, background:T.errorBg, border:`1px solid ${T.errorBorder}` }}>
                    <AlertCircle size={10} color={T.errorIcon} strokeWidth={2.5}/>
                    <span style={{ fontSize:11, color:T.errorText, fontWeight:500 }}>{errors.salary}</span>
                  </div>
                )}
              </Field>
              <Field label="Joining Date" required error={errors.joinDate}>
                <Inp icon={<Calendar size={12}/>} type="date"
                  value={form.joinDate} onChange={v => set("joinDate", v)}
                  onBlur={() => touchField("joinDate")}
                  error={errors.joinDate} isValid={isValidF("joinDate")}/>
              </Field>
            </Grid2>
          </Card>

          {/* ── Mobile: Preview card inline ── */}
          {!showSide && (
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:9.5, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:".12em", marginBottom:10 }}>Live Preview</div>
              <PreviewCard form={form} pct={pct}/>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, paddingTop:4, paddingBottom:24, flexWrap: isMobile ? "wrap" : "nowrap" }}>
            <button onClick={resetForm} disabled={loading}
              style={{ padding:"9px 18px", borderRadius:8, cursor:"pointer", background:"transparent", border:`1px solid ${T.border}`, color:T.textMuted, fontSize:13, fontFamily:"inherit", fontWeight:500, transition:"border .15s, color .15s", width: isMobile ? "100%" : "auto" }}>
              Clear
            </button>
            <button onClick={handleSubmit} disabled={loading || emailChecking}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 22px", borderRadius:8, cursor:(loading||emailChecking)?"not-allowed":"pointer", background:(loading||emailChecking)?T.accentBg:T.accent, border:`1px solid ${(loading||emailChecking)?T.accentBorder:T.accent}`, color:(loading||emailChecking)?T.accentLight:"#fff", fontSize:13, fontFamily:"inherit", fontWeight:600, transition:"all .18s", opacity:(loading||emailChecking)?.7:1, boxShadow:(loading||emailChecking)?"none":"0 2px 14px rgba(91,95,199,.3)", width: isMobile ? "100%" : "auto" }}>
              {loading
                ? <><Loader2 size={13} style={{ animation:"spin .75s linear infinite" }}/>Registering...</>
                : emailChecking
                ? <><Loader2 size={13} style={{ animation:"spin .75s linear infinite" }}/>Verifying email...</>
                : <><UserPlus size={13}/>Register Employee</>
              }
            </button>
          </div>
        </div>

        {/* ── RIGHT: Sticky preview (wide screens only) ── */}
        {showSide && (
          <div style={{ position:"sticky", top:16 }}>
            <div style={{ fontSize:9.5, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:".12em", marginBottom:10 }}>Live Preview</div>
            <PreviewCard form={form} pct={pct}/>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: .35; filter: invert(1); }
        input::placeholder, textarea::placeholder { color: #2e3042; }
        select option { color: #e8e9f0; background: #13151e; }
        textarea { scrollbar-width: thin; scrollbar-color: #252836 #10121a; }
      `}</style>
    </div>
  );
}
