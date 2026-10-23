
import { useMemo, useState } from "react";
import "./TimetableAvailability.css";

const demoScheduleResources = [
  { id: "classroom-1", name: "Classroom 101", type: "Classroom", location: "Academic Block" },
  { id: "classroom-2", name: "Seminar Hall A", type: "Classroom", location: "Main Block" },
  { id: "lab-1", name: "Computer Lab 2", type: "Lab", location: "Technology Block" },
  { id: "lab-2", name: "Science Lab", type: "Lab", location: "Science Block" },
  { id: "equipment-1", name: "Projector P-01", type: "Equipment", location: "Central Store" },
  { id: "equipment-2", name: "Portable Speaker", type: "Equipment", location: "Central Store" },
];

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const timeSlots = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
];

const statusOptions = ["Available", "Booked", "Unavailable"];

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

function getSlotStatus(resourceIndex, dayIndex, timeIndex) {
  // Deterministic demo schedule; replace with backend data later.
  const value = (resourceIndex * 7 + dayIndex * 3 + timeIndex * 5) % 11;

  if (value === 0 || value === 6) return "Unavailable";
  if (value === 2 || value === 4 || value === 8) return "Booked";
  return "Available";
}

function TimetableAvailability() {
  const [resourceType, setResourceType] = useState("All");
  const [selectedResourceId, setSelectedResourceId] = useState("classroom-1");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const resourceTypes = ["All", "Classroom", "Lab", "Equipment"];

  const filteredResources = useMemo(
    () =>
      resourceType === "All"
        ? demoScheduleResources
        : demoScheduleResources.filter(
            (resource) => resource.type === resourceType
          ),
    [resourceType]
  );

  const selectedResource =
    filteredResources.find((resource) => resource.id === selectedResourceId) ||
    filteredResources[0];

  const activeResourceIndex = Math.max(
    0,
    demoScheduleResources.findIndex(
      (resource) => resource.id === selectedResource?.id
    )
  );

  const weekStart = getWeekStart(weekOffset);

  const dates = weekdays.map((_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const schedule = useMemo(() => {
    if (!selectedResource) return [];

    return timeSlots.map((time, timeIndex) => ({
      time,
      slots: weekdays.map((day, dayIndex) => ({
        day,
        date: dates[dayIndex],
        time,
        status: getSlotStatus(activeResourceIndex, dayIndex, timeIndex),
      })),
    }));
  }, [selectedResource, activeResourceIndex, weekOffset]);

  const visibleSchedule = schedule.map((row) => ({
    ...row,
    slots: row.slots.map((slot) =>
      statusFilter === "All" || slot.status === statusFilter ? slot : null
    ),
  }));

  const allStatuses = schedule.flatMap((row) => row.slots);
  const counts = {
    Available: allStatuses.filter((slot) => slot.status === "Available").length,
    Booked: allStatuses.filter((slot) => slot.status === "Booked").length,
    Unavailable: allStatuses.filter((slot) => slot.status === "Unavailable").length,
  };

  function changeResourceType(nextType) {
    setResourceType(nextType);

    const nextResources =
      nextType === "All"
        ? demoScheduleResources
        : demoScheduleResources.filter((resource) => resource.type === nextType);

    if (!nextResources.some((resource) => resource.id === selectedResourceId)) {
      setSelectedResourceId(nextResources[0]?.id ?? "");
    }

    setSelectedSlot(null);
  }

  function changeResource(nextId) {
    setSelectedResourceId(nextId);
    setSelectedSlot(null);
  }

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
            Check campus resource schedules and find an available time slot.
          </p>
        </div>

        <div className="ta-header-icon" aria-hidden="true">
          ▦
        </div>
      </section>

      <section className="ta-summary-grid">
        <article className="ta-summary-card">
          <div className="ta-summary-icon ta-summary-blue">✓</div>
          <div>
            <p>Available Slots</p>
            <h2>{counts.Available}</h2>
            <span>This resource · This week</span>
          </div>
        </article>

        <article className="ta-summary-card">
          <div className="ta-summary-icon ta-summary-orange">▣</div>
          <div>
            <p>Booked Slots</p>
            <h2>{counts.Booked}</h2>
            <span>Already reserved</span>
          </div>
        </article>

        <article className="ta-summary-card">
          <div className="ta-summary-icon ta-summary-gray">×</div>
          <div>
            <p>Unavailable Slots</p>
            <h2>{counts.Unavailable}</h2>
            <span>Not open for booking</span>
          </div>
        </article>
      </section>

      <section className="ta-calendar-section">
        <div className="ta-section-heading">
          <div>
            <h2>Weekly Schedule</h2>
            <p>Select a resource and explore its weekly availability.</p>
          </div>

          <button
            type="button"
            className="ta-today-button"
            onClick={() => changeWeek(-weekOffset)}
          >
            This week
          </button>
        </div>

        <div className="ta-filters">
          <label className="ta-field">
            <span>Resource type</span>
            <select
              value={resourceType}
              onChange={(event) => changeResourceType(event.target.value)}
            >
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All resource types" : type}
                </option>
              ))}
            </select>
          </label>

          <label className="ta-field ta-resource-field">
            <span>Select resource</span>
            <select
              value={selectedResource?.id ?? ""}
              onChange={(event) => changeResource(event.target.value)}
            >
              {filteredResources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </label>

          <label className="ta-field">
            <span>Show slots</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setSelectedSlot(null);
              }}
            >
              <option value="All">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedResource && (
          <div className="ta-resource-info">
            <div className="ta-resource-symbol">▣</div>
            <div className="ta-resource-text">
              <strong>{selectedResource.name}</strong>
              <span>
                {selectedResource.type} <span aria-hidden="true">·</span>{" "}
                {selectedResource.location}
              </span>
            </div>
            <span className="ta-resource-tag">{selectedResource.type}</span>
          </div>
        )}

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

        <div className="ta-legend">
          <span><i className="ta-legend-dot ta-dot-available" /> Available</span>
          <span><i className="ta-legend-dot ta-dot-booked" /> Booked</span>
          <span><i className="ta-legend-dot ta-dot-unavailable" /> Unavailable</span>
        </div>

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
                          className={`ta-slot ta-slot-${slot.status.toLowerCase()} ${
                            selectedSlot?.day === slot.day &&
                            selectedSlot?.time === slot.time
                              ? "ta-slot-selected"
                              : ""
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                          aria-label={`${slot.day}, ${slot.time}: ${slot.status}`}
                          aria-pressed={
                            selectedSlot?.day === slot.day &&
                            selectedSlot?.time === slot.time
                          }
                        >
                          {slot.status === "Available"
                            ? "Available"
                            : slot.status === "Booked"
                              ? "Booked"
                              : "Unavailable"}
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

        {selectedSlot && (
          <div className="ta-selected-slot">
            <div>
              <span className="ta-selected-label">SELECTED TIME SLOT</span>
              <h3>{selectedSlot.day}, {formatDate(selectedSlot.date)}</h3>
              <p>
                {selectedSlot.time} · {selectedResource?.name}
              </p>
            </div>
            <span
              className={`ta-status-pill ta-pill-${selectedSlot.status.toLowerCase()}`}
            >
              {selectedSlot.status}
            </span>
          </div>
        )}

        <p className="ta-demo-note">
          Demo schedule only · Slot statuses are sample data and are not live
          campus availability.
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
