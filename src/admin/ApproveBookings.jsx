import React, { useState, useMemo } from "react";
import "./ApproveBookings.css";
import { useCampus } from "../context/CampusContext";

export default function ApproveBookings() {
  const { resources, requests, approveRequest, rejectRequest } = useCampus();

  const [selectedResourceId, setSelectedResourceId] = useState(
    resources[0] ? String(resources[0].id) : ""
  );
  const [selectedDate, setSelectedDate] = useState("2026-10-28");

  const currentResource = resources.find((r) => String(r.id) === String(selectedResourceId));

  // Find all requests for this resource and date
  const relevantRequests = useMemo(() => {
    return requests.filter(
      (r) =>
        String(r.resourceId) === String(selectedResourceId) &&
        (r.date === selectedDate || selectedDate === "")
    );
  }, [requests, selectedResourceId, selectedDate]);

  // Check which pending requests clash with approved bookings
  function checkSlotClash(targetReq) {
    if (targetReq.status === "Approved") return false;

    const parseMinutes = (t) => {
      if (!t) return 0;
      const parts = t.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
    };

    const s = parseMinutes(targetReq.startTime);
    const e = parseMinutes(targetReq.endTime);

    return relevantRequests.some(
      (r) =>
        r.id !== targetReq.id &&
        r.status === "Approved" &&
        r.date === targetReq.date &&
        s < parseMinutes(r.endTime) &&
        e > parseMinutes(r.startTime)
    );
  }

  return (
    <div className="ab-container">
      {/* Header */}
      <div className="ab-header">
        <div>
          <p className="ab-eyebrow">CONFLICT RESOLUTION & MATRIX</p>
          <h1>Approve Bookings Schedule</h1>
          <p>Inspect timeline slots, detect overlapping conflicts, and lock room allocations.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="ab-selectors">
        <div className="form-group" style={{ minWidth: "260px" }}>
          <label style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: "700" }}>
            SELECT RESOURCE
          </label>
          <select
            className="rm-select"
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
          >
            {resources.map((res) => (
              <option key={res.id} value={res.id}>
                {res.name} ({res.category})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: "700" }}>
            FILTER DATE
          </label>
          <input
            type="date"
            className="rm-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {currentResource && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Location: <strong style={{ color: "#ffffff" }}>{currentResource.location}</strong>
            </span>
            <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              Capacity: <strong style={{ color: "#38bdf8" }}>{currentResource.capacity || "N/A"}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Timeline slots card */}
      <div className="ab-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.15rem", color: "#ffffff" }}>
              Scheduled Requests for {currentResource ? currentResource.name : "Selected Venue"}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              Showing {relevantRequests.length} slot reservation requests on {selectedDate || "all dates"}.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", fontSize: "0.8rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#34d399" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#10b981", borderRadius: "2px" }} />
              Approved / Locked
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#fbbf24" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#fbbf24", borderRadius: "2px" }} />
              Pending Queue
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f87171" }}>
              <span style={{ width: "10px", height: "10px", backgroundColor: "#ef4444", borderRadius: "2px" }} />
              Overlap Clash
            </span>
          </div>
        </div>

        <div className="ab-timeline-track">
          {relevantRequests.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
              📅 No booking requests recorded for this resource on {selectedDate}. Venue is completely free.
            </div>
          ) : (
            relevantRequests.map((req) => {
              const hasClash = checkSlotClash(req);

              return (
                <div
                  key={req.id}
                  className={`ab-slot-item ${
                    req.status === "Approved"
                      ? "is-approved"
                      : hasClash
                      ? "is-conflict"
                      : "is-pending"
                  }`}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <strong style={{ fontSize: "1.05rem", color: "#ffffff" }}>
                        {req.time || `${req.startTime} – ${req.endTime}`}
                      </strong>
                      <span
                        className={`pill-priority ${
                          req.priority === "High" ? "pill-high" : "pill-normal"
                        }`}
                      >
                        {req.priority || "Normal"} Priority
                      </span>
                      {hasClash && (
                        <span
                          style={{
                            background: "rgba(239, 68, 68, 0.2)",
                            color: "#f87171",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                          }}
                        >
                          ⚠️ Slot Overlap Clash Detected!
                        </span>
                      )}
                    </div>

                    <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
                      Requested by <strong style={{ color: "#e2e8f0" }}>{req.userName}</strong> ({req.department}) · Purpose: {req.purpose}
                    </p>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {req.status === "Approved" ? (
                      <span
                        style={{
                          color: "#34d399",
                          fontWeight: "700",
                          fontSize: "0.88rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        ✓ Confirmed Lock
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn-table-approve"
                          onClick={() => approveRequest(req.id)}
                        >
                          ✓ Approve & Lock
                        </button>
                        <button
                          type="button"
                          className="btn-table-reject"
                          onClick={() => {
                            const reason = window.prompt("Rejection reason:", "Slot clash with higher priority session");
                            if (reason !== null) rejectRequest(req.id, reason);
                          }}
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
