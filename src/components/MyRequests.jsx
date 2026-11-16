import { useMemo, useState } from "react";
import "./MyRequests.css";
import SlaTimerBadge from "./SlaTimerBadge";

function MyRequests({ requests = [], onCancelRequest }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);

  const filters = ["All", "Pending", "Approved", "Rejected", "Waiting for Resource"];

  const counts = useMemo(
    () => ({
      All: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      Approved: requests.filter((r) => r.status === "Approved").length,
      Rejected: requests.filter((r) => r.status === "Rejected").length,
      "Waiting for Resource": requests.filter((r) => r.queue === "Waiting for Resource" || (r.adminRemarks || "").includes("Waiting for Resource")).length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = requests.filter((request) => {
      let matchesFilter = true;
      if (activeFilter === "Pending") matchesFilter = request.status === "Pending";
      else if (activeFilter === "Approved") matchesFilter = request.status === "Approved";
      else if (activeFilter === "Rejected") matchesFilter = request.status === "Rejected";
      else if (activeFilter === "Waiting for Resource") {
        matchesFilter = request.queue === "Waiting for Resource" || (request.adminRemarks || "").includes("Waiting for Resource");
      }

      const matchesSearch = [
        request.id,
        request.resource || request.resourceName,
        request.purpose,
        request.date,
        request.time,
        request.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });

    // Sorting
    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "date") {
        return (a.date || "").localeCompare(b.date || "");
      }
      if (sortBy === "status") {
        return (a.status || "").localeCompare(b.status || "");
      }
      return 0;
    });
  }, [requests, activeFilter, search, sortBy]);

  return (
    <div className="my-requests-page">
      <section className="mr-page-header">
        <div>
          <p className="mr-eyebrow">STUDENT PORTAL</p>
          <h1>My Resource Requests</h1>
          <p className="mr-subtitle">
            Track your venue reservations, live 10-Minute SLA countdown, and OS Scheduler decisions.
          </p>
        </div>

        <div className="mr-header-icon" aria-hidden="true">
          ☷
        </div>
      </section>

      {/* 4 Statistic Cards */}
      <section className="mr-stats-grid">
        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-blue">▤</div>
          <div>
            <p>Total Requests</p>
            <h2>{counts.All}</h2>
            <span>All submitted requests</span>
          </div>
        </article>

        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-orange">◷</div>
          <div>
            <p>Pending Decision</p>
            <h2>{counts.Pending}</h2>
            <span>Within SLA / OS Window</span>
          </div>
        </article>

        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-green">✓</div>
          <div>
            <p>Approved</p>
            <h2>{counts.Approved}</h2>
            <span>Manual + OS Dispatched</span>
          </div>
        </article>

        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-red">×</div>
          <div>
            <p>Rejected</p>
            <h2>{counts.Rejected}</h2>
            <span>Requests declined</span>
          </div>
        </article>
      </section>

      <section className="mr-list-section">
        <div className="mr-list-heading">
          <div>
            <h2>Resource Requests Ledger</h2>
            <p>View real-time status and autonomous allocation timers.</p>
          </div>

          <span className="mr-result-count">
            {filteredRequests.length}{" "}
            {filteredRequests.length === 1 ? "request" : "requests"}
          </span>
        </div>

        {/* Toolbar: Search, Filters, Sorting */}
        <div className="mr-toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="mr-search-box" style={{ flex: 1, minWidth: "220px" }}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search requests"
              placeholder="Search Request ID, room number, or purpose..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: "600" }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="date">Date</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="mr-filter-tabs" aria-label="Filter requests by status">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeFilter === filter ? "selected" : ""}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
                <span>{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <>
            <div className="mr-table-wrap">
              <table className="mr-table">
                <thead>
                  <tr>
                    <th>REQUEST ID</th>
                    <th>VENUE &amp; BLOCK</th>
                    <th>PURPOSE</th>
                    <th>DATE &amp; TIME</th>
                    <th>PARTICIPANTS</th>
                    <th>PRIORITY</th>
                    <th>STATUS</th>
                    <th>SLA TIMEOUT / QUEUE</th>
                    <th>ALLOCATION DETAILS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => {
                    const isOs = (request.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");
                    const isWaiting = request.queue === "Waiting for Resource" || (request.adminRemarks || "").includes("Waiting for Resource");

                    return (
                      <tr key={request.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedRequestDetails(request)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2563eb",
                              fontWeight: "700",
                              cursor: "pointer",
                              padding: 0,
                              textDecoration: "underline",
                            }}
                            title="Click to view full request audit details"
                          >
                            {request.id}
                          </button>
                        </td>

                        <td>
                          <div className="mr-resource-cell">
                            <span className="mr-resource-icon">▣</span>
                            <div>
                              <strong>{request.resource || request.resourceName}</strong>
                              <small style={{ display: "block", color: "#64748b" }}>{request.block}</small>
                            </div>
                          </div>
                        </td>

                        <td style={{ maxWidth: "160px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {request.purpose || "—"}
                        </td>

                        <td>
                          <div className="mr-date">{request.date}</div>
                          <span className="mr-time">{request.time}</span>
                        </td>

                        <td>
                          <strong>{request.participants || 1}</strong>
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: "700",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: request.priority === "High" ? "#fee2e2" : "#f1f5f9",
                              color: request.priority === "High" ? "#dc2626" : "#475569",
                            }}
                          >
                            {request.priority || "Normal"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`mr-status mr-status-${String(
                              request.status
                            ).toLowerCase()}`}
                          >
                            <span className="mr-status-dot" />
                            {request.status}
                          </span>
                        </td>

                        <td>
                          {request.status === "Pending" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              <SlaTimerBadge
                                createdAt={request.createdAt || request.submittedAt}
                                slaExpiresAt={request.slaExpiresAt}
                              />
                              {request.queue && request.queue !== "—" && (
                                <small style={{ color: "#d97706", fontWeight: "700" }}>
                                  Queue: #{request.queue}
                                </small>
                              )}
                            </div>
                          ) : (
                            <span className="mr-no-queue">—</span>
                          )}
                        </td>

                        <td>
                          {isOs ? (
                            <div style={{ fontSize: "0.78rem", color: "#7c3aed", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                              <span>✓</span> Auto-Allotted via OS Scheduler (Admin SLA Expired)
                            </div>
                          ) : isWaiting ? (
                            <div style={{ fontSize: "0.78rem", color: "#d97706", fontWeight: "600" }}>
                              ⏳ Waiting for Resource
                            </div>
                          ) : request.status === "Approved" ? (
                            <div style={{ fontSize: "0.78rem", color: "#059669", fontWeight: "600" }}>
                              ✓ Approved by Admin
                            </div>
                          ) : request.adminRemarks ? (
                            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                              {request.adminRemarks}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>—</span>
                          )}
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedRequestDetails(request)}
                              style={{
                                background: "#f1f5f9",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.74rem",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Details
                            </button>

                            {request.status === "Pending" && onCancelRequest && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Withdraw request ${request.id}?`)) {
                                    onCancelRequest(request.id);
                                  }
                                }}
                                style={{
                                  background: "#fee2e2",
                                  border: "1px solid #fca5a5",
                                  color: "#dc2626",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: "0.74rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mr-demo-note">
              10-Minute SLA Policy: If administrator review window expires, the OS Scheduler autonomously evaluates Priority + SJF + Aging and Best-Fit capacity to allocate rooms.
            </p>
          </>
        ) : (
          <div className="mr-empty-state">
            <div className="mr-empty-icon">⌕</div>
            <h3>No requests found</h3>
            <p>
              {search
                ? "Try another search term or change the status filter."
                : "No booking requests yet. Submit your first resource booking request to get started."}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("All");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      {/* Request Details Modal */}
      {selectedRequestDetails && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", maxWidth: "520px", width: "100%", border: "1px solid #cbd5e1", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: "700" }}>AUDIT INSPECTOR</span>
                <h3 style={{ margin: "2px 0 0", color: "#0f172a" }}>Request {selectedRequestDetails.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "0.88rem", marginBottom: "16px" }}>
              <div><span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>ALLOCATED ROOM</span><strong>{selectedRequestDetails.resource || selectedRequestDetails.resourceName}</strong></div>
              <div><span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>CAMPUS LOCATION</span>{selectedRequestDetails.block}, {selectedRequestDetails.floor}</div>
              <div><span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>SCHEDULED DATE</span><strong>{selectedRequestDetails.date}</strong></div>
              <div><span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>TIME SLOT</span>{selectedRequestDetails.time}</div>
              <div><span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>PARTICIPANTS</span>{selectedRequestDetails.participants} Students</div>
              <div><span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>CURRENT STATUS</span><span className={`mr-status mr-status-${String(selectedRequestDetails.status).toLowerCase()}`}>{selectedRequestDetails.status}</span></div>
            </div>

            <div style={{ marginBottom: "14px" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}>EVENT PURPOSE</span>
              <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#334155" }}>
                {selectedRequestDetails.purpose || "No additional purpose provided."}
              </div>
            </div>

            {selectedRequestDetails.adminRemarks && (
              <div style={{ marginBottom: "16px" }}>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "4px" }}>DECISION REMARKS / REASON</span>
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px", borderRadius: "6px", fontSize: "0.85rem", color: "#1e40af" }}>
                  {selectedRequestDetails.adminRemarks}
                </div>
              </div>
            )}

            <div style={{ textAlign: "right", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mr-footer">
        <span>CampusConnect · Resource Allocation System</span>
        <span>Student Portal</span>
      </footer>
    </div>
  );
}

export default MyRequests;
