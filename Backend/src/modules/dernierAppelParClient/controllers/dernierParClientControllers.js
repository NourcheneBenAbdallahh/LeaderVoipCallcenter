import {
  getLastCallByClientPhone,
  getCallHistoryByClientId
} from "../services/dernierParClientService.js";

/**
 * POST /api/client/latestByPhone
 * Recherche le dernier appel par téléphone client
 */
export async function latestByClientPhone(req, res) {
  try {
    const phone = (req.body.phone ?? "").toString().trim();
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Numéro de téléphone requis" 
      });
    }

    const results = await getLastCallByClientPhone(req, phone);
    
    return res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    console.error("latestByClientPhone error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la recherche",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * POST /api/client/:id/history
 * Historique des appels d'un client spécifique
 */
export async function historyByClientId(req, res) {
  try {
    const clientId = parseInt(req.params.id, 10);
    if (isNaN(clientId) || clientId <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "ID client invalide" 
      });
    }

    const result = await getCallHistoryByClientId(req, clientId, {
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
      q: req.body.q
    });

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.total,
        itemsPerPage: result.limit
      }
    });
  } catch (error) {
    console.error("historyByClientId error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la récupération de l'historique",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * GET /api/client/searchByPhone/:phone
 * Recherche de clients par téléphone (sans les appels)
 */
export async function searchClientsByPhone(req, res) {
  try {
    const phone = (req.params.phone ?? "").toString().trim();
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: "Numéro de téléphone requis" 
      });
    }

    // Utilisation simplifiée de la fonction existante
    const results = await getLastCallByClientPhone(req, phone);
    const clients = results.map(result => result.client);

    return res.json({
      success: true,
      data: clients,
      count: clients.length
    });
  } catch (error) {
    console.error("searchClientsByPhone error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Erreur serveur lors de la recherche",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}