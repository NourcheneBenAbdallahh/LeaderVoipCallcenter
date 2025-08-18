import { pool } from "../../../config/db.js";

export async function findAllAffectation() {
  try {
    const [rows] = await pool.query("SELECT * FROM journal_appels");
    return rows;
  } catch (error) {
    console.error("Erreur base de données :", error);
    throw error;
  }
}
