import { findAllAppels,getFilteredJournalAppels } from "../services/appelService.js";

export async function getAllAppels(req, res) {
  try {
    const appels = await findAllAppels();
    res.json(appels);
  } catch (error) {
    console.error("Erreur récupération appels :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function filterJournalAppels(req, res) {
  try {
    const filters = req.body; // { IDAgent_Reception, IDAgent_Emmission, Sous_Statut, Duree_Appel, Date, IDClient }
    const result = await getFilteredJournalAppels(filters);
    res.json(result);
  } catch (err) {
    console.error("Erreur filtrage journal appels :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}