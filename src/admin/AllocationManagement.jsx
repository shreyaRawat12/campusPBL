import React, { useState, useMemo } from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";

export default function AllocationManagement() {
  const { requests, resources, cancelRequest } = useCampus();

  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedSource, setSelectedSource] = useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const confirmedAllocations = useMemo(() => {
    return requests.filter((r) => r.status === "Approved");
  }, [requests]);

  const filteredAllocations = useMemo(() => {
    const q = search.trim().toLowerCase();

    return confirmedAllocations.filter((alloc) => {
      const isOs = (alloc.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");
      const matchSource =
        selectedSource === "All" ||
        (selectedSource === "OS Scheduler" && isOs) ||
        (selectedSource === "Manual Admin" && !isOs);

      const matchBlock = selectedBlock === "All" || alloc.block === selectedBlock;
      const matchDate = !dateFilter || alloc.date === dateFilter;

      const matchSearch = [
        alloc.id,
        alloc.resource || alloc.resourceName,
        alloc.userName,
        alloc.department,
        alloc.purpose,
      ].some((val) => String(val || "").toLowerCase().includes(q));

      return matchSource && matchBlock && matchDate && matchSearch;
    });
  }, [confirmedAllocations, search, selectedBlock, selectedSource, dateFilter]);

  return (
    <div className="br-container">
      <div className="br-header">
        <div>
          <p className="br-eyebrow">CAMPUS ALLOCATIONS LEDGER</p>
          <h1>Allocation Management</h1>
          <p>Master ledger of all confirmed room allocations across Block C and Block E.</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="admin-kpi-grid" style={{ marginBottom: "20px" }}>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-blue">▣</div>
          <div className="admin-kpi-details">
            <p>Total Confirmed</p>
            <h3>{confirmedAllocations.length}</h3>
            <span className="admin-kpi-sub">Active venue allocations</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-purple">⚡</div>
          <div className="admin-kpi-details">
            <p>OS Auto-Allotted</p>
            <h3>
              {confirmedAllocations.filter((a) => (a.adminRemarks || "").includes("Auto-Allotted")).length}
            </h3>
            <span className="admin-kpi-sub">SJF + Priority Aging</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon kpi-emerald">✓</div>
          <div className="admin-kpi-details">
            <p>Manual Admin Confirmed</p>
            <h3>
              {confirmedAllocations.filter((a) => !(a.adminRemarks || "").includes("Auto-Allotted")).length}
            </h3>
            <span className="admin-kpi-sub">Direct approval</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div className="rm-search-box" style={{ flex: 1, minWidth: "220px" }}>
          <span style={{ color: "#64748b" }}>🔍</span>
          <input
            type="search"
            placeholder="Search allocation ID, applicant, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rm-select"
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
        >
          <option value="All">All Blocks (C &amp; E)</option>
          <option value="Block C">Block C</option>
          <option value="Block E">Block E</option>
        </select>

        <select
          className="rm-select"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
        >
          <option value="All">All Allocation Sources</option>
          <option value="Manual Admin">Manual Admin Only</option>
          <option value="OS Scheduler">OS Scheduler Only</option>
        </select>

        <input
          type="date"
          className="rm-select"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            style={{ background: "#334155", color: "#f8fafc", border: "none", padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", cursor: "pointer" }}
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Table */}
      <div className="br-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Allocation ID</th>
                <th>Resource &amp; Room</th>
                <th>Applicant / Dept</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Participants</th>
                <th>Allocation Source</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "36px", color: "#94a3b8" }}>
                    No confirmed allocations match this filter. When booking requests are approved, they appear here.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((alloc) => {
                  const isOs = (alloc.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");

                  return (
                    <tr key={alloc.id}>
                      <td>
                        <strong style={{ color: "#38bdf8" }}>{alloc.id}</strong>
                      </td>
                      <td>
                        <strong>{alloc.resource || alloc.resourceName}</strong>
                        <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          {alloc.block || "Block C"} · {alloc.floor || "General"}
                        </div>
                      </td>
                      <td>
                        <div>{alloc.userName}</div>
                        <small style={{ color: "#64748b" }}>{alloc.department}</small>
                      </td>
                      <td>{alloc.date}</td>
                      <td>
                        <strong style={{ color: "#cbd5e1" }}>{alloc.time || `${alloc.startTime} – ${alloc.endTime}`}</strong>
                      </td>
                      <td>~{alloc.participants || 1}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: isOs ? "rgba(139, 92, 246, 0.2)" : "rgba(59, 130, 246, 0.2)",
                            color: isOs ? "#c084fc" : "#60a5fa",
                          }}
                        >
                          {isOs ? "⚡ OS Scheduler" : "Manual Admin"}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill pill-approved">● Confirmed</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-table-reject"
                          onClick={() => {
                            if (window.confirm(`Revoke allocation ${alloc.id} for ${alloc.resource || alloc.resourceName}?`)) {
                              cancelRequest(alloc.id);
                            }
                          }}
                          title="Revoke Allocation"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
