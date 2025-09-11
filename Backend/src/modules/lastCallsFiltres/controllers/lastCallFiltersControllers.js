import  pool  from "../../../config/db.js";
function getDB(req) { return req?.pool ?? pool; }

/**
 * GET /api/last-calls
 * Params acceptés (tous optionnels) :
 * - page, limit, sortBy, sortDir
 * - clientName            (nom/prenom/raison sociale)
 * - agentEmmissionName    (nom/prenom/login)
 * - agentReceptionName    (nom/prenom/login)
 * - sousStatuts           (CSV ou tableau)
 * - dateFrom, dateTo      (YYYY-MM-DD)
 * - dureeMin, dureeMax    (secondes)
 * - q                     (recherche globale)
 */
export async function lastCalls(req, res) {
  try {
    const db = getDB(req);

    // Pagination / tri
    const page  = Math.max(1, parseInt(req.query.page ?? "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? "20", 10)));
    const offset = (page - 1) * limit;
    const sortDir = String(req.query.sortDir || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const sortable = new Set(["Date","Heure","IDAppel","Duree_Appel","Type_Appel","Sous_Statut"]);
    const sortBy = sortable.has(String(req.query.sortBy)) ? String(req.query.sortBy) : "Date";

    // Filtres (par noms / login)
    const clientName         = (req.query.clientName || req.query.Client_Nom || "").trim();
    const agentEmmissionName = (req.query.agentEmmissionName || req.query.Agent_Emmission_Nom || "").trim();
    const agentReceptionName = (req.query.agentReceptionName || req.query.Agent_Reception_Nom || "").trim();
    const q                  = (req.query.q || "").trim();
    const dateFrom           = (req.query.dateFrom || "").trim();
    const dateTo             = (req.query.dateTo || "").trim();
    const dureeMin           = Number(req.query.dureeMin ?? "");
    const dureeMax           = Number(req.query.dureeMax ?? "");
    const sousStatutsRaw     = (req.query.sousStatuts || req.query.Sous_Statut || "").toString();

    const where = [];
    const params = [];

    // Dates
    if (dateFrom) { where.push("a.Date >= ?"); params.push(dateFrom); }
    if (dateTo)   { where.push("a.Date <= ?"); params.push(dateTo); }

    // Durées (secondes)
    if (!Number.isNaN(dureeMin) && dureeMin > 0) { where.push("a.Duree_Appel >= ?"); params.push(dureeMin); }
    if (!Number.isNaN(dureeMax) && dureeMax > 0) { where.push("a.Duree_Appel <= ?"); params.push(dureeMax); }

    // Client par nom/prénom/raison sociale
    if (clientName) {
      where.push(`EXISTS (
        SELECT 1 FROM Client c2
        WHERE c2.IDClient = a.IDClient
          AND CONCAT_WS(' ', COALESCE(c2.Prenom,''), COALESCE(c2.Nom,''), COALESCE(c2.Civilite,'')) LIKE ?
      )`);
      params.push(`%${clientName}%`);
    }

    // Agents par nom/prénom/login
    if (agentEmmissionName) {
      where.push(`EXISTS (
        SELECT 1 FROM Agent ae2
        WHERE ae2.IDAgent_Emmission = a.IDAgent_Emmission
          AND CONCAT_WS(' ', COALESCE(ae2.Prenom,''), COALESCE(ae2.Nom,''), COALESCE(ae2.Login,'')) LIKE ?
      )`);
      params.push(`%${agentEmmissionName}%`);
    }
    if (agentReceptionName) {
      where.push(`EXISTS (
        SELECT 1 FROM Agent_Reception ar2
        WHERE ar2.IDAgent_Reception = a.IDAgent_Reception
          AND CONCAT_WS(' ', COALESCE(ar2.Prenom,''), COALESCE(ar2.Nom,''), COALESCE(ar2.Login,'')) LIKE ?
      )`);
      params.push(`%${agentReceptionName}%`);
    }

    // Sous-statuts
    let ss = [];
    if (Array.isArray(req.query.sousStatuts)) ss = req.query.sousStatuts;
    else if (sousStatutsRaw) ss = sousStatutsRaw.split(",").map(s => s.trim()).filter(Boolean);
    if (ss.length) {
      where.push(`a.Sous_Statut IN (${ss.map(()=>"?").join(",")})`);
      params.push(...ss);
    }

    // Recherche globale
    if (q) {
      const qLike = `%${q}%`;
      const qDigits = q.replace(/\D/g, "");
      where.push(`(
        a.Commentaire LIKE ?
        OR a.Sous_Statut LIKE ?
        OR REPLACE(REPLACE(REPLACE(a.Numero, '-', ''), '.', ''), ' ', '') LIKE ?
        OR EXISTS (SELECT 1 FROM Client c3 WHERE c3.IDClient=a.IDClient AND CONCAT_WS(' ',c3.Prenom,c3.Nom,c3.Civilite) LIKE ?)
        OR EXISTS (SELECT 1 FROM Agent ae3  WHERE ae3.IDAgent_Emmission=a.IDAgent_Emmission AND CONCAT_WS(' ',ae3.Prenom,ae3.Nom,ae3.Login) LIKE ?)
        OR EXISTS (SELECT 1 FROM Agent_Reception ar3 WHERE ar3.IDAgent_Reception=a.IDAgent_Reception AND CONCAT_WS(' ',ar3.Prenom,ar3.Nom,ar3.Login) LIKE ?)
      )`);
      params.push(qLike, qLike, `%${qDigits}%`, qLike, qLike, qLike);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Total
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM Appel a ${whereSQL}`,
      params
    );

    // Lignes paginées
    const [rows] = await db.query(
      `SELECT a.*,
              ae.Prenom AS ae_prenom, ae.Nom AS ae_nom, ae.Login AS ae_login,
              ar.Prenom AS ar_prenom, ar.Nom AS ar_nom, ar.Login AS ar_login,
              c.Prenom  AS client_prenom, c.Nom AS client_nom, c.Civilite AS client_rs
       FROM Appel a
       LEFT JOIN Agent ae ON ae.IDAgent_Emmission = a.IDAgent_Emmission
       LEFT JOIN Agent_Reception ar ON ar.IDAgent_Reception = a.IDAgent_Reception
       LEFT JOIN Client c ON c.IDClient = a.IDClient
       ${whereSQL}
       ORDER BY a.${sortBy} ${sortDir}, a.IDAppel ${sortDir}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const data = rows.map(r => ({
      IDAppel: r.IDAppel,
      Date: r.Date,
      Heure: r.Heure,
      Type_Appel: r.Type_Appel,
      Duree_Appel: r.Duree_Appel,
      Commentaire: r.Commentaire,
      Numero: r.Numero,
      Sous_Statut: r.Sous_Statut,
      IDClient: r.IDClient,
      IDAgent_Reception: r.IDAgent_Reception,
      IDAgent_Emmission: r.IDAgent_Emmission,
      Client: {
        IDClient: r.IDClient,
        Nom: r.client_nom,
        Prenom: r.client_prenom,
        Civilite: r.client_rs,
      },
      Agent_Emmission: r.IDAgent_Emmission ? {
        Prenom: r.ae_prenom, Nom: r.ae_nom, Login: r.ae_login
      } : null,
      Agent_Reception: r.IDAgent_Reception ? {
        Prenom: r.ar_prenom, Nom: r.ar_nom, Login: r.ar_login
      } : null
    }));

    return res.json({
      success: true,
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (e) {
    console.error("lastCalls error:", e);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}
