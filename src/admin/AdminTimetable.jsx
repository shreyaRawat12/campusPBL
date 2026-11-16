import React, { useState, useMemo } from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeSlots = [
  "08:30 AM",
  "09:30 AM",
  "10:30 AM",
  "11:30 AM",
  "12:30 PM",
  "01:30 PM",
  "02:30 PM",
  "03:30 PM",
  "04:30 PM",
];

function getWeekStart(offset) {
  const today = new Date();
  const day = today.getDay();
  const daysSinceMonday = (day + 6) % 7;

  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysSinceMonday + offset * 7
  );

  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeSlotToMinutes(slot) {
  const [hStr, rest] = slot.split(":");
  const m = parseInt(rest.slice(0, 2), 10);
  let h = parseInt(hStr, 10);
  if (rest.includes("PM") && h < 12) h += 12;
  if (rest.includes("AM") && h === 12) h = 0;
  return h * 60 + m;
}

export default function AdminTimetable() {
  const { resources, requests } = useCampus();

  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchBlock = selectedBlock === "All" || r.block === selectedBlock;
      const matchCat = selectedCategory === "All" || r.category === selectedCategory;
      return matchBlock && matchCat;
    });
  }, [resources, selectedBlock, selectedCategory]);

  const selectedResource = useMemo(() => {
    if (selectedResourceId) {
      const found = filteredResources.find((r) => String(r.id) === String(selectedResourceId));
      if (found) return found;
    }
    return filteredResources[0] || resources[0] || null;
  }, [filteredResources, selectedResourceId, resources]);

  const weekStart = getWeekStart(weekOffset);

  const dates = useMemo(() => {
    return weekdays.map((_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
  }, [weekStart]);

  const schedule = useMemo(() => {
    if (!selectedResource) return [];

    return timeSlots.map((time) => {
      const slotStartMin = timeSlotToMinutes(time);
      const slotEndMin = slotStartMin + 60;

      return {
        time,
        slots: weekdays.map((day, dayIndex) => {
          const slotDate = dates[dayIndex];
          const isoDate = formatIsoDate(slotDate);

          if (!selectedResource.available) {
            return {
              day,
              date: slotDate,
              time,
              status: "Maintenance",
              type: "maintenance",
              details: "Venue marked under maintenance.",
            };
          }

          // Check for Approved bookings in database
          const clashingBookings = requests.filter((req) => {
            if (String(req.resourceId) !== String(selectedResource.id)) return false;
            if (req.date !== isoDate) return false;
            if (req.status !== "Approved") return false;

            const parseMinutes = (t) => {
              if (!t) return 0;
              const [h, m] = t.split(":");
              return parseInt(h, 10) * 60 + parseInt(m || 0, 10);
            };

            const reqStartMin = parseMinutes(req.startTime);
            const reqEndMin = parseMinutes(req.endTime);

            return slotStartMin < reqEndMin && slotEndMin > reqStartMin;
          });

          if (clashingBookings.length > 1) {
            return {
              day,
              date: slotDate,
              time,
              status: "Overlap Conflict",
              type: "conflict",
              details: `Conflict between ${clashingBookings.map((b) => b.id).join(" and ")}!`,
            };
          } else if (clashingBookings.length === 1) {
            const b = clashingBookings[0];
            const isOs = (b.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");
            return {
              day,
              date: slotDate,
              time,
              status: isOs ? "⚡ OS Allotted" : "✓ Manual Approved",
              type: isOs ? "os" : "manual",
              booking: b,
              details: `${b.id}: ${b.purpose} by ${b.userName} (${b.department})`,
            };
          }

          return {
            day,
            date: slotDate,
            time,
            status: "Available",
            type: "available",
            details: "Slot is idle and free for allocation.",
          };
        }),
      };
    });
  }, [selectedResource, requests, dates]);

  return (
    <div className="br-container">
      <div className="br-header">
        <div>
          <p className="br-eyebrow">ADMINISTRATIVE SCHEDULING</p>
          <h1>Scheduling &amp; Timetable Matrix</h1>
          <p>Examine resource timetables, inspect manual locks vs OS allocations, and verify academic slots.</p>
        </div>

        <button
          type="button"
          className="admin-btn-secondary"
          onClick={() => setWeekOffset(0)}
        >
          Today / This Week
        </button>
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <select
          className="rm-select"
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
        >
          <option value="All">All Blocks</option>
          <option value="Block C">Block C</option>
          <option value="Block E">Block E</option>
        </select>

        <select
          className="rm-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Classroom">Classroom</option>
          <option value="Computer Lab">Computer Lab</option>
          <option value="Specialized Lab">Specialized Lab</option>
          <option value="Seminar Hall / Auditorium">Seminar Hall / Auditorium</option>
        </select>

        <select
          className="rm-select"
          style={{ minWidth: "260px" }}
          value={selectedResource?.id || ""}
          onChange={(e) => setSelectedResourceId(e.target.value)}
        >
          {filteredResources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.block}, {r.floor} (Cap: {r.capacity})
            </option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => setWeekOffset((prev) => prev - 1)}
          >
            ← Prev Week
          </button>
          <strong style={{ color: "#38bdf8", fontSize: "0.9rem" }}>
            {formatDate(dates[0])} – {formatDate(dates[5])}
          </strong>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => setWeekOffset((prev) => prev + 1)}
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding: "10px 16px", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", marginBottom: "16px", fontSize: "0.82rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", background: "#059669", borderRadius: "2px" }} />
          Available
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", background: "#2563eb", borderRadius: "2px" }} />
          Manual Admin Approved
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", background: "#7c3aed", borderRadius: "2px" }} />
          ⚡ OS Auto-Allotted
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "12px", height: "12px", background: "#ef4444", borderRadius: "2px" }} />
          Overlap Conflict
        </span>
      </div>

      {/* Timetable Matrix */}
      <div className="br-card">
        <div className="admin-table-wrap">
          <table className="admin-table" style={{ textAlign: "center" }}>
            <thead>
              <tr>
                <th style={{ width: "110px", textAlign: "left" }}>TIME</th>
                {weekdays.map((day, idx) => (
                  <th key={day}>
                    <div>{day}</div>
                    <small style={{ color: "#64748b" }}>{formatDate(dates[idx])}</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.time}>
                  <td style={{ textAlign: "left", fontWeight: "700", color: "#38bdf8", fontSize: "0.82rem" }}>
                    {row.time}
                  </td>
                  {row.slots.map((slot, idx) => {
                    const bg = slot.type === "available"
                      ? "rgba(16, 185, 129, 0.12)"
                      : slot.type === "manual"
                      ? "rgba(37, 99, 235, 0.2)"
                      : slot.type === "os"
                      ? "rgba(124, 58, 237, 0.25)"
                      : slot.type === "conflict"
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(100, 116, 139, 0.2)";

                    const color = slot.type === "available"
                      ? "#34d399"
                      : slot.type === "manual"
                      ? "#60a5fa"
                      : slot.type === "os"
                      ? "#c084fc"
                      : slot.type === "conflict"
                      ? "#f87171"
                      : "#94a3b8";

                    return (
                      <td key={`${row.time}-${idx}`} style={{ padding: "4px" }}>
                        <div
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            background: bg,
                            color: color,
                            border: `1px solid ${color}40`,
                            borderRadius: "6px",
                            padding: "6px 4px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          {slot.status}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Slot Popover */}
      {selectedSlot && (
        <div style={{ marginTop: "16px", background: "#1e293b", border: "1px solid #334155", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ color: "#38bdf8" }}>{selectedSlot.day}, {formatDate(selectedSlot.date)} · {selectedSlot.time}</strong>
            <p style={{ margin: "4px 0 0", color: "#e2e8f0", fontSize: "0.85rem" }}>
              {selectedSlot.details}
            </p>
          </div>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => setSelectedSlot(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
