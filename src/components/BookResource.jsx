
import { useEffect, useMemo, useState } from "react";
import "./BookResource.css";

const defaultCategories = [
  "Classroom",
  "Lab",
  "Laboratory",
  "Seminar Hall",
  "Auditorium",
  "Equipment",
  "Sports Facility",
  "Other",
];

const emptyForm = {
  resourceType: "",
  resourceId: "",
  date: "",
  startTime: "",
  endTime: "",
  participants: "1",
  department: "",
  purpose: "",
  priority: "Normal",
  additionalNotes: "",
};

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
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = useMemo(
    () =>
      [...new Set([
        ...defaultCategories,
        ...resources.map((resource) => resource.category).filter(Boolean),
      ])],
    [resources]
  );

  const availableResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          resource.available !== false &&
          (!form.resourceType || resource.category === form.resourceType)
      ),
    [resources, form.resourceType]
  );

  const selectedResource = useMemo(
    () =>
      resources.find(
        (resource) => String(resource.id) === String(form.resourceId)
      ) || null,
    [resources, form.resourceId]
  );

  useEffect(() => {
    if (initialResource) {
      setForm((previous) => ({
        ...previous,
        resourceType: initialResource.category || "",
        resourceId: String(initialResource.id),
      }));
    }
  }, [initialResource]);

  function updateField(event) {
    const { name, value } = event.target;
    setError("");
    setSuccess("");

    setForm((previous) => {
      if (name === "resourceType") {
        return { ...previous, resourceType: value, resourceId: "" };
      }
      return { ...previous, [name]: value };
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedResource) {
      setError("Please select an available resource.");
      return;
    }

    if (form.date < getToday()) {
      setError("Please select today or a future date.");
      return;
    }

    if (form.endTime <= form.startTime) {
      setError("End time must be later than start time.");
      return;
    }

    if (Number(form.participants) < 1) {
      setError("Participants must be at least 1.");
      return;
    }

    const request = {
      ...form,
      resourceId: selectedResource.id,
      resourceName: selectedResource.name,
      resourceType: selectedResource.category,
      participants: Number(form.participants),
      status: "Pending",
      submittedAt: new Date().toISOString(),
    };

    try {
      setSubmitting(true);

      if (onSubmitRequest) {
        await onSubmitRequest(request);
      }

      setSuccess(
        `Booking request submitted for ${selectedResource.name}.`
      );
      setForm(emptyForm);
    } catch (err) {
      setError(err?.message || "Could not submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="booking-page">
      <header className="booking-header">
        <div>
          <p className="booking-eyebrow">CAMPUSCONNECT / RESOURCES</p>
          <h1>Book a Resource</h1>
          <p className="booking-subtitle">
            Request a classroom, lab, or campus facility for your activity.
          </p>
        </div>
        <div className="booking-header-icon" aria-hidden="true">📅</div>
      </header>

      {success && (
        <div className="booking-alert booking-alert-success" role="status">
          <span>✓</span>
          <div>
            <strong>Request submitted</strong>
            <p>{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="booking-alert booking-alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="booking-layout">
        <form className="booking-form-card" onSubmit={handleSubmit}>
          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">01</span>
              <div>
                <h2>Resource details</h2>
                <p>Choose what you want to book.</p>
              </div>
            </div>

            <div className="booking-fields">
              <label className="booking-field">
                <span>Resource category <b>*</b></span>
                <select
                  name="resourceType"
                  value={form.resourceType}
                  onChange={updateField}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="booking-field">
                <span>Available resource <b>*</b></span>
                <select
                  name="resourceId"
                  value={form.resourceId}
                  onChange={updateField}
                  required
                  disabled={!form.resourceType || availableResources.length === 0}
                >
                  <option value="">
                    {!form.resourceType
                      ? "Select category first"
                      : availableResources.length === 0
                        ? "No resources available in this category"
                        : "Select a resource"}
                  </option>
                  {availableResources.map((resource) => (
                    <option key={resource.id} value={String(resource.id)}>
                      {resource.name}
                      {resource.location ? ` — ${resource.location}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedResource && (
              <div className="booking-resource-preview">
                <div className="booking-resource-symbol">🏫</div>
                <div>
                  <strong>{selectedResource.name}</strong>
                  <p>
                    {selectedResource.category}
                    {selectedResource.location
                      ? ` · ${selectedResource.location}`
                      : ""}
                  </p>
                </div>
                {selectedResource.capacity != null && (
                  <span className="booking-capacity">
                    Capacity: {selectedResource.capacity}
                  </span>
                )}
              </div>
            )}

            {resources.length === 0 && (
              <p className="booking-inline-note">
                No resources were passed to this page. Add resources in Browse
                Resources first.
              </p>
            )}
          </section>

          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">02</span>
              <div>
                <h2>Date and time</h2>
                <p>When do you need the resource?</p>
              </div>
            </div>

            <div className="booking-fields">
              <label className="booking-field">
                <span>Booking date <b>*</b></span>
                <input
                  type="date"
                  name="date"
                  min={getToday()}
                  value={form.date}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="booking-field">
                <span>Participants <b>*</b></span>
                <input
                  type="number"
                  name="participants"
                  min="1"
                  max={selectedResource?.capacity || undefined}
                  value={form.participants}
                  onChange={updateField}
                  required
                />
                {selectedResource?.capacity != null && (
                  <small>Maximum capacity: {selectedResource.capacity}</small>
                )}
              </label>

              <label className="booking-field">
                <span>Start time <b>*</b></span>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="booking-field">
                <span>End time <b>*</b></span>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={updateField}
                  required
                />
              </label>
            </div>
          </section>

          <section className="booking-section">
            <div className="booking-section-heading">
              <span className="booking-step">03</span>
              <div>
                <h2>Request information</h2>
                <p>Tell us about your activity.</p>
              </div>
            </div>

            <div className="booking-fields">
              <label className="booking-field">
                <span>Department <b>*</b></span>
                <input
                  type="text"
                  name="department"
                  placeholder="e.g. Computer Science"
                  value={form.department}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="booking-field">
                <span>Priority</span>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={updateField}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>

              <label className="booking-field booking-field-full">
                <span>Purpose of booking <b>*</b></span>
                <textarea
                  name="purpose"
                  rows="3"
                  placeholder="Describe your class, meeting, event, or activity..."
                  value={form.purpose}
                  onChange={updateField}
                  required
                />
              </label>

              <label className="booking-field booking-field-full">
                <span>Additional notes</span>
                <textarea
                  name="additionalNotes"
                  rows="2"
                  placeholder="Any equipment or special arrangements needed?"
                  value={form.additionalNotes}
                  onChange={updateField}
                />
              </label>
            </div>
          </section>

          <div className="booking-actions">
            <button
              type="button"
              className="booking-reset-button"
              onClick={resetForm}
              disabled={submitting}
            >
              Reset form
            </button>
            <button
              type="submit"
              className="booking-submit-button"
              disabled={submitting || resources.length === 0}
            >
              {submitting ? "Submitting..." : "Submit booking request →"}
            </button>
          </div>
        </form>

        <aside className="booking-side-card">
          <div className="booking-side-icon">✨</div>
          <h2>Before you submit</h2>
          <ul>
            <li>Choose an available resource.</li>
            <li>Make sure the end time is later than the start time.</li>
            <li>Enter the correct participant count and department.</li>
            <li>Your request may need approval before it is confirmed.</li>
          </ul>

          <div className="booking-side-divider" />

          <h3>Selected resource</h3>
          {selectedResource ? (
            <div className="booking-selected-summary">
              <strong>{selectedResource.name}</strong>
              <p>{selectedResource.category}</p>
              {selectedResource.location && <p>{selectedResource.location}</p>}
            </div>
          ) : (
            <p className="booking-empty-summary">
              Select a category and resource to see its details here.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
