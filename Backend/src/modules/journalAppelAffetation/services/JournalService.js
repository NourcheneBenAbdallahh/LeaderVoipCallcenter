import  pool  from "../../../config/db.js";

export async function findAllAffectation() {
  try {
    const [rows] = await pool.query("SELECT * FROM Journal_Appels");
    return rows;
  } catch (error) {
    console.error("Erreur base de données :", error);
    throw error;
  }
}
