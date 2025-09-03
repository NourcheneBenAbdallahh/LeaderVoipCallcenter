import {
  findJournalAppelsPaginated,
  getJournalAppelsAggregates,
} from "../services/appeloptiService.js";


/**
 * GET /api/journalappels/opti
 * Query: page, limit, sortBy, sortDir, + tous les filtres (IDAgent_*, Sous_Statut[], dureeMin/dureeMax, dateFrom/dateTo, IDClient, q)
 */
export async function getJournalAppelsOpti(req, res) {
  try {
    const {
      page,
      limit,
      sortBy,
      sortDir,
      IDAgent_Reception,
      IDAgent_Emmission,
      IDClient,
      dateFrom,
      dateTo,
      dureeMin,
      dureeMax,
      q,
    } = req.query;

    // Sous_Statut[] peut venir sous forme "A,B,C" => on split
    const Sous_Statut = req.query.Sous_Statut
      ? String(req.query.Sous_Statut).split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const result = await findJournalAppelsPaginated({
      page,
      limit,
      sortBy,
      sortDir,
      filters: {
        IDAgent_Reception,
        IDAgent_Emmission,
        Sous_Statut,
        IDClient,
        dateFrom,
        dateTo,
        dureeMin,
        dureeMax,
        q,
      },
    });

    res.json({
      rows: result.rows,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (e) {
    console.error("getJournalAppelsOpti error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * (Optionnel) GET /api/journalappels/opti/aggregates
 * Renvoie des agrégats (total, durée totale, total traités) pour l’ensemble filtré.
 */
export async function getJournalAppelsAggregatesController(req, res) {
  try {
    const {
      IDAgent_Reception,
      IDAgent_Emmission,
      IDClient,
      dateFrom,
      dateTo,
      dureeMin,
      dureeMax,
      q,
    } = req.query;

    const Sous_Statut = req.query.Sous_Statut
      ? String(req.query.Sous_Statut).split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const agg = await getJournalAppelsAggregates({
      IDAgent_Reception,
      IDAgent_Emmission,
      IDClient,
      dateFrom,
      dateTo,
      dureeMin,
      dureeMax,
      q,
      Sous_Statut,
    });

    res.json(agg);
  } catch (e) {
    console.error("getJournalAppelsAggregatesController error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
