import pool from "../../../config/db.js";

function buildWhere({ emiMin, emiMax, recMin, recMax, q }) {
  const where = [];
  const params = [];

  // Conditions pour les appels émis
  if (emiMin !== 0 || emiMax !== 1000000) {
    // Si les filtres ne sont pas les valeurs par défaut, exclure les NULL
    where.push("(NB_appel_Emis BETWEEN ? AND ?)");
    params.push(emiMin, emiMax);
  } else {
    // Si les filtres sont les valeurs par défaut, inclure aussi les NULL
    where.push("(NB_appel_Emis BETWEEN ? AND ? OR NB_appel_Emis IS NULL)");
    params.push(emiMin, emiMax);
  }

  // Conditions pour les appels reçus
  if (recMin !== 0 || recMax !== 1000000) {
    // Si les filtres ne sont pas les valeurs par défaut, exclure les NULL
    where.push("(NB_Appel_Recu BETWEEN ? AND ?)");
    params.push(recMin, recMax);
  } else {
    // Si les filtres sont les valeurs par défaut, inclure aussi les NULL
    where.push("(NB_Appel_Recu BETWEEN ? AND ? OR NB_Appel_Recu IS NULL)");
    params.push(recMin, recMax);
  }

  if (q && q.trim()) {
    where.push(`(
      CAST(IDClient AS CHAR) LIKE ? OR
      Nom LIKE ? OR
      Prenom LIKE ? OR
      Telephone LIKE ? OR
      Email LIKE ? OR
      Adresse LIKE ? OR
      Ville LIKE ? OR
      CodePostal LIKE ? OR
      Sous_Statut LIKE ? OR
      CONCAT(Prenom, ' ', Nom) LIKE ? OR
      CONCAT(Nom, ' ', Prenom) LIKE ?
    )`);
    const like = `%${q.trim()}%`;
    // Ajoute 11 paramètres pour chaque placeholder
    for (let i = 0; i < 11; i++) {
      params.push(like);
    }
  }

  return { whereSql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "", params };
}

export async function findClientsPaginated(params = {}) {
  const toInt = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

  const p = Math.max(1, toInt(params.page, 1));
  const L = Math.min(200, Math.max(1, toInt(params.limit, 20)));
  const offset = (p - 1) * L;

  // Utilise les valeurs par défaut seulement si non spécifiées
  const emiMin = params.appelsEmisMin !== undefined ? toInt(params.appelsEmisMin, 0) : 0;
  const emiMax = params.appelsEmisMax !== undefined ? toInt(params.appelsEmisMax, 1000000) : 1000000;
  const recMin = params.appelsRecusMin !== undefined ? toInt(params.appelsRecusMin, 0) : 0;
  const recMax = params.appelsRecusMax !== undefined ? toInt(params.appelsRecusMax, 1000000) : 1000000;
  const q = params.q || params.search || "";

  try {
    const { whereSql, params: whereParams } = buildWhere({ emiMin, emiMax, recMin, recMax, q });

    const [rows] = await pool.query(
      `
      SELECT
        IDClient, Nom, Prenom, Telephone, Email,
        Adresse, CodePostal, Ville,
        NB_appel_Emis, NB_Appel_Recu,
        Sous_Statut
      FROM Client
      ${whereSql}
      ORDER BY IDClient ASC
      LIMIT ? OFFSET ?
      `,
      [...whereParams, L, offset]
    );

    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM Client
      ${whereSql}
      `,
      whereParams
    );

    return { data: rows, total, page: p, limit: L };
  } catch (error) {
    console.error("Erreur SQL (findClientsPaginated) :", error);
    throw error;
  }
}

export async function countFilteredClients(params = {}) {
  const toInt = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
  
  const emiMin = params.appelsEmisMin !== undefined ? toInt(params.appelsEmisMin, 0) : 0;
  const emiMax = params.appelsEmisMax !== undefined ? toInt(params.appelsEmisMax, 1000000) : 1000000;
  const recMin = params.appelsRecusMin !== undefined ? toInt(params.appelsRecusMin, 0) : 0;
  const recMax = params.appelsRecusMax !== undefined ? toInt(params.appelsRecusMax, 1000000) : 1000000;
  const q = params.q || params.search || "";

  try {
    const { whereSql, params: whereParams } = buildWhere({ emiMin, emiMax, recMin, recMax, q });
    
    const [[{ total }]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM Client
      ${whereSql}
      `,
      whereParams
    );
    
    return total;
  } catch (error) {
    console.error("Erreur SQL (countFilteredClients) :", error);
    throw error;
  }
}