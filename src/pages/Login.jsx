import { useState } from "react";
import API from "../api/axios.js";

const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4" strokeWidth="2"/>
  </svg>
);

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [role, setRole]         = useState("employee");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const validate = () => {
    if (!email.trim())                return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    if (!password)                    return "Password is required.";
    if (password.length < 6)         return "Password must be at least 6 characters.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password, role });
      const data = res.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.role === "admin") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/employee/dashboard";
      }

    } catch (err) {
      const message = err.response?.data?.message || err.message || "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 0.7s linear infinite; }
        .grid-bg {
          background-image:
            linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
      `}</style>

      <div className="font-dm min-h-screen flex bg-[#0A0C10] text-[#E8EAF0] overflow-hidden">

        {/* LEFT PANEL */}
        <div className="hidden md:flex w-[46%] flex-col justify-center px-16 py-16 relative">
          <div className="grid-bg absolute inset-0 z-0" />
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#1E6FBF]/18 blur-[80px] pointer-events-none z-0" />
          <div className="absolute bottom-16 left-48 w-48 h-48 rounded-full bg-[#63B3ED]/10 blur-[80px] pointer-events-none z-0" />
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#63B3ED]/15 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-11 h-11 rounded-[10px] bg-gradient-to-br from-[#1E6FBF] to-[#63B3ED] flex items-center justify-center text-white">
                <ShieldIcon />
              </div>
              <div>
                <div className="font-syne text-[18px] font-extrabold text-[#E8EAF0] tracking-tight">WorkTrack</div>
                <div className="text-[11px] text-[#63B3ED] tracking-[1.8px] uppercase font-medium">Productivity Platform</div>
              </div>
            </div>

            <h1 className="font-syne text-[42px] font-extrabold leading-[1.15] text-[#F0F4FF] tracking-[-1px] mb-4">
              Monitor.<br />Analyze.<br />
              <span className="text-[#63B3ED]">Improve.</span>
            </h1>
            <p className="text-[15px] text-[#7A8299] leading-[1.7] max-w-[340px]">
              Real-time workforce productivity monitoring for remote and hybrid teams — with full transparency and consent.
            </p>

            <div className="flex gap-10 mt-14 pt-10 border-t border-white/[0.06]">
              {[
                { num: "98%",     label: "Uptime SLA"  },
                { num: "256-bit", label: "Encryption"  },
                { num: "GDPR",    label: "Compliant"   },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-syne text-[28px] font-bold text-[#63B3ED]">{s.num}</div>
                  <div className="text-[12px] text-[#5A6280] mt-0.5 tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex items-center justify-center px-8 py-16 md:px-16">
          <div className="w-full max-w-[420px]">

            <h2 className="font-syne text-[26px] font-bold text-[#F0F4FF] tracking-[-0.5px] mb-1.5">
              Welcome back
            </h2>
            <p className="text-[14px] text-[#5A6280] mb-9">
              Sign in to your workspace account
            </p>

            {/* Role Toggle */}
            <div className="flex bg-[#111520] border border-white/[0.07] rounded-[10px] p-1 mb-7">
              {["employee", "admin"].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); setError(""); }}
                  className={[
                    "flex-1 py-2.5 px-4 rounded-[7px] text-[13.5px] font-medium transition-all duration-200",
                    role === r
                      ? "bg-gradient-to-r from-[#1E6FBF] to-[#2B85D8] text-white shadow-lg shadow-blue-900/30"
                      : "text-[#5A6280] hover:text-[#A0AECF]",
                  ].join(" ")}
                >
                  {r === "employee" ? "👤 Employee" : "🛡️ Admin / HR"}
                </button>
              ))}
            </div>

            {role === "admin" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mb-5">
                <p className="text-[12.5px] text-blue-300">
                  🛡️ Admin account is pre-configured. Contact your system administrator if you need access.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Email */}
              <div className="mb-[18px]">
                <label className="block text-[12.5px] font-medium text-[#7A8299] mb-2 uppercase tracking-[0.4px]">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder={role === "admin" ? "admin@worktrack.com" : "you@company.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-[#111520] border border-white/[0.08] rounded-[9px] px-4 py-3.5 text-[14.5px] text-[#E8EAF0] placeholder-[#3D4460] outline-none focus:border-[#63B3ED]/50 focus:ring-2 focus:ring-[#63B3ED]/[0.08] transition-all"
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="block text-[12.5px] font-medium text-[#7A8299] mb-2 uppercase tracking-[0.4px]">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-[#111520] border border-white/[0.08] rounded-[9px] px-4 py-3.5 pr-12 text-[14.5px] text-[#E8EAF0] placeholder-[#3D4460] outline-none focus:border-[#63B3ED]/50 focus:ring-2 focus:ring-[#63B3ED]/[0.08] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A5270] hover:text-[#8090B0] transition-colors"
                  >
                    {showPass ? <EyeOpen /> : <EyeClosed />}
                  </button>
                </div>
              </div>

              {/* Forgot */}
              <div className="flex justify-end mb-6">
                <a href="/forgot-password" className="text-[13px] text-[#4A7FBF] hover:text-[#63B3ED] transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Error Box */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-3 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  <span className="text-[13.5px] text-red-300">{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-[#185FA5] to-[#2B85D8] rounded-[9px] font-syne text-[15px] font-bold text-white tracking-[0.3px] transition-all hover:opacity-90 hover:-translate-y-px active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Signing in…
                  </span>
                ) : `Sign In as ${role === "admin" ? "Admin" : "Employee"}`}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[12px] text-[#3D4460] whitespace-nowrap">
                {role === "employee" ? "No account?" : "Need help?"}
              </span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            <p className="text-center text-[12.5px] text-[#3D4460]">
              {role === "employee"
                ? "Your account is created by your HR Admin."
                : "Contact your system administrator for access."
              }<br />
              <a href="/support" className="text-[#4A7FBF] hover:text-[#63B3ED] transition-colors">
                Having trouble signing in?
              </a>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
