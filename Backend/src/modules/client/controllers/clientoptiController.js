// src/controllers/clientController.js
import {
  findClientsPaginated,
  countFilteredClients,
} from "../services/clientoptiService";

/**
 * GET /api/clients
 * Query params: page, limit, appelsEmisMin, appelsEmisMax, appelsRecusMin, appelsRecusMax
 */
export async function getClients(req, res) {
  try {
    const {
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
    } = req.query;

    const result = await findClientsPaginated({
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
    });

    return res.json({
      clients: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (error) {
    console.error("Erreur getClients :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * POST /api/clients/filter
 * Body: appelsEmisMin, appelsEmisMax, appelsRecusMin, appelsRecusMax, page, limit
 * (Même logique que GET mais en POST si tu préfères envoyer le corps)
 */
export async function filterClients(req, res) {
  try {
    const {
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
    } = req.body || {};

    const result = await findClientsPaginated({
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
    });

    return res.json({
      clients: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (error) {
    console.error("Erreur filterClients :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * (Optionnel) GET /api/clients/count
 * Query params comme getClients, mais ne renvoie que le total.
 */
export async function getClientsCount(req, res) {
  try {
    const {
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
    } = req.query;

    const total = await countFilteredClients({
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
    });

    return res.json({ total });
  } catch (error) {
    console.error("Erreur getClientsCount :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}
