import { pool } from "../../../config/db.js";

export async function findAllAgents() {
  try {
    const [rows] = await pool.query("SELECT * FROM agent");
    return rows;
  } catch (error) {
    console.error("Erreur base de données :", error);
    throw error;
  }
}
