import { pool } from "../../../config/db.js";

export async function findAllAgentsReceptions() {
  try {
    const [rows] = await pool.query("SELECT * FROM agent_reception");
    return rows;
  } catch (error) {
    console.error("Erreur base de données :", error);
    throw error;
  }
}
