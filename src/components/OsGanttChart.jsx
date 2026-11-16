import React, { useState } from "react";
import "./OsGanttChart.css";
import { timeToMinutes } from "../utils/osScheduler";

const timeSlots = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

export default function OsGanttChart({
  resources = [],
  requests = [],
  onRunScheduler,
}) {
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const displayResources = resources
    .filter((r) => selectedBlock === "All" || r.block === selectedBlock)
    .slice(0, 10); // Show top 10 for clean compact visualization

  const baseMinutes = timeToMinutes("08:00");
  const totalMinutes = timeToMinutes("18:00") - baseMinutes; // 10 hours = 600 mins

  function getSlotStyles(req) {
    const startMin = timeToMinutes(req.startTime || "09:00");
    const endMin = timeToMinutes(req.endTime || "11:00");

    const leftPercent = Math.max(0, ((startMin - baseMinutes) / totalMinutes) * 100);
    const widthPercent = Math.max(8, ((endMin - startMin) / totalMinutes) * 100);

    return {
      left: `${leftPercent}%`,
      width: `${Math.min(100 - leftPercent, widthPercent)}%`,
      position: "absolute",
    };
  }

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <div>
          <p className="gantt-eyebrow">OPERATING SYSTEM SCHEDULING ENGINE</p>
          <h2>
            <span>🧠</span> Real-Time Venue Allocation Gantt Chart
          </h2>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
            Visual process execution timeline applying Shortest Job First (SJF) & Priority Aging.
          </p>
        </div>

        <div className="gantt-controls">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f8fafc",
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            <option value="All">All Blocks (Block C & E)</option>
            <option value="Block C">Block C Only</option>
            <option value="Block E">Block E Only</option>
          </select>

          {onRunScheduler && (
            <button
              type="button"
              className="gantt-btn-run"
              onClick={onRunScheduler}
              title="Force execute the OS scheduler across all pending requests"
            >
              <span>⚡</span> Run OS Scheduler
            </button>
          )}
        </div>
      </div>

      <div className="gantt-legend">
        <div className="legend-item">
          <span className="legend-dot dot-manual"></span>
          <span>Manual Admin Approved</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-os"></span>
          <span>⚡ Autonomous OS Dispatched (SJF + Priority)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-pending"></span>
          <span>⏳ Pending (Within 10-Min SLA Window)</span>
        </div>
      </div>

      {/* Timeline Matrix */}
      <div className="gantt-matrix">
        {/* Time Header */}
        <div className="gantt-row">
          <div className="gantt-time-header" style={{ textAlign: "left", paddingLeft: "14px" }}>
            ROOM / VENUE
          </div>
          {timeSlots.map((slot) => (
            <div key={slot} className="gantt-time-header">
              {slot}
            </div>
          ))}
        </div>

        {/* Room Tracks */}
        {displayResources.map((room) => {
          const roomRequests = requests.filter(
            (r) =>
              (String(r.resourceId) === String(room.id) ||
                r.resourceName?.includes(room.name) ||
                r.resource === room.name) &&
              (r.status === "Approved" || r.status === "Pending")
          );

          return (
            <div className="gantt-row" key={room.id}>
              <div className="gantt-room-label">
                <strong>{room.name}</strong>
                <small>{room.block} · {room.floor}</small>
              </div>

              <div className="gantt-track">
                {roomRequests.length === 0 ? (
                  <span style={{ color: "#475569", fontSize: "0.75rem", fontStyle: "italic" }}>
                    Idle (Free slot)
                  </span>
                ) : (
                  roomRequests.map((req) => {
                    const isOsDispatched =
                      req.allocatedBy === "OS_SCHEDULER" ||
                      req.allocatedBy === "AUTONOMOUS_OS_DISPATCH" ||
                      req.status === "Auto-Allotted" ||
                      req.adminRemarks?.includes("OS Scheduler") ||
                      req.adminRemarks?.includes("Auto-Approved");
                    const isApproved = req.status === "Approved";

                    const blockClass = !isApproved
                      ? "block-pending"
                      : isOsDispatched
                      ? "block-os-auto"
                      : "block-approved";

                    return (
                      <div
                        key={req.id}
                        className={`gantt-block ${blockClass}`}
                        style={getSlotStyles(req)}
                        onClick={() => setSelectedBooking(req)}
                        title={`${req.id}: ${req.userName} (${req.time})`}
                      >
                        {isOsDispatched ? "⚡ " : ""}
                        {req.userName.split(" ")[0]} · {req.time}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Details Popover */}
      {selectedBooking && (
        <div
          style={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ color: "#38bdf8", fontSize: "1rem" }}>
                {selectedBooking.id}
              </strong>
              <span
                style={{
                  background:
                    selectedBooking.status === "Approved"
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(245, 158, 11, 0.2)",
                  color: selectedBooking.status === "Approved" ? "#34d399" : "#fbbf24",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.74rem",
                  fontWeight: "700",
                }}
              >
                ● {selectedBooking.status}
              </span>
              {selectedBooking.adminRemarks?.includes("OS Scheduler") && (
                <span
                  style={{
                    background: "rgba(139, 92, 246, 0.2)",
                    color: "#c084fc",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "0.74rem",
                    fontWeight: "700",
                  }}
                >
                  ⚡ OS Dispatched
                </span>
              )}
            </div>

            <p style={{ margin: "6px 0 2px", fontSize: "0.88rem", color: "#f8fafc" }}>
              <strong>{selectedBooking.resource || selectedBooking.resourceName}</strong> ·{" "}
              {selectedBooking.userName} ({selectedBooking.department})
            </p>
            <small style={{ color: "#94a3b8" }}>
              Scheduled: {selectedBooking.date} ({selectedBooking.time}) · Purpose: {selectedBooking.purpose}
            </small>
            {selectedBooking.adminRemarks && (
              <p style={{ margin: "4px 0 0", color: "#6ee7b7", fontSize: "0.8rem" }}>
                Remarks: {selectedBooking.adminRemarks}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedBooking(null)}
            style={{
              background: "#334155",
              color: "#f8fafc",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
