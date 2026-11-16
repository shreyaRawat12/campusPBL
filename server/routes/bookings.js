import express from "express";
import { getPool } from "../config/db.js";

const router = express.Router();

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).trim().split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
}

// Helper to parse participants from purpose field
function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

function parsePurposeAndParticipants(rawPurpose) {
  let participants = 1;
  let purpose = String(rawPurpose || "").trim();
  const match = purpose.match(/^\[Participants:\s*(\d+)\]\s*(.*)$/s);
  if (match) {
    participants = parseInt(match[1], 10) || 1;
    purpose = match[2].trim();
  }
  return { participants, purpose };
}

// Determine priority class and weight
function getPriorityClassAndWeight(booking) {
  const p = String(booking.priority || "Normal").toLowerCase();
  const purpose = String(booking.purpose || "").toLowerCase();
  const userRole = String(booking.userRole || booking.user_name || "").toLowerCase();

  // Academic / Examination: High (100)
  if (p === "high" || purpose.includes("exam") || purpose.includes("academic") || purpose.includes("lecture") || userRole.includes("dr.") || userRole.includes("prof")) {
    return { priorityClass: "High (Academic / Exam)", priorityWeight: 100 };
  }

  // Student Hackathon / Workshop: Medium (60)
  if (purpose.includes("hackathon") || purpose.includes("workshop") || purpose.includes("seminar") || purpose.includes("club") || purpose.includes("project")) {
    return { priorityClass: "Medium (Workshop / Hackathon)", priorityWeight: 60 };
  }

  // Casual Group Study / General: Low (30)
  return { priorityClass: "Low (Group Study / General)", priorityWeight: 30 };
}

// Compute OS Hybrid Score: Priority + Aging - SJF Duration Penalty
function computeOsScore(booking, room = null) {
  const { priorityClass, priorityWeight } = getPriorityClassAndWeight(booking);

  // 1. Waiting Time & Aging (Starvation Prevention: +10 pts per 5 mins elapsed)
  const createdMs = booking.created_at ? new Date(booking.created_at).getTime() : Date.now();
  const waitingMinutes = Math.max(0, Math.floor((Date.now() - createdMs) / 60000));
  const agingBonus = 10 * Math.floor(waitingMinutes / 5);

  // 2. Shortest Job First (SJF) Duration Penalty
  const startMin = timeToMinutes(booking.start_time || booking.startTime);
  const endMin = timeToMinutes(booking.end_time || booking.endTime);
  const durationMinutes = Math.max(15, endMin - startMin);
  // Normalized SJF duration penalty (gives shorter jobs preference)
  const durationPenalty = Math.max(1, Math.round(durationMinutes / 10));

  // 3. Composite Final Score
  const finalScore = Math.max(0, priorityWeight + agingBonus - durationPenalty);

  return {
    priorityClass,
    priorityWeight,
    waitingMinutes,
    agingBonus,
    durationMinutes,
    durationPenalty,
    finalScore,
  };
}

// Format human readable time display
function formatDisplay(timeStr) {
  if (!timeStr) return "";
  const [hStr, mStr] = String(timeStr).split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr || "00"} ${ampm}`;
}

// In-memory OS activity log for real system events
const osActivityLogs = [];

export function logOsEvent(eventType, details) {
  osActivityLogs.unshift({
    id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    eventType,
    details,
  });
  if (osActivityLogs.length > 100) {
    osActivityLogs.pop();
  }
}

// Core Autonomous Scheduler Function
export async function executeAutonomousScheduler(pool, forceAllPending = false) {
  if (!pool) return { dispatchCount: 0, logs: [] };

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Fetch pending bookings
    let query = "SELECT * FROM bookings WHERE status = 'Pending'";
    if (!forceAllPending) {
      // 10-Minute SLA window: evaluate only requests where created_at <= (NOW() - 10 MINUTE)
      query += " AND created_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)";
    }
    query += " ORDER BY created_at ASC";

    const [pendingBookings] = await connection.query(query);
    if (!pendingBookings || pendingBookings.length === 0) {
      connection.release();
      return { dispatchCount: 0, logs: [] };
    }

    // 2. Fetch active campus resources
    const [resources] = await connection.query("SELECT * FROM resources WHERE available = 1");

    // 3. Fetch already approved bookings to check slot availability
    const [approvedBookings] = await connection.query(
      "SELECT * FROM bookings WHERE status = 'Approved'"
    );

    let dispatchCount = 0;
    const logs = [];

    // Group pending by date
    const dateGroups = {};
    for (const b of pendingBookings) {
      const dKey = formatDate(b.booking_date);
      if (!dateGroups[dKey]) dateGroups[dKey] = [];
      dateGroups[dKey].push(b);
    }

    for (const [date, requests] of Object.entries(dateGroups)) {
      // Score each request using Hybrid OS Algorithm: Priority + Aging - SJF
      const scoredRequests = requests.map((req) => {
        const scoreDetails = computeOsScore(req);
        return { req, scoreDetails };
      });

      // Sort descending by OS score; tie-breakers: shorter duration, earlier submission, lower ID
      scoredRequests.sort((a, b) => {
        if (b.scoreDetails.finalScore !== a.scoreDetails.finalScore) {
          return b.scoreDetails.finalScore - a.scoreDetails.finalScore;
        }
        if (a.scoreDetails.durationMinutes !== b.scoreDetails.durationMinutes) {
          return a.scoreDetails.durationMinutes - b.scoreDetails.durationMinutes;
        }
        const aCreated = new Date(a.req.created_at).getTime();
        const bCreated = new Date(b.req.created_at).getTime();
        if (aCreated !== bCreated) return aCreated - bCreated;
        return String(a.req.id).localeCompare(String(b.req.id));
      });

      // Process requests in order of priority
      for (const item of scoredRequests) {
        const booking = item.req;
        const score = item.scoreDetails.finalScore;
        const bStart = timeToMinutes(booking.start_time);
        const bEnd = timeToMinutes(booking.end_time);
        const { participants, purpose } = parsePurposeAndParticipants(booking.purpose);

        // Helper to check if a room is free for this slot
        const isRoomFree = (roomId) => {
          return !approvedBookings.some((ab) => {
            if (ab.resource_id !== roomId || formatDate(ab.booking_date) !== date) return false;
            const abStart = timeToMinutes(ab.start_time);
            const abEnd = timeToMinutes(ab.end_time);
            return bStart < abEnd && bEnd > abStart;
          });
        };

        // Best-Fit Memory Partitioning Analogy:
        // Find smallest suitable available room that satisfies:
        // 1. Capacity >= requested participants
        // 2. Is free for the requested time slot
        const origRoom = resources.find((r) => r.id === booking.resource_id);
        const targetCategory = origRoom ? origRoom.category : "Classroom";

        const candidateRooms = resources
          .filter((r) => r.category === targetCategory && r.capacity >= participants && isRoomFree(r.id))
          .sort((r1, r2) => r1.capacity - r2.capacity); // Ascending capacity = Best-Fit

        let allocatedRoom = null;
        if (origRoom && isRoomFree(origRoom.id) && origRoom.capacity >= participants) {
          // If original requested room fits without extreme waste, prefer it
          allocatedRoom = origRoom;
        } else if (candidateRooms.length > 0) {
          allocatedRoom = candidateRooms[0];
        }

        if (allocatedRoom) {
          // Transactional safe allocation to prevent race conditions
          await connection.beginTransaction();

          // Double-check no simultaneous booking was approved for this room
          const [clashCheck] = await connection.query(
            `SELECT id FROM bookings
             WHERE resource_id = ?
               AND booking_date = ?
               AND status = 'Approved'
               AND start_time < ?
               AND end_time > ?
             FOR UPDATE`,
            [allocatedRoom.id, date, booking.end_time, booking.start_time]
          );

          if (clashCheck.length > 0) {
            // Room was locked by another transaction, rollback and re-evaluate
            await connection.rollback();
            continue;
          }

          const remarks = `✓ Auto-Allotted via OS Scheduler (Admin SLA Expired) | Best-Fit: ${allocatedRoom.name} | Score: ${score} (Priority: ${item.scoreDetails.priorityWeight}, Aging: +${item.scoreDetails.agingBonus}, SJF Penalty: -${item.scoreDetails.durationPenalty})`;

          await connection.query(
            `UPDATE bookings
             SET status = 'Approved',
                 resource_id = ?,
                 resource_name = ?,
                 block = ?,
                 floor = ?,
                 queue_position = '—',
                 admin_remarks = ?
             WHERE id = ? AND status = 'Pending'`,
            [
              allocatedRoom.id,
              allocatedRoom.name,
              allocatedRoom.block,
              allocatedRoom.floor,
              remarks,
              booking.id,
            ]
          );

          await connection.commit();

          // Add to memory list so subsequent candidates on this date respect it
          approvedBookings.push({
            id: booking.id,
            resource_id: allocatedRoom.id,
            booking_date: date,
            start_time: booking.start_time,
            end_time: booking.end_time,
          });

          dispatchCount++;
          const logItem = {
            bookingId: booking.id,
            user: booking.user_name,
            allocatedRoom: allocatedRoom.name,
            block: allocatedRoom.block,
            score,
            message: `Auto-Allotted to ${allocatedRoom.name} (${allocatedRoom.block}, Cap: ${allocatedRoom.capacity})`,
          };
          logs.push(logItem);

          logOsEvent("AUTO_ALLOCATION", {
            bookingId: booking.id,
            room: allocatedRoom.name,
            score,
            details: `Allocated to ${allocatedRoom.name} (Best-Fit, Capacity: ${allocatedRoom.capacity}, Requested: ${participants})`,
          });
        } else {
          // No suitable room found: Update queue position to honest "Waiting for Resource"
          await connection.query(
            `UPDATE bookings
             SET queue_position = 'Waiting for Resource',
                 admin_remarks = '⏳ Waiting for Resource: All suitable ${targetCategory} venues occupied during requested slot.'
             WHERE id = ? AND status = 'Pending'`,
            [booking.id]
          );

          logOsEvent("WAITING_FOR_RESOURCE", {
            bookingId: booking.id,
            details: `No suitable ${targetCategory} venue available for ${participants} participants. Request placed in honest wait state.`,
          });
        }
      }
    }

    connection.release();
    return { dispatchCount, logs };
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
      connection.release();
    }
    console.error("OS Scheduler Engine Error:", error);
    return { dispatchCount: 0, logs: [], error: error.message };
  }
}

// GET /api/bookings
router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  try {
    const [rows] = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
    const bookings = rows.map((b) => {
      const { participants, purpose } = parsePurposeAndParticipants(b.purpose);
      const isOs = (b.admin_remarks || "").includes("Auto-Allotted via OS Scheduler");
      const allocatedBy = isOs ? "AUTONOMOUS_OS_DISPATCH" : "MANUAL_ADMIN";

      const createdDate = b.created_at ? new Date(b.created_at) : new Date();
      const slaExpiresAt = new Date(createdDate.getTime() + 10 * 60 * 1000).toISOString();

      return {
        id: b.id,
        resourceId: b.resource_id,
        resource: b.resource_name,
        resourceName: b.resource_name,
        block: b.block || "Block C",
        floor: b.floor || "Ground Floor",
        userName: b.user_name,
        userId: b.user_id,
        department: b.department,
        date: b.booking_date,
        startTime: b.start_time,
        endTime: b.end_time,
        time: b.time_display,
        purpose: purpose,
        rawPurpose: b.purpose,
        priority: b.priority || "Normal",
        status: b.status,
        queue: b.queue_position,
        adminRemarks: b.admin_remarks || "",
        allocatedBy,
        participants,
        slaExpiresAt,
        createdAt: b.created_at,
      };
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/os-monitor (Live OS Scheduler Monitor endpoint)
router.get("/os-monitor", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  try {
    const [allBookings] = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC");
    const [resources] = await pool.query("SELECT * FROM resources WHERE available = 1");

    const pending = allBookings.filter((b) => b.status === "Pending");
    const approved = allBookings.filter((b) => b.status === "Approved");
    const autoAllotted = approved.filter((b) => (b.admin_remarks || "").includes("Auto-Allotted via OS Scheduler"));
    const waitingForResource = pending.filter((b) => b.queue_position === "Waiting for Resource");

    // Calculate queue breakdown with OS score formula details
    const queue = pending.map((b, idx) => {
      const { participants, purpose } = parsePurposeAndParticipants(b.purpose);
      const scoreDetails = computeOsScore(b);
      const createdMs = new Date(b.created_at).getTime();
      const elapsedMs = Date.now() - createdMs;
      const remainingSlaSec = Math.max(0, Math.floor((600000 - elapsedMs) / 1000));

      const slaStatus = remainingSlaSec > 0
        ? `Active (${Math.floor(remainingSlaSec / 60)}:${String(remainingSlaSec % 60).padStart(2, "0")})`
        : "Expired (OS Dispatch Eligible)";

      return {
        queuePosition: idx + 1,
        id: b.id,
        userName: b.user_name,
        room: b.resource_name,
        purpose,
        participants,
        date: b.booking_date,
        time: b.time_display,
        priorityClass: scoreDetails.priorityClass,
        priorityWeight: scoreDetails.priorityWeight,
        waitingMinutes: scoreDetails.waitingMinutes,
        agingBonus: scoreDetails.agingBonus,
        durationMinutes: scoreDetails.durationMinutes,
        durationPenalty: scoreDetails.durationPenalty,
        finalScore: scoreDetails.finalScore,
        slaStatus,
        decision: b.queue_position === "Waiting for Resource"
          ? "Waiting for Resource"
          : remainingSlaSec <= 0
          ? "Ready for Autonomous Dispatch"
          : "Under Admin SLA Review",
      };
    });

    // Sort queue by final score
    queue.sort((a, b) => b.finalScore - a.finalScore);

    // Calculate average wait time
    const avgWaitMinutes = queue.length > 0
      ? Math.round(queue.reduce((acc, q) => acc + q.waitingMinutes, 0) / queue.length)
      : 0;

    // Recent scheduler decisions
    const recentDecisions = autoAllotted.slice(0, 10).map((b) => {
      const { participants, purpose } = parsePurposeAndParticipants(b.purpose);
      return {
        id: b.id,
        user: b.user_name,
        room: b.resource_name,
        date: b.booking_date,
        time: b.time_display,
        purpose,
        participants,
        adminRemarks: b.admin_remarks,
        createdAt: b.created_at,
      };
    });

    res.json({
      summary: {
        queueCount: pending.length,
        requestsProcessed: approved.length,
        autoAllottedCount: autoAllotted.length,
        waitingCount: waitingForResource.length,
        avgWaitMinutes,
      },
      queue,
      recentDecisions,
      activityLog: osActivityLogs.slice(0, 30),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings (Submit new booking request)
router.post("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const {
    resourceId,
    resourceName,
    userName,
    userId,
    department,
    date,
    startTime,
    endTime,
    purpose,
    priority = "Normal",
    participants = 1,
  } = req.body;

  if (!resourceId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "Missing required booking fields." });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Conflict Check: verify no Approved booking clashes with requested slot
    const [clashes] = await connection.query(
      `SELECT * FROM bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND status = 'Approved'
         AND start_time < ?
         AND end_time > ?`,
      [resourceId, date, endTime, startTime]
    );

    if (clashes.length > 0) {
      connection.release();
      const clash = clashes[0];
      return res.status(409).json({
        error: `Schedule conflict: Resource is already booked by ${clash.user_name} (${clash.department}) for ${clash.time_display}.`,
      });
    }

    // 2. Lookup resource details (block & floor)
    const [resRows] = await connection.query("SELECT * FROM resources WHERE id = ?", [resourceId]);
    const matchedResource = resRows[0] || null;
    const finalBlock = matchedResource ? matchedResource.block : "Block C";
    const finalFloor = matchedResource ? matchedResource.floor : "Ground Floor";
    const finalName = matchedResource ? matchedResource.name : resourceName;

    // 3. Format human readable time display
    const timeDisplay = `${formatDisplay(startTime)} – ${formatDisplay(endTime)}`;

    // 4. Generate Request ID
    const [countRows] = await connection.query("SELECT COUNT(*) as total FROM bookings");
    const nextId = `REQ-${1000 + (countRows[0]?.total || 0) + 1}`;

    // Calculate queue position
    const [pendingRows] = await connection.query(
      "SELECT COUNT(*) as count FROM bookings WHERE resource_id = ? AND booking_date = ? AND status = 'Pending'",
      [resourceId, date]
    );
    const queuePos = String((pendingRows[0]?.count || 0) + 1);

    // Encode participants into purpose text without schema alteration
    const finalPurpose = `[Participants: ${Number(participants) || 1}] ${purpose || ""}`;
    const safePriority = priority === "High" ? "High" : "Normal";

    await connection.query(
      `INSERT INTO bookings (
        id, resource_id, resource_name, block, floor,
        user_id, user_name, department, booking_date,
        start_time, end_time, time_display, purpose,
        priority, status, queue_position, admin_remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, '')`,
      [
        nextId,
        resourceId,
        finalName,
        finalBlock,
        finalFloor,
        userId || "STU-2024-089",
        userName || "Student User",
        department || "Computer Science",
        date,
        startTime,
        endTime,
        timeDisplay,
        finalPurpose,
        safePriority,
        queuePos,
      ]
    );

    connection.release();

    logOsEvent("REQUEST_SUBMITTED", {
      bookingId: nextId,
      room: finalName,
      user: userName,
      details: `10-Minute Admin SLA review timer started.`,
    });

    const now = new Date();
    res.status(201).json({
      id: nextId,
      resourceId,
      resource: finalName,
      resourceName: finalName,
      block: finalBlock,
      floor: finalFloor,
      userName: userName || "Student User",
      userId: userId || "STU-2024-089",
      department: department || "Computer Science",
      date,
      startTime,
      endTime,
      time: timeDisplay,
      purpose,
      priority: safePriority,
      status: "Pending",
      queue: queuePos,
      adminRemarks: "",
      allocatedBy: "MANUAL_ADMIN",
      participants: Number(participants) || 1,
      slaExpiresAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
    });
  } catch (error) {
    if (connection) connection.release();
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings/auto-dispatch (Manual or Periodic trigger for OS Scheduler)
router.post("/auto-dispatch", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const forceAll = req.body?.forceAll || req.body?.force || false;
  try {
    const result = await executeAutonomousScheduler(pool, forceAll);
    res.json({
      success: true,
      dispatchCount: result.dispatchCount,
      logs: result.logs,
      message: `OS Scheduler processed queue. ${result.dispatchCount} bookings allocated.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bookings/:id/approve (Manual Admin Approval)
router.patch("/:id/approve", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;
  const { remarks = "Approved by Campus Admin" } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if request exists and is Pending
    const [existing] = await connection.query("SELECT * FROM bookings WHERE id = ? FOR UPDATE", [id]);
    if (existing.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ error: "Booking request not found." });
    }

    const b = existing[0];

    // Conflict check
    const [conflicts] = await connection.query(
      `SELECT * FROM bookings
       WHERE resource_id = ?
         AND booking_date = ?
         AND status = 'Approved'
         AND id != ?
         AND start_time < ?
         AND end_time > ?`,
      [b.resource_id, b.booking_date, id, b.end_time, b.start_time]
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({
        error: `Cannot approve: Venue has conflicting approved booking (${conflicts[0].id} for ${conflicts[0].user_name}).`,
      });
    }

    const finalRemarks = remarks ? `Approved by Campus Admin: ${remarks}` : "Approved by Campus Admin";

    await connection.query(
      `UPDATE bookings
       SET status = 'Approved',
           queue_position = '—',
           admin_remarks = ?
       WHERE id = ?`,
      [finalRemarks, id]
    );

    await connection.commit();
    connection.release();

    logOsEvent("MANUAL_APPROVAL", {
      bookingId: id,
      room: b.resource_name,
      details: finalRemarks,
    });

    res.json({ success: true, message: `Booking ${id} approved.` });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
      connection.release();
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bookings/:id/reject (Manual Admin Rejection)
router.patch("/:id/reject", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;
  const { remarks = "Declined due to facility constraints." } = req.body;

  try {
    const finalRemarks = remarks ? `Declined by Admin: ${remarks}` : "Declined by Admin";
    await pool.query(
      `UPDATE bookings
       SET status = 'Rejected',
           queue_position = '—',
           admin_remarks = ?
       WHERE id = ?`,
      [finalRemarks, id]
    );

    logOsEvent("MANUAL_REJECTION", {
      bookingId: id,
      details: finalRemarks,
    });

    res.json({ success: true, message: `Booking ${id} rejected.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/bookings/:id/cancel (Student cancellation)
router.patch("/:id/cancel", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE bookings
       SET status = 'Cancelled',
           queue_position = '—',
           admin_remarks = 'Cancelled by applicant'
       WHERE id = ?`,
      [id]
    );

    logOsEvent("BOOKING_CANCELLED", {
      bookingId: id,
      details: "Request cancelled by applicant.",
    });

    res.json({ success: true, message: `Booking ${id} cancelled.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
