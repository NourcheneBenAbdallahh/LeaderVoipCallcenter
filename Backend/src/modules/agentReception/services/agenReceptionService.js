import  pool  from "../../../config/db.js";

export async function findAllAgentsReceptions() {
  try {
    const [rows] = await pool.query("SELECT * FROM agent_reception");
    const [rows2] = await pool.query("SELECT * FROM agent");

    const [countRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN Etat_Compte = 1 THEN 1 ELSE 0 END) AS actifs,
        SUM(CASE WHEN Etat_Compte = 0 THEN 1 ELSE 0 END) AS inactifs
      FROM agent_reception
    `);

    return {
        total: rows.length,
        totalAgent:(rows2.length)+rows.length,

        comptes: countRows[0], 
        agents: rows
    };
  
  } catch (error) {
    console.error("Erreur base de données :", error);
    throw error;
  }
}
