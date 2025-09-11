// src/modules/dernierAppel/controllers/dernierControllers.js
import { getLastCallByPhone, getCallHistoryByPhone,
  getCallHistoryByClient
 } from "../services/dernierService.js";

/** POST /api/appels/latestByPhone */
export async function latestByPhone(req, res) {
  try {
    const numero = (req.body.numero ?? "").toString().replace(/\D/g, "").trim();
    if (!numero) return res.status(400).json({ message: "Numéro requis" });
    const { appel, client } = await getLastCallByPhone(req, numero);
    return res.json({ client, appel });
  } catch (e) {
    console.error("latestByPhone error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * POST /api/appels/historyByPhone
 * Body: {
 *   numero, page, limit, sort, sortBy,
 *   dateFrom, dateTo, typeAppel,
 *   agentReceptionName, agentEmmissionName,
 *   sousStatuts (array|csv),
 *   clientName, q
 * }
 */
export async function historyByPhone(req, res) {
  try {
    const numero = (req.body.numero ?? "").toString().replace(/\D/g, "").trim();
    if (!numero) return res.status(400).json({ message: "Numéro requis" });

    const result = await getCallHistoryByPhone(req, numero, {
      page: req.body.page,
      limit: req.body.limit,
      sort: req.body.sort,       // "asc" | "desc"
      sortBy: req.body.sortBy,   // Date|Heure|IDAppel|Duree_Appel|Type_Appel
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      typeAppel: req.body.typeAppel,
      agentReceptionName: req.body.agentReceptionName,
      agentEmmissionName: req.body.agentEmmissionName,
      sousStatuts: req.body.sousStatuts,
      clientName: req.body.clientName,
      q: req.body.q,
    });
    return res.json(result);
  } catch (e) {
    console.error("historyByPhone error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}
// src/modules/dernierAppel/controllers/dernierControllers.js

/** POST /api/appels/historyByClient */
export async function historyByClient(req, res) {
  try {
    const clientId = parseInt(req.body.clientId);
    if (!clientId) return res.status(400).json({ message: "ID client requis" });

    const result = await getCallHistoryByClient(req, clientId, {
      page: req.body.page,
      limit: req.body.limit,
      sort: req.body.sort,
      sortBy: req.body.sortBy,
      dateFrom: req.body.dateFrom,
      dateTo: req.body.dateTo,
      typeAppel: req.body.typeAppel,
      agentReceptionName: req.body.agentReceptionName,
      agentEmmissionName: req.body.agentEmmissionName,
      sousStatuts: req.body.sousStatuts,
      clientName: req.body.clientName,
      q: req.body.q,
    });
    return res.json(result);
  } catch (e) {
    console.error("historyByClient error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}