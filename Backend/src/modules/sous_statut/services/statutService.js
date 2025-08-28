import  pool  from "../../../config/db.js";

export async function findAllStatut() {
  try {
    const [rows] = await pool.query("SELECT * FROM Sous_Status");
    return rows;
  } catch (error) {
    console.error("Erreur récupération datastatut :", error);
    throw error;
  }
}

export async function findAllSousStatut() {
  try {
    const [rows] = await pool.query("SELECT Sous_Statut FROM Sous_Status");
    return rows;
  } catch (error) {
    console.error("Erreur récupération sous_status :", error);
    throw error;
  }
}

//exclure aappelr

export async function findStatuts() {
  try {
    const [rows] = await pool.query("SELECT * FROM Sous_Status WHERE Sous_Statut <> 'À appeler'");
    return rows;
  } catch (error) {
    console.error("Erreur récupération datastatut :", error);
    throw error;
  }
}
export async function findAllSousStatutsauf() {
  try {
    const [rows] = await pool.query("SELECT Sous_Statut FROM Sous_Status WHERE Sous_Statut <> 'À appeler' ");
    return rows;
  } catch (error) {
    console.error("Erreur récupération sous_status :", error);
    throw error;
  }
}


export async function findAppelSelectedStatutEdit() {

  const [rows] = await pool.query(
    `SELECT Sous_Statut 
     FROM Sous_Status
     WHERE TRIM(Sous_Statut) IN ('TRAITE', 'NE REPOND PAS')`
  );
  return rows;
}

