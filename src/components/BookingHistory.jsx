import { useMemo, useState } from "react";
import "./BookingHistory.css";

function BookingHistory({ requests = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [resourceFilter, setResourceFilter] = useState("All");

  const resourcesList = useMemo(() => {
    const set = new Set();
    requests.forEach((r) => {
      const name = r.resource || r.resourceName;
      if (name) set.add(name);
    });
    return ["All", ...Array.from(set)];
  }, [requests]);

  const history = useMemo(() => {
    return requests.filter((request) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = [
        request.id,
        request.resource || request.resourceName,
        request.purpose,
        request.date,
        request.time,
        request.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const isOs = (request.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");
      const matchesSource =
        sourceFilter === "All" ||
        (sourceFilter === "OS Scheduler" && isOs) ||
        (sourceFilter === "Manual Admin" && !isOs);

      const matchesResource =
        resourceFilter === "All" ||
        (request.resource || request.resourceName) === resourceFilter;

      const matchesFrom = !fromDate || (request.date && request.date >= fromDate);
      const matchesTo = !toDate || (request.date && request.date <= toDate);

      return matchesSearch && matchesStatus && matchesSource && matchesResource && matchesFrom && matchesTo;
    });
  }, [requests, search, statusFilter, sourceFilter, resourceFilter, fromDate, toDate]);

  const total = requests.length;
  const approved = requests.filter((r) => r.status === "Approved").length;
  const pending = requests.filter((r) => r.status === "Pending").length;
  const rejected = requests.filter((r) => r.status === "Rejected").length;

  function clearAllFilters() {
    setSearch("");
    setStatusFilter("All");
    setSourceFilter("All");
    setResourceFilter("All");
    setFromDate("");
    setToDate("");
  }

  function formatTimestamp(isoStr) {
    if (!isoStr) return "—";
    const d = new Date(isoStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section className="history-page">
      <div className="history-heading">
        <div>
          <span className="history-eyebrow">BOOKING AUDIT LOG</span>
          <h1>Booking History</h1>
          <p>Complete historical log of all your resource requests, approvals, and OS allocations.</p>
        </div>
        <div className="history-total-badge">
          <span>Total Records</span>
          <strong>{total}</strong>
        </div>
      </div>

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-blue">▤</div>
          <div>
            <span>Total Requests</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-green">✓</div>
          <div>
            <span>Approved</span>
            <strong>{approved}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-orange">◷</div>
          <div>
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-red">×</div>
          <div>
            <span>Rejected</span>
            <strong>{rejected}</strong>
          </div>
        </div>
      </div>

      <div className="history-panel">
        <div className="history-panel-heading">
          <div>
            <h2>All Booking Records</h2>
            <p>Filter requests by status, allocation source, date range, or venue.</p>
          </div>
          <span className="history-result-count">
            {history.length} records found
          </span>
        </div>

        {/* Multi-filter Toolbar */}
        <div className="history-toolbar" style={{ flexWrap: "wrap", gap: "10px", padding: "16px 20px" }}>
          <div className="history-search" style={{ minWidth: "220px", flex: 1 }}>
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search Request ID, room, purpose..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter source"
          >
            <option value="All">All Allocation Sources</option>
            <option value="Manual Admin">Manual Admin</option>
            <option value="OS Scheduler">OS Scheduler</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            aria-label="Filter room"
          >
            {resourcesList.map((r) => (
              <option key={r} value={r}>
                {r === "All" ? "All Rooms" : r}
              </option>
            ))}
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
            />
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              padding: "7px 12px",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>REQUEST ID</th>
                <th>PURPOSE</th>
                <th>ROOM</th>
                <th>BOOKING DATE</th>
                <th>TIME</th>
                <th>DECISION</th>
                <th>ALLOCATION SOURCE</th>
                <th>DECISION DATE</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((request) => {
                  const isOs = (request.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");
                  return (
                    <tr key={request.id}>
                      <td>
                        <strong style={{ color: "#2563eb" }}>{request.id}</strong>
                      </td>
                      <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {request.purpose || "—"}
                      </td>
                      <td>
                        <strong>{request.resource || request.resourceName}</strong>
                      </td>
                      <td>{request.date || "—"}</td>
                      <td>{request.time || "—"}</td>
                      <td>
                        <span
                          className={`history-status history-status-${String(request.status).toLowerCase()}`}
                        >
                          <span className="history-status-dot" />
                          {request.status}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: isOs ? "#f5f3ff" : "#eff6ff",
                            color: isOs ? "#7c3aed" : "#2563eb",
                          }}
                        >
                          {isOs ? "⚡ OS Auto-Allotted" : "Manual Admin"}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: "#64748b" }}>
                          {formatTimestamp(request.createdAt)}
                        </small>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="history-empty" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div className="history-empty-icon" style={{ fontSize: "2rem", marginBottom: "8px" }}>◷</div>
                    <strong style={{ display: "block", marginBottom: "4px" }}>No booking history available.</strong>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                      When you submit and complete resource reservations, your full audit trail will be logged here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="history-footer">
          Showing {history.length} of {total} booking records
        </div>
      </div>

      <p className="history-note">
        <span>ⓘ</span> Booking history records are fetched directly from the connected MySQL database.
      </p>
    </section>
  );
}

export default BookingHistory;
