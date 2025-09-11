import  pool  from "../../../config/db.js";

function toInt(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}

function clamp(n, min, max) { 
  return Math.max(min, Math.min(max, n)); 
}

/**
 * Récupère le dernier appel pour chaque client
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Object} - Résultats paginés avec les derniers appels
 */
export async function findLastCallsByClient({
  page = 1,
  limit = 20,
  sortBy = "Date",
  sortDir = "DESC",
  filters = {}
}) {
  const p = clamp(toInt(page, 1), 1, 1e9);
  const L = clamp(toInt(limit, 20), 1, 200);
  const offset = (p - 1) * L;

  const ALLOWED_SORT = new Set([
    "IDClient", "Date", "Heure", "Type_Appel", "Duree_Appel", 
    "Sous_Statut", "IDAgent_Emmission", "IDAgent_Reception"
  ]);
  
  const sortCol = ALLOWED_SORT.has(sortBy) ? sortBy : "Date";
  const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Construction des conditions WHERE
  const { whereSql, params } = buildWhereAndParams(filters);

  // Requête pour récupérer le dernier appel de chaque client
  const sqlRows = `
    SELECT a1.*
    FROM Appel a1
    INNER JOIN (
      SELECT 
        IDClient, 
        MAX(CONCAT(Date, ' ', Heure)) as max_datetime
      FROM Appel
      ${whereSql}
      GROUP BY IDClient
    ) a2 ON a1.IDClient = a2.IDClient 
           AND CONCAT(a1.Date, ' ', a1.Heure) = a2.max_datetime
    ORDER BY ${sortCol === "Date" ? "a1.Date" : `a1.${sortCol}`} ${dir}
    LIMIT ? OFFSET ?
  `;

  // Requête pour compter le nombre total de clients distincts
  const sqlCount = `
    SELECT COUNT(DISTINCT IDClient) as total
    FROM Appel
    ${whereSql}
  `;

  try {
    const [rows] = await pool.query(sqlRows, [...params, L, offset]);
    const [[{ total }]] = await pool.query(sqlCount, params);
    
    return { 
      rows, 
      total, 
      page: p, 
      limit: L,
      totalPages: Math.ceil(total / L)
    };
  } catch (e) {
    console.error("Erreur SQL (findLastCallsByClient):", e);
    throw e;
  }
}

/**
 * Construit les conditions WHERE basées sur les filtres
 */
function buildWhereAndParams(filters) {
  const {
    IDAgent_Reception,
    IDAgent_Emmission,
    Sous_Statut,
    dureeMin,
    dureeMax,
    dateFrom,
    dateTo,
    IDClient,
    q,
  } = filters || {};

  const where = [];
  const params = [];

  // Filtres de base
  if (IDAgent_Reception) { 
    where.push("(IDAgent_Reception = ?)"); 
    params.push(IDAgent_Reception); 
  }
  
  if (IDAgent_Emmission) { 
    where.push("(IDAgent_Emmission = ?)"); 
    params.push(IDAgent_Emmission); 
  }

  // Sous_Statut (IN)
  if (Array.isArray(Sous_Statut) && Sous_Statut.length) {
    where.push(`(Sous_Statut IN (${Sous_Statut.map(() => "?").join(",")}))`);
    params.push(...Sous_Statut);
  }

  // IDClient
  if (IDClient) { 
    where.push("(IDClient = ?)"); 
    params.push(IDClient); 
  }

  // Date
  if (dateFrom) { 
    where.push("(DATE(Date) >= ?)"); 
    params.push(dateFrom); 
  }
  
  if (dateTo) { 
    where.push("(DATE(Date) <= ?)"); 
    params.push(dateTo); 
  }

  // Durée
  const secMin = normalizeDurationToSec(dureeMin);
  const secMax = normalizeDurationToSec(dureeMax);
  
  if (secMin != null) { 
    where.push("(TIME_TO_SEC(Duree_Appel) >= ?)"); 
    params.push(secMin); 
  }
  
  if (secMax != null) { 
    where.push("(TIME_TO_SEC(Duree_Appel) <= ?)"); 
    params.push(secMax); 
  }

  // Recherche globale
  if (q && String(q).trim()) {
    const like = `%${String(q).trim()}%`;
    where.push("(" +
      ["IDAppel", "IDClient", "Numero", "Commentaire", "Sous_Statut", "Type_Appel"]
        .map(col => `${col} LIKE ?`).join(" OR ") +
    ")");
    params.push(like, like, like, like, like, like);
  }

  const whereSql = where.length ? ("WHERE " + where.join(" AND ")) : "";
  return { whereSql, params };
}

/**
 * Normalise la durée en secondes
 */
function normalizeDurationToSec(v) {
  if (v == null || v === "") return null;
  if (!isNaN(v)) return toInt(v, 0);
  const parts = String(v).split(":").map(n => Number(n) || 0);
  if (parts.length === 3) { 
    const [h, m, s] = parts; 
    return h * 3600 + m * 60 + s; 
  }
  if (parts.length === 2) { 
    const [m, s] = parts;  
    return m * 60 + s; 
  }
  return null;
}

/**
 * Récupère les statistiques agrégées pour les derniers appels
 */
export async function getLastCallsAggregates(filters = {}) {
  const { whereSql, params } = buildWhereAndParams(filters);
  
  const sql = `
    SELECT 
      COUNT(DISTINCT IDClient) as total_clients,
      SUM(TIME_TO_SEC(Duree_Appel)) as total_duration_sec,
      AVG(TIME_TO_SEC(Duree_Appel)) as avg_duration_sec,
      SUM(CASE WHEN UPPER(TRIM(Sous_Statut)) = 'TRAITE' THEN 1 ELSE 0 END) as total_traites,
      COUNT(*) as total_calls
    FROM (
      SELECT a1.*
      FROM Appel a1
      INNER JOIN (
        SELECT 
          IDClient, 
          MAX(CONCAT(Date, ' ', Heure)) as max_datetime
        FROM Appel
        ${whereSql}
        GROUP BY IDClient
      ) a2 ON a1.IDClient = a2.IDClient 
             AND CONCAT(a1.Date, ' ', a1.Heure) = a2.max_datetime
    ) last_calls
  `;

  try {
    const [[agg]] = await pool.query(sql, params);
    return agg || { 
      total_clients: 0, 
      total_duration_sec: 0, 
      avg_duration_sec: 0, 
      total_traites: 0, 
      total_calls: 0 
    };
  } catch (e) {
    console.error("Erreur SQL (getLastCallsAggregates):", e);
    throw e;
  }
}