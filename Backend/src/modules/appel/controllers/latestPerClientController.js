// controllers/clientLastCallsController.js
import {
  findLastCallsByClient,
  getLastCallsAggregates,
} from "../services/latestPerClientService.js";

/**
 * GET /api/client/last-calls
 * Récupère le dernier appel pour chaque client avec pagination et filtres
 */
export async function getClientLastCalls(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "Date",
      sortDir = "DESC",
      IDAgent_Reception,
      IDAgent_Emmission,
      IDClient,
      dateFrom,
      dateTo,
      dureeMin,
      dureeMax,
      q,
    } = req.query;

    // Conversion des paramètres de Sous_Statut
    const Sous_Statut = req.query.Sous_Statut
      ? String(req.query.Sous_Statut).split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const result = await findLastCallsByClient({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
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
      success: true,
      data: result.rows,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit
      }
    });
  } catch (e) {
    console.error("getClientLastCalls error:", e);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des derniers appels",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}

/**
 * GET /api/client/last-calls/aggregates
 * Récupère les statistiques agrégées pour les derniers appels
 */
export async function getClientLastCallsAggregates(req, res) {
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

    const aggregates = await getLastCallsAggregates({
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

    res.json({
      success: true,
      aggregates
    });
  } catch (e) {
    console.error("getClientLastCallsAggregates error:", e);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}

/**
 * GET /api/client/:idClient/last-call
 * Récupère le dernier appel d'un client spécifique
 */
export async function getSingleClientLastCall(req, res) {
  try {
    const { idClient } = req.params;

    const result = await findLastCallsByClient({
      page: 1,
      limit: 1,
      sortBy: "Date",
      sortDir: "DESC",
      filters: { IDClient: idClient },
    });

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun appel trouvé pour ce client"
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (e) {
    console.error("getSingleClientLastCall error:", e);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération du dernier appel",
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
}