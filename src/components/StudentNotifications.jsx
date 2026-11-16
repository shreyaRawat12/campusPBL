import React from "react";
import "./StudentNotifications.css";
import { useCampus } from "../context/CampusContext";

export default function StudentNotifications({ onNavigateToRequest }) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useCampus();

  function getIcon(type) {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "os":
        return "⚡";
      default:
        return "ℹ";
    }
  }

  function formatTime(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="notif-page">
      <header className="notif-header">
        <div>
          <p className="notif-eyebrow">STUDENT PORTAL</p>
          <h1>Notification Centre</h1>
          <p className="notif-subtitle">
            Real-time updates on your booking requests, admin approvals, SLA timeouts, and OS Scheduler decisions.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            className="notif-mark-all-btn"
            onClick={markAllNotificationsAsRead}
          >
            ✓ Mark All as Read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="notif-empty-state">
          <div className="notif-empty-icon">🔔</div>
          <h3>You're all caught up!</h3>
          <p>No notifications yet. When you submit a booking request or an admin reviews it, updates will appear here.</p>
        </div>
      ) : (
        <div className="notif-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notif-card ${notif.isRead ? "is-read" : "is-unread"} notif-${notif.type}`}
              onClick={() => {
                markNotificationAsRead(notif.id);
                if (onNavigateToRequest && notif.requestId) {
                  onNavigateToRequest(notif.requestId);
                }
              }}
            >
              <div className={`notif-icon-badge notif-badge-${notif.type}`}>
                {getIcon(notif.type)}
              </div>

              <div className="notif-content">
                <div className="notif-title-row">
                  <strong className="notif-title">{notif.title}</strong>
                  <span className="notif-time">{formatTime(notif.timestamp)}</span>
                </div>
                <p className="notif-message">{notif.message}</p>
                {notif.requestId && (
                  <span className="notif-req-tag">Ref: {notif.requestId}</span>
                )}
              </div>

              {!notif.isRead && <span className="notif-unread-dot" title="Unread" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
