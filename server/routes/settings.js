import express from "express";
import { getPool } from "../config/db.js";

const router = express.Router();

// GET /api/settings
router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  try {
    const [rows] = await pool.query("SELECT * FROM system_settings");
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value === "true" ? true : row.setting_value === "false" ? false : row.setting_value;
      return acc;
    }, {});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings/toggle-auto-approve
router.post("/toggle-auto-approve", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  try {
    const [rows] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'auto_approve_mode'"
    );
    const current = rows[0]?.setting_value === "true";
    const nextVal = (!current).toString();

    await pool.query(
      "UPDATE system_settings SET setting_value = ? WHERE setting_key = 'auto_approve_mode'",
      [nextVal]
    );

    res.json({ auto_approve_mode: !current });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
