
import { useMemo, useState } from "react";
import "./BookingHistory.css";

function BookingHistory({ requests = [] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const history = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch = [
        request.id,
        request.resource,
        request.date,
        request.time,
        request.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const total = requests.length;
  const approved = requests.filter(
    (request) => request.status === "Approved"
  ).length;
  const pending = requests.filter(
    (request) => request.status === "Pending"
  ).length;
  const rejected = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  function statusClass(status) {
    return status.toLowerCase().replace(/\s+/g, "-");
  }

  return (
    <section className="history-page">
      <div className="history-heading">
        <div>
          <span className="history-eyebrow">BOOKING MANAGEMENT</span>
          <h1>Booking History</h1>
          <p>View and track all your resource booking requests.</p>
        </div>
        <div className="history-total-badge">
          <span>Total Records</span>
          <strong>{total}</strong>
        </div>
      </div>

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-blue">▤</div>
          <div>
            <span>Total Requests</span>
            <strong>{total}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-green">✓</div>
          <div>
            <span>Approved</span>
            <strong>{approved}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-orange">◷</div>
          <div>
            <span>Pending</span>
            <strong>{pending}</strong>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="history-stat-icon history-icon-red">×</div>
          <div>
            <span>Rejected</span>
            <strong>{rejected}</strong>
          </div>
        </div>
      </div>

      <div className="history-panel">
        <div className="history-panel-heading">
          <div>
            <h2>All Booking Records</h2>
            <p>Search your requests or filter them by status.</p>
          </div>
          <span className="history-result-count">
            {history.length} records
          </span>
        </div>

        <div className="history-toolbar">
          <div className="history-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search ID, resource, date..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter booking history by status"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>REQUEST ID</th>
                <th>RESOURCE</th>
                <th>BOOKING DATE</th>
                <th>TIME SLOT</th>
                <th>STATUS</th>
                <th>QUEUE</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <span className="history-request-id">
                        {request.id}
                      </span>
                    </td>
                    <td>
                      <strong className="history-resource">
                        {request.resource}
                      </strong>
                    </td>
                    <td>{request.date || "—"}</td>
                    <td>{request.time || "—"}</td>
                    <td>
                      <span
                        className={`history-status ${statusClass(
                          request.status
                        )}`}
                      >
                        <span className="history-status-dot" />
                        {request.status}
                      </span>
                    </td>
                    <td>{request.queue ?? "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="history-empty">
                    <div className="history-empty-icon">⌕</div>
                    <strong>No booking records found</strong>
                    <p>Try another search term or status filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("All");
                      }}
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="history-footer">
          Showing {history.length} of {total} booking records
        </div>
      </div>

      <p className="history-note">
        <span>ⓘ</span> Booking history is displayed using the app's current
        request data.
      </p>
    </section>
  );
}

export default BookingHistory;
