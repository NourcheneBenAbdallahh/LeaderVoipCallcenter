import  pool  from "../../../config/db.js";


/**
 * Normalise et sécurise les bornes numériques
 */
function normalizeRanges({
  appelsEmisMin = 0,
  appelsEmisMax = 1_000_000,
  appelsRecusMin = 0,
  appelsRecusMax = 1_000_000,
}) {
  const toInt = (v, d) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : d;
  };

  let emiMin = toInt(appelsEmisMin, 0);
  let emiMax = toInt(appelsEmisMax, 1_000_000);
  let recMin = toInt(appelsRecusMin, 0);
  let recMax = toInt(appelsRecusMax, 1_000_000);

  if (emiMin > emiMax) [emiMin, emiMax] = [emiMax, emiMin];
  if (recMin > recMax) [recMin, recMax] = [recMax, recMin];

  return { emiMin, emiMax, recMin, recMax };
}

/**
 * Calcule offset/limit (limite max protectrice)
 */
function getPaging({ page = 1, limit = 20 }) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const L = Math.min(200, Math.max(1, parseInt(limit, 10) || 20)); // hard cap 200
  const offset = (p - 1) * L;
  return { page: p, limit: L, offset };
}

/**
 * Retourne la liste paginée + total selon filtres.
 */// ...
export async function findClientsPaginated(params = {}) {
  const { page = 1, limit = 20 } = params;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const L = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * L;

  const toInt = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
  const emiMin = toInt(params.appelsEmisMin, 0);
  const emiMax = toInt(params.appelsEmisMax, 1_000_000);
  const recMin = toInt(params.appelsRecusMin, 0);
  const recMax = toInt(params.appelsRecusMax, 1_000_000);

  try {
    // ✅ Inclure les NULL côté liste
    const [rows] = await pool.query(
      `
      SELECT *
      FROM Client
      WHERE (NB_appel_Emis BETWEEN ? AND ? OR NB_appel_Emis IS NULL)
        AND (NB_Appel_Recu BETWEEN ? AND ? OR NB_Appel_Recu IS NULL)
      ORDER BY IDClient ASC
      LIMIT ? OFFSET ?
      `,
      [emiMin, emiMax, recMin, recMax, L, offset]
    );

    // ✅ Inclure les NULL côté COUNT
    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM Client
      WHERE (NB_appel_Emis BETWEEN ? AND ? OR NB_appel_Emis IS NULL)
        AND (NB_Appel_Recu BETWEEN ? AND ? OR NB_Appel_Recu IS NULL)
      `,
      [emiMin, emiMax, recMin, recMax]
    );

    return { data: rows, total, page: p, limit: L };
  } catch (error) {
    console.error("Erreur SQL (findClientsPaginated) :", error);
    throw error;
  }
}

export async function countFilteredClients(params = {}) {
  const toInt = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
  const emiMin = toInt(params.appelsEmisMin, 0);
  const emiMax = toInt(params.appelsEmisMax, 1_000_000);
  const recMin = toInt(params.appelsRecusMin, 0);
  const recMax = toInt(params.appelsRecusMax, 1_000_000);

  try {
    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM Client
      WHERE (NB_appel_Emis BETWEEN ? AND ? OR NB_appel_Emis IS NULL)
        AND (NB_Appel_Recu BETWEEN ? AND ? OR NB_Appel_Recu IS NULL)
      `,
      [emiMin, emiMax, recMin, recMax]
    );
    return total;
  } catch (error) {
    console.error("Erreur SQL (countFilteredClients) :", error);
    throw error;
  }
}
