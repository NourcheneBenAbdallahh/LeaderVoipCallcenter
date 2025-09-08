import {
  findClientsPaginated,
  countFilteredClients,
} from "../services/clientoptiService.js"; 

export async function getClients(req, res) {
  try {
    const {
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      q,        // Paramètre de recherche
      search,   // Alternative à 'q'
    } = req.query;

    // Utilise 'q' ou 'search' comme terme de recherche
    const searchTerm = q || search;

    const result = await findClientsPaginated({
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      q: searchTerm, // Passe le terme de recherche
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

export async function filterClients(req, res) {
  try {
    const {
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      q,        // Recherche dans le body aussi
      search,
    } = req.body || {};

    const searchTerm = q || search;

    const result = await findClientsPaginated({
      page,
      limit,
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      q: searchTerm,
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

export async function getClientsCount(req, res) {
  try {
    const {
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      q,
      search,
    } = req.query;

    const searchTerm = q || search;

    const total = await countFilteredClients({
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      q: searchTerm,
    });

    return res.json({ total });
  } catch (error) {
    console.error("Erreur getClientsCount :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}