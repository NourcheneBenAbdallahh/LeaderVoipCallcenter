import  pool  from "../../../config/db.js";

export async function findAllClients() {
  try {
    const [rows] = await pool.query("SELECT * FROM Client");
    return rows;
  } catch (error) {
    console.error("Erreur récupération clients :", error);
    throw error;
  }
}

export async function findFilteredClients({
  appelsEmisMin = 0,
  appelsEmisMax = 1000000,
  appelsRecusMin = 0,
  appelsRecusMax = 1000000,
}) {
  try {
    const [rows] = await pool.query(
      `
      SELECT * FROM Client
      WHERE NB_appel_Emis BETWEEN ? AND ?
      AND NB_Appel_Recu BETWEEN ? AND ?
      `,
      [appelsEmisMin, appelsEmisMax, appelsRecusMin, appelsRecusMax]
    );
    return rows;
  } catch (error) {
    console.error("Erreur SQL (SELECT) :", error);
    throw error;
  }
}

export async function countFilteredClients({
  appelsEmisMin = 0,
  appelsEmisMax = 1000000,
  appelsRecusMin = 0,
  appelsRecusMax = 1000000,
}) {
  try {
    const [rows] = await pool.query(
      `
      SELECT COUNT(*) AS total FROM Client
      WHERE NB_appel_Emis BETWEEN ? AND ?
      AND NB_Appel_Recu BETWEEN ? AND ?
      `,
      [appelsEmisMin, appelsEmisMax, appelsRecusMin, appelsRecusMax]
    );
    return rows[0].total;
  } catch (error) {
    console.error("Erreur SQL (COUNT) :", error);
    throw error;
  }
}
