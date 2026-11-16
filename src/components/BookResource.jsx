import { useEffect, useMemo, useState } from "react";
import "./BookResource.css";
import { useCampus } from "../context/CampusContext";

const defaultCategories = [
  "Classroom",
  "Computer Lab",
  "Specialized Lab",
  "Seminar Hall / Auditorium",
];

const priorityOptions = [
  { value: "Group Study / General Activity", priorityClass: "Low", weight: 30, dbPriority: "Normal", label: "Group Study / General Activity (Low Priority - Weight: 30)" },
  { value: "Student Workshop / Hackathon", priorityClass: "Medium", weight: 60, dbPriority: "Normal", label: "Student Workshop / Hackathon (Medium Priority - Weight: 60)" },
  { value: "Academic / Examination", priorityClass: "High", weight: 100, dbPriority: "High", label: "Academic / Examination (High Priority - Weight: 100)" },
  { value: "Faculty / Official Academic Activity", priorityClass: "High", weight: 100, dbPriority: "High", label: "Faculty / Official Academic Activity (High Priority - Weight: 100)" },
];

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BookResource({
  resources = [],
  initialResource = null,
  onSubmitRequest,
}) {
  const { user, checkConflict, requests } = useCampus();

  const [form, setForm] = useState({
    eventTitle: "",
    resourceCategory: "Classroom",
    date: getToday(),
    startTime: "10:00",
    endTime: "11:00",
    participants: "30",
    eventDescription: "",
    preferredBuilding: "All",
    preferredResourceId: "",
    requiredFacility: "All",
    priorityCategory: "Group Study / General Activity",
    department: user?.department || "Computer Science",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submittedBookingId, setSubmittedBookingId] = useState("");

  const categories = useMemo(() => {
    const list = resources.map((r) => r.category).filter(Boolean);
    return [...new Set(list.length > 0 ? list : defaultCategories)];
  }, [resources]);

  useEffect(() => {
    if (initialResource) {
      setForm((prev) => ({
        ...prev,
        resourceCategory: initialResource.category || "Classroom",
        preferredResourceId: String(initialResource.id),
        preferredBuilding: initialResource.block || "All",
      }));
    }
  }, [initialResource]);

  // Candidate resources based on filters
  const candidateResources = useMemo(() => {
    return resources.filter((r) => {
      const matchCat = !form.resourceCategory || r.category === form.resourceCategory;
      const matchBlock = form.preferredBuilding === "All" || r.block === form.preferredBuilding;
      const matchCap = !form.participants || r.capacity >= Number(form.participants);
      return r.available && matchCat && matchBlock && matchCap;
    });
  }, [resources, form.resourceCategory, form.preferredBuilding, form.participants]);

  // Selected or Recommended resource
  const resolvedResource = useMemo(() => {
    if (form.preferredResourceId) {
      const found = resources.find((r) => String(r.id) === String(form.preferredResourceId));
      if (found) return found;
    }
    // Best-Fit auto recommendation: smallest sufficient capacity among candidates
    const sorted = [...candidateResources].sort((a, b) => a.capacity - b.capacity);
    return sorted[0] || null;
  }, [form.preferredResourceId, candidateResources, resources]);

  // Live Availability Check
  const availabilityStatus = useMemo(() => {
    if (!resolvedResource || !form.date || !form.startTime || !form.endTime) {
      return { checked: false, available: false, message: "Select date and times to check slot availability." };
    }

    if (form.endTime <= form.startTime) {
      return { checked: true, available: false, message: "End time must be later than start time." };
    }

    const conflict = checkConflict(resolvedResource.id, form.date, form.startTime, form.endTime);
    if (conflict.hasConflict) {
      return {
        checked: true,
        available: false,
        message: conflict.message,
      };
    }

    return {
      checked: true,
      available: true,
      message: `✓ ${resolvedResource.name} is available for reservation on ${form.date} (${form.startTime} – ${form.endTime}).`,
    };
  }, [resolvedResource, form.date, form.startTime, form.endTime, checkConflict]);

  function updateField(e) {
    const { name, value } = e.target;
    setError("");
    setSuccess("");
    setSubmittedBookingId("");
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resolvedResource) {
      setError("No suitable campus venue found matching your requirements. Try adjusting participant count or building preference.");
      return;
    }

    if (!form.eventTitle.trim()) {
      setError("Please provide an Event Title / Booking Purpose.");
      return;
    }

    if (form.date < getToday()) {
      setError("Please choose today or a future date.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError("End time must be later than start time.");
      return;
    }

    const participantsNum = Number(form.participants) || 1;
    if (participantsNum < 1) {
      setError("Participants count must be at least 1.");
      return;
    }

    const chosenPriority = priorityOptions.find((p) => p.value === form.priorityCategory) || priorityOptions[0];

    const finalPurpose = `${form.eventTitle.trim()} — ${form.eventDescription.trim() || form.priorityCategory}`;

    const bookingPayload = {
      resourceId: resolvedResource.id,
      resourceName: `${resolvedResource.name} (${resolvedResource.block})`,
      resourceType: resolvedResource.category,
      block: resolvedResource.block,
      floor: resolvedResource.floor,
      userName: user ? user.name : "Student User",
      userId: user ? user.id : "STU-2024-089",
      department: form.department || (user ? user.department : "Computer Science"),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      participants: participantsNum,
      purpose: finalPurpose,
      priority: chosenPriority.dbPriority,
    };

    try {
      setSubmitting(true);
      const res = await onSubmitRequest(bookingPayload);
      const reqId = res?.id || "REQ-NEW";
      setSubmittedBookingId(reqId);
      setSuccess(`Your booking request ${reqId} for ${resolvedResource.name} (${resolvedResource.block}) has been successfully submitted!`);
    } catch (err) {
      setError(err?.message || "Could not submit booking request. Please check slot availability.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <div>
          <p className="booking-eyebrow">CAMPUSCONNECT / RESOURCE ALLOCATION</p>
          <h1>Book a Campus Resource</h1>
          <p className="booking-subtitle">
            Submit a booking request with dynamic conflict checking, 10-Minute Admin review, and Best-Fit OS allocation.
          </p>
        </div>
        <div className="booking-header-icon" aria-hidden="true">📅</div>
      </header>

      {success && (
        <div className="booking-alert booking-alert-success" role="status">
          <span>✓</span>
          <div>
            <strong>Booking Request Submitted!</strong>
            <p>{success}</p>
            <small style={{ display: "block", marginTop: "4px", color: "#065f46" }}>
              Request ID: <strong>{submittedBookingId}</strong> · Live 10-minute SLA countdown has started under My Requests.
            </small>
          </div>
        </div>
      )}

      {error && (
        <div className="booking-alert booking-alert-error" role="alert">
          <span>⚠</span>
          <div>
            <strong>Validation Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="booking-layout">
        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          {/* SECTION 1: BOOKING INFORMATION */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">01</span>
              <div>
                <h2>Booking Information</h2>
                <p>Event details, category, duration, and participant requirements.</p>
              </div>
            </div>

            <div className="booking-fields-row">
              <label className="booking-field" style={{ flex: 2 }}>
                <span>Booking Purpose / Event Title <b>*</b></span>
                <input
                  type="text"
                  name="eventTitle"
                  required
                  placeholder="e.g. Operating Systems Lab Evaluation, ACM Hackathon, PPT Review"
                  value={form.eventTitle}
                  onChange={updateField}
                />
              </label>

              <label className="booking-field" style={{ flex: 1 }}>
                <span>Resource Category <b>*</b></span>
                <select
                  name="resourceCategory"
                  value={form.resourceCategory}
                  onChange={updateField}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="booking-fields-row booking-fields-3">
              <label className="booking-field">
                <span>Date <b>*</b></span>
                <input
                  type="date"
                  name="date"
                  min={getToday()}
                  required
                  value={form.date}
                  onChange={updateField}
                />
              </label>

              <label className="booking-field">
                <span>Start Time <b>*</b></span>
                <input
                  type="time"
                  name="startTime"
                  required
                  value={form.startTime}
                  onChange={updateField}
                />
              </label>

              <label className="booking-field">
                <span>End Time <b>*</b></span>
                <input
                  type="time"
                  name="endTime"
                  required
                  value={form.endTime}
                  onChange={updateField}
                />
              </label>
            </div>

            <div className="booking-fields-row">
              <label className="booking-field">
                <span>Number of Participants <b>*</b></span>
                <input
                  type="number"
                  name="participants"
                  min="1"
                  max="300"
                  required
                  value={form.participants}
                  onChange={updateField}
                />
              </label>

              <label className="booking-field">
                <span>Department <b>*</b></span>
                <input
                  type="text"
                  name="department"
                  required
                  value={form.department}
                  onChange={updateField}
                />
              </label>
            </div>

            <div className="booking-field-full">
              <label className="booking-field">
                <span>Event Description / Additional Notes</span>
                <textarea
                  name="eventDescription"
                  rows="2"
                  placeholder="Describe planned academic or extracurricular activities, equipment requirements..."
                  value={form.eventDescription}
                  onChange={updateField}
                />
              </label>
            </div>
          </section>

          {/* SECTION 2: RESOURCE PREFERENCES */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">02</span>
              <div>
                <h2>Resource Preferences</h2>
                <p>Choose a specific room or allow Best-Fit algorithm to recommend the optimal venue.</p>
              </div>
            </div>

            <div className="booking-fields-row">
              <label className="booking-field">
                <span>Preferred Building</span>
                <select
                  name="preferredBuilding"
                  value={form.preferredBuilding}
                  onChange={updateField}
                >
                  <option value="All">Any Available Block (Block C or Block E)</option>
                  <option value="Block C">Block C Only</option>
                  <option value="Block E">Block E Only</option>
                </select>
              </label>

              <label className="booking-field">
                <span>Specific Room Selection (Optional)</span>
                <select
                  name="preferredResourceId"
                  value={form.preferredResourceId}
                  onChange={updateField}
                >
                  <option value="">⚡ Let System Recommend Best-Fit Room</option>
                  {candidateResources.map((res) => (
                    <option key={res.id} value={res.id}>
                      {res.name} — {res.block}, {res.floor} (Capacity: {res.capacity})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {resolvedResource && (
              <div className="booking-resource-preview">
                <div className="booking-resource-symbol">
                  {resolvedResource.category === "Computer Lab" ? "💻" : resolvedResource.category === "Specialized Lab" ? "🔬" : resolvedResource.category === "Seminar Hall / Auditorium" ? "🏛️" : "🏫"}
                </div>
                <div>
                  <strong>{resolvedResource.name} ({resolvedResource.block})</strong>
                  <p>{resolvedResource.category} · {resolvedResource.floor} · Capacity: ~{resolvedResource.capacity} Seats</p>
                  <small style={{ color: "#059669", fontWeight: "600" }}>
                    Best-Fit Match: Wastes only {resolvedResource.capacity - Number(form.participants || 0)} unused seats
                  </small>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 3: PRIORITY POLICY */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">03</span>
              <div>
                <h2>Priority Category</h2>
                <p>Priority determines scheduling order and queue aging in case of peak contention.</p>
              </div>
            </div>

            <div className="booking-field-full">
              <label className="booking-field">
                <span>Activity Priority Category <b>*</b></span>
                <select
                  name="priorityCategory"
                  value={form.priorityCategory}
                  onChange={updateField}
                  required
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "12px 14px", borderRadius: "8px", fontSize: "0.82rem", color: "#92400e" }}>
              ℹ️ <strong>System Priority Verification:</strong> Academic and Examination activities carry highest scheduling weight. Priority is validated by administration and backend scheduling audit rules.
            </div>
          </section>

          {/* SECTION 4: LIVE AVAILABILITY CHECK */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">04</span>
              <div>
                <h2>Live Availability Check</h2>
                <p>Real-time slot collision detection against campus database schedule.</p>
              </div>
            </div>

            <div
              style={{
                padding: "14px 16px",
                borderRadius: "8px",
                border: `1px solid ${availabilityStatus.available ? "#a7f3d0" : "#fca5a5"}`,
                background: availabilityStatus.available ? "#ecfdf5" : "#fef2f2",
                color: availabilityStatus.available ? "#065f46" : "#991b1b",
                fontSize: "0.88rem",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>
                {availabilityStatus.available ? "✓" : "⚠"}
              </span>
              <div>
                <strong>{availabilityStatus.available ? "Slot Available" : "Collision Warning"}</strong>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem" }}>{availabilityStatus.message}</p>
              </div>
            </div>
          </section>

          {/* SECTION 5: REVIEW AND SUBMIT */}
          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">05</span>
              <div>
                <h2>Review and Submit</h2>
                <p>Confirm booking summary before sending request to the system queue.</p>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.86rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div><span style={{ color: "#64748b" }}>Event Title:</span> <strong>{form.eventTitle || "—"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Assigned Venue:</span> <strong>{resolvedResource ? `${resolvedResource.name} (${resolvedResource.block})` : "—"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Date:</span> {form.date}</div>
              <div><span style={{ color: "#64748b" }}>Time:</span> {form.startTime} – {form.endTime}</div>
              <div><span style={{ color: "#64748b" }}>Participants:</span> {form.participants} Students</div>
              <div><span style={{ color: "#64748b" }}>Priority Class:</span> <strong>{form.priorityCategory.split(" ")[0]}</strong></div>
            </div>

            <div className="booking-actions" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="booking-reset-button"
                onClick={() => {
                  setForm({
                    eventTitle: "",
                    resourceCategory: "Classroom",
                    date: getToday(),
                    startTime: "10:00",
                    endTime: "11:00",
                    participants: "30",
                    eventDescription: "",
                    preferredBuilding: "All",
                    preferredResourceId: "",
                    requiredFacility: "All",
                    priorityCategory: "Group Study / General Activity",
                    department: user?.department || "Computer Science",
                  });
                  setError("");
                  setSuccess("");
                }}
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="booking-submit-button"
                disabled={submitting || !availabilityStatus.available}
              >
                {submitting ? "Submitting..." : "Submit Booking Request →"}
              </button>
            </div>
          </section>
        </form>

        <aside className="booking-side-card">
          <div className="booking-side-icon">🏛️</div>
          <h2>Booking Policy</h2>
          <ul>
            <li>Every submission begins with a <strong>10-Minute Admin Review Window</strong>.</li>
            <li>Admins can approve or decline requests manually during this SLA window.</li>
            <li>If review window expires, the <strong>Autonomous OS Scheduler</strong> dispatches the request using SJF, Priority &amp; Best-Fit algorithms.</li>
            <li>Zero overlap collisions are permitted.</li>
          </ul>

          <div className="booking-side-divider" />

          <h3>Selected Allocation</h3>
          {resolvedResource ? (
            <div className="booking-selected-summary">
              <strong>{resolvedResource.name}</strong>
              <p>{resolvedResource.category}</p>
              <p>{resolvedResource.block}, {resolvedResource.floor}</p>
              <p style={{ color: "#38bdf8", fontWeight: "600", marginTop: "4px" }}>
                Capacity: ~{resolvedResource.capacity} Seats
              </p>
            </div>
          ) : (
            <p className="booking-empty-summary">
              No suitable room selected yet.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
