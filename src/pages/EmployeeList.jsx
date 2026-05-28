import { useState, useEffect, useMemo, useCallback, memo } from "react";
import {
  Search, ChevronDown, LayoutGrid, Table2,
  Trash2, Loader2, AlertCircle, ArrowUp, RefreshCw,
  AlertTriangle, X,
} from "lucide-react";
import API from "../api/axios.js";

// -------------------------------------------------
// CONSTANTS
// -------------------------------------------------
const DEPT_COLORS = {
  Engineering: { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.35)",  text: "#818cf8", dot: "#818cf8" },
  Design:      { bg: "rgba(236,72,153,0.15)",  border: "rgba(236,72,153,0.35)",  text: "#f472b6", dot: "#f472b6" },
  QA:          { bg: "rgba(234,179,8,0.15)",   border: "rgba(234,179,8,0.35)",   text: "#facc15", dot: "#facc15" },
  DevOps:      { bg: "rgba(249,115,22,0.15)",  border: "rgba(249,115,22,0.35)",  text: "#fb923c", dot: "#fb923c" },
  HR:          { bg: "rgba(20,184,166,0.15)",  border: "rgba(20,184,166,0.35)",  text: "#2dd4bf", dot: "#2dd4bf" },
  Marketing:   { bg: "rgba(16,185,129,0.15)",  border: "rgba(16,185,129,0.35)",  text: "#34d399", dot: "#34d399" },
  Finance:     { bg: "rgba(59,130,246,0.15)",  border: "rgba(59,130,246,0.35)",  text: "#60a5fa", dot: "#60a5fa" },
  Sales:       { bg: "rgba(168,85,247,0.15)",  border: "rgba(168,85,247,0.35)",  text: "#c084fc", dot: "#c084fc" },
  Operations:  { bg: "rgba(245,158,11,0.15)",  border: "rgba(245,158,11,0.35)",  text: "#fbbf24", dot: "#fbbf24" },
};
const DEPT_FALLBACK   = { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.15)", text: "#94a3b8", dot: "#94a3b8" };

const STATUS_COLORS = {
  active:      { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)",  text: "#34d399" },
  Active:      { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)",  text: "#34d399" },
  onLeave:     { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.35)",   text: "#fbbf24" },
  "On Leave":  { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.35)",   text: "#fbbf24" },
  idle:        { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.35)",  text: "#818cf8" },
  Idle:        { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.35)",  text: "#818cf8" },
  Remote:      { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.35)",  text: "#818cf8" },
  "Part-time": { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.35)",  text: "#c084fc" },
  Inactive:    { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.35)",   text: "#f87171" },
};
const STATUS_FALLBACK = STATUS_COLORS.Active;

const STATUS_LABEL_MAP = { active: "Active", onLeave: "On Leave", idle: "Idle" };
const statusLabel = (s = "") => STATUS_LABEL_MAP[s] || s;

const SCORE_COLOR = (v) => v >= 90 ? "#22c55e" : v >= 75 ? "#84cc16" : v >= 60 ? "#eab308" : "#ef4444";

const AVATAR_COLORS = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#db2777","#0d9488","#16a34a","#ca8a04"];
const getInitials   = (name = "") => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
const avatarColor   = (name = "") => {
  let h = 0;
  for (const c of name) h += c.charCodeAt(0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const formatSalary  = (v) => (v ? Number(v).toLocaleString() : "—");
const formatJoined  = (emp) => {
  if (emp.joiningDate) return new Date(emp.joiningDate).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" });
  if (emp.joinDate)    return emp.joinDate.slice(0, 10);
  return "—";
};
const empName = (emp) => (emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "—");
const empId   = (emp) => emp._id || emp.id;

const looksLike = (email = "") => {
  if (!email) return false;
  const lower = email.toLowerCase();
  const fakeDomains = ["test.com","fake.com","example.com","dummy.com","abc.com","xyz.com","temp.com","asdf.com"];
  const domain = lower.split("@")[1] || "";
  return fakeDomains.includes(domain) || lower.includes("fake") || lower.includes("test123");
};

// -------------------------------------------------
// RESPONSIVE HOOK
// -------------------------------------------------
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// -------------------------------------------------
// SUB-COMPONENTS
// -------------------------------------------------

const Avatar = memo(({ emp, size = 36 }) => {
  const name = empName(emp);
  const sc   = STATUS_COLORS[emp.status] || STATUS_FALLBACK;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {emp.avatar
        ? <img src={emp.avatar} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
        : (
          <div style={{
            width: size, height: size, borderRadius: "50%",
            background: avatarColor(name),
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: size * 0.33, fontWeight: 700, color: "#fff",
          }}>
            {getInitials(name)}
          </div>
        )
      }
      <span style={{
        position: "absolute", bottom: 1, right: 1,
        width: size * 0.22, height: size * 0.22,
        borderRadius: "50%", background: sc.text,
        border: "1.5px solid #0c1017", display: "block",
      }} />
    </div>
  );
});

const DeptBadge = memo(({ dept }) => {
  const c = DEPT_COLORS[dept] || DEPT_FALLBACK;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 6,
      background: c.bg, border: `1px solid ${c.border}`,
      fontSize: 11, fontWeight: 600, color: c.text,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {dept || "—"}
    </span>
  );
});

const StatusBadge = memo(({ status }) => {
  const sc = STATUS_COLORS[status] || STATUS_FALLBACK;
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: 20,
      background: sc.bg, border: `1px solid ${sc.border}`,
      fontSize: 11, fontWeight: 600, color: sc.text,
    }}>
      {statusLabel(status)}
    </span>
  );
});

const ScoreBar = memo(({ score }) => {
  if (score == null) return <span style={{ fontSize: 12, color: "#2e3a4e" }}>—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 70, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", borderRadius: 4, background: SCORE_COLOR(score), transition: "width 0.6s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: SCORE_COLOR(score) }}>{score}%</span>
    </div>
  );
});

const ActionBtn = memo(({ onClick, disabled, title, danger, children }) => (
  <button
    aria-label={title}
    title={title}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 28, height: 28, borderRadius: 7,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      padding: 0, flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
      transition: "background 0.15s",
    }}
    className={danger ? "el-action el-action-del" : "el-action"}
  >
    {children}
  </button>
));

const Th = ({ children, style: sx = {} }) => <th style={{ ...s.th, ...sx }}>{children}</th>;

const FilterSelect = memo(({ value, onChange, options }) => (
  <div style={{ position: "relative" }}>
    <select
      className="el-input"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={s.filterSelect}
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown size={12} color="#3a4556" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
  </div>
));

const DeleteConfirm = memo(({ onConfirm, onCancel, loading }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    padding: "4px 8px", borderRadius: 8,
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
  }}>
    <AlertTriangle size={12} color="#f87171" />
    <span style={{ fontSize: 11, color: "#f87171" }}>Delete?</span>
    <button
      onClick={onConfirm}
      disabled={loading}
      style={{ fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: "0 2px" }}
    >
      {loading ? <Loader2 size={11} className="el-spin" color="#f87171" /> : "Yes"}
    </button>
    <button
      onClick={onCancel}
      style={{ fontSize: 11, color: "#4b5a70", background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
    >
      <X size={11} />
    </button>
  </div>
));

// -------------------------------------------------
// INLINE EMAIL EDITOR
// -------------------------------------------------
const EmailCell = memo(({ emp, editEmailId, editEmailVal, emailSaving, emailError, onEditEmail, onEmailChange, onEmailSave, onEmailCancel }) => {
  const id      = empId(emp);
  const isEditing = editEmailId === id;
  const fake    = looksLike(emp.email);

  if (isEditing) {
    return (
      <div style={{ marginTop: 3 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <input
            value={editEmailVal}
            onChange={e => onEmailChange(e.target.value)}
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter")  onEmailSave(id);
              if (e.key === "Escape") onEmailCancel();
            }}
            style={{
              fontSize: 11, padding: "4px 8px", borderRadius: 5,
              border: "1px solid rgba(147,180,248,0.45)",
              background: "rgba(147,180,248,0.07)",
              color: "#fff", outline: "none", width: 178,
              fontFamily: "'DM Sans',sans-serif",
            }}
          />
          <button
            onClick={() => onEmailSave(id)}
            disabled={emailSaving}
            style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 5,
              border: "none", background: "rgba(34,197,94,0.18)",
              color: "#22c55e", cursor: "pointer", fontWeight: 700,
            }}
          >
            {emailSaving ? <Loader2 size={10} className="el-spin" color="#22c55e" /> : "✓"}
          </button>
          <button
            onClick={onEmailCancel}
            style={{
              fontSize: 11, padding: "3px 8px", borderRadius: 5,
              border: "none", background: "rgba(255,255,255,0.05)",
              color: "#4b5a70", cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
        {emailError && (
          <div style={{ fontSize: 10, color: "#f87171", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
            <AlertCircle size={9} color="#f87171" /> {emailError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
      <span style={{ fontSize: 11, color: fake ? "#f87171" : "#3a4556" }}>
        {emp.email || "—"}
      </span>
      {fake && (
        <span style={{
          fontSize: 9, padding: "1px 5px", borderRadius: 3,
          background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171", fontWeight: 700, letterSpacing: ".04em",
        }}>
          FAKE
        </span>
      )}
      <button
        onClick={() => onEditEmail(id, emp.email || "")}
        title="Email update karo"
        style={{
          fontSize: 9, padding: "1px 6px", borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "none", color: "#3a4556",
          cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        }}
      >
        edit
      </button>
    </div>
  );
});


// -------------------------------------------------
// MOBILE EMPLOYEE CARD (replaces table row on mobile)
// -------------------------------------------------
const MobileCard = memo(({
  emp, onDelete, deleteId, confirmDeleteId, onRequestDelete, onCancelDelete,
  editEmailId, editEmailVal, emailSaving, emailError,
  onEditEmail, onEmailChange, onEmailSave, onEmailCancel,
}) => {
  const id    = empId(emp);
  const name  = empName(emp);
  const tasks = emp.tasksCount ?? emp.tasks ?? 0;
  const score = emp.score ?? emp.performanceScore ?? null;

  return (
    <div className="el-mobile-card" style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* top row: avatar + name + status */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Avatar emp={emp} size={40} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
            <EmailCell
              emp={emp} editEmailId={editEmailId} editEmailVal={editEmailVal}
              emailSaving={emailSaving} emailError={emailError}
              onEditEmail={onEditEmail} onEmailChange={onEmailChange}
              onEmailSave={onEmailSave} onEmailCancel={onEmailCancel}
            />
          </div>
        </div>
        <StatusBadge status={emp.status} />
      </div>

      {/* dept + role row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <DeptBadge dept={emp.department} />
        {(emp.designation || emp.role) && (
          <span style={{ fontSize: 11, color: "#4b5a70", padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {emp.designation || emp.role}
          </span>
        )}
      </div>

      {/* stats row */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, color: "#2e3a4e", marginBottom: 2 }}>JOINED</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{formatJoined(emp)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#2e3a4e", marginBottom: 2 }}>SALARY</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>PKR {formatSalary(emp.salary)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#2e3a4e", marginBottom: 2 }}>TASKS</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#93b4f8" }}>{tasks}</div>
        </div>
        {score != null && (
          <div>
            <div style={{ fontSize: 10, color: "#2e3a4e", marginBottom: 4 }}>SCORE</div>
            <ScoreBar score={score} />
          </div>
        )}
      </div>

      {/* action row */}
      <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 10 }}>
        {confirmDeleteId === id ? (
          <DeleteConfirm loading={deleteId === id} onConfirm={() => onDelete(id)} onCancel={onCancelDelete} />
        ) : (
          <ActionBtn title="Delete employee" danger onClick={() => onRequestDelete(id)}>
            <Trash2 size={13} color="#4b5a70" />
          </ActionBtn>
        )}
      </div>
    </div>
  );
});

// -------------------------------------------------
// TABLE ROW
// -------------------------------------------------
const TableRow = memo(({
  emp, onDelete, deleteId, confirmDeleteId, onRequestDelete, onCancelDelete,
  editEmailId, editEmailVal, emailSaving, emailError,
  onEditEmail, onEmailChange, onEmailSave, onEmailCancel,
}) => {
  const id    = empId(emp);
  const name  = empName(emp);
  const tasks = emp.tasksCount ?? emp.tasks ?? 0;

  return (
    <tr className="el-row">
      <td style={s.td}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar emp={emp} size={36} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{name}</div>
            <EmailCell
              emp={emp}
              editEmailId={editEmailId}
              editEmailVal={editEmailVal}
              emailSaving={emailSaving}
              emailError={emailError}
              onEditEmail={onEditEmail}
              onEmailChange={onEmailChange}
              onEmailSave={onEmailSave}
              onEmailCancel={onEmailCancel}
            />
          </div>
        </div>
      </td>
      <td style={s.td}><DeptBadge dept={emp.department} /></td>
      <td style={{ ...s.td, fontSize: 12, color: "#c5cfe0" }}>{emp.designation || emp.role || "—"}</td>
      <td style={s.td}><StatusBadge status={emp.status} /></td>
      <td style={{ ...s.td, fontSize: 12, color: "#94a3b8" }}>{formatJoined(emp)}</td>
      <td style={s.td}>
        <div style={{ fontSize: 11, color: "#6b7a94" }}>PKR</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{formatSalary(emp.salary)}</div>
      </td>
      <td style={{ ...s.td, textAlign: "right" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 36, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
              <div style={{ width: `${Math.min(tasks * 10, 100)}%`, height: "100%", borderRadius: 4, background: "rgba(147,180,248,0.4)" }} />
            </div>
            <span style={{ fontSize: 11, color: "#3a4556", minWidth: 14, textAlign: "center" }}>{tasks}</span>
          </div>
          {confirmDeleteId === id ? (
            <DeleteConfirm
              loading={deleteId === id}
              onConfirm={() => onDelete(id)}
              onCancel={onCancelDelete}
            />
          ) : (
            <ActionBtn title="Delete employee" danger onClick={() => onRequestDelete(id)}>
              <Trash2 size={13} color="#4b5a70" />
            </ActionBtn>
          )}
        </div>
      </td>
    </tr>
  );
});


// -------------------------------------------------
// GRID CARD
// -------------------------------------------------
const GridCard = memo(({
  emp, onDelete, deleteId, confirmDeleteId, onRequestDelete, onCancelDelete,
  editEmailId, editEmailVal, emailSaving, emailError,
  onEditEmail, onEmailChange, onEmailSave, onEmailCancel,
}) => {
  const id    = empId(emp);
  const score = emp.score ?? emp.performanceScore ?? null;

  return (
    <div className="el-grid-card" style={s.gridCard}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar emp={emp} size={42} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{empName(emp)}</div>
            <EmailCell
              emp={emp}
              editEmailId={editEmailId}
              editEmailVal={editEmailVal}
              emailSaving={emailSaving}
              emailError={emailError}
              onEditEmail={onEditEmail}
              onEmailChange={onEmailChange}
              onEmailSave={onEmailSave}
              onEmailCancel={onEmailCancel}
            />
          </div>
        </div>
        <StatusBadge status={emp.status} />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <DeptBadge dept={emp.department} />
        <span style={{ padding: "3px 8px", borderRadius: 5, background: "rgba(255,255,255,0.04)", fontSize: 10, color: "#4b5a70" }}>
          {emp.designation || emp.role}
        </span>
      </div>

      {score != null && (
        <div style={{ marginBottom: 12 }}>
          <ScoreBar score={score} />
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, color: "#2e3a4e" }}>PKR</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{formatSalary(emp.salary)}</div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {confirmDeleteId === id ? (
            <DeleteConfirm
              loading={deleteId === id}
              onConfirm={() => onDelete(id)}
              onCancel={onCancelDelete}
            />
          ) : (
            <ActionBtn title="Delete employee" danger onClick={() => onRequestDelete(id)}>
              <Trash2 size={12} color="#4b5a70" />
            </ActionBtn>
          )}
        </div>
      </div>
    </div>
  );
});


// -------------------------------------------------
// MAIN COMPONENT
// -------------------------------------------------
export default function EmployeeList() {
  const width     = useWindowWidth();
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;

  const [employees,       setEmployees]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [search,          setSearch]          = useState("");
  const [deptFilter,      setDeptFilter]      = useState("All Departments");
  const [statusFilter,    setStatusFilter]    = useState("All Status");
  const [viewMode,        setViewMode]        = useState("table");
  const [deleteId,        setDeleteId]        = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [editEmailId,  setEditEmailId]  = useState(null);
  const [editEmailVal, setEditEmailVal] = useState("");
  const [emailSaving,  setEmailSaving]  = useState(false);
  const [emailError,   setEmailError]   = useState("");

  // mobile pe default grid view
  useEffect(() => {
    if (isMobile) setViewMode("grid");
  }, [isMobile]);

  // Fetch
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await API.get("/employees");
      setEmployees(Array.isArray(data) ? data : data.employees || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // Delete
  const handleDelete = useCallback(async (id) => {
    setDeleteId(id);
    try {
      await API.delete(`/employees/${id}`);
      setEmployees(prev => prev.filter(e => empId(e) !== id));
      setConfirmDeleteId(null);
    } catch {
      setError("Failed to delete employee. Please try again.");
    } finally {
      setDeleteId(null);
    }
  }, []);

  const handleRequestDelete = useCallback((id) => setConfirmDeleteId(id), []);
  const handleCancelDelete  = useCallback(() => setConfirmDeleteId(null), []);

  // Email edit handlers
  const handleEditEmail = useCallback((id, currentEmail) => {
    setEditEmailId(id);
    setEditEmailVal(currentEmail);
    setEmailError("");
  }, []);

  const handleEmailChange = useCallback((val) => {
    setEditEmailVal(val);
    setEmailError("");
  }, []);

  const handleEmailSave = useCallback(async (id) => {
    const val = editEmailVal.trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailError("Valid email address daalo");
      return;
    }
    setEmailSaving(true);
    setEmailError("");
    try {
      const { data } = await API.put(`/employees/${id}`, { email: val });
      setEmployees(prev =>
        prev.map(e => empId(e) === id ? { ...e, email: data.email } : e)
      );
      setEditEmailId(null);
      setEditEmailVal("");
    } catch (err) {
      setEmailError(err?.response?.data?.message || "Update nahi hua, dobara try karo");
    } finally {
      setEmailSaving(false);
    }
  }, [editEmailVal]);

  const handleEmailCancel = useCallback(() => {
    setEditEmailId(null);
    setEditEmailVal("");
    setEmailError("");
  }, []);

  // Derived state
  const departments = useMemo(() =>
    ["All Departments", ...Array.from(new Set(employees.map(e => e.department).filter(Boolean)))],
    [employees]
  );
  const statuses = useMemo(() =>
    ["All Status", ...Array.from(new Set(employees.map(e => statusLabel(e.status)).filter(Boolean)))],
    [employees]
  );
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(emp => {
      const fn = empName(emp).toLowerCase();
      const matchSearch = !q
        || fn.includes(q)
        || emp.email?.toLowerCase().includes(q)
        || emp.designation?.toLowerCase().includes(q)
        || emp.department?.toLowerCase().includes(q);
      const matchDept   = deptFilter   === "All Departments" || emp.department === deptFilter;
      const matchStatus = statusFilter === "All Status"      || statusLabel(emp.status) === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const deptCounts = useMemo(() =>
    employees.reduce((acc, e) => {
      if (e.department) acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {}),
    [employees]
  );

  const activeCount = useMemo(() =>
    employees.filter(e => e.status === "active" || e.status === "Active").length,
    [employees]
  );
  const leaveCount = useMemo(() =>
    employees.filter(e => e.status === "onLeave" || e.status === "On Leave").length,
    [employees]
  );

  const deleteProps = {
    onDelete: handleDelete, deleteId, confirmDeleteId,
    onRequestDelete: handleRequestDelete, onCancelDelete: handleCancelDelete,
  };

  const emailProps = {
    editEmailId, editEmailVal, emailSaving, emailError,
    onEditEmail:   handleEditEmail,
    onEmailChange: handleEmailChange,
    onEmailSave:   handleEmailSave,
    onEmailCancel: handleEmailCancel,
  };

  // grid columns: mobile=1, tablet=2, desktop=auto-fill
  const gridCols = isMobile
    ? "1fr"
    : isTablet
      ? "repeat(2, 1fr)"
      : "repeat(auto-fill, minmax(260px, 1fr))";

  return (
    <div style={s.root}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div style={{ ...s.header, flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 10 : 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={s.liveDot} />
          <span style={s.headerTitle}>EMPLOYEE LIST</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: isMobile ? 0 : "auto" }}>
          <span style={{ fontSize: 12, color: "#3a4556" }}>{activeCount} active · {leaveCount} on leave</span>
          <button aria-label="Refresh employees" style={s.refreshBtn} onClick={fetchEmployees}>
            <RefreshCw size={13} color="#4b5a70" />
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 14, flexWrap: "wrap",
      }}>
        {/* search full-width on mobile */}
        <div style={{ position: "relative", flex: isMobile ? "0 0 100%" : "1", minWidth: isMobile ? "100%" : 200 }}>
          <Search size={14} color="#3a4556" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input
            className="el-input"
            style={s.searchInput}
            placeholder="Search name, email, role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search employees"
          />
        </div>

        {/* filters row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
          <FilterSelect value={deptFilter}   onChange={setDeptFilter}   options={departments} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statuses} />

          {/* hide view toggle on mobile, always show grid there */}
          {!isMobile && (
            <div style={s.viewToggle}>
              {([["table","Table",Table2],["grid","Grid",LayoutGrid]]).map(([id, label, Icon]) => (
                <button
                  key={id}
                  aria-label={`Switch to ${label} view`}
                  className={`el-view-btn${viewMode === id ? " el-view-active" : ""}`}
                  style={{ ...s.viewBtn, ...(viewMode === id ? s.viewBtnActive : {}) }}
                  onClick={() => setViewMode(id)}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}

          <span style={{ fontSize: 12, color: "#3a4556", whiteSpace: "nowrap", marginLeft: "auto" }}>
            {filtered.length} of {employees.length}
          </span>
        </div>
      </div>

      {/* DEPT PILLS */}
      <div style={{ ...s.deptPills, display: isMobile ? "none" : "flex" }}>
        <span style={s.deptLabel}>BY DEPT:</span>
        {Object.entries(deptCounts).map(([dept, count]) => {
          const c  = DEPT_COLORS[dept] || DEPT_FALLBACK;
          const on = deptFilter === dept;
          return (
            <button
              key={dept}
              aria-pressed={on}
              onClick={() => setDeptFilter(on ? "All Departments" : dept)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 20, cursor: "pointer",
                background: on ? c.bg : "rgba(255,255,255,0.03)",
                border: `1px solid ${on ? c.border : "rgba(255,255,255,0.07)"}`,
                color: on ? c.text : "#4b5a70",
                fontSize: 11, fontWeight: 600,
                fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s ease",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? c.dot : "#2e3a4e", display: "inline-block", flexShrink: 0 }} />
              {dept} ({count})
            </button>
          );
        })}
        {Object.keys(deptCounts).length === 0 && !loading && (
          <span style={{ fontSize: 11, color: "#2e3a4e", fontStyle: "italic" }}>No departments yet</span>
        )}
      </div>

      {/* mobile: dept pills horizontally scrollable */}
      {isMobile && Object.keys(deptCounts).length > 0 && (
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", marginBottom: 14,
          paddingBottom: 4, WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}>
          {Object.entries(deptCounts).map(([dept, count]) => {
            const c  = DEPT_COLORS[dept] || DEPT_FALLBACK;
            const on = deptFilter === dept;
            return (
              <button
                key={dept}
                aria-pressed={on}
                onClick={() => setDeptFilter(on ? "All Departments" : dept)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 20, cursor: "pointer",
                  background: on ? c.bg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${on ? c.border : "rgba(255,255,255,0.07)"}`,
                  color: on ? c.text : "#4b5a70",
                  fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: on ? c.dot : "#2e3a4e", display: "inline-block" }} />
                {dept} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ERROR BANNER */}
      {error && (
        <div style={s.errBanner} role="alert">
          <AlertCircle size={14} color="#fca5a5" />
          <span style={{ flex: 1 }}>{error}</span>
          <button style={s.errClose} onClick={() => setError("")} aria-label="Dismiss error">Dismiss</button>
          <button style={{ ...s.errClose, marginLeft: 4 }} onClick={fetchEmployees}>Retry</button>
        </div>
      )}

      {/* TABLE VIEW — desktop/tablet only */}
      {viewMode === "table" && !isMobile && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                <Th style={{ minWidth: 200 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    EMPLOYEE <ArrowUp size={11} color="#93b4f8" />
                  </span>
                </Th>
                {!isTablet && <Th>DEPARTMENT</Th>}
                <Th>ROLE</Th>
                <Th>STATUS</Th>
                {!isTablet && <Th>JOINED</Th>}
                <Th>SALARY</Th>
                <Th style={{ textAlign: "right" }}>TASKS / ACTIONS</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={isTablet ? 5 : 7} style={s.stateCell}>
                    <Loader2 size={22} color="#93b4f8" className="el-spin" />
                    <span style={{ display: "block", marginTop: 10, fontSize: 12, color: "#3a4556" }}>Loading employees…</span>
                  </td>
                </tr>
              )}
              {!loading && !error && employees.length === 0 && (
                <tr>
                  <td colSpan={isTablet ? 5 : 7} style={s.stateCell}>
                    <span style={{ fontSize: 34 }}>👥</span>
                    <span style={{ display: "block", marginTop: 10, fontSize: 13, fontWeight: 600, color: "#3a4556" }}>No employees added yet</span>
                    <span style={{ display: "block", marginTop: 4, fontSize: 11, color: "#2e3a4e" }}>Use Add Employee tab to register your first team member</span>
                  </td>
                </tr>
              )}
              {!loading && !error && employees.length > 0 && filtered.length === 0 && (
                <tr>
                  <td colSpan={isTablet ? 5 : 7} style={s.stateCell}>
                    <span style={{ fontSize: 28 }}>🔍</span>
                    <span style={{ display: "block", marginTop: 10, fontSize: 13, color: "#3a4556" }}>No employees match your filters</span>
                  </td>
                </tr>
              )}
              {!loading && filtered.map(emp => {
                // tablet: simplified row (hide dept + joined columns)
                if (isTablet) {
                  const id    = empId(emp);
                  const name  = empName(emp);
                  const tasks = emp.tasksCount ?? emp.tasks ?? 0;
                  return (
                    <tr key={id} className="el-row">
                      <td style={s.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar emp={emp} size={34} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>{name}</div>
                            <EmailCell emp={emp} editEmailId={editEmailId} editEmailVal={editEmailVal}
                              emailSaving={emailSaving} emailError={emailError}
                              onEditEmail={handleEditEmail} onEmailChange={handleEmailChange}
                              onEmailSave={handleEmailSave} onEmailCancel={handleEmailCancel} />
                          </div>
                        </div>
                      </td>
                      <td style={{ ...s.td, fontSize: 12, color: "#c5cfe0" }}>{emp.designation || emp.role || "—"}</td>
                      <td style={s.td}><StatusBadge status={emp.status} /></td>
                      <td style={s.td}>
                        <div style={{ fontSize: 11, color: "#6b7a94" }}>PKR</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{formatSalary(emp.salary)}</div>
                      </td>
                      <td style={{ ...s.td, textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "#3a4556" }}>{tasks}</span>
                          {confirmDeleteId === id ? (
                            <DeleteConfirm loading={deleteId === id} onConfirm={() => handleDelete(id)} onCancel={handleCancelDelete} />
                          ) : (
                            <ActionBtn title="Delete employee" danger onClick={() => handleRequestDelete(id)}>
                              <Trash2 size={13} color="#4b5a70" />
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
                return <TableRow key={empId(emp)} emp={emp} {...deleteProps} {...emailProps} />;
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE LIST VIEW — card stack */}
      {isMobile && (
        <>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "50px 0" }}>
              <Loader2 size={24} color="#93b4f8" className="el-spin" />
              <span style={{ fontSize: 13, color: "#3a4556" }}>Loading employees…</span>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#3a4556" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {employees.length === 0 ? "No employees added yet" : "No employees match your filters"}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!loading && filtered.map(emp => (
              <MobileCard key={empId(emp)} emp={emp} {...deleteProps} {...emailProps} />
            ))}
          </div>
        </>
      )}

      {/* GRID VIEW — tablet/desktop */}
      {viewMode === "grid" && !isMobile && (
        <>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "50px 0" }}>
              <Loader2 size={24} color="#93b4f8" className="el-spin" />
              <span style={{ fontSize: 13, color: "#3a4556" }}>Loading employees…</span>
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 0", color: "#3a4556" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {employees.length === 0 ? "No employees added yet" : "No employees match your filters"}
              </div>
            </div>
          )}
          <div style={{ ...s.gridWrap, gridTemplateColumns: gridCols }}>
            {!loading && filtered.map(emp => (
              <GridCard key={empId(emp)} emp={emp} {...deleteProps} {...emailProps} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


// -------------------------------------------------
// STYLES
// -------------------------------------------------
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  .el-input { transition: border-color 0.2s, box-shadow 0.2s; }
  .el-input:focus { border-color: rgba(147,180,248,0.4)!important; box-shadow: 0 0 0 3px rgba(147,180,248,0.07)!important; outline: none; }
  .el-input::placeholder { color: #2e3a4e!important; }
  .el-input option { background: #141c28; color: #fff; }
  .el-row { transition: background 0.15s ease; }
  .el-row:hover { background: rgba(255,255,255,0.025)!important; }
  .el-action { transition: background 0.15s, color 0.15s; }
  .el-action:hover { background: rgba(255,255,255,0.08)!important; }
  .el-action-del:hover { background: rgba(252,165,165,0.1)!important; }
  .el-action-del:hover svg { stroke: #f87171; }
  .el-grid-card { transition: transform 0.2s, box-shadow 0.2s; }
  .el-grid-card:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,0.3)!important; }
  .el-mobile-card { transition: border-color 0.15s; }
  .el-mobile-card:active { border-color: rgba(147,180,248,0.25)!important; }
  .el-view-btn { transition: background 0.15s, color 0.15s; }
  @keyframes el-spin { to { transform: rotate(360deg); } }
  .el-spin { animation: el-spin 0.8s linear infinite; display: inline-block; }
  ::-webkit-scrollbar { width: 0; height: 0; }
`;

const s = {
  root:       { fontFamily: "'DM Sans',sans-serif", color: "#ffffff" },
  header:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  toolbar:    { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  deptPills:  { display: "flex", alignItems: "center", gap: 8, marginBottom: 18, flexWrap: "wrap", minHeight: 32 },
  liveDot:    { display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" },
  headerTitle:{ fontSize: 13, fontWeight: 700, color: "#ffffff", letterSpacing: "0.08em" },
  refreshBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4, borderRadius: 6 },
  deptLabel:  { fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#2e3a4e", textTransform: "uppercase", marginRight: 4 },
  searchInput:  { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 14px 9px 38px", fontSize: 13, color: "#ffffff", fontFamily: "'DM Sans',sans-serif", appearance: "none" },
  filterSelect: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "9px 32px 9px 12px", fontSize: 12, color: "#ffffff", fontFamily: "'DM Sans',sans-serif", appearance: "none", cursor: "pointer", minWidth: 130 },
  viewToggle:   { display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" },
  viewBtn:      { display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", background: "transparent", border: "none", color: "#4b5a70", fontFamily: "'DM Sans',sans-serif" },
  viewBtnActive:{ background: "rgba(147,180,248,0.12)", color: "#93b4f8" },
  errBanner:  { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 16px", borderRadius: 10, background: "rgba(252,165,165,0.08)", border: "1px solid rgba(252,165,165,0.2)", fontSize: 13, color: "#fca5a5" },
  errClose:   { background: "none", border: "1px solid rgba(252,165,165,0.25)", borderRadius: 6, color: "#fca5a5", cursor: "pointer", fontSize: 11, padding: "3px 10px" },
  tableWrap:  { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "auto" },
  table:      { width: "100%", borderCollapse: "collapse" },
  th:         { padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#3a4556", textAlign: "left", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", whiteSpace: "nowrap" },
  td:         { padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" },
  stateCell:  { textAlign: "center", padding: "56px 0", verticalAlign: "middle" },
  gridWrap:   { display: "grid", gap: 14 },
  gridCard:   { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px" },
};