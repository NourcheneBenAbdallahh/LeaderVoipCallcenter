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
 */
export async function findClientsPaginated(params = {}) {
  const { page, limit, offset } = getPaging(params);
  const { emiMin, emiMax, recMin, recMax } = normalizeRanges(params);

  try {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM Client
      WHERE NB_appel_Emis BETWEEN ? AND ?
        AND NB_Appel_Recu BETWEEN ? AND ?
      ORDER BY IDClient ASC
      LIMIT ? OFFSET ?
      `,
      [emiMin, emiMax, recMin, recMax, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM Client
      WHERE NB_appel_Emis BETWEEN ? AND ?
        AND NB_Appel_Recu BETWEEN ? AND ?
      `,
      [emiMin, emiMax, recMin, recMax]
    );

    return { data: rows, total, page, limit };
  } catch (error) {
    console.error("Erreur SQL (findClientsPaginated) :", error);
    throw error;
  }
}

/**
 * Compte uniquement (utile si besoin séparé)
 */
export async function countFilteredClients(params = {}) {
  const { emiMin, emiMax, recMin, recMax } = normalizeRanges(params);
  try {
    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM Client
      WHERE NB_appel_Emis BETWEEN ? AND ?
        AND NB_Appel_Recu BETWEEN ? AND ?
      `,
      [emiMin, emiMax, recMin, recMax]
    );
    return total;
  } catch (error) {
    console.error("Erreur SQL (countFilteredClients) :", error);
    throw error;
  }
}
