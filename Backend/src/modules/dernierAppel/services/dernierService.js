import pool from "../../../config/db.js";

function getDB(req) {
  return req?.pool ?? pool;
}

export async function getLastCallByPhone(req, numero) {
  const db = getDB(req);
  const telRecherche = (numero ?? "").toString().replace(/\D/g, "").trim();
  if (telRecherche.length < 3) return { appel: null, client: null };

  // Solution optimisée: utilise LIKE avec les patterns possibles
  const patterns = [
    telRecherche,
    `${telRecherche.slice(0, 2)}-${telRecherche.slice(2, 4)}-${telRecherche.slice(4, 6)}-${telRecherche.slice(6, 8)}-${telRecherche.slice(8)}`,
    `${telRecherche.slice(0, 2)}.${telRecherche.slice(2, 4)}.${telRecherche.slice(4, 6)}.${telRecherche.slice(6, 8)}.${telRecherche.slice(8)}`,
    `${telRecherche.slice(0, 2)} ${telRecherche.slice(2, 4)} ${telRecherche.slice(4, 6)} ${telRecherche.slice(6, 8)} ${telRecherche.slice(8)}`
  ];

  // Essaye chaque pattern jusqu'à trouver un résultat
  for (const pattern of patterns) {
    const [rows] = await db.query(
      `
      SELECT
        a.IDAppel, a.Date, a.Heure, a.Type_Appel, a.Duree_Appel, a.Commentaire,
        a.Numero, a.IDClient, a.IDAgent_Emmission, a.IDAgent_Reception, a.Sous_Statut,
        c.IDClient   AS client_IDClient,
        c.Nom        AS client_Nom,
        c.Prenom     AS client_Prenom,
        c.Telephone  AS client_Telephone
      FROM Appel a
      LEFT JOIN Client c ON c.IDClient = a.IDClient
      WHERE a.Numero LIKE ?
      ORDER BY a.Date DESC, a.Heure DESC, a.IDAppel DESC
      LIMIT 1
      `,
      [`%${pattern}%`]
    );

    if (rows[0]) {
      const r = rows[0];
      const appel = {
        IDAppel: r.IDAppel,
        Date: r.Date,
        Heure: r.Heure,
        Type_Appel: r.Type_Appel,
        Duree_Appel: r.Duree_Appel,
        Commentaire: r.Commentaire,
        Numero: r.Numero,
        IDClient: r.IDClient,
        IDAgent_Emmission: r.IDAgent_Emmission,
        IDAgent_Reception: r.IDAgent_Reception,
        Sous_Statut: r.Sous_Statut,
      };

      const client = r.client_IDClient
        ? {
            IDClient: r.client_IDClient,
            Nom: r.client_Nom,
            Prenom: r.client_Prenom,
            Telephone: r.client_Telephone ?? null,
          }
        : null;

      return { appel, client };
    }
  }

  return { appel: null, client: null };
}
export async function getCallHistoryByPhone(
  req,
  numero,
  { page = 1, limit = 20, sort = "desc" } = {}
) {
  const db = getDB(req);
  const telRecherche = (numero ?? "").toString().replace(/\D/g, "").trim();
  if (telRecherche.length < 3) return { total: 0, rows: [], page: 1, limit: 20 };

  const patterns = [
    telRecherche,
    `${telRecherche.slice(0, 2)}-${telRecherche.slice(2, 4)}-${telRecherche.slice(4, 6)}-${telRecherche.slice(6, 8)}-${telRecherche.slice(8)}`,
    `${telRecherche.slice(0, 2)}.${telRecherche.slice(2, 4)}.${telRecherche.slice(4, 6)}.${telRecherche.slice(6, 8)}.${telRecherche.slice(8)}`,
    `${telRecherche.slice(0, 2)} ${telRecherche.slice(2, 4)} ${telRecherche.slice(4, 6)} ${telRecherche.slice(6, 8)} ${telRecherche.slice(8)}`
  ];

  const p = Math.max(1, parseInt(page, 10) || 1);
  const L = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * L;
  const order = String(sort).toLowerCase() === "asc" ? "ASC" : "DESC";

  // Construire la condition WHERE dynamiquement
  let whereClause = "WHERE (";
  const params = [];
  
  patterns.forEach((pattern, index) => {
    if (index > 0) whereClause += " OR ";
    whereClause += "a.Numero LIKE ?";
    params.push(`%${pattern}%`);
  });
  whereClause += ")";

  // Compter le total
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM Appel a ${whereClause}`,
    params
  );

  // Récupérer les données paginées
  const [rows] = await db.query(
    `
    SELECT
      a.IDAppel, a.Date, a.Heure, a.Type_Appel, a.Duree_Appel, a.Commentaire,
      a.Numero, a.IDClient, a.IDAgent_Emmission, a.IDAgent_Reception, a.Sous_Statut
    FROM Appel a
    ${whereClause}
    ORDER BY a.Date ${order}, a.Heure ${order}, a.IDAppel ${order}
    LIMIT ? OFFSET ?
    `,
    [...params, L, offset]
  );

  return { total, rows, page: p, limit: L };
}