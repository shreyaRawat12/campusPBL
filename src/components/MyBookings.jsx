
import { useMemo, useState } from "react";
import "./MyBookings.css";

function MyBookings({ requests = [] }) {
  const [search, setSearch] = useState("");

  const bookings = useMemo(
    () => requests.filter((request) => request.status === "Approved"),
    [requests]
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) =>
      [
        booking.id,
        booking.resource,
        booking.date,
        booking.time,
      ].some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [bookings, search]);

  return (
    <div className="my-bookings-page">
      <section className="mb-page-header">
        <div>
          <p className="mb-eyebrow">STUDENT PORTAL</p>
          <h1>My Bookings</h1>
          <p className="mb-subtitle">
            View your approved resource bookings and their schedule.
          </p>
        </div>

        <div className="mb-header-icon" aria-hidden="true">
          ▣
        </div>
      </section>

      <section className="mb-stats-grid">
        <article className="mb-stat-card">
          <div className="mb-stat-icon mb-blue">▣</div>
          <div>
            <p>Total Approved</p>
            <h2>{bookings.length}</h2>
            <span>Confirmed requests</span>
          </div>
        </article>

        <article className="mb-stat-card">
          <div className="mb-stat-icon mb-green">✓</div>
          <div>
            <p>Approved Status</p>
            <h2>{bookings.length}</h2>
            <span>Ready to view</span>
          </div>
        </article>

        <article className="mb-stat-card">
          <div className="mb-stat-icon mb-purple">▤</div>
          <div>
            <p>Resources Booked</p>
            <h2>{new Set(bookings.map((booking) => booking.resource)).size}</h2>
            <span>Unique resources</span>
          </div>
        </article>
      </section>

      <section className="mb-list-section">
        <div className="mb-list-heading">
          <div>
            <h2>Approved Bookings</h2>
            <p>Only requests approved by the campus team appear here.</p>
          </div>

          <span className="mb-count">
            {filteredBookings.length}{" "}
            {filteredBookings.length === 1 ? "booking" : "bookings"}
          </span>
        </div>

        <div className="mb-toolbar">
          <div className="mb-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search approved bookings"
              placeholder="Search booking ID or resource..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <span className="mb-approved-label">
            <span /> Approved requests only
          </span>
        </div>

        {filteredBookings.length > 0 ? (
          <>
            <div className="mb-table-wrap">
              <table className="mb-table">
                <thead>
                  <tr>
                    <th>BOOKING ID</th>
                    <th>RESOURCE</th>
                    <th>DATE &amp; TIME</th>
                    <th>STATUS</th>
                    <th>QUEUE</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <span className="mb-booking-id">{booking.id}</span>
                      </td>

                      <td>
                        <div className="mb-resource-cell">
                          <span className="mb-resource-icon">▣</span>
                          <span>{booking.resource}</span>
                        </div>
                      </td>

                      <td>
                        <div className="mb-date">{booking.date}</div>
                        <span className="mb-time">{booking.time}</span>
                      </td>

                      <td>
                        <span className="mb-status">
                          <span className="mb-status-dot" />
                          Approved
                        </span>
                      </td>

                      <td>
                        <span className="mb-queue-none">—</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mb-demo-note">
              Demo data only · Live booking details will come from the backend.
            </p>
          </>
        ) : (
          <div className="mb-empty-state">
            <div className="mb-empty-icon">▣</div>
            <h3>{search ? "No matching bookings" : "No approved bookings yet"}</h3>
            <p>
              {search
                ? "Try searching with another booking ID or resource name."
                : "When your resource request is approved, it will appear here."}
            </p>

            {search && (
              <button type="button" onClick={() => setSearch("")}>
                Clear search
              </button>
            )}
          </div>
        )}
      </section>

      <footer className="mb-footer">
        <span>CampusConnect · Resource Allocation System</span>
        <span>Student Portal</span>
      </footer>
    </div>
  );
}

export default MyBookings;
