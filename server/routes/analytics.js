import express from "express";
import { getPool } from "../config/db.js";

const router = express.Router();

// GET /api/analytics
router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  try {
    const [bookings] = await pool.query("SELECT * FROM bookings");
    const [resources] = await pool.query("SELECT * FROM resources");

    const totalBookings = bookings.length;
    const approved = bookings.filter((b) => b.status === "Approved");
    const pending = bookings.filter((b) => b.status === "Pending");
    const rejected = bookings.filter((b) => b.status === "Rejected");
    const cancelled = bookings.filter((b) => b.status === "Cancelled");

    // Allocation source breakdown
    const osAllotted = approved.filter((b) =>
      (b.admin_remarks || "").includes("Auto-Allotted via OS Scheduler")
    );
    const manualAdmin = approved.length - osAllotted.length;

    // Room popularity
    const roomCounts = {};
    for (const b of bookings) {
      const room = b.resource_name || "Unknown";
      roomCounts[room] = (roomCounts[room] || 0) + 1;
    }
    const topVenues = Object.entries(roomCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Block breakdown
    const blockDistribution = {
      "Block C": resources.filter((r) => r.block === "Block C").length,
      "Block E": resources.filter((r) => r.block === "Block E").length,
    };

    // Category breakdown
    const categoryDistribution = resources.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    // Time slot demand
    const timeSlots = {};
    for (const b of bookings) {
      const slot = b.time_display || `${b.start_time} - ${b.end_time}`;
      timeSlots[slot] = (timeSlots[slot] || 0) + 1;
    }
    const peakSlots = Object.entries(timeSlots)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      summary: {
        totalResources: resources.length,
        totalBookings,
        approvedCount: approved.length,
        pendingCount: pending.length,
        rejectedCount: rejected.length,
        cancelledCount: cancelled.length,
        osAllottedCount: osAllotted.length,
        manualAdminCount: manualAdmin,
        approvalRate: totalBookings > 0 ? Math.round((approved.length / totalBookings) * 100) : 0,
      },
      topVenues,
      blockDistribution,
      categoryDistribution,
      peakSlots,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
