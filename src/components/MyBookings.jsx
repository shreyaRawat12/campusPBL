import { useMemo, useState } from "react";
import "./MyBookings.css";

function MyBookings({ requests = [], onCancelRequest }) {
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedPass, setSelectedPass] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const categorizedBookings = useMemo(() => {
    const approved = requests.filter((r) => r.status === "Approved");
    const cancelled = requests.filter((r) => r.status === "Cancelled");

    const upcoming = approved.filter((r) => !r.date || r.date >= todayStr);
    const past = approved.filter((r) => r.date && r.date < todayStr);

    return { upcoming, past, cancelled };
  }, [requests, todayStr]);

  const displayedBookings = useMemo(() => {
    let list = [];
    if (activeTab === "Upcoming") list = categorizedBookings.upcoming;
    else if (activeTab === "Past") list = categorizedBookings.past;
    else if (activeTab === "Cancelled") list = categorizedBookings.cancelled;

    const q = search.trim().toLowerCase();

    return list.filter((b) => {
      const matchSearch = [
        b.id,
        b.resource || b.resourceName,
        b.purpose,
        b.department,
        b.block,
      ].some((v) => String(v || "").toLowerCase().includes(q));

      const matchDate = !dateFilter || b.date === dateFilter;

      return matchSearch && matchDate;
    });
  }, [categorizedBookings, activeTab, search, dateFilter]);

  return (
    <div className="my-bookings-page">
      <section className="mb-page-header">
        <div>
          <p className="mb-eyebrow">STUDENT PORTAL</p>
          <h1>My Bookings</h1>
          <p className="mb-subtitle">
            View your confirmed resource bookings, schedule details, entry passes, and manage cancellations.
          </p>
        </div>

        <div className="mb-header-icon" aria-hidden="true">
          ▣
        </div>
      </section>

      {/* Stats Grid */}
      <section className="mb-stats-grid">
        <article className="mb-stat-card">
          <div className="mb-stat-icon mb-blue">▣</div>
          <div>
            <p>Upcoming Bookings</p>
            <h2>{categorizedBookings.upcoming.length}</h2>
            <span>Confirmed for future use</span>
          </div>
        </article>

        <article className="mb-stat-card">
          <div className="mb-stat-icon mb-green">✓</div>
          <div>
            <p>Past Allocations</p>
            <h2>{categorizedBookings.past.length}</h2>
            <span>Completed sessions</span>
          </div>
        </article>

        <article className="mb-stat-card">
          <div className="mb-stat-icon mb-purple">▤</div>
          <div>
            <p>Cancelled Bookings</p>
            <h2>{categorizedBookings.cancelled.length}</h2>
            <span>Released back to campus</span>
          </div>
        </article>
      </section>

      <section className="mb-list-section">
        {/* Tabs & Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {["Upcoming", "Past", "Cancelled"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  border: activeTab === tab ? "1px solid #2563eb" : "1px solid #cbd5e1",
                  background: activeTab === tab ? "#2563eb" : "#ffffff",
                  color: activeTab === tab ? "#ffffff" : "#475569",
                }}
              >
                {tab} ({tab === "Upcoming" ? categorizedBookings.upcoming.length : tab === "Past" ? categorizedBookings.past.length : categorizedBookings.cancelled.length})
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="search"
              aria-label="Search bookings"
              placeholder="Search booking ID or venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                minWidth: "220px",
              }}
            />

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
              }}
            />

            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "8px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Clear Date
              </button>
            )}
          </div>
        </div>

        {displayedBookings.length > 0 ? (
          <>
            <div className="mb-table-wrap">
              <table className="mb-table">
                <thead>
                  <tr>
                    <th>BOOKING ID</th>
                    <th>RESOURCE</th>
                    <th>BUILDING</th>
                    <th>DATE &amp; TIME</th>
                    <th>PARTICIPANTS</th>
                    <th>APPROVAL SOURCE</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedBookings.map((booking) => {
                    const isOs = (booking.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");

                    return (
                      <tr key={booking.id}>
                        <td>
                          <span className="mb-booking-id">{booking.id}</span>
                        </td>

                        <td>
                          <div className="mb-resource-cell">
                            <span className="mb-resource-icon">▣</span>
                            <div>
                              <strong>{booking.resource || booking.resourceName}</strong>
                              {booking.purpose && (
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                  {booking.purpose}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>{booking.block || "Block C"}</div>
                          <small style={{ color: "#94a3b8" }}>{booking.floor || "General"}</small>
                        </td>

                        <td>
                          <div className="mb-date">{booking.date}</div>
                          <span className="mb-time">{booking.time}</span>
                        </td>

                        <td>
                          <strong>{booking.participants || 1}</strong>
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              background: isOs ? "#f3e8ff" : "#eff6ff",
                              color: isOs ? "#7c3aed" : "#2563eb",
                              display: "inline-block",
                            }}
                          >
                            {isOs ? "⚡ OS Scheduler" : "Manual Admin"}
                          </span>
                        </td>

                        <td>
                          <span className={`mb-status ${booking.status === "Cancelled" ? "status-cancelled" : ""}`}>
                            <span className="mb-status-dot" />
                            {booking.status}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              onClick={() => setSelectedPass(booking)}
                              style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                color: "#2563eb",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              🎟️ Pass
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedDetails(booking)}
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                padding: "5px 10px",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                fontWeight: "600",
                                cursor: "pointer",
                              }}
                            >
                              Details
                            </button>

                            {booking.status === "Approved" && onCancelRequest && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Cancel booking ${booking.id} and release ${booking.resource || booking.resourceName}?`)) {
                                    onCancelRequest(booking.id);
                                  }
                                }}
                                style={{
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  color: "#dc2626",
                                  padding: "5px 10px",
                                  borderRadius: "6px",
                                  fontSize: "0.78rem",
                                  fontWeight: "600",
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mb-demo-note">
              Official university booking confirmation · Present the pass to facility in-charge upon arrival.
            </p>
          </>
        ) : (
          <div className="mb-empty-state">
            <div className="mb-empty-icon">▣</div>
            <h3>
              {activeTab === "Upcoming"
                ? "You don't have any confirmed bookings yet."
                : `No ${activeTab.toLowerCase()} bookings found.`}
            </h3>
            <p>
              {activeTab === "Upcoming"
                ? "When your resource booking request is approved by the admin or auto-allotted by the OS Scheduler, your confirmed booking and entry pass will appear here."
                : "No matching records found in this category."}
            </p>
          </div>
        )}
      </section>

      {/* Booking Details Modal */}
      {selectedDetails && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", maxWidth: "480px", width: "100%", border: "1px solid #cbd5e1", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, color: "#0f172a" }}>Booking Details: {selectedDetails.id}</h3>
              <button type="button" onClick={() => setSelectedDetails(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
              <div><span style={{ color: "#64748b" }}>Venue:</span> <strong>{selectedDetails.resource || selectedDetails.resourceName}</strong></div>
              <div><span style={{ color: "#64748b" }}>Location:</span> {selectedDetails.block}, {selectedDetails.floor}</div>
              <div><span style={{ color: "#64748b" }}>Scheduled Date:</span> <strong>{selectedDetails.date}</strong></div>
              <div><span style={{ color: "#64748b" }}>Time:</span> {selectedDetails.time}</div>
              <div><span style={{ color: "#64748b" }}>Purpose:</span> {selectedDetails.purpose}</div>
              <div><span style={{ color: "#64748b" }}>Participants:</span> ~{selectedDetails.participants} Students</div>
              <div><span style={{ color: "#64748b" }}>Approval Source:</span> <strong>{(selectedDetails.adminRemarks || "").includes("Auto-Allotted") ? "⚡ Autonomous OS Scheduler (Admin SLA Expired)" : "Manual Campus Admin"}</strong></div>
              {selectedDetails.adminRemarks && (
                <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: "6px", color: "#334155", fontSize: "0.82rem", border: "1px solid #e2e8f0" }}>
                  Remarks: {selectedDetails.adminRemarks}
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSelectedDetails(null)}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Pass Modal */}
      {selectedPass && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "14px",
              maxWidth: "460px",
              width: "100%",
              padding: "24px",
              color: "#f8fafc",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div
              style={{
                borderBottom: "2px dashed #334155",
                paddingBottom: "16px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  letterSpacing: "0.05em",
                }}
              >
                OFFICIAL CAMPUS ALLOCATION PASS
              </span>
              <h2 style={{ margin: "10px 0 2px", fontSize: "1.3rem" }}>
                CampusConnect Authority
              </h2>
              <small style={{ color: "#94a3b8" }}>
                Pass Token: <strong style={{ color: "#38bdf8" }}>{selectedPass.id}</strong>
              </small>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Allocated Venue:</span>
                <strong>{selectedPass.resource || selectedPass.resourceName}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Building Block:</span>
                <span>{selectedPass.block}, {selectedPass.floor}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Applicant Name:</span>
                <strong>{selectedPass.userName || "Student User"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Department:</span>
                <span>{selectedPass.department || "Computer Science"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Scheduled Date:</span>
                <strong>{selectedPass.date}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Time Slot:</span>
                <span style={{ color: "#38bdf8", fontWeight: "600" }}>{selectedPass.time}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Approval Authority:</span>
                <span style={{ color: "#34d399" }}>
                  {(selectedPass.adminRemarks || "").includes("Auto-Allotted") ? "⚡ Autonomous OS Scheduler" : "Campus Facility Admin"}
                </span>
              </div>

              {selectedPass.adminRemarks && (
                <div
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.1)",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "0.8rem",
                    color: "#6ee7b7",
                    marginTop: "6px",
                  }}
                >
                  Remarks: {selectedPass.adminRemarks}
                </div>
              )}
            </div>

            <div
              style={{
                textAlign: "center",
                margin: "18px 0 10px",
                padding: "14px",
                background: "#1e293b",
                borderRadius: "10px",
                border: "1px solid #334155",
              }}
            >
              <div style={{ fontSize: "1.8rem" }}>🏁 ▦ ▣ ▦ 🏁</div>
              <small style={{ color: "#64748b", display: "block", marginTop: "6px" }}>
                Scan at room entrance scanner for automated gate validation
              </small>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                🖨️ Print Pass
              </button>
              <button
                type="button"
                onClick={() => setSelectedPass(null)}
                style={{
                  background: "#334155",
                  color: "#f8fafc",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mb-footer">
        <span>CampusConnect · Resource Allocation System</span>
        <span>Student Portal</span>
      </footer>
    </div>
  );
}

export default MyBookings;
