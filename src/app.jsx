import { useState, useMemo } from "react";
import "./app.css";
import { CampusProvider, useCampus } from "./context/CampusContext";
import Login from "./components/login";
import AdminLayout from "./admin/AdminLayout";
import MyRequests from "./components/MyRequests";
import MyBookings from "./components/MyBookings";
import BookingHistory from "./components/BookingHistory";
import TimetableAvailability from "./components/TimetableAvailability";
import BrowseResources from "./components/BrowseResources";
import BookResource from "./components/BookResource";
import StudentNotifications from "./components/StudentNotifications";
import StudentProfile from "./components/StudentProfile";

const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Browse Resources", icon: "⌕" },
  { name: "Book a Resource", icon: "＋" },
  { name: "My Requests", icon: "☷" },
  { name: "My Bookings", icon: "▣" },
  { name: "Timetable & Availability", icon: "▦" },
  { name: "Booking History", icon: "◷" },
  { name: "Notifications", icon: "🔔" },
  { name: "Profile", icon: "👤" },
];

function StudentPortal({ onSwitchToAdmin }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);

  const {
    user,
    resources,
    requests,
    notifications,
    unreadNotificationsCount,
    isBackendConnected,
    addBookingRequest,
    cancelRequest,
    logout,
  } = useCampus();

  // Filter requests specific to logged-in student
  const studentRequests = useMemo(() => {
    if (!user) return [];
    return requests.filter((r) => String(r.userId) === String(user.id));
  }, [requests, user]);

  // Dynamic live statistics for logged in student
  const stats = useMemo(() => {
    const total = studentRequests.length;
    const pending = studentRequests.filter((r) => r.status === "Pending").length;
    const approved = studentRequests.filter((r) => r.status === "Approved").length;
    const rejected = studentRequests.filter((r) => r.status === "Rejected").length;

    return [
      {
        label: "Total Requests",
        value: total,
        icon: "☷",
        color: "blue",
      },
      {
        label: "Pending Requests",
        value: pending,
        icon: "◷",
        color: "orange",
      },
      {
        label: "Approved Bookings",
        value: approved,
        icon: "✓",
        color: "green",
      },
      {
        label: "Rejected Requests",
        value: rejected,
        icon: "×",
        color: "red",
      },
    ];
  }, [studentRequests]);

  // Confirmed upcoming bookings for logged in student
  const upcomingBookings = useMemo(() => {
    return studentRequests.filter((r) => r.status === "Approved");
  }, [studentRequests]);

  // Campus resource availability calculation
  const resourceOverview = useMemo(() => {
    const total = resources.length;
    const available = resources.filter((r) => r.available).length;
    const blockC = resources.filter((r) => r.block === "Block C").length;
    const blockE = resources.filter((r) => r.block === "Block E").length;
    return { total, available, blockC, blockE };
  }, [resources]);

  function openBooking(resource) {
    setSelectedResource(resource);
    setActiveMenu("Book a Resource");
  }

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">CR</div>
          <div>
            <h2>
              Campus<span>Connect</span>
            </h2>
            <p>STUDENT PORTAL</p>
          </div>
        </div>

        <div className="nav-heading">STUDENT MENU</div>

        <nav className="navigation">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${
                activeMenu === item.name ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>

              {item.name === "Notifications" && unreadNotificationsCount > 0 && (
                <span className="unread-pill">{unreadNotificationsCount}</span>
              )}

              {activeMenu === item.name && (
                <span className="active-dot">●</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="switch-portal-btn"
            style={{
              marginBottom: "10px",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#38bdf8",
              padding: "10px",
              borderRadius: "8px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
            }}
            onClick={onSwitchToAdmin}
            title="Open Admin Management Console"
          >
            <span>⇄</span> Switch to Admin View
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Student Portal <span>/</span> <strong>{activeMenu}</strong>
          </div>

          <div className="topbar-right">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#ffffff",
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                fontSize: "0.82rem",
                color: isBackendConnected ? "#10b981" : "#64748b",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isBackendConnected ? "#10b981" : "#94a3b8",
                }}
              />
              {isBackendConnected ? "MySQL Live DB (Port 5000)" : "Connecting DB..."}
            </div>

            {/* Notification Bell Icon */}
            <button
              type="button"
              onClick={() => setActiveMenu("Notifications")}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                fontSize: "1.05rem",
              }}
              title="Notifications"
            >
              🔔
              {unreadNotificationsCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Profile Pill */}
            <div
              className="profile"
              onClick={() => setActiveMenu("Profile")}
              style={{ cursor: "pointer" }}
              title="View Profile"
            >
              <div className="avatar">
                {user ? user.name.charAt(0) : "S"}
              </div>
              <div className="profile-info">
                <strong>{user ? user.name : "Student User"}</strong>
                <span>{user ? user.department : "Computer Science"}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeMenu === "Browse Resources" ? (
            <BrowseResources
              resources={resources}
              onBookResource={openBooking}
            />
          ) : activeMenu === "Book a Resource" ? (
            <BookResource
              resources={resources}
              initialResource={selectedResource}
              onSubmitRequest={async (request) => {
                await addBookingRequest(request);
                setActiveMenu("My Requests");
              }}
            />
          ) : activeMenu === "My Requests" ? (
            <MyRequests
              requests={studentRequests}
              onCancelRequest={cancelRequest}
            />
          ) : activeMenu === "My Bookings" ? (
            <MyBookings requests={studentRequests} onCancelRequest={cancelRequest} />
          ) : activeMenu === "Timetable & Availability" ? (
            <TimetableAvailability />
          ) : activeMenu === "Booking History" ? (
            <BookingHistory requests={studentRequests} />
          ) : activeMenu === "Notifications" ? (
            <StudentNotifications onNavigateToRequest={() => setActiveMenu("My Requests")} />
          ) : activeMenu === "Profile" ? (
            <StudentProfile />
          ) : (
            /* Student Dashboard View */
            <>
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">STUDENT OVERVIEW</p>
                  <h1>
                    Welcome back, {user ? user.name.split(" ")[0] : "Student"}! <span>👋</span>
                  </h1>
                  <p className="welcome-description">
                    Manage campus facilities, request lab and seminar venues, and track real-time queue allocations.
                  </p>
                </div>

                <div className="date-card">
                  <span>▦</span>
                  <div>
                    <strong>CampusConnect</strong>
                    <p>OS &amp; DBMS PBL System</p>
                  </div>
                </div>
              </section>

              {/* 4 Statistic Cards */}
              <section className="stats-grid">
                {stats.map((stat) => (
                  <article className="stat-card" key={stat.label}>
                    <div className={`stat-icon ${stat.color}`}>
                      {stat.icon}
                    </div>

                    <div className="stat-info">
                      <p>{stat.label}</p>
                      <h2>{stat.value}</h2>
                      <span>Real MySQL records</span>
                    </div>

                    <span className="stat-arrow">↗️</span>
                  </article>
                ))}
              </section>

              {/* 1. Quick Actions */}
              <section className="quick-section">
                <div className="section-heading">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>What would you like to allocate today?</p>
                  </div>
                </div>

                <div className="quick-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <button
                    type="button"
                    className="quick-card primary-action"
                    onClick={() => setActiveMenu("Browse Resources")}
                  >
                    <span className="quick-icon">⌕</span>
                    <span className="quick-text">
                      <strong>Browse Available Resources</strong>
                      <small>Explore {resources.length} Block C &amp; E rooms</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-card"
                    onClick={() => {
                      setSelectedResource(null);
                      setActiveMenu("Book a Resource");
                    }}
                  >
                    <span className="quick-icon">＋</span>
                    <span className="quick-text">
                      <strong>Book a Resource</strong>
                      <small>Reserve a venue with conflict check</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-card"
                    onClick={() => setActiveMenu("My Requests")}
                  >
                    <span className="quick-icon">☷</span>
                    <span className="quick-text">
                      <strong>View My Requests</strong>
                      <small>Track 10-Min SLA &amp; status</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-card"
                    onClick={() => setActiveMenu("Timetable & Availability")}
                  >
                    <span className="quick-icon">▦</span>
                    <span className="quick-text">
                      <strong>View Timetable</strong>
                      <small>Weekly room occupancy grid</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>
                </div>
              </section>

              {/* 2. Upcoming Bookings */}
              <section className="requests-section">
                <div className="section-heading">
                  <div>
                    <h2>Upcoming Bookings</h2>
                    <p>Confirmed allocations reserved for your academic activities.</p>
                  </div>

                  <button
                    type="button"
                    className="view-all"
                    onClick={() => setActiveMenu("My Bookings")}
                  >
                    View My Bookings →
                  </button>
                </div>

                {upcomingBookings.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 20px", background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "0.95rem" }}>
                      You don't have any confirmed bookings yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveMenu("Book a Resource")}
                      style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}
                    >
                      Book a Resource Now
                    </button>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>BOOKING ID</th>
                          <th>RESOURCE / ROOM</th>
                          <th>DATE</th>
                          <th>START TIME</th>
                          <th>END TIME</th>
                          <th>PURPOSE</th>
                          <th>ALLOCATION SOURCE</th>
                          <th>STATUS</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingBookings.slice(0, 5).map((booking) => {
                          const isOs = (booking.adminRemarks || "").includes("Auto-Allotted via OS Scheduler");
                          return (
                            <tr key={booking.id}>
                              <td className="request-id">
                                <strong>{booking.id}</strong>
                              </td>
                              <td className="resource-name">
                                <strong>{booking.resource || booking.resourceName}</strong>
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                  {booking.block} · {booking.floor}
                                </div>
                              </td>
                              <td>{booking.date}</td>
                              <td>{booking.startTime}</td>
                              <td>{booking.endTime}</td>
                              <td style={{ maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {booking.purpose}
                              </td>
                              <td>
                                <span
                                  style={{
                                    fontSize: "0.75rem",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                    background: isOs ? "rgba(139, 92, 246, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                    color: isOs ? "#8b5cf6" : "#2563eb",
                                  }}
                                >
                                  {isOs ? "⚡ OS Scheduler" : "Manual Admin"}
                                </span>
                              </td>
                              <td>
                                <span className="status approved">
                                  <span className="status-dot"></span>
                                  Approved
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingDetails(booking)}
                                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 3. Recent Requests */}
              <section className="requests-section">
                <div className="section-heading">
                  <div>
                    <h2>Recent Requests</h2>
                    <p>Track the real-time status and queue position of your latest submissions.</p>
                  </div>

                  <button
                    type="button"
                    className="view-all"
                    onClick={() => setActiveMenu("My Requests")}
                  >
                    View all requests →
                  </button>
                </div>

                {studentRequests.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 20px", background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                    <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "0.95rem" }}>
                      No booking requests yet. Submit your first resource booking request to get started.
                    </p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table>
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
                        {studentRequests.slice(0, 5).map((request) => (
                          <tr key={request.id}>
                            <td className="request-id">{request.id}</td>
                            <td className="resource-name">
                              <strong>{request.resource || request.resourceName}</strong>
                              <small style={{ display: "block", color: "#64748b" }}>{request.block}</small>
                            </td>
                            <td>
                              <div>{request.date}</div>
                              <small>{request.time}</small>
                            </td>
                            <td>
                              <span
                                className={`status ${
                                  request.status === "Approved"
                                    ? "approved"
                                    : request.status === "Pending"
                                    ? "pending"
                                    : "rejected"
                                }`}
                              >
                                <span className="status-dot"></span>
                                {request.status}
                              </span>
                            </td>
                            <td>
                              {request.status === "Pending" && request.queue && request.queue !== "—" ? (
                                <span className="queue-position" style={{ color: "#f59e0b", fontWeight: "700" }}>
                                  #{request.queue}
                                </span>
                              ) : (
                                <span className="queue-none">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 4. Resource Availability Overview & 5. Recent Notifications */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
                {/* Resource Overview */}
                <section style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.1rem", color: "#0f172a" }}>Campus Resource Inventory</h3>
                  <p style={{ margin: "0 0 16px", fontSize: "0.85rem", color: "#64748b" }}>Live infrastructure across Block C and Block E.</p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b", display: "block" }}>Total Rooms</span>
                      <strong style={{ fontSize: "1.4rem", color: "#0f172a" }}>{resourceOverview.total}</strong>
                    </div>
                    <div style={{ background: "#ecfdf5", padding: "14px", borderRadius: "8px", border: "1px solid #a7f3d0" }}>
                      <span style={{ fontSize: "0.78rem", color: "#059669", display: "block" }}>Available for Booking</span>
                      <strong style={{ fontSize: "1.4rem", color: "#047857" }}>{resourceOverview.available}</strong>
                    </div>
                    <div style={{ background: "#eff6ff", padding: "14px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                      <span style={{ fontSize: "0.78rem", color: "#2563eb", display: "block" }}>Block C Venues</span>
                      <strong style={{ fontSize: "1.4rem", color: "#1d4ed8" }}>{resourceOverview.blockC}</strong>
                    </div>
                    <div style={{ background: "#f5f3ff", padding: "14px", borderRadius: "8px", border: "1px solid #ddd6fe" }}>
                      <span style={{ fontSize: "0.78rem", color: "#7c3aed", display: "block" }}>Block E Venues</span>
                      <strong style={{ fontSize: "1.4rem", color: "#6d28d9" }}>{resourceOverview.blockE}</strong>
                    </div>
                  </div>
                </section>

                {/* Recent Notifications */}
                <section style={{ background: "#ffffff", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>Recent Notifications</h3>
                    <button
                      type="button"
                      onClick={() => setActiveMenu("Notifications")}
                      style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.82rem", fontWeight: "600", cursor: "pointer" }}
                    >
                      View All →
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "0.88rem", textAlign: "center", padding: "20px 0" }}>
                      No recent notifications.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {notifications.slice(0, 3).map((notif) => (
                        <div
                          key={notif.id}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            fontSize: "0.85rem",
                          }}
                        >
                          <strong style={{ display: "block", color: "#0f172a", marginBottom: "2px" }}>{notif.title}</strong>
                          <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem", lineHeight: "1.3" }}>{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Booking Details Modal */}
              {selectedBookingDetails && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                  <div style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", maxWidth: "480px", width: "100%", border: "1px solid #cbd5e1", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
                      <h3 style={{ margin: 0, color: "#0f172a" }}>Booking Details: {selectedBookingDetails.id}</h3>
                      <button type="button" onClick={() => setSelectedBookingDetails(null)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.9rem" }}>
                      <div><span style={{ color: "#64748b" }}>Allocated Room:</span> <strong>{selectedBookingDetails.resource || selectedBookingDetails.resourceName}</strong></div>
                      <div><span style={{ color: "#64748b" }}>Block &amp; Floor:</span> {selectedBookingDetails.block}, {selectedBookingDetails.floor}</div>
                      <div><span style={{ color: "#64748b" }}>Date:</span> <strong>{selectedBookingDetails.date}</strong></div>
                      <div><span style={{ color: "#64748b" }}>Time:</span> {selectedBookingDetails.time} ({selectedBookingDetails.startTime} – {selectedBookingDetails.endTime})</div>
                      <div><span style={{ color: "#64748b" }}>Purpose:</span> {selectedBookingDetails.purpose}</div>
                      <div><span style={{ color: "#64748b" }}>Participants:</span> ~{selectedBookingDetails.participants} Students</div>
                      <div><span style={{ color: "#64748b" }}>Allocation Source:</span> <strong>{(selectedBookingDetails.adminRemarks || "").includes("Auto-Allotted") ? "⚡ Autonomous OS Scheduler" : "Manual Admin"}</strong></div>
                      {selectedBookingDetails.adminRemarks && (
                        <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px", color: "#334155", fontSize: "0.82rem" }}>
                          Remarks: {selectedBookingDetails.adminRemarks}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: "20px", textAlign: "right" }}>
                      <button type="button" onClick={() => setSelectedBookingDetails(null)} style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <footer className="footer">
                <span>CampusConnect · Campus Resource Allocation and Scheduling System</span>
                <span>Student Portal</span>
              </footer>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function CampusApp() {
  const { user, switchRole } = useCampus();

  if (!user) {
    return <Login />;
  }

  if (user.role === "Admin") {
    return <AdminLayout onSwitchToStudent={() => switchRole("Student")} />;
  }

  return <StudentPortal onSwitchToAdmin={() => switchRole("Admin")} />;
}

export default function App() {
  return (
    <CampusProvider>
      <CampusApp />
    </CampusProvider>
  );
}
