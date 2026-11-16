import React, { useState, useEffect } from "react";
import "./AdminLayout.css";
import { api } from "../services/api";

export default function ReportsAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getAnalytics();
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const summary = analytics?.summary || {
    totalResources: 31,
    totalBookings: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    cancelledCount: 0,
    osAllottedCount: 0,
    manualAdminCount: 0,
    approvalRate: 0,
  };

  const topVenues = analytics?.topVenues || [];
  const blockDistribution = analytics?.blockDistribution || { "Block C": 15, "Block E": 16 };
  const categoryDistribution = analytics?.categoryDistribution || {};
  const peakSlots = analytics?.peakSlots || [];

  return (
    <div className="br-container">
      <div className="br-header">
        <div>
          <p className="br-eyebrow">EXECUTIVE INTELLIGENCE</p>
          <h1>Reports &amp; Campus Analytics</h1>
          <p>Real-time database metrics on venue demand, allocation efficiency, and resource utilization.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-blue">📊</div>
          <div className="admin-kpi-details">
            <p>Total Database Bookings</p>
            <h3>{summary.totalBookings}</h3>
            <span className="admin-kpi-sub">Lifetime submissions</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-emerald">✓</div>
          <div className="admin-kpi-details">
            <p>Overall Approval Rate</p>
            <h3>{summary.approvalRate}%</h3>
            <span className="admin-kpi-sub">Confirmed allocations</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-purple">⚡</div>
          <div className="admin-kpi-details">
            <p>OS Scheduler Dispatches</p>
            <h3>{summary.osAllottedCount}</h3>
            <span className="admin-kpi-sub">
              {summary.approvedCount > 0
                ? `${Math.round((summary.osAllottedCount / summary.approvedCount) * 100)}% of all approved`
                : "Autonomous allocations"}
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-amber">🏢</div>
          <div className="admin-kpi-details">
            <p>Active Campus Venues</p>
            <h3>{summary.totalResources}</h3>
            <span className="admin-kpi-sub">Block C (15) + Block E (16)</span>
          </div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Category Distribution */}
        <div className="br-card">
          <h2 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0 0 12px" }}>
            Infrastructure by Category
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(categoryDistribution).map(([cat, count]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1e293b", borderRadius: "8px" }}>
                <span style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>{cat}</span>
                <strong style={{ color: "#38bdf8" }}>{count} Rooms</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Block Allocation Ratio */}
        <div className="br-card">
          <h2 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0 0 12px" }}>
            Block Inventory Distribution
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(blockDistribution).map(([block, count]) => (
              <div key={block} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#1e293b", borderRadius: "8px" }}>
                <span style={{ color: "#e2e8f0", fontSize: "0.85rem" }}>{block}</span>
                <strong style={{ color: "#34d399" }}>{count} Rooms</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Peak Booking Slots & Top Requested Venues */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Peak Slots */}
        <div className="br-card">
          <h2 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0 0 4px" }}>
            Peak Demand Hours
          </h2>
          <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "0.82rem" }}>
            Time intervals experiencing highest booking contention.
          </p>

          {peakSlots.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No booking records recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {peakSlots.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1e293b", borderRadius: "6px", fontSize: "0.84rem" }}>
                  <span style={{ color: "#cbd5e1" }}>{item.slot}</span>
                  <strong style={{ color: "#fbbf24" }}>{item.count} requests</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Requested Venues */}
        <div className="br-card">
          <h2 style={{ fontSize: "1.1rem", color: "#f8fafc", margin: "0 0 4px" }}>
            Top Requested Venues
          </h2>
          <p style={{ margin: "0 0 12px", color: "#94a3b8", fontSize: "0.82rem" }}>
            Most frequently reserved campus rooms.
          </p>

          {topVenues.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No venue reservation records yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {topVenues.map((item, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#1e293b", borderRadius: "6px", fontSize: "0.84rem" }}>
                  <span style={{ color: "#cbd5e1" }}>{item.name}</span>
                  <strong style={{ color: "#38bdf8" }}>{item.count} bookings</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
