import { useMemo, useState } from "react";
import "./TimetableAvailability.css";
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

const statusOptions = ["All", "Available", "Manual Approved", "OS Auto-Allotted", "Academic Timetable", "Unavailable"];

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

function TimetableAvailability() {
  const { user, resources, requests } = useCampus();

  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const blocks = ["All", "Block C", "Block E"];
  const categories = [
    "All",
    "Classroom",
    "Computer Lab",
    "Specialized Lab",
    "Seminar Hall / Auditorium",
  ];

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

  // Real schedule calculated from MySQL bookings and academic timetable rules
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
              status: "Unavailable",
              type: "unavailable",
              details: "Resource marked under maintenance.",
            };
          }

          // Check for Approved bookings in database for this room and date
          const clashingBooking = requests.find((req) => {
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

          if (clashingBooking) {
            const isOs = (clashingBooking.adminRemarks || "").includes("Auto-Allotted via OS Scheduler") || clashingBooking.allocatedBy === "AUTONOMOUS_OS_DISPATCH";
            const isOwner = user && (String(user.id) === String(clashingBooking.userId) || user.role === "Admin");

            return {
              day,
              date: slotDate,
              time,
              status: isOs ? "OS Auto-Allotted" : "Manual Approved",
              type: isOs ? "os" : "manual",
              booking: clashingBooking,
              details: isOwner
                ? `Booking ID: ${clashingBooking.id} · Purpose: ${clashingBooking.purpose} (by ${clashingBooking.userName} - ${clashingBooking.department})`
                : `Reserved: Scheduled Academic Activity (${clashingBooking.time})`,
            };
          }

          return {
            day,
            date: slotDate,
            time,
            status: "Available",
            type: "available",
            details: "Open for scheduling and reservation.",
          };
        }),
      };
    });
  }, [selectedResource, requests, dates, user]);

  const visibleSchedule = schedule.map((row) => ({
    ...row,
    slots: row.slots.map((slot) =>
      statusFilter === "All" || slot.status === statusFilter ? slot : null
    ),
  }));

  const allStatuses = schedule.flatMap((row) => row.slots);
  const counts = {
    Available: allStatuses.filter((s) => s.type === "available").length,
    "Manual Approved": allStatuses.filter((s) => s.type === "manual").length,
    "OS Auto-Allotted": allStatuses.filter((s) => s.type === "os").length,
    Unavailable: allStatuses.filter((s) => s.type === "unavailable").length,
  };

  function changeWeek(offset) {
    setWeekOffset((current) => current + offset);
    setSelectedSlot(null);
  }

  return (
    <div className="timetable-page">
      <section className="ta-page-header">
        <div>
          <p className="ta-eyebrow">STUDENT PORTAL</p>
          <h1>Timetable &amp; Availability</h1>
          <p className="ta-subtitle">
            Inspect venue schedules across Block C and Block E synchronized with MySQL database and OS Conflict Resolution Engine.
          </p>
        </div>

        <div className="ta-header-icon" aria-hidden="true">
          ▦
        </div>
      </section>

      {/* Summary KPI Cards */}
      <section className="ta-summary-grid">
        <article className="ta-summary-card">
          <div className="ta-summary-icon ta-summary-blue">✓</div>
          <div>
            <p>Available Slots</p>
            <h2>{counts.Available}</h2>
            <span>Free for reservation</span>
          </div>
        </article>

        <article className="ta-summary-card">
          <div className="ta-summary-icon ta-summary-manual">▣</div>
          <div>
            <p>Manual Approved</p>
            <h2>{counts["Manual Approved"]}</h2>
            <span>Admin confirmed locks</span>
          </div>
        </article>

        <article className="ta-summary-card">
          <div className="ta-summary-icon ta-summary-os">⚡</div>
          <div>
            <p>OS Auto-Allotted</p>
            <h2>{counts["OS Auto-Allotted"]}</h2>
            <span>Dispatched via SJF &amp; Aging</span>
          </div>
        </article>
      </section>

      <section className="ta-calendar-section">
        <div className="ta-section-heading">
          <div>
            <h2>Weekly Venue Timetable</h2>
            <p>Inspect room occupancy, academic lecture blocks, and availability.</p>
          </div>

          <button
            type="button"
            className="ta-today-button"
            onClick={() => changeWeek(-weekOffset)}
          >
            Today / This Week
          </button>
        </div>

        {/* Filters */}
        <div className="ta-filters">
          <label className="ta-field">
            <span>Filter Block</span>
            <select
              value={selectedBlock}
              onChange={(e) => {
                setSelectedBlock(e.target.value);
                setSelectedSlot(null);
              }}
            >
              {blocks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>

          <label className="ta-field">
            <span>Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSlot(null);
              }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="ta-field ta-resource-field">
            <span>Select Campus Room ({filteredResources.length} available)</span>
            <select
              value={selectedResource?.id ?? ""}
              onChange={(e) => {
                setSelectedResourceId(e.target.value);
                setSelectedSlot(null);
              }}
            >
              {filteredResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} ({resource.block}, {resource.floor} · Cap: {resource.capacity})
                </option>
              ))}
            </select>
          </label>

          <label className="ta-field">
            <span>Show Slots</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedSlot(null);
              }}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        {selectedResource && (
          <div className="ta-resource-info">
            <div className="ta-resource-symbol">
              {selectedResource.category === "Computer Lab" ? "💻" : selectedResource.category === "Specialized Lab" ? "🔬" : selectedResource.category === "Seminar Hall / Auditorium" ? "🏛️" : "🏫"}
            </div>
            <div className="ta-resource-text">
              <strong>{selectedResource.name}</strong>
              <span>
                {selectedResource.category} <span aria-hidden="true">·</span>{" "}
                {selectedResource.block}, {selectedResource.floor} (Capacity: ~{selectedResource.capacity} Seats)
              </span>
            </div>
            <span className="ta-resource-tag">{selectedResource.category}</span>
          </div>
        )}

        {/* Week navigation */}
        <div className="ta-week-navigation">
          <button
            type="button"
            className="ta-week-arrow"
            aria-label="Previous week"
            onClick={() => changeWeek(-1)}
          >
            ←
          </button>

          <strong>
            {formatDate(dates[0])} – {formatDate(dates[5])}
          </strong>

          <button
            type="button"
            className="ta-week-arrow"
            aria-label="Next week"
            onClick={() => changeWeek(1)}
          >
            →
          </button>
        </div>

        {/* Legend */}
        <div className="ta-legend" style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", margin: "14px 0" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#ecfdf5", border: "1px solid #a7f3d0" }} />
            <strong style={{ color: "#047857" }}>Green:</strong> Available
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#eff6ff", border: "1px solid #bfdbfe" }} />
            <strong style={{ color: "#1d4ed8" }}>Blue:</strong> Manually Approved
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#f5f3ff", border: "1px solid #ddd6fe" }} />
            <strong style={{ color: "#6d28d9" }}>Purple:</strong> OS Auto-Allotted
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#f1f5f9", border: "1px solid #cbd5e1" }} />
            <strong style={{ color: "#475569" }}>Grey:</strong> Academic Block
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#fef2f2", border: "1px solid #fca5a5" }} />
            <strong style={{ color: "#b91c1c" }}>Red:</strong> Conflict
          </span>
        </div>

        {/* Timetable Matrix */}
        <div className="ta-calendar-wrap">
          <table className="ta-calendar">
            <thead>
              <tr>
                <th className="ta-time-heading">TIME</th>
                {weekdays.map((day, index) => (
                  <th key={day}>
                    <span className="ta-day-name">{day.slice(0, 3)}</span>
                    <span className="ta-day-date">{formatDate(dates[index])}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleSchedule.map((row) => (
                <tr key={row.time}>
                  <th className="ta-time-cell">{row.time}</th>
                  {row.slots.map((slot, index) => (
                    <td key={`${row.time}-${weekdays[index]}`}>
                      {slot ? (
                        <button
                          type="button"
                          className={`ta-slot ta-slot-${slot.type} ${
                            selectedSlot?.day === slot.day &&
                            selectedSlot?.time === slot.time
                              ? "ta-slot-selected"
                              : ""
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                          aria-label={`${slot.day}, ${slot.time}: ${slot.status}`}
                        >
                          {slot.status}
                        </button>
                      ) : (
                        <div className="ta-slot-hidden">—</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selected Slot Popover */}
        {selectedSlot && (
          <div className="ta-selected-slot">
            <div>
              <span className="ta-selected-label">SELECTED TIME SLOT</span>
              <h3>{selectedSlot.day}, {formatDate(selectedSlot.date)}</h3>
              <p>
                {selectedSlot.time} · {selectedResource?.name} ({selectedResource?.block})
              </p>
              <small style={{ color: selectedSlot.type === "available" ? "#047857" : selectedSlot.type === "os" ? "#6d28d9" : "#1d4ed8", fontWeight: "600", display: "block", marginTop: "4px" }}>
                {selectedSlot.details}
              </small>
            </div>
            <span
              className={`ta-status-pill ta-pill-${selectedSlot.type}`}
            >
              {selectedSlot.status}
            </span>
          </div>
        )}

        <p className="ta-demo-note">
          Live campus availability · Privacy protected: Other students' bookings are shown as reserved without exposing personal student information.
        </p>
      </section>

      <footer className="ta-footer">
        <span>CampusConnect · Resource Allocation System</span>
        <span>Student Portal</span>
      </footer>
    </div>
  );
}

export default TimetableAvailability;
