import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { initialResources } from "../data/mockData";
import { api } from "../services/api";
import { runAutonomousScheduler, DEFAULT_SLA_SECONDS } from "../utils/osScheduler";

const CampusContext = createContext();

const STORAGE_KEYS = {
  RESOURCES: "campus_pbl_resources_v6",
  REQUESTS: "campus_pbl_requests_v6",
  USERS: "campus_pbl_users_v6",
  AUTH_USER: "campus_pbl_auth_user_v6",
  AUTO_APPROVE: "campus_pbl_auto_approve_v6",
  READ_NOTIFICATIONS: "campus_pbl_read_notifs_v6",
};

export function CampusProvider({ children }) {
  // Clear any old legacy cache versions to strictly enforce zero dummy data policy
  useEffect(() => {
    try {
      [
        "campus_pbl_resources_v1", "campus_pbl_resources_v2", "campus_pbl_resources_v3",
        "campus_pbl_resources_v4", "campus_pbl_resources_v5",
        "campus_pbl_requests_v1", "campus_pbl_requests_v2", "campus_pbl_requests_v3",
        "campus_pbl_requests_v4", "campus_pbl_requests_v5",
      ].forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      // Ignore
    }
  }, []);

  // 1. Current logged-in user (null by default so user MUST login first)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [loginPromptRole, setLoginPromptRole] = useState("user");

  // 2. Auto-Approval Toggle
  const [autoApproveMode, setAutoApproveMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTO_APPROVE);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return false;
  });

  // 3. Resources list (Strictly 31 real venues in Block C & Block E)
  const [resources, setResources] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESOURCES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 25) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return initialResources;
  });

  // 4. Requests list: STRICT ZERO DUMMY DATA.
  // Defaults to empty array []. Only genuine records from MySQL database are shown.
  const [requests, setRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 5. Users list
  const [users, setUsers] = useState([]);

  // 6. Real MySQL backend status indicator
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // 7. Track read notification IDs
  const [readNotifIds, setReadNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.READ_NOTIFICATIONS);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {}
    return new Set();
  });

  // Sync with real MySQL backend on load and periodic refresh
  const syncWithBackend = useCallback(async () => {
    const health = await api.checkHealth();
    if (health.success && health.data?.status === "online") {
      setIsBackendConnected(true);

      const [resRes, resBook, resUsers, resSettings] = await Promise.all([
        api.getResources(),
        api.getBookings(),
        api.getUsers(),
        api.getSettings(),
      ]);

      if (resRes.success && Array.isArray(resRes.data) && resRes.data.length >= 25) {
        setResources(resRes.data);
      }
      if (resBook.success && Array.isArray(resBook.data)) {
        setRequests(resBook.data);
      }
      if (resUsers.success && Array.isArray(resUsers.data)) {
        setUsers(resUsers.data);
      }
      if (resSettings.success && typeof resSettings.data.auto_approve_mode === "boolean") {
        setAutoApproveMode(resSettings.data.auto_approve_mode);
      }
    } else {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
    const pollInterval = setInterval(() => {
      syncWithBackend();
    }, 10000); // 10s live sync
    return () => clearInterval(pollInterval);
  }, [syncWithBackend]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_APPROVE, JSON.stringify(autoApproveMode));
    } catch (e) {}
  }, [autoApproveMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(resources));
    } catch (e) {}
  }, [resources]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
    } catch (e) {}
  }, [requests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.READ_NOTIFICATIONS, JSON.stringify(Array.from(readNotifIds)));
    } catch (e) {}
  }, [readNotifIds]);

  // ============================================================
  // NOTIFICATIONS GENERATOR (Purely derived from genuine DB state)
  // ============================================================
  const notifications = useMemo(() => {
    if (!requests || requests.length === 0) return [];

    const list = [];
    const targetUserId = user?.id;
    const isAdmin = user?.role === "Admin";

    const userRequests = isAdmin
      ? requests
      : requests.filter((r) => String(r.userId) === String(targetUserId));

    userRequests.forEach((req) => {
      const roomName = req.resource || req.resourceName || "Venue";

      // 1. Submission notice
      list.push({
        id: `notif-sub-${req.id}`,
        requestId: req.id,
        title: "Request Submitted",
        message: `Your booking request for ${roomName} (${req.date}, ${req.time}) was submitted. 10-Minute Admin SLA review timer is active.`,
        type: "info",
        timestamp: req.createdAt || new Date().toISOString(),
        isRead: readNotifIds.has(`notif-sub-${req.id}`),
      });

      // 2. Decision notice
      if (req.status === "Approved") {
        const isOs = (req.adminRemarks || "").includes("Auto-Allotted via OS Scheduler") || req.allocatedBy === "AUTONOMOUS_OS_DISPATCH";
        list.push({
          id: `notif-app-${req.id}`,
          requestId: req.id,
          title: isOs ? "Auto-Allotted via OS Scheduler" : "Admin Approved",
          message: isOs
            ? `✓ Booking for ${roomName} on ${req.date} was auto-allotted by the OS Scheduler after Admin SLA elapsed.`
            : `✓ Booking for ${roomName} on ${req.date} has been approved by Campus Admin. ${req.adminRemarks || ""}`,
          type: isOs ? "os" : "success",
          timestamp: req.createdAt || new Date().toISOString(),
          isRead: readNotifIds.has(`notif-app-${req.id}`),
        });
      } else if (req.status === "Rejected") {
        list.push({
          id: `notif-rej-${req.id}`,
          requestId: req.id,
          title: "Request Declined",
          message: `Booking request for ${roomName} was declined. Reason: ${req.adminRemarks || "Facility conflict."}`,
          type: "error",
          timestamp: req.createdAt || new Date().toISOString(),
          isRead: readNotifIds.has(`notif-rej-${req.id}`),
        });
      } else if (req.status === "Cancelled") {
        list.push({
          id: `notif-can-${req.id}`,
          requestId: req.id,
          title: "Booking Cancelled",
          message: `Booking request ${req.id} for ${roomName} was cancelled.`,
          type: "warning",
          timestamp: req.createdAt || new Date().toISOString(),
          isRead: readNotifIds.has(`notif-can-${req.id}`),
        });
      } else if (req.status === "Pending") {
        // Check if SLA has expired
        const createdMs = new Date(req.createdAt).getTime();
        const elapsedMin = (Date.now() - createdMs) / 60000;
        if (elapsedMin >= 10) {
          list.push({
            id: `notif-sla-${req.id}`,
            requestId: req.id,
            title: "Admin SLA Expired",
            message: `10-Minute review expired for ${req.id}. Autonomous OS Scheduler is evaluating candidate rooms.`,
            type: "warning",
            timestamp: req.createdAt || new Date().toISOString(),
            isRead: readNotifIds.has(`notif-sla-${req.id}`),
          });
        }
      }
    });

    // Sort newest first
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [requests, user, readNotifIds]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const markNotificationAsRead = (id) => {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    setReadNotifIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  };

  // ============================================================
  // OS SCHEDULER: Autonomous SLA Evaluation Loop
  // ============================================================
  const triggerOsScheduler = useCallback(async (forceAll = false) => {
    if (isBackendConnected) {
      try {
        const res = await api.triggerAutoDispatch(forceAll);
        if (res.success) {
          const fresh = await api.getBookings();
          if (fresh.success && Array.isArray(fresh.data)) {
            setRequests(fresh.data);
          }
          return {
            dispatchCount: res.data?.dispatchCount || 0,
            dispatchLogs: res.data?.logs || [],
          };
        }
      } catch (err) {
        console.error("Backend AutoDispatch error:", err);
      }
    }

    const result = runAutonomousScheduler(requests, resources, DEFAULT_SLA_SECONDS);
    if (result.dispatchCount > 0) {
      setRequests(result.updatedRequests);
    }
    return result;
  }, [isBackendConnected, requests, resources]);

  useEffect(() => {
    const interval = setInterval(() => {
      triggerOsScheduler(false);
    }, 15000); // 15-second tick

    return () => clearInterval(interval);
  }, [triggerOsScheduler]);

  // ============================================================
  // AUTHENTICATION
  // ============================================================
  async function login(role, credentials) {
    if (role === "admin") {
      if (credentials.password !== "1203") {
        return {
          success: false,
          message: "Incorrect Admin Password! (Default is 1203)",
        };
      }

      const adminUser = {
        id: "ADM-001",
        name: "Campus Resource Admin",
        email: "admin.resources@campus.edu",
        role: "Admin",
        department: "Estate & Facility Management",
      };
      setUser(adminUser);
      api.login(role, credentials);
      return { success: true, user: adminUser };
    } else {
      const studentName = credentials.name?.trim();
      const studentId = credentials.studentId?.trim().toUpperCase();

      if (!studentName || !studentId) {
        return {
          success: false,
          message: "Please enter both Student Name and Student ID.",
        };
      }

      const studentUser = {
        id: studentId,
        name: studentName,
        email: `${studentId.toLowerCase()}@campus.edu`,
        role: "Student",
        department: credentials.department || "Computer Science",
      };

      setUser(studentUser);
      api.login(role, credentials);
      return { success: true, user: studentUser };
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }

  function switchRole(targetRole) {
    logout();
    setLoginPromptRole(targetRole === "Admin" ? "admin" : "user");
  }

  // Conflict Checking
  function parseTimeToMinutes(t) {
    if (!t) return 0;
    const parts = t.trim().split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
  }

  function checkConflict(resourceId, date, startTime, endTime, excludeRequestId = null) {
    const newStart = parseTimeToMinutes(startTime);
    const newEnd = parseTimeToMinutes(endTime);

    const approvedClashes = requests.filter((r) => {
      if (r.id === excludeRequestId) return false;
      if (String(r.resourceId) !== String(resourceId)) return false;
      if (r.date !== date) return false;
      if (r.status !== "Approved") return false;

      const rStart = parseTimeToMinutes(r.startTime || "00:00");
      const rEnd = parseTimeToMinutes(r.endTime || "23:59");

      return newStart < rEnd && newEnd > rStart;
    });

    if (approvedClashes.length > 0) {
      const clash = approvedClashes[0];
      return {
        hasConflict: true,
        type: "APPROVED_CLASH",
        message: `Venue is already booked by ${clash.userName} (${clash.department}) for ${clash.time}.`,
        clash,
      };
    }

    return { hasConflict: false };
  }

  // Add Booking Request
  async function addBookingRequest(form) {
    const conflict = checkConflict(
      form.resourceId,
      form.date,
      form.startTime,
      form.endTime
    );

    if (conflict.hasConflict) {
      throw new Error(conflict.message);
    }

    if (isBackendConnected) {
      const payload = {
        ...form,
        userName: user ? user.name : "Student User",
        userId: user ? user.id : "STU-2024-089",
        department: form.department || (user ? user.department : "Computer Science"),
        participants: form.participants || 1,
      };

      const apiRes = await api.createBooking(payload);
      if (apiRes.success && apiRes.data) {
        setRequests((prev) => [apiRes.data, ...prev.filter((r) => r.id !== apiRes.data.id)]);
        return apiRes.data;
      } else if (apiRes.error) {
        throw new Error(apiRes.error);
      }
    }

    const formatTimeDisplay = (time24) => {
      if (!time24) return "";
      const [hStr, mStr] = time24.split(":");
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${String(h).padStart(2, "0")}:${mStr || "00"} ${ampm}`;
    };

    const formattedTime = `${formatTimeDisplay(form.startTime)} – ${formatTimeDisplay(form.endTime)}`;
    const now = Date.now();
    const newRequest = {
      id: `REQ-${1000 + requests.length + 1}`,
      resourceId: form.resourceId,
      resource: form.resourceName,
      resourceName: form.resourceName,
      category: form.resourceType,
      block: form.block,
      floor: form.floor,
      userName: user ? user.name : "Student User",
      userId: user ? user.id : "STU-2024-089",
      userRole: user ? user.role : "Student",
      department: form.department || (user ? user.department : "Computer Science"),
      date: form.date,
      time: formattedTime,
      startTime: form.startTime,
      endTime: form.endTime,
      participants: form.participants || 1,
      purpose: form.purpose,
      priority: form.priority || "Normal",
      status: "Pending",
      queue: "1",
      allocatedBy: "MANUAL_ADMIN",
      adminRemarks: "",
      slaExpiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
      createdAt: new Date(now).toISOString(),
    };

    setRequests((prev) => [newRequest, ...prev]);
    return newRequest;
  }

  // Admin Actions
  async function approveRequest(requestId, remarks = "") {
    if (isBackendConnected) {
      await api.approveBooking(requestId, remarks);
    }
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: "Approved",
            queue: "—",
            allocatedBy: "MANUAL_ADMIN",
            adminRemarks: remarks || "Approved by Campus Admin",
          };
        }
        return r;
      })
    );
  }

  async function rejectRequest(requestId, remarks = "Request not aligned with campus schedule.") {
    if (isBackendConnected) {
      await api.rejectBooking(requestId, remarks);
    }
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: "Rejected",
            queue: "—",
            adminRemarks: remarks,
          };
        }
        return r;
      })
    );
  }

  async function cancelRequest(requestId) {
    if (isBackendConnected) {
      await api.cancelBooking(requestId);
    }
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: "Cancelled",
            queue: "—",
            adminRemarks: "Cancelled by student",
          };
        }
        return r;
      })
    );
  }

  function toggleAutoApproveMode() {
    setAutoApproveMode((prev) => !prev);
    api.toggleAutoApprove().catch(console.error);
  }

  function addResource(resourceData) {
    const newId = resources.length > 0 ? Math.max(...resources.map((r) => Number(r.id) || 0)) + 1 : 1;
    const newResource = {
      id: newId,
      name: resourceData.name,
      block: resourceData.block || "Block C",
      floor: resourceData.floor || "Ground Floor",
      location: `${resourceData.block || "Block C"}, ${resourceData.floor || "Ground Floor"}`,
      category: resourceData.category || "Classroom",
      capacity: resourceData.capacity ? Number(resourceData.capacity) : 80,
      available: resourceData.available ?? true,
      facilities: resourceData.facilities || [],
      description: resourceData.description || "",
    };

    setResources((prev) => [newResource, ...prev]);
    api.addResource(resourceData).catch(console.error);
    return newResource;
  }

  function updateResource(id, updatedData) {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedData } : r))
    );
    api.updateResource(id, updatedData).catch(console.error);
  }

  function toggleResourceAvailability(id) {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, available: !r.available } : r))
    );
    api.toggleResource(id).catch(console.error);
  }

  function deleteResource(id) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    api.deleteResource(id).catch(console.error);
  }

  function addUser(userData) {
    const newUser = {
      id: userData.id || `STU-2024-${Math.floor(100 + Math.random() * 900)}`,
      name: userData.name,
      email: userData.email,
      role: userData.role || "Student",
      department: userData.department || "Computer Science",
      status: "Active",
    };
    setUsers((prev) => [newUser, ...prev]);
    api.addUser(newUser).catch(console.error);
    return newUser;
  }

  function toggleUserStatus(userId) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" }
          : u
      )
    );
    api.toggleUser(userId).catch(console.error);
  }

  return (
    <CampusContext.Provider
      value={{
        user,
        resources,
        requests,
        users,
        autoApproveMode,
        loginPromptRole,
        isBackendConnected,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        triggerOsScheduler,
        toggleAutoApproveMode,
        login,
        logout,
        switchRole,
        checkConflict,
        addBookingRequest,
        approveRequest,
        rejectRequest,
        cancelRequest,
        addResource,
        updateResource,
        toggleResourceAvailability,
        deleteResource,
        addUser,
        toggleUserStatus,
        refreshData: syncWithBackend,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error("useCampus must be used within a CampusProvider");
  }
  return context;
}
