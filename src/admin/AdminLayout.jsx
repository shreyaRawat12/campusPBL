import React, { useState } from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";
import AdminDashboard from "./AdminDashboard";
import ResourceManagement from "./ResourceManagement";
import BookingRequests from "./BookingRequests";
import AllocationManagement from "./AllocationManagement";
import AdminTimetable from "./AdminTimetable";
import OsSchedulerMonitor from "./OsSchedulerMonitor";
import OsGanttChart from "./OsGanttChart";
import UserManagement from "./UserManagement";
import ReportsAnalytics from "./ReportsAnalytics";
import AdminNotifications from "./AdminNotifications";
import AdminSettings from "./AdminSettings";

const adminMenuItems = [
  { name: "Dashboard", icon: "📊" },
  { name: "Resource Management", icon: "🏢" },
  { name: "Booking Requests", icon: "📋" },
  { name: "Allocation Management", icon: "📑" },
  { name: "Scheduling & Timetable", icon: "📅" },
  { name: "OS Scheduler Monitor", icon: "⚡" },
  { name: "OS Gantt Chart", icon: "📊" },
  { name: "User Management", icon: "👥" },
  { name: "Reports & Analytics", icon: "📈" },
  { name: "Notifications", icon: "🔔" },
  { name: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ onSwitchToStudent }) {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const { user, requests, isBackendConnected, autoApproveMode, toggleAutoApproveMode, triggerOsScheduler, logout } = useCampus();

  const pendingCount = requests.filter((r) => r.status === "Pending").length;

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ overflowY: "auto" }}>
        <div className="admin-brand">
          <div className="admin-brand-icon">CC</div>
          <div>
            <h2>
              Campus<span>Connect</span>
            </h2>
            <span className="admin-badge">ADMIN CONSOLE</span>
          </div>
        </div>

        <div className="admin-nav-heading">CAMPUS ADMINISTRATION</div>

        <nav className="admin-nav">
          {adminMenuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`admin-nav-item ${
                activeMenu === item.name ? "active" : ""
              }`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{item.name}</span>
              {item.name === "Booking Requests" && pendingCount > 0 && (
                <span className="admin-pending-pill">{pendingCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="switch-portal-btn"
            onClick={onSwitchToStudent}
            title="Preview student view"
          >
            <span>⇄</span> Switch to Student View
          </button>

          <button
            type="button"
            className="admin-logout-btn"
            onClick={logout}
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            Admin Console <span>/</span> <strong>{activeMenu}</strong>
          </div>

          <div className="admin-topbar-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Quick Scheduler Button */}
            <button
              type="button"
              onClick={triggerOsScheduler}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Execute OS Scheduler"
            >
              <span>⚡</span> Run OS Engine
            </button>

            {/* Auto-Approve Indicator */}
            <button
              type="button"
              onClick={toggleAutoApproveMode}
              style={{
                background: autoApproveMode ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)",
                border: `1px solid ${autoApproveMode ? "#10b981" : "#475569"}`,
                color: autoApproveMode ? "#34d399" : "#94a3b8",
                borderRadius: "6px",
                padding: "5px 10px",
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
              title="Toggle Auto-Approve Watchdog"
            >
              Auto: {autoApproveMode ? "ON" : "OFF"}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setActiveMenu("Notifications")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "1.2rem",
                position: "relative",
                padding: "6px",
                color: "#cbd5e1",
              }}
              title="Notifications"
            >
              🔔
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "50%",
                    fontSize: "0.68rem",
                    fontWeight: "700",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>

            {/* DB Status */}
            <div className="admin-system-status">
              <span
                className="status-pulse"
                style={{ backgroundColor: isBackendConnected ? "#10b981" : "#38bdf8" }}
              ></span>
              <span>
                {isBackendConnected ? "MySQL Live DB · Port 5000" : "Local Storage Mode"}
              </span>
            </div>

            {/* Admin Profile */}
            <div className="admin-profile" onClick={() => setActiveMenu("Settings")} style={{ cursor: "pointer" }}>
              <div className="admin-avatar">A</div>
              <div className="admin-profile-info">
                <strong>{user ? user.name : "Admin User"}</strong>
                <span>Facility Officer</span>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content-area" style={{ padding: "28px 32px" }}>
          {activeMenu === "Dashboard" && (
            <AdminDashboard onNavigate={(menu) => setActiveMenu(menu)} />
          )}
          {activeMenu === "Resource Management" && <ResourceManagement />}
          {activeMenu === "Booking Requests" && <BookingRequests />}
          {activeMenu === "Allocation Management" && <AllocationManagement />}
          {activeMenu === "Scheduling & Timetable" && <AdminTimetable />}
          {activeMenu === "OS Scheduler Monitor" && <OsSchedulerMonitor />}
          {activeMenu === "OS Gantt Chart" && <OsGanttChart />}
          {activeMenu === "User Management" && <UserManagement />}
          {activeMenu === "Reports & Analytics" && <ReportsAnalytics />}
          {activeMenu === "Notifications" && <AdminNotifications />}
          {activeMenu === "Settings" && <AdminSettings />}
        </div>
      </main>
    </div>
  );
}
