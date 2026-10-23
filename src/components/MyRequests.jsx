
import { useMemo, useState } from "react";
import "./MyRequests.css";

function MyRequests({ requests = [] }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const filters = ["All", "Pending", "Approved", "Rejected"];

  const counts = useMemo(
    () => ({
      All: requests.length,
      Pending: requests.filter((r) => r.status === "Pending").length,
      Approved: requests.filter((r) => r.status === "Approved").length,
      Rejected: requests.filter((r) => r.status === "Rejected").length,
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesFilter =
        activeFilter === "All" || request.status === activeFilter;

      const matchesSearch = [
        request.id,
        request.resource,
        request.date,
        request.time,
        request.status,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }, [requests, activeFilter, search]);

  return (
    <div className="my-requests-page">
      <section className="mr-page-header">
        <div>
          <p className="mr-eyebrow">STUDENT PORTAL</p>
          <h1>My Requests</h1>
          <p className="mr-subtitle">
            Track your resource requests and check their latest status.
          </p>
        </div>

        <div className="mr-header-icon" aria-hidden="true">
          ☷
        </div>
      </section>

      <section className="mr-stats-grid">
        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-blue">▤</div>
          <div>
            <p>Total Requests</p>
            <h2>{counts.All}</h2>
            <span>All submitted requests</span>
          </div>
        </article>

        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-orange">◷</div>
          <div>
            <p>Pending</p>
            <h2>{counts.Pending}</h2>
            <span>Awaiting a decision</span>
          </div>
        </article>

        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-green">✓</div>
          <div>
            <p>Approved</p>
            <h2>{counts.Approved}</h2>
            <span>Requests accepted</span>
          </div>
        </article>

        <article className="mr-stat-card">
          <div className="mr-stat-icon mr-icon-red">×</div>
          <div>
            <p>Rejected</p>
            <h2>{counts.Rejected}</h2>
            <span>Requests not approved</span>
          </div>
        </article>
      </section>

      <section className="mr-list-section">
        <div className="mr-list-heading">
          <div>
            <h2>All Resource Requests</h2>
            <p>View and manage your submitted requests.</p>
          </div>

          <span className="mr-result-count">
            {filteredRequests.length}{" "}
            {filteredRequests.length === 1 ? "request" : "requests"}
          </span>
        </div>

        <div className="mr-toolbar">
          <div className="mr-search-box">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              aria-label="Search requests"
              placeholder="Search by ID or resource name..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="mr-filter-tabs" aria-label="Filter requests by status">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeFilter === filter ? "selected" : ""}
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
              >
                {filter}
                <span>{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        {filteredRequests.length > 0 ? (
          <>
            <div className="mr-table-wrap">
              <table className="mr-table">
                <thead>
                  <tr>
                    <th>REQUEST ID</th>
                    <th>RESOURCE</th>
                    <th>DATE &amp; TIME</th>
                    <th>STATUS</th>
                    <th>QUEUE POSITION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <span className="mr-request-id">{request.id}</span>
                      </td>

                      <td>
                        <div className="mr-resource-cell">
                          <span className="mr-resource-icon">▣</span>
                          <span>{request.resource}</span>
                        </div>
                      </td>

                      <td>
                        <div className="mr-date">{request.date}</div>
                        <span className="mr-time">{request.time}</span>
                      </td>

                      <td>
                        <span
                          className={`mr-status mr-status-${String(
                            request.status
                          ).toLowerCase()}`}
                        >
                          <span className="mr-status-dot" />
                          {request.status}
                        </span>
                      </td>

                      <td>
                        {request.queue && request.queue !== "—" ? (
                          <span className="mr-queue">#{request.queue}</span>
                        ) : (
                          <span className="mr-no-queue">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mr-demo-note">
              Demo data only · Requests are not yet connected to the backend.
            </p>
          </>
        ) : (
          <div className="mr-empty-state">
            <div className="mr-empty-icon">⌕</div>
            <h3>No requests found</h3>
            <p>
              {search
                ? "Try another search term or change the status filter."
                : "There are no requests in this category yet."}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <footer className="mr-footer">
        <span>CampusConnect · Resource Allocation System</span>
        <span>Student Portal</span>
      </footer>
    </div>
  );
}

export default MyRequests;
