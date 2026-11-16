import React, { useState, useMemo } from "react";
import "./AdminLayout.css";
import { useCampus } from "../context/CampusContext";

export default function AdminNotifications() {
  const { requests, isBackendConnected } = useCampus();

  const [activeFilter, setActiveFilter] = useState("All");
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campus_admin_notifications_read") || "[]");
    } catch {
      return [];
    }
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campus_admin_notifications_dismissed") || "[]");
    } catch {
      return [];
    }
  });

  // Dynamically derive authentic admin notifications from current DB booking states
  const notifications = useMemo(() => {
    const list = [];
    const now = Date.now();

    // System connectivity event
    list.push({
      id: "sys-db-connected",
      category: "System Event",
      title: isBackendConnected ? "Live Database Connection Active" : "Local Fallback State",
      message: isBackendConnected
        ? "Connected to MySQL campus_resource_db on port 5000. Real-time updates active."
        : "Operating in client memory mode. Verify Node.js backend on port 5000.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      severity: isBackendConnected ? "success" : "warning",
      icon: isBackendConnected ? "🟢" : "⚠️",
    });

    requests.forEach((req) => {
      const createdTime = req.createdAt ? new Date(req.createdAt).getTime() : now;
      const ageMinutes = Math.max(0, Math.floor((now - createdTime) / 60000));
      const remainingMinutes = Math.max(0, 10 - ageMinutes);

      if (req.status === "Pending") {
        // Request Arrival notification
        list.push({
          id: `req-arrival-${req.id}`,
          category: "Request Arrival",
          title: `New Booking Request: ${req.id}`,
          message: `${req.userName} requested ${req.resource || req.resourceName} on ${req.date} (${req.time || `${req.startTime} - ${req.endTime}`}) for "${req.purpose}". Priority: ${req.priority || "Normal"}.`,
          timestamp: req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
          severity: "info",
          icon: "📋",
          requestId: req.id,
        });

        // SLA Warning notification
        if (remainingMinutes <= 3 && remainingMinutes > 0) {
          list.push({
            id: `sla-warn-${req.id}`,
            category: "SLA Approaching",
            title: `SLA Warning: ${req.id} expires in ${remainingMinutes}m`,
            message: `Admin review window for ${req.id} has ${remainingMinutes} minute(s) remaining before Autonomous OS Dispatch triggers.`,
            timestamp: "Live Alert",
            severity: "warning",
            icon: "⏳",
            requestId: req.id,
          });
        } else if (remainingMinutes === 0) {
          list.push({
            id: `sla-exp-${req.id}`,
            category: "SLA Expired / OS Dispatched",
            title: `SLA Deadline Reached: ${req.id}`,
            message: `10-minute admin SLA window elapsed. Request is now in the OS Autonomous Dispatch queue.`,
            timestamp: "SLA Expired",
            severity: "purple",
            icon: "⚡",
            requestId: req.id,
          });
        }
      } else if (req.status === "Approved") {
        const isOs = req.allocatedBy === "OS_SCHEDULER" || req.allocatedBy === "AUTONOMOUS_OS_DISPATCH";
        list.push({
          id: `alloc-approved-${req.id}`,
          category: isOs ? "SLA Expired / OS Dispatched" : "System Event",
          title: isOs ? `Autonomous OS Dispatch: ${req.id}` : `Manual Allocation Confirmed: ${req.id}`,
          message: `${req.resource || req.resourceName} was allocated to ${req.userName} for ${req.date} (${req.time || `${req.startTime} - ${req.endTime}`}). Source: ${isOs ? "OS Scheduler (SJF/Aging)" : "Admin Manual"}`,
          timestamp: req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Processed",
          severity: isOs ? "purple" : "success",
          icon: isOs ? "⚡" : "✓",
          requestId: req.id,
        });
      } else if (req.status === "Rejected") {
        list.push({
          id: `req-rej-${req.id}`,
          category: "System Event",
          title: `Booking Request Declined: ${req.id}`,
          message: `Request for ${req.resource || req.resourceName} submitted by ${req.userName} was declined. Remarks: ${req.adminRemarks || "Slot unavailable."}`,
          timestamp: "Processed",
          severity: "danger",
          icon: "✕",
          requestId: req.id,
        });
      }
    });

    return list.filter((n) => !dismissedIds.includes(n.id));
  }, [requests, isBackendConnected, dismissedIds]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "All") return notifications;
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  function handleMarkAllRead() {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem("campus_admin_notifications_read", JSON.stringify(allIds));
  }

  function handleToggleRead(id) {
    let next;
    if (readIds.includes(id)) {
      next = readIds.filter((item) => item !== id);
    } else {
      next = [...readIds, id];
    }
    setReadIds(next);
    localStorage.setItem("campus_admin_notifications_read", JSON.stringify(next));
  }

  function handleClearAll() {
    if (window.confirm("Are you sure you want to dismiss all current notifications?")) {
      const allIds = notifications.map((n) => n.id);
      setDismissedIds(allIds);
      localStorage.setItem("campus_admin_notifications_dismissed", JSON.stringify(allIds));
    }
  }

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", color: "#38bdf8", textTransform: "uppercase" }}>
            Operational Feeds & Real-Time Alerts
          </span>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#0f172a", margin: "4px 0 6px" }}>
            Admin Notification Center
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
            Audit log of incoming booking requests, approaching SLA deadlines, and autonomous OS dispatches.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#1e293b",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "0.84rem",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ✓ Mark All Read
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              color: "#64748b",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "0.84rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Clear Feed
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
        {["All", "Request Arrival", "SLA Approaching", "SLA Expired / OS Dispatched", "System Event"].map((tab) => {
          const count = tab === "All" ? notifications.length : notifications.filter((n) => n.category === tab).length;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              style={{
                background: activeFilter === tab ? "#0284c7" : "#f8fafc",
                color: activeFilter === tab ? "#fff" : "#475569",
                border: `1px solid ${activeFilter === tab ? "#0284c7" : "#e2e8f0"}`,
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "40px", textAlign: "center" }}>
            <span style={{ fontSize: "2rem" }}>🔔</span>
            <h3 style={{ fontSize: "1.1rem", color: "#1e293b", margin: "12px 0 4px" }}>No Notifications In This Category</h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
              Operational alerts will appear here in real time as requests are submitted and processed.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isRead = readIds.includes(n.id);
            return (
              <div
                key={n.id}
                onClick={() => handleToggleRead(n.id)}
                style={{
                  background: isRead ? "#f8fafc" : "#ffffff",
                  borderLeft: `4px solid ${
                    n.severity === "danger"
                      ? "#ef4444"
                      : n.severity === "warning"
                      ? "#f59e0b"
                      : n.severity === "purple"
                      ? "#8b5cf6"
                      : n.severity === "success"
                      ? "#10b981"
                      : "#38bdf8"
                  }`,
                  borderTop: "1px solid #e2e8f0",
                  borderRight: "1px solid #e2e8f0",
                  borderBottom: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  cursor: "pointer",
                  display: "flex",
                  gap: "14px",
                  alignItems: "flex-start",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ fontSize: "1.3rem", marginTop: "2px" }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "0.95rem", color: isRead ? "#475569" : "#0f172a" }}>
                        {n.title}
                      </strong>
                      {!isRead && (
                        <span style={{ background: "#0284c7", width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" }}></span>
                      )}
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{n.timestamp}</span>
                  </div>

                  <p style={{ color: "#475569", fontSize: "0.86rem", margin: "0 0 6px", lineHeight: "1.4" }}>
                    {n.message}
                  </p>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span
                      style={{
                        background: "#e2e8f0",
                        color: "#475569",
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: "600",
                      }}
                    >
                      {n.category}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      Click to {isRead ? "mark unread" : "mark read"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
