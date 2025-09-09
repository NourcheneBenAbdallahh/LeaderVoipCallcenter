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
        c.IDClient AS client_IDClient,
        c.Nom AS client_Nom,
        c.Prenom AS client_Prenom,
        c.Telephone AS client_Telephone,
        ae.Nom AS agent_emmission_nom,
        ae.Prenom AS agent_emmission_prenom,
        ar.Nom AS agent_reception_nom,
        ar.Prenom AS agent_reception_prenom
      FROM Appel a
      LEFT JOIN Client c ON c.IDClient = a.IDClient
      LEFT JOIN Agent ae ON ae.IDAgent_Emmission = a.IDAgent_Emmission
      LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception = a.IDAgent_Reception
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
        Agent_Emmission: r.IDAgent_Emmission ? {
          Nom: r.agent_emmission_nom,
          Prenom: r.agent_emmission_prenom
        } : null,
        Agent_Reception: r.IDAgent_Reception ? {
          Nom: r.agent_reception_nom,
          Prenom: r.agent_reception_prenom
        } : null,
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

  // Récupérer les données paginées avec les noms des agents
  const [rows] = await db.query(
    `
    SELECT
      a.IDAppel, a.Date, a.Heure, a.Type_Appel, a.Duree_Appel, a.Commentaire,
      a.Numero, a.IDClient, a.Sous_Statut,
      c.Nom AS client_nom,
      c.Prenom AS client_prenom,
      ae.Nom AS agent_emmission_nom,
      ae.Prenom AS agent_emmission_prenom,
      ar.Nom AS agent_reception_nom,
      ar.Prenom AS agent_reception_prenom
    FROM Appel a
    LEFT JOIN Client c ON c.IDClient = a.IDClient
    LEFT JOIN Agent ae ON ae.IDAgent_Emmission = a.IDAgent_Emmission
    LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception = a.IDAgent_Reception
    ${whereClause}
    ORDER BY a.Date ${order}, a.Heure ${order}, a.IDAppel ${order}
    LIMIT ? OFFSET ?
    `,
    [...params, L, offset]
  );

  // Formater les résultats pour inclure les noms au lieu des IDs
  const formattedRows = rows.map(row => ({
    IDAppel: row.IDAppel,
    Date: row.Date,
    Heure: row.Heure,
    Type_Appel: row.Type_Appel,
    Duree_Appel: row.Duree_Appel,
    Commentaire: row.Commentaire,
    Numero: row.Numero,
    Client: row.IDClient ? {
      IDClient: row.IDClient,
      Nom: row.client_nom,
      Prenom: row.client_prenom
    } : null,
    Agent_Emmission: row.agent_emmission_nom ? {
      Nom: row.agent_emmission_nom,
      Prenom: row.agent_emmission_prenom
    } : null,
    Agent_Reception: row.agent_reception_nom ? {
      Nom: row.agent_reception_nom,
      Prenom: row.agent_reception_prenom
    } : null,
    Sous_Statut: row.Sous_Statut
  }));

  return { total, rows: formattedRows, page: p, limit: L };
}