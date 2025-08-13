import { findAllClients, findFilteredClients, countFilteredClients } from "../services/clientService.js";

export async function getAllClients(req, res) {
  try {
    const clients = await findAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Erreur récupération clients :", error);  
    res.status(500).json({ message: "Erreur serveur", error });
  }
}export async function getFilteredClients(req, res) {
  try {
    const {
      appelsEmisMin = 0,
      appelsEmisMax = 1000000,
      appelsRecusMin = 0,
      appelsRecusMax = 1000000,
      sousStatut = null, // ✅ lecture du body
    } = req.body;

    const params = {
      appelsEmisMin,
      appelsEmisMax,
      appelsRecusMin,
      appelsRecusMax,
      sousStatut,
    };

    const clients = await findFilteredClients(params);
    const totalClients = await countFilteredClients(params);

    res.json({ totalClients, clients });
  } catch (error) {
    console.error("Erreur récupération filtrée clients :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
}
