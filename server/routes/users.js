import express from "express";
import { getPool } from "../config/db.js";

const router = express.Router();

// GET /api/users
router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  try {
    const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users
router.post("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id, name, email, role, department } = req.body;
  const userId = id || `STU-2024-${Math.floor(100 + Math.random() * 900)}`;

  try {
    await pool.query(
      `INSERT INTO users (id, name, email, role, department, status)
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      [userId, name, email, role || "Student", department || "Computer Science"]
    );
    res.status(201).json({ id: userId, name, email, role, department, status: "Active" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/users/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE users
       SET status = IF(status = 'Active', 'Suspended', 'Active')
       WHERE id = ?`,
      [id]
    );
    res.json({ success: true, message: "User status toggled." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
