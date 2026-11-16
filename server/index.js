import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase, getPool } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import resourceRoutes from "./routes/resources.js";
import bookingRoutes, { executeAutonomousScheduler } from "./routes/bookings.js";
import userRoutes from "./routes/users.js";
import settingsRoutes from "./routes/settings.js";
import analyticsRoutes from "./routes/analytics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    timestamp: new Date().toISOString(),
    database: "MySQL (campus_resource_db)",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Start Server
async function startServer() {
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 Campus Resource Backend running on http://localhost:${PORT}`);
    console.log(`📦 Database: MySQL (campus_resource_db)`);
    console.log(`📡 Endpoints active: /api/auth, /api/resources, /api/bookings, /api/users`);
    console.log(`🧠 OS Autonomous Scheduler Daemon: Active (30s SLA Watchdog)`);
    console.log(`=================================================`);
  });

  // OS Background Watchdog: Auto-evaluates SLA expirations every 30 seconds
  setInterval(async () => {
    const pool = getPool();
    if (pool) {
      try {
        const result = await executeAutonomousScheduler(pool, false);
        if (result.dispatchCount > 0) {
          console.log(`[OS-SCHEDULER] ⚡ Dispatched ${result.dispatchCount} expired bookings to optimal resources.`);
        }
      } catch (err) {
        // Silent catch for background heartbeat
      }
    }
  }, 30000);
}

startServer();
