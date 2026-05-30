import { useState } from "react";
import { usePrivacy } from "../context/PrivacyContext";
import {
  Shield, ShieldOff, Plus, Trash2, Eye, EyeOff,
  RefreshCw, AlertTriangle, CheckCircle, Lock, Unlock,
  Monitor, Camera, Info
} from "lucide-react";

// Common apps list for quick-add
const COMMON_APPS = [
  "WhatsApp", "Telegram", "Signal", "Facebook", "Instagram",
  "Twitter", "Gmail", "Outlook", "Personal Banking", "Google Chrome",
  "Firefox", "Safari", "Discord", "Slack (Personal)", "Zoom (Personal)",
  "Skype", "Teams (Personal)", "Spotify", "YouTube", "Netflix",
];

export default function PrivacySettings() {
  const {
    blockedApps,
    screenshotPaused,
    loading,
    error,
    blockApp,
    unblockApp,
    toggleScreenshotPause,
    reload,
  } = usePrivacy();

  const [newApp,   setNewApp]   = useState("");
  const [newReason,setNewReason]= useState("");
  const [adding,   setAdding]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const [confirm,  setConfirm]  = useState(null); // appName to unblock

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleBlock = async () => {
    const name = newApp.trim();
    if (!name) return;
    const already = blockedApps.find(
      a => a.appName.toLowerCase() === name.toLowerCase()
    );
    if (already) { showToast("Ye app pehle se blocked hai", "warn"); return; }
    setAdding(true);
    await blockApp(name, newReason.trim());
    setNewApp("");
    setNewReason("");
    setAdding(false);
    showToast(`"${name}" block ho gaya — screenshots nahi jaenge`);
  };

  const handleUnblock = async (appName) => {
    await unblockApp(appName);
    setConfirm(null);
    showToast(`"${appName}" unblock ho gaya`);
  };

  const handleQuickAdd = async (appName) => {
    const already = blockedApps.find(
      a => a.appName.toLowerCase() === appName.toLowerCase()
    );
    if (already) { showToast(`"${appName}" pehle se blocked hai`, "warn"); return; }
    await blockApp(appName, "Personal app");
    showToast(`"${appName}" block ho gaya`);
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toast && (
        <div style={{
          ...S.toast,
          background: toast.type === "warn"
            ? "rgba(251,191,36,0.12)" : "rgba(74,222,128,0.12)",
          borderColor: toast.type === "warn"
            ? "rgba(251,191,36,0.35)" : "rgba(74,222,128,0.35)",
          color: toast.type === "warn" ? "#fbbf24" : "#4ade80",
        }}>
          {toast.type === "warn"
            ? <AlertTriangle size={14} />
            : <CheckCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ── Confirm Unblock Modal ──────────────────────────── */}
      {confirm && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>
              Unblock karna chahte hain?
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>
              <span style={{ color: "#f87171", fontWeight: 700 }}>"{confirm}"</span>{" "}
              unblock hone ke baad is app ka screenshot admin tak ja sakta hai.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirm(null)} style={S.btnGray}>
                Cancel
              </button>
              <button onClick={() => handleUnblock(confirm)} style={S.btnRed}>
                <Unlock size={13} /> Haan, Unblock karo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────── */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={S.headerIcon}>
            <Shield size={18} color="#a78bfa" />
          </div>
          <div>
            <h1 style={S.h1}>Privacy Settings</h1>
            <p style={S.sub}>
              Woh apps block karo jinka screenshot admin ko nahi jaana chahiye
            </p>
          </div>
        </div>
        <button onClick={reload} style={S.btnGray}>
          <RefreshCw size={13}
            style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={S.errorBar}>
          <AlertTriangle size={13} /> Preferences locally save ho rahi hain (server error: {error})
        </div>
      )}

      {/* ── Master Pause Card ─────────────────────────────── */}
      <div style={{
        ...S.card,
        border: screenshotPaused
          ? "1px solid rgba(248,113,113,0.4)"
          : "1px solid rgba(74,222,128,0.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: screenshotPaused
                ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.1)",
              border: screenshotPaused
                ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(74,222,128,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {screenshotPaused
                ? <CameraOff size={22} color="#f87171" />
                : <Camera size={22} color="#4ade80" />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                {screenshotPaused ? "Screenshots Band Hain" : "Screenshots Chal Rahi Hain"}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                {screenshotPaused
                  ? "Abhi koi bhi screenshot admin ko nahi ja raha"
                  : "Neeche blocked apps ka screenshot nahi jaata, baaki jaata hai"}
              </div>
            </div>
          </div>
          <button
            onClick={toggleScreenshotPause}
            style={{
              ...S.btnBase,
              background: screenshotPaused
                ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.1)",
              border: screenshotPaused
                ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(248,113,113,0.3)",
              color: screenshotPaused ? "#4ade80" : "#f87171",
              padding: "10px 20px", fontSize: 13,
            }}
          >
            {screenshotPaused
              ? <><Eye size={14} /> Resume karo</>
              : <><EyeOff size={14} /> Sab Pause karo</>}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── LEFT: Add New Block ─────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Manual Add */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              <Lock size={14} color="#818cf8" />
              Naya App Block Karo
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>App ka naam</label>
              <input
                style={S.input}
                placeholder="Jaise: WhatsApp, Gmail, Chrome..."
                value={newApp}
                onChange={e => setNewApp(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleBlock()}
              />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Reason (optional)</label>
              <input
                style={S.input}
                placeholder="Jaise: Personal use, Privacy..."
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleBlock()}
              />
            </div>
            <button
              onClick={handleBlock}
              disabled={!newApp.trim() || adding}
              style={{
                ...S.btnBase,
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.4)",
                color: "#a78bfa", padding: "10px 16px",
                width: "100%", justifyContent: "center",
                opacity: !newApp.trim() ? 0.4 : 1,
              }}
            >
              {adding
                ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
                : <Plus size={14} />}
              Block Karo
            </button>
          </div>

          {/* Quick Add from common list */}
          <div style={S.card}>
            <div style={S.cardTitle}>
              <Monitor size={14} color="#818cf8" />
              Common Apps — Quick Add
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {COMMON_APPS.map(app => {
                const isBlocked = blockedApps.some(
                  a => a.appName.toLowerCase() === app.toLowerCase()
                );
                return (
                  <button
                    key={app}
                    onClick={() => isBlocked ? setConfirm(app) : handleQuickAdd(app)}
                    style={{
                      ...S.pill,
                      background: isBlocked
                        ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.04)",
                      border: isBlocked
                        ? "1px solid rgba(248,113,113,0.35)" : "1px solid #1f2937",
                      color: isBlocked ? "#f87171" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {isBlocked ? <Lock size={9} /> : <Plus size={9} />}
                    {app}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div style={{
            ...S.card,
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Info size={15} color="#60a5fa" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                Jab blocked app screen par active ho, Electron agent screenshot ko
                <span style={{ color: "#818cf8" }}> automatically skip</span> kar deta hai.
                Admin ko sirf "Blocked" badge dikhta hai —{" "}
                <span style={{ color: "#818cf8" }}>content bilkul nahi dikhta</span>.<br /><br />
                Aapki privacy preferences sirf aapki machine par save hoti hain.
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Blocked Apps List ─────────────────────── */}
        <div style={S.card}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 16,
          }}>
            <div style={S.cardTitle}>
              <ShieldOff size={14} color="#f87171" />
              Blocked Apps
              <span style={{
                background: "rgba(248,113,113,0.15)",
                border: "1px solid rgba(248,113,113,0.3)",
                color: "#f87171", fontSize: 10, fontWeight: 700,
                padding: "1px 8px", borderRadius: 20,
              }}>
                {blockedApps.length}
              </span>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: "center", padding: "30px 0", opacity: 0.4 }}>
              <RefreshCw size={18} style={{ animation: "spin 1s linear infinite", display: "block", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 12 }}>Load ho raha hai...</div>
            </div>
          )}

          {!loading && blockedApps.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Shield size={32} color="#1f2937" style={{ display: "block", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                Abhi koi app block nahi
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 5 }}>
                Left side se apps block karo
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {blockedApps.map((a, i) => (
              <div key={i} className="blocked-row" style={S.blockedRow}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Lock size={15} color="#f87171" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.appName}
                  </div>
                  {a.reason && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                      {a.reason}
                    </div>
                  )}
                  {a.blockedAt && (
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 2 }}>
                      {new Date(a.blockedAt).toLocaleDateString("ur-PK", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setConfirm(a.appName)}
                  className="unblock-btn"
                  style={S.unblockBtn}
                  title="Unblock karo"
                >
                  <Unlock size={13} />
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inline CameraOff icon (lucide mein nahi) ───────────────────
function CameraOff({ size = 22, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const S = {
  page: {
    background: "#0a0a0f", minHeight: "100vh",
    padding: "28px 32px",
    fontFamily: "'Outfit', sans-serif", color: "#fff",
  },
  header: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 24,
    flexWrap: "wrap", gap: 14,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 11,
    background: "rgba(139,92,246,0.15)",
    border: "1px solid rgba(139,92,246,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  h1: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" },
  card: {
    background: "#0f1117", border: "1px solid #1a1d2e",
    borderRadius: 16, padding: "20px",
  },
  cardTitle: {
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 700, marginBottom: 16,
  },
  fieldGroup: { marginBottom: 12 },
  label: {
    display: "block", fontSize: 10, fontWeight: 600,
    color: "rgba(255,255,255,0.35)", textTransform: "uppercase",
    letterSpacing: ".07em", marginBottom: 6,
  },
  input: {
    width: "100%", padding: "9px 12px", borderRadius: 9,
    border: "1px solid #1f2937", background: "#111827",
    color: "#fff", fontSize: 13,
    fontFamily: "'Outfit', sans-serif", outline: "none",
    boxSizing: "border-box",
  },
  btnBase: {
    display: "flex", alignItems: "center", gap: 7,
    border: "none", borderRadius: 9, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", fontWeight: 600,
    fontSize: 12, transition: "opacity 0.15s",
  },
  btnGray: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 14px", borderRadius: 9,
    border: "1px solid #1f2937", background: "#111827",
    color: "#fff", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
  },
  btnRed: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "8px 16px", borderRadius: 9,
    border: "1px solid rgba(248,113,113,0.4)",
    background: "rgba(248,113,113,0.1)",
    color: "#f87171", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif", fontSize: 12, fontWeight: 600,
  },
  pill: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 11px", borderRadius: 20,
    fontSize: 11, fontWeight: 500, cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    transition: "all 0.15s",
  },
  blockedRow: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 12px", borderRadius: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(248,113,113,0.12)",
    transition: "background 0.15s",
  },
  unblockBtn: {
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 12px", borderRadius: 8,
    border: "1px solid rgba(74,222,128,0.3)",
    background: "rgba(74,222,128,0.08)",
    color: "#4ade80", cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
    fontSize: 11, fontWeight: 600, flexShrink: 0,
  },
  toast: {
    position: "fixed", top: 20, right: 20, zIndex: 9999,
    borderRadius: 12, padding: "10px 18px",
    display: "flex", alignItems: "center", gap: 8,
    fontSize: 13, fontWeight: 600, border: "1px solid",
    fontFamily: "'Outfit', sans-serif",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  errorBar: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 14px", borderRadius: 9, marginBottom: 16,
    background: "rgba(251,191,36,0.08)",
    border: "1px solid rgba(251,191,36,0.25)",
    color: "#fbbf24", fontSize: 12,
  },
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#0f1117", border: "1px solid #1a1d2e",
    borderRadius: 16, padding: "24px", maxWidth: 380, width: "90%",
  },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus { border-color: #374151 !important; box-shadow: 0 0 0 2px rgba(139,92,246,0.2); }
  .blocked-row:hover { background: rgba(255,255,255,0.04) !important; }
  .unblock-btn:hover { background: rgba(74,222,128,0.15) !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
`;
