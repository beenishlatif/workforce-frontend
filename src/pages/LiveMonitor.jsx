import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

// const API = "http://localhost:5000/api/monitor";
const API = "https://workforce-backend-production-cc13.up.railway.app/api/monitor";

export default function LiveMonitor() {
  const [employees, setEmployees] = useState([]);
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState({});

  const fetchData = async () => {
    try {
      const res = await axios.get(API);
      setEmployees(res.data.employees);
      setFeed(res.data.feed);
      setStats(res.data.stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <h1 style={styles.title}>All Employees Live Monitor</h1>

      {/* TOP STATS */}
      <div style={styles.statsRow}>
        <StatCard label="Active Now" value={stats.active} color="#22c55e" />
        <StatCard label="Idle" value={stats.idle} color="#eab308" />
        <StatCard label="Offline" value={stats.offline} color="#ef4444" />
        <StatCard label="Total" value={stats.total} color="#3b82f6" />
      </div>

      <div style={styles.mainGrid}>
        {/* LEFT SIDE */}
        <div style={styles.left}>
          {employees.map((emp) => (
            <EmployeeRow key={emp._id} emp={emp} />
          ))}
        </div>

        {/* RIGHT SIDE */}
        <div style={styles.right}>
          <ActivityFeed feed={feed} />
          <ScreenshotGallery employees={employees} />
          <ProductivityPie stats={stats} />
        </div>
      </div>
    </div>
  );
}

// ================= COMPONENTS =================

function StatCard({ label, value, color }) {
  return (
    <div style={styles.statCard}>
      <p style={{ color: "#aaa" }}>{label}</p>
      <h2 style={{ color }}>{value || 0}</h2>
    </div>
  );
}

function EmployeeRow({ emp }) {
  return (
    <div style={styles.row}>
      {/* USER */}
      <div style={styles.user}>
        <img src={emp.avatar} style={styles.avatar} />
        <div>
          <h3>{emp.firstName} {emp.lastName}</h3>
          <p style={styles.small}>{emp.role}</p>
          <span style={{
            ...styles.badge,
            background:
              emp.status === "Active"
                ? "#16a34a"
                : emp.status === "Idle"
                ? "#ca8a04"
                : "#dc2626",
          }}>
            {emp.status}
          </span>
        </div>
      </div>

      {/* ACTIVITY */}
      <div>
        <p style={styles.small}>Activity</p>
        <p>{emp.currentActivity}</p>
      </div>

      {/* GRAPH */}
      <div style={{ width: 120, height: 40 }}>
        <ResponsiveContainer>
          <LineChart data={emp.graph}>
            <Line dataKey="value" stroke="#22c55e" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TIME */}
      <div>
        <p style={styles.small}>Time</p>
        <p>{emp.timeTracked}</p>
      </div>

      {/* TASK */}
      <div>
        <p style={styles.small}>Tasks</p>
        <p>{emp.tasksDone}/{emp.tasksTotal}</p>
      </div>

      {/* SCREENSHOT */}
      <img src={emp.screenshot} style={styles.screenshot} />
    </div>
  );
}

function ActivityFeed({ feed }) {
  return (
    <div style={styles.card}>
      <h3>Live Activity</h3>
      {feed.map((f, i) => (
        <div key={i} style={styles.feedItem}>
          <span><b>{f.name}</b> {f.action}</span>
          <span style={styles.small}>{f.time}</span>
        </div>
      ))}
    </div>
  );
}

function ScreenshotGallery({ employees }) {
  return (
    <div style={styles.card}>
      <h3>Screenshots</h3>
      <div style={styles.grid}>
        {employees.slice(0, 6).map((e, i) => (
          <img key={i} src={e.screenshot} style={styles.thumb} />
        ))}
      </div>
    </div>
  );
}

function ProductivityPie({ stats }) {
  const data = [
    { name: "High", value: stats.high || 40 },
    { name: "Medium", value: stats.medium || 30 },
    { name: "Low", value: stats.low || 20 },
    { name: "Idle", value: stats.idle || 10 },
  ];

  const colors = ["#22c55e", "#eab308", "#3b82f6", "#ef4444"];

  return (
    <div style={styles.card}>
      <h3>Productivity</h3>
      <div style={{ height: 200 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================= STYLES =================

const styles = {
  container: {
    background: "#0B1220",
    minHeight: "100vh",
    color: "white",
    padding: 20,
    fontFamily: "sans-serif",
  },
  title: { fontSize: 24, marginBottom: 20 },

  statsRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },

  statCard: {
    background: "#111827",
    padding: 15,
    borderRadius: 10,
    flex: 1,
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "3fr 1fr",
    gap: 20,
  },

  left: { display: "flex", flexDirection: "column", gap: 10 },

  right: { display: "flex", flexDirection: "column", gap: 15 },

  row: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
    alignItems: "center",
    gap: 10,
    background: "#111827",
    padding: 10,
    borderRadius: 10,
  },

  user: { display: "flex", gap: 10, alignItems: "center" },

  avatar: { width: 40, height: 40, borderRadius: "50%" },

  badge: {
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 5,
  },

  small: { fontSize: 12, color: "#aaa" },

  screenshot: {
    width: 100,
    height: 60,
    objectFit: "cover",
    borderRadius: 5,
  },

  card: {
    background: "#111827",
    padding: 15,
    borderRadius: 10,
  },

  feedItem: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 5,
  },

  thumb: {
    width: "100%",
    height: 60,
    objectFit: "cover",
    borderRadius: 5,
  },
};