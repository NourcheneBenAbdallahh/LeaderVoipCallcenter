// src/modules/dernierAppel/services/dernierService.js
import pool from "../../../config/db.js";
function getDB(req) { return req?.pool ?? pool; }

/* ====== inchangé : latest ====== */
export async function getLastCallByPhone(req, numero) {
  const db = getDB(req);
  const telRecherche = (numero ?? "").toString().replace(/\D/g, "").trim();
  if (telRecherche.length < 3) return { appel: null, client: null };

  const patterns = [
    telRecherche,
    `${telRecherche.slice(0, 2)}-${telRecherche.slice(2, 4)}-${telRecherche.slice(4, 6)}-${telRecherche.slice(6, 8)}-${telRecherche.slice(8)}`,
    `${telRecherche.slice(0, 2)}.${telRecherche.slice(2, 4)}.${telRecherche.slice(4, 6)}.${telRecherche.slice(6, 8)}.${telRecherche.slice(8)}`,
    `${telRecherche.slice(0, 2)} ${telRecherche.slice(2, 4)} ${telRecherche.slice(4, 6)} ${telRecherche.slice(6, 8)} ${telRecherche.slice(8)}`
  ];

  for (const pattern of patterns) {
    const [rows] = await db.query(
      `
      SELECT
        a.IDAppel, a.Date, a.Heure, a.Type_Appel, a.Duree_Appel, a.Commentaire,
        a.Numero, a.IDClient, a.IDAgent_Emmission, a.IDAgent_Reception, a.Sous_Statut,
        c.IDClient AS client_IDClient, c.Nom AS client_Nom, c.Prenom AS client_Prenom, c.Telephone AS client_Telephone,
        ae.Nom AS agent_emmission_nom, ae.Prenom AS agent_emmission_prenom,
        ar.Nom AS agent_reception_nom, ar.Prenom AS agent_reception_prenom
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
        Agent_Emmission: r.IDAgent_Emmission ? { Nom: r.agent_emmission_nom, Prenom: r.agent_emmission_prenom } : null,
        Agent_Reception: r.IDAgent_Reception ? { Nom: r.agent_reception_nom, Prenom: r.agent_reception_prenom } : null,
        Sous_Statut: r.Sous_Statut,
      };

      const client = r.client_IDClient
        ? { IDClient: r.client_IDClient, Nom: r.client_Nom, Prenom: r.client_Prenom, Telephone: r.client_Telephone ?? null }
        : null;

      return { appel, client };
    }
  }
  return { appel: null, client: null };
}

/* ====== NOUVEL historique filtré (backend) ====== */
export async function getCallHistoryByPhone(
  req,
  numero,
  {
    page = 1,
    limit = 20,
    sort = "desc",
    sortBy = "Date",

    dateFrom,
    dateTo,
    typeAppel,              // "1" | "2"
    agentReceptionName,     // LIKE
    agentEmmissionName,     // LIKE
    sousStatuts,            // array | CSV
    clientName,             // LIKE
    q                       // global
  } = {}
) {
  const db = getDB(req);
  const tel = (numero ?? "").toString().replace(/\D/g, "").trim();
  if (tel.length < 3) return { total: 0, rows: [], page: 1, limit: 20 };

  const p = Math.max(1, parseInt(page, 10) || 1);
  const L = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * L;
  const order = String(sort).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sortable = new Set(["Date", "Heure", "IDAppel", "Duree_Appel", "Type_Appel"]);
  const sortCol = sortable.has(String(sortBy)) ? sortBy : "Date";

  const where = [];
  const params = [];

  // matcher le numéro sous toutes ses formes (normalisation)
  where.push(`(
    a.Numero LIKE ?
    OR REPLACE(REPLACE(REPLACE(a.Numero, '-', ''), '.', ''), ' ', '') LIKE ?
  )`);
  params.push(`%${tel}%`, `%${tel}%`);

  if (dateFrom) { where.push(`a.Date >= ?`); params.push(dateFrom); }
  if (dateTo)   { where.push(`a.Date <= ?`); params.push(dateTo); }

  if (typeAppel != null && String(typeAppel).trim() !== "") {
    where.push(`a.Type_Appel = ?`); params.push(typeAppel);
  }

  // sous-statuts (array ou CSV)
  let ss = [];
  if (Array.isArray(sousStatuts)) ss = sousStatuts;
  else if (typeof sousStatuts === "string") ss = sousStatuts.split(",").map(s => s.trim()).filter(Boolean);
  if (ss.length) {
    where.push(`a.Sous_Statut IN (${ss.map(() => "?").join(",")})`);
    params.push(...ss);
  }

  // client nom/prénom
  if (clientName && clientName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Client c2
      WHERE c2.IDClient = a.IDClient
        AND CONCAT_WS(' ', COALESCE(c2.Prenom,''), COALESCE(c2.Nom,'')) LIKE ?
    )`);
    params.push(`%${clientName}%`);
  }

  // agent réception par nom
  if (agentReceptionName && agentReceptionName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Agent_Reception ar2
      WHERE ar2.IDAgent_Reception = a.IDAgent_Reception
        AND CONCAT_WS(' ', COALESCE(ar2.Prenom,''), COALESCE(ar2.Nom,''), COALESCE(ar2.Login,'')) LIKE ?
    )`);
    params.push(`%${agentReceptionName}%`);
  }

  // agent émission par nom
  if (agentEmmissionName && agentEmmissionName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Agent ae2
      WHERE ae2.IDAgent_Emmission = a.IDAgent_Emmission
        AND CONCAT_WS(' ', COALESCE(ae2.Prenom,''), COALESCE(ae2.Nom,''), COALESCE(ae2.Login,'')) LIKE ?
    )`);
    params.push(`%${agentEmmissionName}%`);
  }

  // recherche globale q : commentaire + numéro normalisé + noms
  if (q && q.trim()) {
    const qq = `%${q.trim()}%`;
    const qDigits = `%${q.replace(/\D/g, "")}%`;
    where.push(`(
      a.Commentaire LIKE ?
      OR REPLACE(REPLACE(REPLACE(a.Numero, '-', ''), '.', ''), ' ', '') LIKE ?
      OR EXISTS (SELECT 1 FROM Client c3 WHERE c3.IDClient = a.IDClient
                 AND CONCAT_WS(' ', COALESCE(c3.Prenom,''), COALESCE(c3.Nom,'')) LIKE ?)
      OR EXISTS (SELECT 1 FROM Agent_Reception ar3 WHERE ar3.IDAgent_Reception = a.IDAgent_Reception
                 AND CONCAT_WS(' ', COALESCE(ar3.Prenom,''), COALESCE(ar3.Nom,''), COALESCE(ar3.Login,'')) LIKE ?)
      OR EXISTS (SELECT 1 FROM Agent ae3 WHERE ae3.IDAgent_Emmission = a.IDAgent_Emmission
                 AND CONCAT_WS(' ', COALESCE(ae3.Prenom,''), COALESCE(ae3.Nom,''), COALESCE(ae3.Login,'')) LIKE ?)
    )`);
    params.push(qq, qDigits, qq, qq, qq);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // total (compte uniquement Appel)
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM Appel a
     ${whereSQL}`,
    params
  );

  // page (noms déjà résolus)
  const [rows] = await db.query(
    `
    SELECT
      a.IDAppel, a.Date, a.Heure, a.Type_Appel, a.Duree_Appel, a.Commentaire,
      a.Numero, a.IDClient, a.IDAgent_Emmission, a.IDAgent_Reception, a.Sous_Statut,
      c.Prenom AS client_prenom, c.Nom AS client_nom,
      ae.Prenom AS ae_prenom, ae.Nom AS ae_nom,
      ar.Prenom AS ar_prenom, ar.Nom AS ar_nom
    FROM Appel a
    LEFT JOIN Client c ON c.IDClient = a.IDClient
    LEFT JOIN Agent ae ON ae.IDAgent_Emmission = a.IDAgent_Emmission
    LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception = a.IDAgent_Reception
    ${whereSQL}
    ORDER BY a.${sortCol} ${order}, a.IDAppel ${order}
    LIMIT ? OFFSET ?
    `,
    [...params, L, offset]
  );

  const formatted = (rows || []).map(r => ({
    IDAppel: r.IDAppel,
    Date: r.Date,
    Heure: r.Heure,
    Type_Appel: r.Type_Appel,
    Duree_Appel: r.Duree_Appel,
    Commentaire: r.Commentaire,
    Numero: r.Numero,
    Sous_Statut: r.Sous_Statut,
    Client: r.IDClient ? { IDClient: r.IDClient, Prenom: r.client_prenom, Nom: r.client_nom } : null,
    Agent_Emmission: r.IDAgent_Emmission ? { Prenom: r.ae_prenom, Nom: r.ae_nom } : null,
    Agent_Reception: r.IDAgent_Reception ? { Prenom: r.ar_prenom, Nom: r.ar_nom } : null,
  }));

  return { total, rows: formatted, page: p, limit: L };
}
// src/modules/dernierAppel/services/dernierService.js

export async function getCallHistoryByClient(
  req,
  clientId,
  {
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
    clientName,
    q
  } = {}
) {
  const db = getDB(req);
  
  const p = Math.max(1, parseInt(page, 10) || 1);
  const L = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (p - 1) * L;
  const order = String(sort).toLowerCase() === "asc" ? "ASC" : "DESC";

  const sortable = new Set(["Date", "Heure", "IDAppel", "Duree_Appel", "Type_Appel"]);
  const sortCol = sortable.has(String(sortBy)) ? sortBy : "Date";

  const where = [];
  const params = [];

  // Filtrer par ID client
  where.push(`a.IDClient = ?`);
  params.push(clientId);

  if (dateFrom) { where.push(`a.Date >= ?`); params.push(dateFrom); }
  if (dateTo)   { where.push(`a.Date <= ?`); params.push(dateTo); }

  if (typeAppel != null && String(typeAppel).trim() !== "") {
    where.push(`a.Type_Appel = ?`); params.push(typeAppel);
  }

  // sous-statuts (array ou CSV)
  let ss = [];
  if (Array.isArray(sousStatuts)) ss = sousStatuts;
  else if (typeof sousStatuts === "string") ss = sousStatuts.split(",").map(s => s.trim()).filter(Boolean);
  if (ss.length) {
    where.push(`a.Sous_Statut IN (${ss.map(() => "?").join(",")})`);
    params.push(...ss);
  }

  // client nom/prénom (recherche dans le nom du client)
  if (clientName && clientName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Client c2
      WHERE c2.IDClient = a.IDClient
        AND CONCAT_WS(' ', COALESCE(c2.Prenom,''), COALESCE(c2.Nom,'')) LIKE ?
    )`);
    params.push(`%${clientName}%`);
  }

  // agent réception par nom
  if (agentReceptionName && agentReceptionName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Agent_Reception ar2
      WHERE ar2.IDAgent_Reception = a.IDAgent_Reception
        AND CONCAT_WS(' ', COALESCE(ar2.Prenom,''), COALESCE(ar2.Nom,''), COALESCE(ar2.Login,'')) LIKE ?
    )`);
    params.push(`%${agentReceptionName}%`);
  }

  // agent émission par nom
  if (agentEmmissionName && agentEmmissionName.trim()) {
    where.push(`EXISTS (
      SELECT 1 FROM Agent ae2
      WHERE ae2.IDAgent_Emmission = a.IDAgent_Emmission
        AND CONCAT_WS(' ', COALESCE(ae2.Prenom,''), COALESCE(ae2.Nom,''), COALESCE(ae2.Login,'')) LIKE ?
    )`);
    params.push(`%${agentEmmissionName}%`);
  }

  // recherche globale q : commentaire + numéro normalisé + noms
  if (q && q.trim()) {
    const qq = `%${q.trim()}%`;
    const qDigits = `%${q.replace(/\D/g, "")}%`;
    where.push(`(
      a.Commentaire LIKE ?
      OR REPLACE(REPLACE(REPLACE(a.Numero, '-', ''), '.', ''), ' ', '') LIKE ?
      OR EXISTS (SELECT 1 FROM Client c3 WHERE c3.IDClient = a.IDClient
                 AND CONCAT_WS(' ', COALESCE(c3.Prenom,''), COALESCE(c3.Nom,'')) LIKE ?)
      OR EXISTS (SELECT 1 FROM Agent_Reception ar3 WHERE ar3.IDAgent_Reception = a.IDAgent_Reception
                 AND CONCAT_WS(' ', COALESCE(ar3.Prenom,''), COALESCE(ar3.Nom,''), COALESCE(ar3.Login,'')) LIKE ?)
      OR EXISTS (SELECT 1 FROM Agent ae3 WHERE ae3.IDAgent_Emmission = a.IDAgent_Emmission
                 AND CONCAT_WS(' ', COALESCE(ae3.Prenom,''), COALESCE(ae3.Nom,''), COALESCE(ae3.Login,'')) LIKE ?)
    )`);
    params.push(qq, qDigits, qq, qq, qq);
  }

  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // total (compte uniquement Appel)
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total
     FROM Appel a
     ${whereSQL}`,
    params
  );

  // page (noms déjà résolus)
  const [rows] = await db.query(
    `
    SELECT
      a.IDAppel, a.Date, a.Heure, a.Type_Appel, a.Duree_Appel, a.Commentaire,
      a.Numero, a.IDClient, a.IDAgent_Emmission, a.IDAgent_Reception, a.Sous_Statut,
      c.Prenom AS client_prenom, c.Nom AS client_nom,
      ae.Prenom AS ae_prenom, ae.Nom AS ae_nom,
      ar.Prenom AS ar_prenom, ar.Nom AS ar_nom
    FROM Appel a
    LEFT JOIN Client c ON c.IDClient = a.IDClient
    LEFT JOIN Agent ae ON ae.IDAgent_Emmission = a.IDAgent_Emmission
    LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception = a.IDAgent_Reception
    ${whereSQL}
    ORDER BY a.${sortCol} ${order}, a.IDAppel ${order}
    LIMIT ? OFFSET ?
    `,
    [...params, L, offset]
  );

  const formatted = (rows || []).map(r => ({
    IDAppel: r.IDAppel,
    Date: r.Date,
    Heure: r.Heure,
    Type_Appel: r.Type_Appel,
    Duree_Appel: r.Duree_Appel,
    Commentaire: r.Commentaire,
    Numero: r.Numero,
    Sous_Statut: r.Sous_Statut,
    Client: r.IDClient ? { IDClient: r.IDClient, Prenom: r.client_prenom, Nom: r.client_nom } : null,
    Agent_Emmission: r.IDAgent_Emmission ? { Prenom: r.ae_prenom, Nom: r.ae_nom } : null,
    Agent_Reception: r.IDAgent_Reception ? { Prenom: r.ar_prenom, Nom: r.ar_nom } : null,
  }));

  return { total, rows: formatted, page: p, limit: L };
}