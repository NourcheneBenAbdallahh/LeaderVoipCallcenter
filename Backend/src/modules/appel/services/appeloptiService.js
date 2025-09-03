import  pool  from "../../../config/db.js";

function toInt(v, d = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
}
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }


function buildWhereAndParams(filters) {
  const {
    IDAgent_Reception,
    IDAgent_Emmission,
    Sous_Statut,      // array
    dureeMin,         // en secondes ou "mm:ss"
    dureeMax,
    dateFrom,         // "YYYY-MM-DD"
    dateTo,
    IDClient,
    q,                // recherche globale (Numero, Commentaire, etc.)
  } = filters || {};

  const where = [];
  const params = [];

  // Agents
  if (IDAgent_Reception) { where.push("(IDAgent_Reception = ?)"); params.push(IDAgent_Reception); }
  if (IDAgent_Emmission) { where.push("(IDAgent_Emmission = ?)"); params.push(IDAgent_Emmission); }

  // Sous_Statut (IN) — si vide, on n’ajoute rien
  if (Array.isArray(Sous_Statut) && Sous_Statut.length) {
    where.push(`(Sous_Statut IN (${Sous_Statut.map(() => "?").join(",")}))`);
    params.push(...Sous_Statut);
  }

  // IDClient
  if (IDClient) { where.push("(IDClient = ?)"); params.push(IDClient); }

  // Date (on compare sur la partie date)
  if (dateFrom) { where.push("(DATE(Date) >= ?)"); params.push(dateFrom); }
  if (dateTo)   { where.push("(DATE(Date) <= ?)"); params.push(dateTo); }

  // Durée — si ta DB stocke HH:MM:SS (VARCHAR/TIME)
  const secMin = normalizeDurationToSec(dureeMin);
  const secMax = normalizeDurationToSec(dureeMax);
  if (secMin != null) { where.push("(TIME_TO_SEC(Duree_Appel) >= ?)"); params.push(secMin); }
  if (secMax != null) { where.push("(TIME_TO_SEC(Duree_Appel) <= ?)"); params.push(secMax); }

  // Recherche globale (évite le concat monstrueux ; cible des colonnes précises)
  if (q && String(q).trim()) {
    const like = `%${String(q).trim()}%`;
    where.push("("+
      ["IDAppel", "IDClient", "Numero", "Commentaire", "Sous_Statut", "Type_Appel"]
        .map(col => `${col} LIKE ?`).join(" OR ")+
    ")");
    params.push(like, like, like, like, like, like);
  }

  // Rien par défaut => on n’ajoute pas de WHERE; on ne filtre pas les NULL
  const whereSql = where.length ? ("WHERE " + where.join(" AND ")) : "";
  return { whereSql, params };
}

function normalizeDurationToSec(v) {
  if (v == null || v === "") return null;
  if (!isNaN(v)) return toInt(v, 0); // déjà en secondes
  const parts = String(v).split(":").map(n => Number(n) || 0);
  if (parts.length === 3) { const [h,m,s]=parts; return h*3600 + m*60 + s; }
  if (parts.length === 2) { const [m,s]=parts;  return m*60 + s; }
  return null;
}

const ALLOWED_SORT = new Set([
  "IDAppel","IDClient","IDAgent_Reception","IDAgent_Emmission","Date","Heure","Duree_Appel","Type_Appel","Sous_Statut"
]);

export async function findJournalAppelsPaginated({
  page = 1,
  limit = 20,
  sortBy = "Date",
  sortDir = "DESC",
  filters = {},
}) {
  const p = clamp(toInt(page, 1), 1, 1e9);
  const L = clamp(toInt(limit, 20), 1, 200); // hard cap
  const offset = (p - 1) * L;

  const sortCol = ALLOWED_SORT.has(sortBy) ? sortBy : "Date";
  const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";

  const { whereSql, params } = buildWhereAndParams(filters);

  const orderBy = sortCol === "Duree_Appel"
    ? "TIME_TO_SEC(Duree_Appel)"
    : sortCol;

  const sqlRows = `
    SELECT *
    FROM Appel
    ${whereSql}
    ORDER BY ${orderBy} ${dir}
    LIMIT ? OFFSET ?
  `;
  const sqlCount = `
    SELECT COUNT(*) AS total
    FROM Appel
    ${whereSql}
  `;

  try {
    const [rows] = await pool.query(sqlRows, [...params, L, offset]);
    const [[{ total }]] = await pool.query(sqlCount, params);
    return { rows, total, page: p, limit: L };
  } catch (e) {
    console.error("Erreur SQL (findJournalAppelsPaginated):", e);
    throw e;
  }
}

export async function getJournalAppelsAggregates(filters = {}) {
  const { whereSql, params } = buildWhereAndParams(filters);
  const sql = `
    SELECT
      COUNT(*)                                        AS total_rows,
      SUM(TIME_TO_SEC(Duree_Appel))                  AS total_duration_sec,
      SUM(CASE WHEN UPPER(TRIM(Sous_Statut))='TRAITE' THEN 1 ELSE 0 END) AS total_traites
    FROM Appel
    ${whereSql}
  `;
  const [[agg]] = await pool.query(sql, params);
  return agg || { total_rows: 0, total_duration_sec: 0, total_traites: 0 };
}
