import express from "express";
import { getPool } from "../config/db.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { role, credentials } = req.body;
  const pool = getPool();

  if (!role || !credentials) {
    return res.status(400).json({ success: false, message: "Invalid login payload." });
  }

  if (role === "admin") {
    // Strictly check 1203 password
    if (credentials.password !== "1203") {
      return res.status(401).json({
        success: false,
        message: "Incorrect Admin Password! (Password is 1203)",
      });
    }

    const adminUser = {
      id: "ADM-001",
      name: "Campus Resource Admin",
      email: "admin.resources@campus.edu",
      role: "Admin",
      department: "Estate & Facility Management",
    };

    return res.json({ success: true, user: adminUser });
  } else {
    // Student Login
    const name = credentials.name?.trim();
    const studentId = credentials.studentId?.trim().toUpperCase();

    if (!name || !studentId) {
      return res.status(400).json({
        success: false,
        message: "Please enter both Student Name and Student ID.",
      });
    }

    const studentUser = {
      id: studentId,
      name: name,
      email: `${studentId.toLowerCase()}@campus.edu`,
      role: "Student",
      department: credentials.department || "Computer Science",
    };

    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (id, name, email, role, department, status)
           VALUES (?, ?, ?, 'Student', ?, 'Active')
           ON DUPLICATE KEY UPDATE name = VALUES(name), department = VALUES(department)`,
          [studentId, name, studentUser.email, studentUser.department]
        );
      } catch (err) {
        console.error("DB User insert error:", err);
      }
    }

    return res.json({ success: true, user: studentUser });
  }
});

export default router;
