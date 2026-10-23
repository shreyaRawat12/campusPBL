
import { useState } from "react";
import "./BookResource.css";

function BookResource() {
  const initialForm = {
    resourceType: "",
    resourceName: "",
    date: "",
    startTime: "",
    endTime: "",
    participants: "",
    purpose: "",
    priority: "Normal",
  };

  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSubmitted(false);
  };

  const handleReset = () => {
    setForm(initialForm);
    setSubmitted(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form.endTime <= form.startTime) {
      alert("End time must be later than start time.");
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div>
          <p className="booking-eyebrow">RESOURCE MANAGEMENT</p>
          <h1>Book a Resource</h1>
          <p>
            Submit a request to reserve campus facilities and equipment.
          </p>
        </div>

        <div className="booking-heading-icon">▣</div>
      </div>

      {submitted && (
        <div className="booking-success" role="status">
          <span className="success-icon">✓</span>
          <div>
            <strong>Form validated successfully!</strong>
            <p>
              This is a frontend demo. Your request has not been saved
              to the database yet.
            </p>
          </div>
        </div>
      )}

      <div className="booking-layout">
        <section className="booking-form-card">
          <div className="booking-card-heading">
            <div className="section-icon">▤</div>
            <div>
              <h2>Booking Details</h2>
              <p>Enter the details for your resource request.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="booking-form-grid">
              <div className="booking-field">
                <label htmlFor="resourceType">
                  Resource Category *
                </label>
                <select
                  id="resourceType"
                  name="resourceType"
                  value={form.resourceType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Classroom">Classroom</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Auditorium">Auditorium</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Sports Facility">Sports Facility</option>
                </select>
              </div>

              <div className="booking-field">
                <label htmlFor="resourceName">Resource Name *</label>
                <input
                  id="resourceName"
                  name="resourceName"
                  type="text"
                  value={form.resourceName}
                  onChange={handleChange}
                  placeholder="e.g. Computer Lab 2"
                  required
                />
                <small>
                  Resource inventory integration will be added later.
                </small>
              </div>

              <div className="booking-field">
                <label htmlFor="date">Booking Date *</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  min={new Date().toLocaleDateString("en-CA")}
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="booking-field">
                <label htmlFor="participants">
                  Number of Participants *
                </label>
                <input
                  id="participants"
                  name="participants"
                  type="number"
                  min="1"
                  step="1"
                  value={form.participants}
                  onChange={handleChange}
                  placeholder="Enter participant count"
                  required
                />
              </div>

              <div className="booking-field">
                <label htmlFor="startTime">Start Time *</label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="booking-field">
                <label htmlFor="endTime">End Time *</label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="booking-field full-width">
                <label htmlFor="purpose">Purpose of Booking *</label>
                <textarea
                  id="purpose"
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  placeholder="Describe your academic activity, event, or project..."
                  rows={4}
                  required
                />
              </div>

              <div className="booking-field full-width">
                <label htmlFor="priority">Request Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                </select>
                <small>
                  Queue position will be determined by the scheduling rules.
                </small>
              </div>
            </div>

            <div className="booking-form-footer">
              <p>* Required fields</p>

              <button
                type="button"
                className="booking-reset"
                onClick={handleReset}
              >
                Reset Form
              </button>

              <button type="submit" className="booking-submit">
                Submit Request <span>→</span>
              </button>
            </div>
          </form>
        </section>

        <aside className="booking-info-column">
          <div className="booking-info-card">
            <div className="info-card-icon">ⓘ</div>
            <h3>Before You Submit</h3>
            <ul>
              <li>Choose the appropriate resource category.</li>
              <li>Check your booking date and requested time.</li>
              <li>Enter the number of participants.</li>
              <li>Explain the purpose of your booking.</li>
            </ul>
          </div>

          <div className="booking-process-card">
            <h3>Request Process</h3>

            <div className="process-step">
              <span>1</span>
              <div>
                <strong>Submit Request</strong>
                <p>Enter the required booking details.</p>
              </div>
            </div>

            <div className="process-line" />

            <div className="process-step">
              <span>2</span>
              <div>
                <strong>Availability Check</strong>
                <p>
                  Resource availability will be checked after backend integration.
                </p>
              </div>
            </div>

            <div className="process-line" />

            <div className="process-step">
              <span>3</span>
              <div>
                <strong>Admin Review</strong>
                <p>The request will follow campus booking rules.</p>
              </div>
            </div>
          </div>

          <div className="booking-note">
            <span>⚑</span>
            <p>
              <strong>Note:</strong> Submitting this form does not confirm
              a booking. Database integration is not implemented yet.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default BookResource;
