import pool from "../../../config/db.js";

function getDB(req) { return req?.pool ?? pool; }

/**
 * Normalise un numéro de téléphone (supprime tous les caractères non numériques)
 */
function normalizePhone(phone) {
  return (phone || "").replace(/\D/g, "").trim();
}

/**
 * Recherche le dernier appel d'un client par son téléphone
 */
export async function getLastCallByClientPhone(req, phone) {
  const db = getDB(req);
  const normalizedPhone = normalizePhone(phone);

  if (normalizedPhone.length < 5) {
    return []; // IMPORTANT: le controller renvoie data: results -> doit être un tableau
  }

  try {
    // 1) Clients correspondant au téléphone
    const [clientRows] = await db.query(
      `SELECT 
         IDClient, Civilite, Nom, Prenom,
         Adresse, CodePostal,
         Telephone, Mobile, Email, Fax,
         Sous_Statut, Cumul_temps, NB_appel_Emis, NB_Appel_Recu
       FROM Client
       WHERE Telephone LIKE ? OR Mobile LIKE ? OR Fax LIKE ?
       LIMIT 10`,
      [`%${normalizedPhone}%`, `%${normalizedPhone}%`, `%${normalizedPhone}%`]
    );

    if (!clientRows.length) {
      return []; // aucun client -> tableau vide
    }

    const results = [];

    // 2) Pour chaque client, récupérer le dernier appel
    for (const client of clientRows) {
      const [callRows] = await db.query(
        `SELECT a.*,
                ae.Nom   AS agent_emmission_nom,   ae.Prenom AS agent_emmission_prenom,
                ar.Nom   AS agent_reception_nom,   ar.Prenom AS agent_reception_prenom
         FROM Appel a
         LEFT JOIN Agent           ae ON ae.IDAgent_Emmission   = a.IDAgent_Emmission
         LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception   = a.IDAgent_Reception
         WHERE a.IDClient = ?
         ORDER BY a.Date DESC, a.Heure DESC, a.IDAppel DESC
         LIMIT 1`,
        [client.IDClient]
      );

      const baseClient = {
        IDClient:       client.IDClient,
        Civilite:       client.Civilite,
        Nom:            client.Nom,
        Prenom:         client.Prenom,
        Adresse:        client.Adresse,
        CodePostal:     client.CodePostal,
        Telephone:      client.Telephone,
        Mobile:         client.Mobile,
        Email:          client.Email,
        Fax:            client.Fax,
        Sous_Statut:    client.Sous_Statut,
        Cumul_temps:    client.Cumul_temps,
        NB_appel_Emis:  client.NB_appel_Emis,
        NB_Appel_Recu:  client.NB_Appel_Recu
      };

      if (callRows[0]) {
        const a = callRows[0];
        results.push({
          client: baseClient,
          appel: {
            IDAppel:            a.IDAppel,
            Date:               a.Date,
            Heure:              a.Heure,
            Type_Appel:         a.Type_Appel,
            Duree_Appel:        a.Duree_Appel,
            Commentaire:        a.Commentaire,
            Numero:             a.Numero,          // <- demandé
            IDClient:           a.IDClient,
            IDAgent_Emmission:  a.IDAgent_Emmission,
            IDAgent_Reception:  a.IDAgent_Reception,
            Sous_Statut:        a.Sous_Statut,
            Agent_Emmission:    a.IDAgent_Emmission ? {
              Nom:    a.agent_emmission_nom,
              Prenom: a.agent_emmission_prenom
            } : null,                               // <- demandé (nom/prénom)
            Agent_Reception:    a.IDAgent_Reception ? {
              Nom:    a.agent_reception_nom,
              Prenom: a.agent_reception_prenom
            } : null                                // <- demandé (nom/prénom)
          }
        });
      } else {
        // Client sans appel enregistré
        results.push({
          client: baseClient,
          appel: null
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Erreur dans getLastCallByClientPhone:", error);
    throw error;
  }
}


/**
 * Récupère l'historique des appels d'un client par son ID
 */
export async function getCallHistoryByClientId(req, clientId, options = {}) {
  const db = getDB(req);
  const {
    page = 1,
    limit = 20,
    sort = "desc",
    sortBy = "Date",
    dateFrom,
    dateTo,
    typeAppel,
    agentReceptionName,
    agentEmmissionName,
    sousStatuts,
    q
  } = options;

  const p = Math.max(1, parseInt(page, 10) || 1);
  const L = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * L;
  const order = String(sort).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sortable = new Set(["Date", "Heure", "IDAppel", "Duree_Appel", "Type_Appel"]);
  const sortCol = sortable.has(String(sortBy)) ? sortBy : "Date";

  const where = ["a.IDClient = ?"];
  const params = [clientId];

  // Filtres
  if (dateFrom) { where.push("a.Date >= ?"); params.push(dateFrom); }
  if (dateTo) { where.push("a.Date <= ?"); params.push(dateTo); }

  if (typeAppel != null && String(typeAppel).trim() !== "") {
    where.push("a.Type_Appel = ?"); params.push(typeAppel);
  }

  // Sous-statuts
  let ss = [];
  if (Array.isArray(sousStatuts)) ss = sousStatuts;
  else if (typeof sousStatuts === "string") ss = sousStatuts.split(",").map(s => s.trim()).filter(Boolean);
  if (ss.length) {
    where.push(`a.Sous_Statut IN (${ss.map(() => "?").join(",")})`);
    params.push(...ss);
  }

  // Agents réception par nom
  if (agentReceptionName && agentReceptionName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Agent_Reception ar2
      WHERE ar2.IDAgent_Reception = a.IDAgent_Reception
        AND CONCAT_WS(' ', COALESCE(ar2.Prenom,''), COALESCE(ar2.Nom,''), COALESCE(ar2.Login,'')) LIKE ?
    )`);
    params.push(`%${agentReceptionName}%`);
  }

  // Agents émission par nom
  if (agentEmmissionName && agentEmmissionName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Agent ae2
      WHERE ae2.IDAgent_Emmission = a.IDAgent_Emmission
        AND CONCAT_WS(' ', COALESCE(ae2.Prenom,''), COALESCE(ae2.Nom,''), COALESCE(ae2.Login,'')) LIKE ?
    )`);
    params.push(`%${agentEmmissionName}%`);
  }

  // Recherche globale
  if (q && q.trim()) {
    const qq = `%${q.trim()}%`;
    where.push(`(
      a.Commentaire LIKE ?
      OR REPLACE(REPLACE(REPLACE(a.Numero, '-', ''), '.', ''), ' ', '') LIKE ?
      OR a.Sous_Statut LIKE ?
    )`);
    params.push(qq, `%${q.replace(/\D/g, "")}%`, qq);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Total
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM Appel a ${whereSQL}`,
    params
  );

  // Données paginées
  const [rows] = await db.query(
    `SELECT a.*,
            ae.Prenom AS ae_prenom, ae.Nom AS ae_nom,
            ar.Prenom AS ar_prenom, ar.Nom AS ar_nom,
            c.Prenom AS client_prenom, c.Nom AS client_nom
     FROM Appel a
     LEFT JOIN Agent ae ON ae.IDAgent_Emmission = a.IDAgent_Emmission
     LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception = a.IDAgent_Reception
     LEFT JOIN Client c ON c.IDClient = a.IDClient
     ${whereSQL}
     ORDER BY a.${sortCol} ${order}, a.IDAppel ${order}
     LIMIT ? OFFSET ?`,
    [...params, L, offset]
  );

  const formatted = rows.map(r => ({
    IDAppel: r.IDAppel,
    Date: r.Date,
    Heure: r.Heure,
    Type_Appel: r.Type_Appel,
    Duree_Appel: r.Duree_Appel,
    Commentaire: r.Commentaire,
    Numero: r.Numero,
    Sous_Statut: r.Sous_Statut,
    Client: {
      IDClient: r.IDClient,
      Prenom: r.client_prenom,
      Nom: r.client_nom
    },
    Agent_Emmission: r.IDAgent_Emmission ? {
      Prenom: r.ae_prenom,
      Nom: r.ae_nom
    } : null,
    Agent_Reception: r.IDAgent_Reception ? {
      Prenom: r.ar_prenom,
      Nom: r.ar_nom
    } : null
  }));

  return {
    total,
    rows: formatted,
    page: p,
    limit: L,
    totalPages: Math.ceil(total / L)
  };
}