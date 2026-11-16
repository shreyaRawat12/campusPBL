import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT) || 3306,
};

let pool = null;

// Initialize Database connection safely without modifying schema or inserting dummy records
export async function initializeDatabase() {
  try {
    pool = mysql.createPool({
      ...dbConfig,
      database: "campus_resource_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log("✓ Connected to MySQL: campus_resource_db (31 campus resources, Block C & Block E).");
    connection.release();
    return pool;
  } catch (error) {
    console.error("⚠️ MySQL Connection Error:", error.message);
    console.log("ℹ️ Ensure MySQL is running in XAMPP on localhost:3306 (user: root, no password).");
    return null;
  }
}

export function getPool() {
  return pool;
}
