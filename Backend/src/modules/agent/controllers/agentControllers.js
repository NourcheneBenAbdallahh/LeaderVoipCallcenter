import { findAllAgents } from "../services/agenService.js";

export async function getAllAgents(req, res) {
  try {
    const agents = await findAllAgents();
    res.json(agents);
  } catch (error) {
    console.error("Erreur récupération agents :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
