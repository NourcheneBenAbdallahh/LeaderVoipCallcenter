import { findAllAffectation } from "../services/JournalService.js";

export async function getAllAffectation(req, res) {
  try {
    const appels = await findAllAffectation();
    res.json(appels);
  } catch (error) {
    console.error("Erreur récupération affectation :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
