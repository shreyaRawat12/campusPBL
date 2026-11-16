import React from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";

export default function AdminSettings() {
  const { user, isBackendConnected, autoApproveMode, toggleAutoApproveMode } = useCampus();

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <span style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: "#38bdf8", textTransform: "uppercase" }}>
          Platform Configuration & Engine Parameters
        </span>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: "4px 0 6px" }}>
          System Settings & OS Governance
        </h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
          Configure autonomous allocation policies, inspect operating system parameters, and review database health.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
        {/* Section 1: Autonomous Policy & SLA Window */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚡</span> Autonomous Allocation & SLA Policy
          </h2>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "18px", marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>Auto-Approve Engine (Background Watchdog)</strong>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "4px 0 0" }}>
                  When enabled, requests with expired SLAs are automatically allocated by the hybrid OS scheduler without requiring manual admin intervention.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAutoApproveMode}
                style={{
                  background: autoApproveMode ? "#10b981" : "#94a3b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "20px",
                  padding: "8px 18px",
                  fontSize: "0.84rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {autoApproveMode ? "ACTIVE (ON)" : "PAUSED (OFF)"}
              </button>
            </div>
            <div style={{ fontSize: "0.76rem", color: autoApproveMode ? "#059669" : "#64748b", fontWeight: "500" }}>
              Status: {autoApproveMode ? "Running 30s background audit cycle" : "Manual review mode enforced"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
              <div>
                <strong style={{ fontSize: "0.88rem", color: "#1e293b" }}>Admin Review SLA Window</strong>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Grace period for facility officers before OS dispatch activates</div>
              </div>
              <span style={{ background: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "0.82rem" }}>
                10 Minutes
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
              <div>
                <strong style={{ fontSize: "0.88rem", color: "#1e293b" }}>Watchdog Polling Interval</strong>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Frequency of server-side autonomous queue audit</div>
              </div>
              <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "0.82rem" }}>
                30 Seconds
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", border: "1px solid #f1f5f9", borderRadius: "8px" }}>
              <div>
                <strong style={{ fontSize: "0.88rem", color: "#1e293b" }}>Concurrency & Race Protection</strong>
                <div style={{ fontSize: "0.78rem", color: "#64748b" }}>ACID transaction isolation with row-level locks</div>
              </div>
              <span style={{ background: "#ecfdf5", color: "#047857", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "0.82rem" }}>
                FOR UPDATE
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: OS Scheduling Engine Mathematical Parameters */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🧠</span> OS Scheduling Algorithm Parameters
          </h2>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
            <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: "600", marginBottom: "4px" }}>COMPOSITE SCORE FORMULA</div>
            <code style={{ fontSize: "0.85rem", color: "#0284c7", fontWeight: "700", display: "block" }}>
              Score = Priority Weight + (10 × ⌊Wait / 5m⌋) - ⌊Duration / 10m⌋
            </code>
          </div>

          <table style={{ width: "100%", fontSize: "0.84rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", color: "#475569" }}>Parameter</th>
                <th style={{ padding: "8px 12px", color: "#475569" }}>Value / Rule</th>
                <th style={{ padding: "8px 12px", color: "#475569" }}>Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontWeight: "600" }}>Academic / Examination</td>
                <td style={{ padding: "10px 12px", color: "#2563eb", fontWeight: "700" }}>100 pts</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>Highest priority institutional event</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontWeight: "600" }}>Faculty / Official Activity</td>
                <td style={{ padding: "10px 12px", color: "#2563eb", fontWeight: "700" }}>100 pts</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>Academic leadership scheduling</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontWeight: "600" }}>Student Workshop / Hackathon</td>
                <td style={{ padding: "10px 12px", color: "#059669", fontWeight: "700" }}>60 pts</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>Co-curricular student projects</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontWeight: "600" }}>Group Study / General</td>
                <td style={{ padding: "10px 12px", color: "#d97706", fontWeight: "700" }}>30 pts</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>Casual collaborative sessions</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontWeight: "600" }}>Starvation Aging Bonus</td>
                <td style={{ padding: "10px 12px", color: "#7c3aed", fontWeight: "700" }}>+10 pts / 5 min</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>Prevents low-priority indefinite starvation</td>
              </tr>
              <tr>
                <td style={{ padding: "10px 12px", fontWeight: "600" }}>Shortest Job First (SJF)</td>
                <td style={{ padding: "10px 12px", color: "#dc2626", fontWeight: "700" }}>-1 pt / 10 min</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>Favors quicker meetings to optimize throughput</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Database & Backend Infrastructure */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🗄️</span> DBMS Engine & Connection Integrity
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>RDBMS Engine</span>
              <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>MySQL / MariaDB 10.4.32 (XAMPP)</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Target Database</span>
              <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>campus_resource_db</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Database Port</span>
              <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>3306 (TCP)</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Backend Node.js API</span>
              <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>Express REST API on Port 5000</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Database Integrity Policy</span>
              <span style={{ background: "#ecfdf5", color: "#047857", fontSize: "0.76rem", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>
                ZERO-MODIFICATION STRICT RULE
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Academic Project Attribution */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🎓</span> Academic PBL Attribution
          </h2>

          <div style={{ fontSize: "0.86rem", color: "#475569", lineHeight: "1.6" }}>
            <p style={{ margin: "0 0 10px" }}>
              <strong>Project Name:</strong> CampusConnect — Campus Resource Allocation and Scheduling System
            </p>
            <p style={{ margin: "0 0 10px" }}>
              <strong>Course Integration:</strong> Database Management Systems (DBMS) & Operating Systems (OS) Project-Based Learning (PBL).
            </p>
            <p style={{ margin: "0 0 10px" }}>
              <strong>OS Concepts Demonstrated:</strong> Process Scheduling (Priority, SJF, Starvation Prevention via Aging), Dynamic Partitioning (Best-Fit Allocation), Synchronization & Mutual Exclusion (ACID transactions, pessimistic row locks), Service Level Agreements (10-minute SLA countdown).
            </p>
            <p style={{ margin: "0" }}>
              <strong>Admin Credentials:</strong> Facility Admin (<span style={{ fontFamily: "monospace", color: "#0284c7" }}>ADM-001</span>), Master Passcode: <span style={{ fontFamily: "monospace", color: "#0284c7" }}>1203</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
