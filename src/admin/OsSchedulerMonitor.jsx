import React, { useState, useEffect } from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";
import { api } from "../services/api";

export default function OsSchedulerMonitor() {
  const { triggerOsScheduler } = useCampus();

  const [monitorData, setMonitorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState("");

  async function fetchMonitorData() {
    try {
      const res = await api.getOsMonitor();
      if (res.success && res.data) {
        setMonitorData(res.data);
      }
    } catch (e) {
      console.error("Failed to load OS Monitor data:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 6000); // 6s live polling
    return () => clearInterval(interval);
  }, []);

  async function handleExecuteScheduler(forceAll = false) {
    setExecuting(true);
    setDispatchMessage("");
    try {
      const result = await triggerOsScheduler(forceAll);
      await fetchMonitorData();
      if (result.dispatchCount > 0) {
        setDispatchMessage(`⚡ OS Scheduler Auto-Dispatched ${result.dispatchCount} candidate requests to Best-Fit venues!`);
      } else {
        setDispatchMessage(`ℹ️ Queue Evaluated: Requests are either within the 10-Minute Admin SLA review period or waiting for suitable free rooms.`);
      }
    } catch (err) {
      setDispatchMessage(`Error running scheduler: ${err.message}`);
    } finally {
      setExecuting(false);
      setTimeout(() => setDispatchMessage(""), 10000);
    }
  }

  const summary = monitorData?.summary || {
    queueCount: 0,
    requestsProcessed: 0,
    autoAllottedCount: 0,
    waitingCount: 0,
    avgWaitMinutes: 0,
  };

  const queue = monitorData?.queue || [];
  const recentDecisions = monitorData?.recentDecisions || [];
  const activityLog = monitorData?.activityLog || [];

  return (
    <div className="br-container">
      {/* Header */}
      <div className="br-header">
        <div>
          <p className="br-eyebrow">OPERATING SYSTEMS (OS) PBL ENGINE</p>
          <h1>OS Scheduler Monitor</h1>
          <p>
            Autonomous request scheduling, Shortest Job First (SJF), Priority Aging, and Best-Fit Resource Partitioning.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="admin-btn-primary"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            disabled={executing}
            onClick={() => handleExecuteScheduler(false)}
            title="Evaluate requests whose 10-Minute SLA has expired"
          >
            {executing ? "Processing..." : "⚡ Run OS Scheduler"}
          </button>

          <button
            type="button"
            className="admin-btn-secondary"
            disabled={executing}
            onClick={() => handleExecuteScheduler(true)}
            title="Force evaluation across all pending requests regardless of SLA timer"
          >
            Force Run All
          </button>
        </div>
      </div>

      {dispatchMessage && (
        <div
          style={{
            background: "rgba(124, 58, 237, 0.2)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            borderRadius: "10px",
            padding: "12px 18px",
            color: "#d8b4fe",
            fontSize: "0.9rem",
            marginBottom: "16px",
          }}
        >
          {dispatchMessage}
        </div>
      )}

      {/* 5 Scheduler Summary Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-amber">⏳</div>
          <div className="admin-kpi-details">
            <p>Requests in Queue</p>
            <h3>{summary.queueCount}</h3>
            <span className="admin-kpi-sub">Active pending jobs</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-blue">▣</div>
          <div className="admin-kpi-details">
            <p>Requests Processed</p>
            <h3>{summary.requestsProcessed}</h3>
            <span className="admin-kpi-sub">Total locked bookings</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-purple">⚡</div>
          <div className="admin-kpi-details">
            <p>Auto-Allotted by OS</p>
            <h3>{summary.autoAllottedCount}</h3>
            <span className="admin-kpi-sub">SLA Expired dispatches</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-emerald">⏱️</div>
          <div className="admin-kpi-details">
            <p>Average Waiting Time</p>
            <h3>{summary.avgWaitMinutes} min</h3>
            <span className="admin-kpi-sub">Aging Bonus active</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-red">⚠</div>
          <div className="admin-kpi-details">
            <p>Waiting for Resource</p>
            <h3>{summary.waitingCount}</h3>
            <span className="admin-kpi-sub">No suitable room free</span>
          </div>
        </div>
      </div>

      {/* Mathematical Algorithm Specification Card */}
      <div
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "18px 22px",
          color: "#e2e8f0",
          marginBottom: "20px",
          fontSize: "0.86rem",
          lineHeight: "1.6",
        }}
      >
        <strong style={{ color: "#38bdf8", fontSize: "0.95rem", display: "block", marginBottom: "6px" }}>
          📐 Operating System Hybrid Scheduling Policy Formula:
        </strong>
        <code style={{ background: "#0f172a", padding: "6px 12px", borderRadius: "6px", display: "inline-block", color: "#a5b4fc", fontWeight: "700", marginBottom: "8px" }}>
          Final Scheduling Score = Priority Weight + Aging Bonus − Duration Penalty
        </code>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px", marginTop: "8px", color: "#94a3b8" }}>
          <div>• <strong>Priority Classes:</strong> Exam/Academic (100) · Workshop/Hackathon (60) · General Study (30)</div>
          <div>• <strong>Anti-Starvation Aging:</strong> +10 points added for each 5 minutes of waiting time</div>
          <div>• <strong>SJF Duration Penalty:</strong> Shorter durations incur lower penalty, prioritizing short jobs</div>
          <div>• <strong>Best-Fit Partitioning:</strong> Selects smallest available venue where Capacity ≥ Participants</div>
        </div>
      </div>

      {/* Scheduler Queue Table */}
      <div className="br-card" style={{ marginBottom: "24px" }}>
        <div className="admin-section-header">
          <div>
            <h2>Real-Time OS Scheduler Queue</h2>
            <p>Calculated composite scores and live starvation prevention for pending requests.</p>
          </div>
          <span style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
            Sorted by Highest Final Score
          </span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Queue Pos</th>
                <th>Request ID</th>
                <th>Purpose</th>
                <th>Priority Class</th>
                <th>Priority Weight</th>
                <th>Waiting Time</th>
                <th>Aging Bonus</th>
                <th>Duration</th>
                <th>SJF Penalty</th>
                <th>Final Score</th>
                <th>SLA Status</th>
                <th>Scheduler Decision</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                    Scheduler queue is currently empty. No pending requests awaiting allocation.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ color: "#fbbf24" }}>#{item.queuePosition}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "#38bdf8" }}>{item.id}</strong>
                    </td>
                    <td style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.purpose}
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                        {item.priorityClass}
                      </span>
                    </td>
                    <td>
                      <strong>{item.priorityWeight}</strong>
                    </td>
                    <td>{item.waitingMinutes} min</td>
                    <td>
                      <span style={{ color: "#34d399", fontWeight: "700" }}>+{item.agingBonus}</span>
                    </td>
                    <td>{item.durationMinutes} min</td>
                    <td>
                      <span style={{ color: "#f87171" }}>-{item.durationPenalty}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "1.05rem", color: "#c084fc" }}>
                        {item.finalScore}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.78rem", color: item.slaStatus.includes("Expired") ? "#c084fc" : "#38bdf8" }}>
                        {item.slaStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: item.decision.includes("Ready")
                            ? "rgba(139, 92, 246, 0.2)"
                            : item.decision.includes("Waiting")
                            ? "rgba(239, 68, 68, 0.2)"
                            : "rgba(56, 189, 248, 0.15)",
                          color: item.decision.includes("Ready")
                            ? "#c084fc"
                            : item.decision.includes("Waiting")
                            ? "#fca5a5"
                            : "#38bdf8",
                        }}
                      >
                        {item.decision}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduling Explanation Panel */}
      <div className="br-card" style={{ marginBottom: "24px" }}>
        <div className="admin-section-header">
          <div>
            <h2>Best-Fit Memory Partitioning Decisions</h2>
            <p>Detailed breakdown of how candidate rooms were evaluated and selected without wasting large venues.</p>
          </div>
        </div>

        {recentDecisions.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
            No autonomous allocations performed yet. When pending requests exceed the 10-Minute SLA, decision breakdowns will appear here.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {recentDecisions.map((dec) => (
              <div
                key={dec.id}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  padding: "16px 20px",
                  fontSize: "0.86rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <strong style={{ color: "#38bdf8", fontSize: "1rem" }}>{dec.id}</strong>
                    <span style={{ color: "#e2e8f0" }}>{dec.user}</span>
                    <span style={{ color: "#94a3b8" }}>· Scheduled: {dec.date} ({dec.time})</span>
                  </div>
                  <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700" }}>
                    ✓ Allocated Room: {dec.room}
                  </span>
                </div>
                <div style={{ color: "#94a3b8", marginBottom: "6px" }}>
                  <strong>Purpose:</strong> {dec.purpose} · <strong>Participants:</strong> {dec.participants}
                </div>
                <div style={{ color: "#c084fc", fontSize: "0.82rem", background: "rgba(139, 92, 246, 0.1)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                  {dec.adminRemarks}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chronological Activity Log */}
      <div className="br-card">
        <div className="admin-section-header">
          <div>
            <h2>Scheduler Audit Event Log</h2>
            <p>Chronological system activity emitted by the background SLA watchdog and OS engine.</p>
          </div>
        </div>

        {activityLog.length === 0 ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
            No system events logged yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {activityLog.map((evt) => (
              <div
                key={evt.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  fontSize: "0.82rem",
                }}
              >
                <div>
                  <strong style={{ color: "#38bdf8", marginRight: "10px" }}>[{evt.eventType}]</strong>
                  <span style={{ color: "#e2e8f0" }}>{evt.details?.details || JSON.stringify(evt.details)}</span>
                </div>
                <small style={{ color: "#64748b" }}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
