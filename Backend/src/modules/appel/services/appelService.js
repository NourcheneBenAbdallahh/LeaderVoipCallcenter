// src/modules/appel/services/appelService.js
import { pool } from "../../../config/db.js";

// 👉 adapte ici si ta colonne s'appelle autrement (ex: "Statut")
const COL_STATUT = "Sous_Statut";

// -------------------- LECTURE --------------------

export async function findAllAppels() {
  const [rows] = await pool.query("SELECT * FROM `appel`");
  return rows;
}

/** Tous les appels sauf "À appeler" (sur Sous_Statut) */
export async function findAppelSelectedStatut() {
  const [rows] = await pool.query(
    "SELECT * FROM `appel` WHERE TRIM(`Sous_Statut`) <> 'À appeler' OR `Sous_Statut` IS NULL"
  );
  return rows;
}

/** Filtrage flexible (agents, dates, durée, client, sous_statut, ...) */
export async function getFilteredJournalAppels(filters = {}) {
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
    SELECT * ,
      CASE WHEN Date = (
        SELECT MAX(Date) FROM appel a2
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

  if (Date)     { sql += " AND DATE(Date) = ?"; params.push(Date); }
  if (dateFrom) { sql += " AND Date >= ?";      params.push(dateFrom); }
  if (dateTo)   { sql += " AND Date <= ?";      params.push(dateTo); }

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
}

/** Uniquement les appels "À appeler" */
export async function findAppelsAAppeler() {
  const [rows] = await pool.query(`
    SELECT * FROM \`appel\`
    WHERE TRIM(\`Sous_Statut\`) = 'À appeler'
    ORDER BY Date DESC, Heure DESC
  `);
  return rows;
}

// -------------------- UTILITAIRES --------------------

/** Vérifie si un appel existe par IDAppel */
export async function existsAppel(idAppel) {
  const [rows] = await pool.query(
    "SELECT 1 FROM `appel` WHERE `IDAppel` = ? LIMIT 1",
    [idAppel]
  );
  return rows.length > 0;
}

// -------------------- UPDATE --------------------

/**
 * Met à jour un appel (Sous_Statut, Commentaire) — champs optionnels
 * Retourne { affectedRows, changedRows, info }
 */
export async function updateAppelById(idAppel, patch = {}) {
  const sets = [];
  const vals = [];

  if (typeof patch.Sous_Statut !== "undefined") {
    sets.push(`\`${COL_STATUT}\` = ?`);
    vals.push(patch.Sous_Statut);
  }
  if (typeof patch.Commentaire !== "undefined") {
    sets.push("`Commentaire` = ?");
    vals.push(patch.Commentaire);
  }

  if (sets.length === 0) {
    return { affectedRows: 0, changedRows: 0, info: "" };
  }

  vals.push(idAppel);
  const sql = `UPDATE \`appel\` SET ${sets.join(", ")} WHERE \`IDAppel\` = ? LIMIT 1`;
  const [result] = await pool.query(sql, vals);

  return {
    affectedRows: result.affectedRows ?? 0,
    changedRows: result.changedRows ?? result.affectedRows ?? 0,
    info: result.info ?? "",
  };
}
