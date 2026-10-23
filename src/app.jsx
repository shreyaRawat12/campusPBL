import { useState } from "react";
import "./app.css";
import BrowseResources from "./components/BrowseResources";
import BookResource from "./components/BookResource";

const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Browse Resources", icon: "⌕" },
  { name: "Book a Resource", icon: "＋" },
  { name: "My Requests", icon: "☷" },
  { name: "My Bookings", icon: "▣" },
  { name: "Timetable & Availability", icon: "▦" },
  { name: "Booking History", icon: "◷" },
];

const requests = [
  {
    id: "REQ-1001",
    resource: "Computer Lab 2",
    date: "22 Oct 2026",
    time: "10:00 AM – 12:00 PM",
    status: "Approved",
    queue: "—",
  },
  {
    id: "REQ-1002",
    resource: "Seminar Hall A",
    date: "23 Oct 2026",
    time: "01:00 PM – 03:00 PM",
    status: "Pending",
    queue: "2",
  },
  {
    id: "REQ-1003",
    resource: "Projector P-01",
    date: "24 Oct 2026",
    time: "11:00 AM – 12:00 PM",
    status: "Pending",
    queue: "4",
  },
];

function App() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  const stats = [
    { label: "Upcoming Bookings", value: "02", icon: "▣", color: "blue" },
    { label: "Pending Requests", value: "02", icon: "◷", color: "orange" },
    { label: "Completed Bookings", value: "05", icon: "✓", color: "green" },
    { label: "Waiting in Queue", value: "02", icon: "☷", color: "purple" },
  ];

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">CR</div>
          <div>
            <h2>
              Campus<span>Connect</span>
            </h2>
            <p>RESOURCE PORTAL</p>
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

              {activeMenu === item.name && (
                <span className="active-dot">●</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-box">
            <div className="help-icon">?</div>
            <h4>Need help?</h4>
            <p>Contact campus resource support.</p>
            <button
              type="button"
              onClick={() =>
                window.alert("Campus support details will be added later.")
              }
            >
              Get Help →
            </button>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={() =>
              window.alert("Login integration will be added later.")
            }
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
            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
              onClick={() =>
                window.alert("Notifications will be added later.")
              }
            >
              ♧<span className="notification-dot"></span>
            </button>

            <div className="profile">
              <div className="avatar">S</div>
              <div className="profile-info">
                <strong>Student Name</strong>
                <span>Student</span>
              </div>
              <span className="chevron">⌄</span>
            </div>
          </div>
        </header>

        <div className="page-content">
          {activeMenu === "Browse Resources" ? (
            <BrowseResources />
          ) : activeMenu === "Dashboard" ? (
            <>
              <section className="welcome-section">
                <div>
                  <p className="eyebrow">STUDENT OVERVIEW</p>
                  <h1>
                    Welcome back, Student! <span>👋</span>
                  </h1>
                  <p className="welcome-description">
                    Manage your campus resources, track requests, and stay
                    updated with your bookings.
                  </p>
                </div>

                <div className="date-card">
                  <span>▦</span>
                  <div>
                    <strong>Campus Resource Portal</strong>
                    <p>Plan. Request. Allocate.</p>
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                {stats.map((stat) => (
                  <article className="stat-card" key={stat.label}>
                    <div className={`stat-icon ${stat.color}`}>
                      {stat.icon}
                    </div>

                    <div className="stat-info">
                      <p>{stat.label}</p>
                      <h2>{stat.value}</h2>
                      <span>View your activity</span>
                    </div>

                    <span className="stat-arrow">↗️</span>
                  </article>
                ))}
              </section>

              <section className="quick-section">
                <div className="section-heading">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>What would you like to do today?</p>
                  </div>
                </div>

                <div className="quick-grid">
                  <button
                    type="button"
                    className="quick-card primary-action"
                    onClick={() => setActiveMenu("Browse Resources")}
                  >
                    <span className="quick-icon">⌕</span>
                    <span className="quick-text">
                      <strong>Browse Resources</strong>
                      <small>Explore rooms, labs and equipment</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>

                  <button
                    type="button"
                    className="quick-card"
                    onClick={() => setActiveMenu("Book a Resource")}
                  >
                    <span className="quick-icon">＋</span>
                    <span className="quick-text">
                      <strong>New Booking Request</strong>
                      <small>Request a resource for your activity</small>
                    </span>
                    <span className="quick-arrow">→</span>
                  </button>
                </div>
              </section>

              <section className="requests-section">
                <div className="section-heading">
                  <div>
                    <h2>Recent Requests</h2>
                    <p>Track the status of your latest requests.</p>
                  </div>

                  <button
                    type="button"
                    className="view-all"
                    onClick={() => setActiveMenu("My Requests")}
                  >
                    View all requests →
                  </button>
                </div>

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
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td className="request-id">{request.id}</td>
                          <td className="resource-name">
                            {request.resource}
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
                                  : "pending"
                              }`}
                            >
                              <span className="status-dot"></span>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            {request.queue === "—" ? (
                              <span className="queue-none">—</span>
                            ) : (
                              <span className="queue-position">
                                #{request.queue}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="demo-note">
                  Demo data only · Live booking data will come from the
                  backend.
                </p>
              </section>

              <footer className="footer">
                <span>CampusConnect · Resource Allocation System</span>
                <span>Student Portal</span>
              </footer>
            </>
          ) : (
            <section className="coming-soon">
              <div className="coming-soon-icon">▦</div>
              <p className="eyebrow">STUDENT PORTAL</p>
              <h1>{activeMenu}</h1>
              <p>
                This page will be implemented in a future step.
              </p>
              <button
                type="button"
                onClick={() => setActiveMenu("Dashboard")}
              >
                ← Back to Dashboard
              </button>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;