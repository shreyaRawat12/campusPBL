import React, { useState, useMemo } from "react";
import "./AdminDashboard.css";
import { useCampus } from "../context/CampusContext";
import SlaTimerBadge from "../components/SlaTimerBadge";

export default function AdminDashboard({ onNavigate }) {
  const {
    resources,
    requests,
    users,
    autoApproveMode,
    toggleAutoApproveMode,
    triggerOsScheduler,
    approveRequest,
    rejectRequest,
  } = useCampus();

  const [osNotice, setOsNotice] = useState(null);

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "Pending"), [requests]);
  const approvedRequests = useMemo(() => requests.filter((r) => r.status === "Approved"), [requests]);
  const rejectedRequests = useMemo(() => requests.filter((r) => r.status === "Rejected"), [requests]);
  const osDispatchedRequests = useMemo(
    () =>
      approvedRequests.filter(
        (r) => r.allocatedBy === "OS_SCHEDULER" || r.allocatedBy === "AUTONOMOUS_OS_DISPATCH"
      ),
    [approvedRequests]
  );

  // SLA Urgency calculation: count requests with <= 3 mins left
  const urgentCount = useMemo(() => {
    const now = Date.now();
    return pendingRequests.filter((r) => {
      const created = r.createdAt ? new Date(r.createdAt).getTime() : now;
      const ageMins = Math.floor((now - created) / 60000);
      return (10 - ageMins) <= 3 && (10 - ageMins) > 0;
    }).length;
  }, [pendingRequests]);

  const blockC_count = resources.filter((r) => r.block === "Block C").length;
  const blockE_count = resources.filter((r) => r.block === "Block E").length;

  // Group resources by category
  const categoriesCount = useMemo(() => {
    return resources.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});
  }, [resources]);

  // Today's allocations
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAllocations = useMemo(() => {
    return approvedRequests.filter((r) => r.date === todayStr);
  }, [approvedRequests, todayStr]);

  function handleRunScheduler() {
    const result = triggerOsScheduler();
    if (result.dispatchCount > 0) {
      setOsNotice(`⚡ OS Scheduler Auto-Dispatched ${result.dispatchCount} candidate booking(s) using SJF & Priority Scoring!`);
    } else {
      setOsNotice("ℹ️ OS Scheduler evaluated queue: All active pending requests are currently within the 10-minute Admin SLA window or have room conflicts.");
    }
    setTimeout(() => setOsNotice(null), 8000);
  }

  function handleQuickReject(req) {
    const reason = window.prompt(`Enter rejection reason for request ${req.id}:`, "Time slot unavailable due to maintenance / conflicting schedule.");
    if (reason !== null) {
      rejectRequest(req.id, reason);
    }
  }

  return (
    <div className="admin-db">
      {/* Header */}
      <div className="admin-db-header">
        <div>
          <p className="admin-db-eyebrow">EXECUTIVE METRICS & OS SCHEDULER</p>
          <h1>Campus Allocation Dashboard</h1>
          <p>Real-time Block C & Block E utilization, 10-Min SLA timers, and OS process scheduling.</p>
        </div>

        <div className="admin-db-actions" style={{ alignItems: "center" }}>
          {/* OS Force Scheduler Execution Button */}
          <button
            type="button"
            className="admin-btn-primary"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            onClick={handleRunScheduler}
            title="Execute Shortest Job First (SJF) + Priority algorithm across all pending requests"
          >
            <span>⚡</span> Execute OS Scheduler Now
          </button>

          {/* Smart Auto-Pilot Toggle */}
          <button
            type="button"
            onClick={toggleAutoApproveMode}
            style={{
              background: autoApproveMode
                ? "rgba(16, 185, 129, 0.2)"
                : "rgba(100, 116, 139, 0.2)",
              border: `1px solid ${autoApproveMode ? "#10b981" : "#475569"}`,
              color: autoApproveMode ? "#34d399" : "#94a3b8",
              borderRadius: "8px",
              padding: "10px 14px",
              fontSize: "0.84rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{autoApproveMode ? "⚡" : "⏸️"}</span>
            <span>Auto-Approve: {autoApproveMode ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* OS Notice Banner */}
      {osNotice && (
        <div
          style={{
            backgroundColor: "rgba(124, 58, 237, 0.18)",
            border: "1px solid rgba(124, 58, 237, 0.4)",
            borderRadius: "10px",
            padding: "14px 20px",
            color: "#d8b4fe",
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>{osNotice}</div>
          <button
            type="button"
            onClick={() => setOsNotice(null)}
            style={{ background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontWeight: "700" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 6 MASTER STATISTIC KPI CARDS */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {/* Card 1: Total Resources */}
        <div className="admin-kpi-card" onClick={() => onNavigate && onNavigate("Resource Management")} style={{ cursor: "pointer" }}>
          <div className="admin-kpi-icon kpi-blue">🏢</div>
          <div className="admin-kpi-details">
            <p>Total Resources</p>
            <h3>{resources.length}</h3>
            <span className="admin-kpi-sub">Block C ({blockC_count}) · Block E ({blockE_count})</span>
          </div>
        </div>

        {/* Card 2: Total Bookings / Requests */}
        <div className="admin-kpi-card" onClick={() => onNavigate && onNavigate("Booking Requests")} style={{ cursor: "pointer" }}>
          <div className="admin-kpi-icon" style={{ background: "rgba(14, 165, 233, 0.15)", color: "#38bdf8" }}>📋</div>
          <div className="admin-kpi-details">
            <p>Total Requests</p>
            <h3>{requests.length}</h3>
            <span className="admin-kpi-sub">Recorded in MySQL DB</span>
          </div>
        </div>

        {/* Card 3: Pending Requests */}
        <div className="admin-kpi-card" onClick={() => onNavigate && onNavigate("Booking Requests")} style={{ cursor: "pointer" }}>
          <div className="admin-kpi-icon kpi-amber">⏳</div>
          <div className="admin-kpi-details">
            <p>Pending Requests</p>
            <h3>{pendingRequests.length}</h3>
            <span className="admin-kpi-sub" style={{ color: urgentCount > 0 ? "#f87171" : "#64748b" }}>
              {urgentCount > 0 ? `🚨 ${urgentCount} urgent (<3m left)` : "10-min SLA timer active"}
            </span>
          </div>
        </div>

        {/* Card 4: Approved Allocations */}
        <div className="admin-kpi-card" onClick={() => onNavigate && onNavigate("Allocation Management")} style={{ cursor: "pointer" }}>
          <div className="admin-kpi-icon kpi-emerald">✓</div>
          <div className="admin-kpi-details">
            <p>Approved Allocations</p>
            <h3>{approvedRequests.length}</h3>
            <span className="admin-kpi-sub">Confirmed & Scheduled</span>
          </div>
        </div>

        {/* Card 5: Rejected Requests */}
        <div className="admin-kpi-card" onClick={() => onNavigate && onNavigate("Booking Requests")} style={{ cursor: "pointer" }}>
          <div className="admin-kpi-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171" }}>✕</div>
          <div className="admin-kpi-details">
            <p>Rejected Requests</p>
            <h3>{rejectedRequests.length}</h3>
            <span className="admin-kpi-sub">Declined by Admin</span>
          </div>
        </div>

        {/* Card 6: OS Auto-Dispatched */}
        <div className="admin-kpi-card" onClick={() => onNavigate && onNavigate("OS Scheduler Monitor")} style={{ cursor: "pointer" }}>
          <div className="admin-kpi-icon kpi-purple">⚡</div>
          <div className="admin-kpi-details">
            <p>OS Auto-Dispatched</p>
            <h3>{osDispatchedRequests.length}</h3>
            <span className="admin-kpi-sub">SJF + Aging Scheduler</span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS ROW */}
      <section style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "14px", padding: "18px 24px" }}>
        <div style={{ fontSize: "0.76rem", fontWeight: "700", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>
          QUICK ACTIONS
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleRunScheduler}
            style={{
              background: "rgba(124, 58, 237, 0.18)",
              border: "1px solid rgba(124, 58, 237, 0.4)",
              color: "#c084fc",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>⚡</span> Execute OS Scheduler Now
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Booking Requests")}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📋</span> View Pending Requests ({pendingRequests.length})
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Scheduling & Timetable")}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📅</span> Check Timetable Matrix
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate("OS Gantt Chart")}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📊</span> OS Gantt Chart
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Allocation Management")}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📑</span> Master Allocation Ledger
          </button>

          <button
            type="button"
            onClick={() => onNavigate && onNavigate("Reports & Analytics")}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "9px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📈</span> View Analytics & Reports
          </button>
        </div>
      </section>

      {/* PENDING REQUESTS WITH LIVE SLA TIMERS */}
      <section className="admin-card-section">
        <div className="admin-section-header">
          <div>
            <h2>Pending Requests & 10-Minute SLA Ticker</h2>
            <p>Admin must act before countdown reaches 00:00, or OS Scheduler will auto-allocate using SJF & Priority Scoring.</p>
          </div>
          <button
            type="button"
            className="admin-link-btn"
            onClick={() => onNavigate && onNavigate("Booking Requests")}
          >
            Open All Requests ({requests.length}) →
          </button>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "10px", border: "1px dashed #334155" }}>
            <span style={{ fontSize: "2rem" }}>🎉</span>
            <h3 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "10px 0 4px" }}>All Requests Processed</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
              There are currently no pending booking requests awaiting admin review in the SLA queue.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Room & Block</th>
                  <th>Applicant</th>
                  <th>Scheduled Slot</th>
                  <th>Priority</th>
                  <th>10-Min SLA Countdown</th>
                  <th>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.slice(0, 5).map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ color: "#38bdf8" }}>{req.id}</strong>
                    </td>
                    <td>
                      <strong>{req.resource || req.resourceName}</strong>
                      <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                        {req.block || "Block C"} · {req.category || "Classroom"}
                      </div>
                    </td>
                    <td>
                      <div>{req.userName}</div>
                      <small style={{ color: "#64748b" }}>{req.department}</small>
                    </td>
                    <td>
                      <div>{req.date}</div>
                      <small style={{ color: "#94a3b8" }}>{req.time}</small>
                    </td>
                    <td>
                      <span
                        className={`pill-priority ${
                          req.priority === "High" ? "pill-high" : "pill-normal"
                        }`}
                      >
                        {req.priority || "Normal"}
                      </span>
                    </td>
                    <td>
                      <SlaTimerBadge
                        createdAt={req.createdAt || req.submittedAt}
                        slaExpiresAt={req.slaExpiresAt}
                        onExpired={triggerOsScheduler}
                      />
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="btn-table-approve"
                          onClick={() => approveRequest(req.id)}
                          title="Instant Approve"
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          className="btn-table-reject"
                          onClick={() => handleQuickReject(req)}
                          title="Reject"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* TODAY'S ALLOCATION SCHEDULE & OS SCHEDULER STATUS (TWO COLUMNS) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Today's Confirmed Allocations */}
        <section className="admin-card-section">
          <div className="admin-section-header">
            <div>
              <h2>Today's Confirmed Allocations</h2>
              <p>Confirmed schedule for {todayStr}</p>
            </div>
            <button
              type="button"
              className="admin-link-btn"
              onClick={() => onNavigate && onNavigate("Allocation Management")}
            >
              Master Ledger →
            </button>
          </div>

          {todayAllocations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 16px", color: "#64748b" }}>
              <span style={{ fontSize: "1.6rem" }}>📅</span>
              <p style={{ margin: "8px 0 0", fontSize: "0.88rem" }}>No allocations scheduled for today ({todayStr}).</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {todayAllocations.slice(0, 4).map((b) => {
                const isOs = b.allocatedBy === "OS_SCHEDULER" || b.allocatedBy === "AUTONOMOUS_OS_DISPATCH";
                return (
                  <div
                    key={b.id}
                    style={{
                      background: "#1a2234",
                      border: "1px solid #2d3748",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ color: "#f8fafc", fontSize: "0.92rem" }}>
                          {b.resource || b.resourceName}
                        </strong>
                        <span
                          style={{
                            background: isOs ? "rgba(139, 92, 246, 0.2)" : "rgba(2, 132, 199, 0.2)",
                            color: isOs ? "#c084fc" : "#38bdf8",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          {isOs ? "⚡ OS Allotted" : "Admin Approved"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>
                        {b.userName} · {b.time || `${b.startTime} - ${b.endTime}`}
                      </div>
                    </div>
                    <span style={{ color: "#10b981", fontSize: "0.82rem", fontWeight: "600" }}>Confirmed</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* OS Scheduler Engine Activity Panel */}
        <section className="admin-card-section">
          <div className="admin-section-header">
            <div>
              <h2>OS Scheduler Engine Status</h2>
              <p>Process scheduler runtime diagnostics</p>
            </div>
            <button
              type="button"
              className="admin-link-btn"
              onClick={() => onNavigate && onNavigate("OS Scheduler Monitor")}
            >
              Monitor Console →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1a2234", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.84rem", color: "#94a3b8" }}>Watchdog Daemon</span>
              <span style={{ color: autoApproveMode ? "#34d399" : "#fbbf24", fontWeight: "700", fontSize: "0.84rem" }}>
                {autoApproveMode ? "● Active (30s Polling)" : "⏸️ Paused (Manual)"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1a2234", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.84rem", color: "#94a3b8" }}>Current Queue Depth</span>
              <strong style={{ color: "#f8fafc", fontSize: "0.88rem" }}>{pendingRequests.length} Processes</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1a2234", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.84rem", color: "#94a3b8" }}>Admin SLA Window</span>
              <span style={{ color: "#38bdf8", fontWeight: "700", fontSize: "0.84rem" }}>10 Minutes Persistent</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1a2234", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.84rem", color: "#94a3b8" }}>Aging Rule</span>
              <span style={{ color: "#c084fc", fontWeight: "600", fontSize: "0.84rem" }}>+10 pts / 5 min waiting</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1a2234", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.84rem", color: "#94a3b8" }}>Allocation Strategy</span>
              <span style={{ color: "#34d399", fontWeight: "600", fontSize: "0.84rem" }}>Best-Fit (Min. Fragmentation)</span>
            </div>
          </div>
        </section>
      </div>

      {/* CAMPUS INFRASTRUCTURE DISTRIBUTION */}
      <section className="admin-card-section">
        <div className="admin-section-header">
          <div>
            <h2>Campus Infrastructure Distribution</h2>
            <p>Active rooms across Block C and Block E verified in MySQL database.</p>
          </div>
          <button
            type="button"
            className="admin-link-btn"
            onClick={() => onNavigate && onNavigate("Resource Management")}
          >
            Manage Inventory ({resources.length}) →
          </button>
        </div>

        <div className="admin-categories-row">
          {Object.entries(categoriesCount).map(([cat, count]) => (
            <div className="admin-cat-box" key={cat}>
              <strong>{count}</strong>
              <span>{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* RECENT ACTIVITY STREAM */}
      <section className="admin-card-section">
        <div className="admin-section-header">
          <div>
            <h2>Recent Activity Audit Stream</h2>
            <p>Audit trail of requests, allocations, and scheduler runs</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
            No recent system activity. Submissions from students will appear here.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {requests.slice(0, 6).map((req) => (
              <div
                key={req.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 16px",
                  background: "#151e2e",
                  borderRadius: "8px",
                  border: "1px solid #1f2937",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "1.1rem" }}>
                    {req.status === "Approved" ? "✅" : req.status === "Pending" ? "⏳" : "❌"}
                  </span>
                  <div>
                    <div style={{ color: "#f8fafc", fontSize: "0.88rem", fontWeight: "600" }}>
                      {req.id}: {req.userName} requested {req.resource || req.resourceName}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
                      {req.date} · {req.time || `${req.startTime} - ${req.endTime}`} · {req.purpose}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span
                    className={`status-pill ${
                      req.status === "Approved"
                        ? "pill-approved"
                        : req.status === "Pending"
                        ? "pill-pending"
                        : "pill-rejected"
                    }`}
                  >
                    ● {req.status}
                  </span>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "4px" }}>
                    {req.allocatedBy === "OS_SCHEDULER" ? "OS Dispatched" : "Manual / In Review"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
