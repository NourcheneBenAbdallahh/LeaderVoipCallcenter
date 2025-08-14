import { findAllAgentsReceptions } from "../services/agenReceptionService.js";


export async function getAllAgentsReceptions(req, res) {
  try {
    const agents = await findAllAgentsReceptions();
    res.json(agents);
  } catch (error) {
    console.error("Erreur récupération agents receptions :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
