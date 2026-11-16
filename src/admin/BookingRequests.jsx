import React, { useState, useMemo } from "react";
import "./BookingRequests.css";
import { useCampus } from "../context/CampusContext";
import SlaTimerBadge from "../components/SlaTimerBadge";

export default function BookingRequests() {
  const { requests, approveRequest, rejectRequest } = useCampus();

  const [activeTab, setActiveTab] = useState("Pending");
  const [search, setSearch] = useState("");

  // Reject Modal State
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  // Details Modal State
  const [viewDetailsReq, setViewDetailsReq] = useState(null);

  const counts = useMemo(
    () => ({
      All: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      Approved: requests.filter((r) => r.status === "Approved").length,
      Rejected: requests.filter((r) => r.status === "Rejected").length,
      "High Priority": requests.filter((r) => r.priority === "High" && r.status === "Pending").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();

    return requests.filter((req) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === "Pending") matchesTab = req.status === "Pending";
      else if (activeTab === "Approved") matchesTab = req.status === "Approved";
      else if (activeTab === "Rejected") matchesTab = req.status === "Rejected";
      else if (activeTab === "High Priority") matchesTab = req.priority === "High" && req.status === "Pending";

      // Search filter
      const matchesSearch = [
        req.id,
        req.resource || req.resourceName,
        req.userName,
        req.department,
        req.date,
        req.purpose,
      ].some((val) => String(val || "").toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [requests, activeTab, search]);

  function handleOpenReject(req) {
    setRejectModalReq(req);
    setRejectReason("Time slot unavailable due to campus scheduling.");
  }

  function handleConfirmReject() {
    if (rejectModalReq) {
      rejectRequest(rejectModalReq.id, rejectReason);
      setRejectModalReq(null);
    }
  }

  return (
    <div className="br-container">
      {/* Header */}
      <div className="br-header">
        <div>
          <p className="br-eyebrow">BOOKING AUDIT & WORKFLOW</p>
          <h1>Booking Requests Queue</h1>
          <p>Review, validate, approve, or decline campus allocation requests.</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div className="br-tabs">
          {["Pending", "Approved", "Rejected", "High Priority", "All"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`br-tab-btn ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({counts[tab] || 0})
            </button>
          ))}
        </div>

        <div className="rm-search-box" style={{ maxWidth: "320px" }}>
          <span style={{ color: "#64748b" }}>🔍</span>
          <input
            type="search"
            placeholder="Search request ID, student, or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="br-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Resource</th>
                <th>Applicant</th>
                <th>Scheduled Slot</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Queue</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
                    No requests found matching this view.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <strong style={{ color: "#38bdf8" }}>{req.id}</strong>
                    </td>
                    <td>
                      <strong>{req.resource || req.resourceName}</strong>
                      <div style={{ fontSize: "0.76rem", color: "#94a3b8" }}>
                        {req.category || "Classroom"}
                      </div>
                    </td>
                    <td>
                      <div>{req.userName}</div>
                      <small style={{ color: "#64748b" }}>
                        {req.userId} · {req.department}
                      </small>
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
                      <span
                        className={`status-pill ${
                          req.status === "Approved"
                            ? "pill-approved"
                            : req.status === "Pending"
                            ? "pill-pending"
                            : req.status === "Rejected"
                            ? "pill-rejected"
                            : "pill-cancelled"
                        }`}
                      >
                        ● {req.status}
                      </span>
                      {req.status === "Pending" && (
                        <div style={{ marginTop: "6px" }}>
                          <SlaTimerBadge
                            createdAt={req.createdAt || req.submittedAt}
                            slaExpiresAt={req.slaExpiresAt}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      {req.status === "Pending" && req.queue && req.queue !== "—" ? (
                        <span style={{ color: "#fbbf24", fontWeight: "700" }}>#{req.queue}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="btn-icon-action"
                          title="View Details"
                          onClick={() => setViewDetailsReq(req)}
                        >
                          👁️
                        </button>

                        {req.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              className="btn-table-approve"
                              onClick={() => approveRequest(req.id)}
                              title="Approve Booking"
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              className="btn-table-reject"
                              onClick={() => handleOpenReject(req)}
                              title="Reject Booking"
                            >
                              ✕ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {viewDetailsReq && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Request Details: {viewDetailsReq.id}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setViewDetailsReq(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <small style={{ color: "#94a3b8" }}>APPLICANT</small>
                  <p style={{ margin: "4px 0", fontWeight: "600", color: "#f8fafc" }}>
                    {viewDetailsReq.userName}
                  </p>
                  <small style={{ color: "#64748b" }}>
                    {viewDetailsReq.userId} ({viewDetailsReq.userRole || "Student"})
                  </small>
                </div>

                <div>
                  <small style={{ color: "#94a3b8" }}>DEPARTMENT</small>
                  <p style={{ margin: "4px 0", fontWeight: "600", color: "#f8fafc" }}>
                    {viewDetailsReq.department}
                  </p>
                </div>

                <div>
                  <small style={{ color: "#94a3b8" }}>RESOURCE</small>
                  <p style={{ margin: "4px 0", fontWeight: "600", color: "#38bdf8" }}>
                    {viewDetailsReq.resource || viewDetailsReq.resourceName}
                  </p>
                </div>

                <div>
                  <small style={{ color: "#94a3b8" }}>DATE & TIME</small>
                  <p style={{ margin: "4px 0", fontWeight: "600", color: "#f8fafc" }}>
                    {viewDetailsReq.date} ({viewDetailsReq.time})
                  </p>
                </div>

                <div>
                  <small style={{ color: "#94a3b8" }}>CURRENT STATUS</small>
                  <p style={{ margin: "4px 0" }}>
                    <span
                      className={`status-pill ${
                        viewDetailsReq.status === "Approved"
                          ? "pill-approved"
                          : viewDetailsReq.status === "Pending"
                          ? "pill-pending"
                          : "pill-rejected"
                      }`}
                    >
                      ● {viewDetailsReq.status}
                    </span>
                  </p>
                </div>

                <div>
                  <small style={{ color: "#94a3b8" }}>PRIORITY LEVEL</small>
                  <p style={{ margin: "4px 0", fontWeight: "700" }}>
                    {viewDetailsReq.priority || "Normal"}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <small style={{ color: "#94a3b8" }}>STATED PURPOSE / ACTIVITY</small>
                <div
                  style={{
                    backgroundColor: "#1e293b",
                    padding: "12px",
                    borderRadius: "8px",
                    marginTop: "6px",
                    color: "#e2e8f0",
                    fontSize: "0.9rem",
                  }}
                >
                  {viewDetailsReq.purpose || "No additional purpose description supplied."}
                </div>
              </div>

              {viewDetailsReq.adminRemarks && (
                <div style={{ marginTop: "12px" }}>
                  <small style={{ color: "#94a3b8" }}>ADMIN REMARKS</small>
                  <div
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      padding: "12px",
                      borderRadius: "8px",
                      marginTop: "6px",
                      color: "#fca5a5",
                      fontSize: "0.9rem",
                    }}
                  >
                    {viewDetailsReq.adminRemarks}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setViewDetailsReq(null)}
              >
                Close
              </button>
              {viewDetailsReq.status === "Pending" && (
                <button
                  type="button"
                  className="admin-btn-primary"
                  onClick={() => {
                    approveRequest(viewDetailsReq.id);
                    setViewDetailsReq(null);
                  }}
                >
                  ✓ Approve Immediately
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalReq && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <h3>Decline Request {rejectModalReq.id}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRejectModalReq(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: "#cbd5e1", fontSize: "0.9rem", margin: 0 }}>
                Please specify the reason for declining{" "}
                <strong style={{ color: "#ffffff" }}>{rejectModalReq.userName}</strong>'s request
                for {rejectModalReq.resource || rejectModalReq.resourceName}.
              </p>

              <div className="form-group" style={{ marginTop: "10px" }}>
                <label>Admin Remarks / Reason *</label>
                <textarea
                  rows="3"
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => setRejectModalReq(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                style={{ background: "#ef4444" }}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
