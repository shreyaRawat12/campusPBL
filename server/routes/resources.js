import express from "express";
import { getPool } from "../config/db.js";

const router = express.Router();

// GET /api/resources (with optional ?block=Block+C & ?category=Classroom filters)
router.get("/", async (req, res) => {
  const pool = getPool();
  if (!pool) {
    return res.status(503).json({ error: "Database not connected." });
  }

  const { block, category } = req.query;

  try {
    let query = "SELECT * FROM resources WHERE 1=1";
    const params = [];

    if (block && block !== "All") {
      query += " AND block = ?";
      params.push(block);
    }

    if (category && category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    query += " ORDER BY id ASC";

    const [rows] = await pool.query(query, params);
    const resources = rows.map((r) => ({
      ...r,
      available: Boolean(r.available),
      location: `${r.block}, ${r.floor}`,
      facilities: r.facilities ? r.facilities.split(",").map((s) => s.trim()) : [],
    }));

    res.json(resources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/resources
router.post("/", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { name, block, floor, category, capacity, available, facilities, description } = req.body;
  const facString = Array.isArray(facilities) ? facilities.join(", ") : facilities || "";

  try {
    const [result] = await pool.query(
      `INSERT INTO resources (name, block, floor, category, capacity, available, facilities, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        block || "Block C",
        floor || "Ground Floor",
        category,
        capacity ? Number(capacity) : 60,
        available ?? true,
        facString,
        description || "",
      ]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      block: block || "Block C",
      floor: floor || "Ground Floor",
      location: `${block || "Block C"}, ${floor || "Ground Floor"}`,
      category,
      capacity,
      available: available ?? true,
      facilities: Array.isArray(facilities) ? facilities : facString.split(",").map((s) => s.trim()),
      description,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/resources/:id
router.put("/:id", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;
  const { name, block, floor, category, capacity, available, facilities, description } = req.body;
  const facString = Array.isArray(facilities) ? facilities.join(", ") : facilities || "";

  try {
    await pool.query(
      `UPDATE resources
       SET name = ?, block = ?, floor = ?, category = ?, capacity = ?, available = ?, facilities = ?, description = ?
       WHERE id = ?`,
      [
        name,
        block,
        floor,
        category,
        capacity ? Number(capacity) : 60,
        available ?? true,
        facString,
        description || "",
        id,
      ]
    );

    res.json({ success: true, message: "Resource updated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/resources/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;
  try {
    await pool.query("UPDATE resources SET available = NOT available WHERE id = ?", [id]);
    res.json({ success: true, message: "Status toggled." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/resources/:id
router.delete("/:id", async (req, res) => {
  const pool = getPool();
  if (!pool) return res.status(503).json({ error: "Database not connected." });

  const { id } = req.params;
  try {
    await pool.query("DELETE FROM resources WHERE id = ?", [id]);
    res.json({ success: true, message: "Resource deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
