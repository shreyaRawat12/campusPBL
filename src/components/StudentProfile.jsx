import React from "react";
import "./StudentProfile.css";
import { useCampus } from "../context/CampusContext";

export default function StudentProfile() {
  const { user, requests } = useCampus();

  const userRequests = requests.filter((r) => String(r.userId) === String(user?.id));
  const activeBookings = userRequests.filter((r) => r.status === "Approved").length;
  const pendingRequests = userRequests.filter((r) => r.status === "Pending").length;

  return (
    <div className="profile-page">
      <header className="profile-header-card">
        <div className="profile-banner">
          <div className="profile-avatar-large">
            {user?.name ? user.name.charAt(0) : "S"}
          </div>
        </div>

        <div className="profile-meta">
          <div>
            <h1>{user?.name || "Student User"}</h1>
            <p className="profile-department">
              {user?.department || "Computer Science"} · Campus ID: <strong>{user?.id || "STU-2024-089"}</strong>
            </p>
          </div>

          <span className="profile-status-pill">
            ● Active University Account
          </span>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="profile-stats-row">
        <div className="profile-stat-box">
          <span>Active Bookings</span>
          <strong>{activeBookings}</strong>
        </div>
        <div className="profile-stat-box">
          <span>Pending Requests</span>
          <strong>{pendingRequests}</strong>
        </div>
        <div className="profile-stat-box">
          <span>Total Requests Made</span>
          <strong>{userRequests.length}</strong>
        </div>
      </div>

      {/* Details Card */}
      <div className="profile-details-card">
        <h2>Academic & Facility Credentials</h2>
        <p className="profile-subtext">Information provided by the campus directory database.</p>

        <div className="profile-grid">
          <div className="profile-field">
            <label>FULL NAME</label>
            <p>{user?.name || "Student User"}</p>
          </div>

          <div className="profile-field">
            <label>STUDENT ROLL / ID</label>
            <p>{user?.id || "STU-2024-089"}</p>
          </div>

          <div className="profile-field">
            <label>OFFICIAL EMAIL</label>
            <p>{user?.email || `${(user?.id || "student").toLowerCase()}@campus.edu`}</p>
          </div>

          <div className="profile-field">
            <label>ACADEMIC DEPARTMENT</label>
            <p>{user?.department || "Computer Science"}</p>
          </div>

          <div className="profile-field">
            <label>USER ROLE</label>
            <p>{user?.role || "Student"}</p>
          </div>

          <div className="profile-field">
            <label>RESOURCE ACCESS TIER</label>
            <p>Tier 1: Classrooms, Computer Labs &amp; Seminar Venues</p>
          </div>
        </div>

        <div className="profile-footer-notice">
          <span>🔒</span> Verified campus identity. Resource requests are logged with timestamp and user ID for DBMS and OS audit compliance.
        </div>
      </div>
    </div>
  );
}
