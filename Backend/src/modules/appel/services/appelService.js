import { pool } from "../../../config/db.js";

export async function findAllAppels() {
  try {
    const [rows] = await pool.query("SELECT * FROM appel");
    return rows;
  } catch (error) {
    console.error("Erreur base de données :", error);
    throw error;
  }
}

export async function getFilteredJournalAppels(filters = {}) {
  try {
    let {
      IDAgent_Reception = null,
      IDAgent_Emmission = null,
      Sous_Statut = null,   
      Duree_Appel = null,   
      dureeMin = null,
      dureeMax = null,
      Date = null,        
      dateFrom = null,     
      dateTo = null,
      IDClient = null,
    } = filters;

    if (dureeMin == null && dureeMax == null && Duree_Appel != null) {
      dureeMin = 0;
      dureeMax = Number(Duree_Appel);
    }

    let sql = `
      SELECT *,
             CASE WHEN Date = (
               SELECT MAX(Date) 
               FROM appel a2 
               WHERE 1=1
                 ${IDAgent_Reception ? " AND a2.IDAgent_Reception = ?" : ""}
                 ${IDAgent_Emmission ? " AND a2.IDAgent_Emmission = ?" : ""}
                 ${IDClient ? " AND a2.IDClient = ?" : ""}
             ) THEN 1 ELSE 0 END AS isLast
      FROM appel 
      WHERE 1=1
    `;
    const params = [];

    if (IDAgent_Reception) { sql += " AND IDAgent_Reception = ?"; params.push(IDAgent_Reception); }
    if (IDAgent_Emmission) { sql += " AND IDAgent_Emmission = ?"; params.push(IDAgent_Emmission); }
    if (IDClient)          { sql += " AND IDClient = ?";          params.push(IDClient); }

    if (Date)      { sql += " AND DATE(Date) = ?"; params.push(Date); }
    if (dateFrom)  { sql += " AND Date >= ?";      params.push(dateFrom); }
    if (dateTo)    { sql += " AND Date <= ?";      params.push(dateTo); }

    if (dureeMin != null || dureeMax != null) {
      const min = Number(dureeMin ?? 0);
      const max = Number(dureeMax ?? 999999);
      sql += " AND Duree_Appel BETWEEN ? AND ?";
      params.push(min, max);
    }

    if (Sous_Statut) {
      const list = Array.isArray(Sous_Statut) ? Sous_Statut : `${Sous_Statut}`.split(",");
      const normalized = list.map(s => s.trim().toUpperCase()).filter(Boolean);
      if (normalized.length) {
        const placeholders = normalized.map(() => "?").join(",");
        sql += ` AND TRIM(UPPER(Sous_Statut)) IN (${placeholders})`;
        params.push(...normalized);
      }
    }

    sql += " ORDER BY Date DESC, Heure DESC";

    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error("Erreur base de données (filter appels):", error);
    throw error;
  }
}

// les appels 'À appeler'
export async function findAppelsAAppeler() {
  try {
    const sql = `
      SELECT * 
      FROM appel
      WHERE Sous_Statut = 'À appeler'
      ORDER BY Date DESC, Heure DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  } catch (error) {
    console.error("Erreur récupération appels 'À appeler':", error);
    throw error;
  }
}