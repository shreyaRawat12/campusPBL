// ============================================================
// OS RESOURCE & JOB SCHEDULER ENGINE
// Applies Operating System Scheduling Algorithms:
// 1. Shortest Job First (SJF)
// 2. Priority Scheduling + Aging (Starvation Prevention)
// 3. Best-Fit Memory Partitioning (Capacity Matching)
// 4. SLA Expiration Auto-Dispatcher
// ============================================================

export const DEFAULT_SLA_SECONDS = 600; // 10 minutes default SLA

// Helper to convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
}

// Calculate remaining SLA in seconds
export function getRemainingSlaSeconds(createdAt, slaLimitSeconds = DEFAULT_SLA_SECONDS) {
  if (!createdAt) return 0;
  const createdMs = new Date(createdAt).getTime();
  const nowMs = Date.now();
  const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  return Math.max(0, slaLimitSeconds - elapsedSeconds);
}

// Format seconds into MM:SS
export function formatTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Computes composite OS Job Scheduling Score for a pending request:
 * - Priority: High = 100, Normal = 40
 * - Shortest Job First (SJF): Shorter duration gets higher bonus (up to 80 pts)
 * - Aging: Requests waiting longer gain score to prevent starvation (2 pts per min, up to 60 pts)
 * - Best-Fit Capacity Penalty: Penalizes severe mismatch between participants and room capacity
 */
export function calculateJobScore(request, room) {
  // 1. Base Priority
  const priorityScore = request.priority === "High" ? 100 : 40;

  // 2. Shortest Job First (SJF)
  const start = timeToMinutes(request.startTime);
  const end = timeToMinutes(request.endTime);
  const durationMinutes = Math.max(15, end - start);
  // Max 80 pts bonus for <= 45 min sessions; drops for longer bookings
  const sjfBonus = Math.max(0, Math.round((240 - durationMinutes) * 0.35));

  // 3. Aging (Anti-Starvation)
  const createdMs = request.createdAt || request.submittedAt ? new Date(request.createdAt || request.submittedAt).getTime() : Date.now();
  const waitingMinutes = Math.floor((Date.now() - createdMs) / (1000 * 60));
  const agingBonus = Math.min(60, waitingMinutes * 3);

  // 4. Best-Fit Capacity Matching
  let capacityPenalty = 0;
  if (room && room.capacity) {
    const participants = Number(request.participants) || 40;
    const wastedSeats = room.capacity - participants;
    if (wastedSeats > 0) {
      // Small penalty if room is way too large (e.g. 30 students in 100-seater)
      capacityPenalty = Math.min(30, Math.round(wastedSeats * 0.25));
    }
  }

  const finalScore = Math.round(priorityScore + sjfBonus + agingBonus - capacityPenalty);
  return {
    finalScore,
    durationMinutes,
    sjfBonus,
    agingBonus,
    capacityPenalty,
  };
}

/**
 * Autonomous OS Scheduler:
 * Evaluates pending requests where SLA has expired or auto-dispatch is triggered.
 * Resolves conflicts by granting the room to the candidate with the highest OS Score.
 */
export function runAutonomousScheduler(requests, resources, slaLimitSeconds = DEFAULT_SLA_SECONDS) {
  const updatedRequests = [...requests];
  let dispatchCount = 0;
  const dispatchLogs = [];

  // 1. Find all pending requests whose 10-minute SLA has expired
  const expiredPending = updatedRequests.filter((req) => {
    if (req.status !== "Pending") return false;
    const remaining = getRemainingSlaSeconds(req.createdAt || req.submittedAt, slaLimitSeconds);
    return remaining <= 0;
  });

  if (expiredPending.length === 0) {
    return { updatedRequests, dispatchCount: 0, dispatchLogs: [] };
  }

  // 2. Group by Resource and Date to detect conflicting requests
  const groups = {};
  expiredPending.forEach((req) => {
    const key = `${req.resourceId || req.resourceName}_${req.date}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(req);
  });

  // 3. Process each group
  Object.keys(groups).forEach((key) => {
    const groupReqs = groups[key];
    const targetRoom = resources.find((r) => String(r.id) === String(groupReqs[0].resourceId)) || null;

    // Score all requests in this group
    const scoredList = groupReqs.map((req) => ({
      req,
      scoreDetails: calculateJobScore(req, targetRoom),
    }));

    // Sort descending by OS score
    scoredList.sort((a, b) => b.scoreDetails.finalScore - a.scoreDetails.finalScore);

    // Attempt allocation for highest scoring candidate
    scoredList.forEach(({ req, scoreDetails }) => {
      const startMin = timeToMinutes(req.startTime);
      const endMin = timeToMinutes(req.endTime);

      // Check if this slot conflicts with an ALREADY APPROVED booking
      const hasConflict = updatedRequests.some((existing) => {
        if (existing.id === req.id) return false;
        if (String(existing.resourceId) !== String(req.resourceId)) return false;
        if (existing.date !== req.date) return false;
        if (existing.status !== "Approved") return false;

        const exStart = timeToMinutes(existing.startTime);
        const exEnd = timeToMinutes(existing.endTime);
        return startMin < exEnd && endMin > exStart;
      });

      if (!hasConflict) {
        // Safe State: Auto-allocate via OS Scheduler!
        const index = updatedRequests.findIndex((r) => r.id === req.id);
        if (index !== -1) {
          updatedRequests[index] = {
            ...updatedRequests[index],
            status: "Approved",
            queue: "—",
            allocatedBy: "OS_SCHEDULER",
            adminRemarks: `⚡ Auto-Allocated via OS Scheduler (10-Min SLA Expired · SJF+Priority Score: ${scoreDetails.finalScore})`,
          };
          dispatchCount++;
          dispatchLogs.push({
            id: req.id,
            room: req.resource || req.resourceName,
            user: req.userName,
            score: scoreDetails.finalScore,
            reason: `SJF Duration: ${scoreDetails.durationMinutes}m | Priority: ${req.priority}`,
          });
        }
      }
    });
  });

  return {
    updatedRequests,
    dispatchCount,
    dispatchLogs,
  };
}
