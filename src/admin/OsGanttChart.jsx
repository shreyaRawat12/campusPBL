import React, { useState, useMemo } from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";
import OsGanttChartVisualizer from "../components/OsGanttChart";

export default function OsGanttChartPage() {
  const { resources, requests, triggerOsScheduler } = useCampus();

  const [filterBlock, setFilterBlock] = useState("All");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [osNotice, setOsNotice] = useState(null);

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchBlock = filterBlock === "All" || r.block === filterBlock;
      const matchDate = !filterDate || r.date === filterDate;
      return matchBlock && matchDate;
    });
  }, [requests, filterBlock, filterDate]);

  const approvedBookings = filteredRequests.filter((r) => r.status === "Approved");
  const osDispatchedCount = approvedBookings.filter(
    (r) => r.allocatedBy === "OS_SCHEDULER" || r.allocatedBy === "AUTONOMOUS_OS_DISPATCH"
  ).length;

  function handleRunScheduler() {
    const res = triggerOsScheduler();
    if (res.dispatchCount > 0) {
      setOsNotice(`⚡ OS Process Scheduler allocated ${res.dispatchCount} candidate request(s) using SJF + Priority Aging!`);
    } else {
      setOsNotice("ℹ️ OS Scheduler evaluated queue: No pending requests have expired their 10-minute SLA window or met dispatch criteria.");
    }
    setTimeout(() => setOsNotice(null), 7000);
  }

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: "#38bdf8", textTransform: "uppercase" }}>
            Operating System • Process Scheduling Timeline
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: "4px 0 6px" }}>
            OS Venue Gantt Chart Visualizer
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
            Real-time visualization of venue occupancy modeled as CPU Process Execution (Shortest Job First + Priority Aging).
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleRunScheduler}
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "10px 18px",
              fontSize: "0.88rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)",
            }}
          >
            <span>⚡</span> Run OS Scheduler
          </button>
        </div>
      </div>

      {/* OS Notice */}
      {osNotice && (
        <div style={{
          background: "#f3e8ff",
          border: "1px solid #d8b4fe",
          color: "#6b21a8",
          padding: "12px 18px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "0.88rem",
          fontWeight: "500",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>{osNotice}</span>
          <button type="button" onClick={() => setOsNotice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b21a8", fontWeight: "700" }}>✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>TOTAL TRACKED VENUES</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{resources.length}</div>
          <div style={{ fontSize: "0.76rem", color: "#3b82f6", marginTop: "2px" }}>Block C (15) · Block E (16)</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>CONFIRMED ALLOCATIONS</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#10b981", marginTop: "4px" }}>{approvedBookings.length}</div>
          <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>Active time blocks today</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>AUTONOMOUS OS ALLOCATIONS</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#8b5cf6", marginTop: "4px" }}>{osDispatchedCount}</div>
          <div style={{ fontSize: "0.76rem", color: "#8b5cf6", marginTop: "2px" }}>Dispatched via SJF/Aging</div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px" }}>
          <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: "600" }}>MANUAL ADMIN APPROVALS</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "#0284c7", marginTop: "4px" }}>{approvedBookings.length - osDispatchedCount}</div>
          <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "2px" }}>Manual officer reviews</div>
        </div>
      </div>

      {/* Main Gantt Visualizer Section */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <OsGanttChartVisualizer
          resources={resources}
          requests={requests}
          onRunScheduler={handleRunScheduler}
        />
      </div>

      {/* OS Theoretical Mapping Guide */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#0f172a", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📖</span> Operating Systems Theoretical Mapping to CampusConnect
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
            <strong style={{ color: "#2563eb", fontSize: "0.9rem" }}>Process vs Booking Request</strong>
            <p style={{ fontSize: "0.82rem", color: "#475569", margin: "6px 0 0", lineHeight: "1.5" }}>
              Each booking request acts as an OS <em>Process</em>. Process ID = Request ID. Burst Time = Booking Duration. Arrival Time = Timestamp submitted.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
            <strong style={{ color: "#7c3aed", fontSize: "0.9rem" }}>Shortest Job First (SJF) & Aging</strong>
            <p style={{ fontSize: "0.82rem", color: "#475569", margin: "6px 0 0", lineHeight: "1.5" }}>
              Shorter meetings receive lower duration penalties (SJF). To prevent starvation of long events, aging adds <strong>+10 points</strong> per 5 minutes of wait time.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
            <strong style={{ color: "#059669", fontSize: "0.9rem" }}>Best-Fit Memory Allocation</strong>
            <p style={{ fontSize: "0.82rem", color: "#475569", margin: "6px 0 0", lineHeight: "1.5" }}>
              Rooms represent physical memory partitions. When an applicant requests space for <em>N</em> participants, Best-Fit selects the smallest valid room to minimize internal fragmentation.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
            <strong style={{ color: "#ea580c", fontSize: "0.9rem" }}>Synchronization & Race Conditions</strong>
            <p style={{ fontSize: "0.82rem", color: "#475569", margin: "6px 0 0", lineHeight: "1.5" }}>
              Concurrent booking requests execute within MySQL ACID transactions using pessimistic row locking (<code>FOR UPDATE</code>) to guarantee mutual exclusion and zero double-bookings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
