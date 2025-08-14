import { findAllStatut ,findAllSousStatut} from "../services/statutService.js";

export async function getAllSousStatut(req, res) {
  try {
    const sousStatut = await findAllStatut();
    res.json(sousStatut);
  } catch (error) {
    console.error("Erreur récupération sous_statut :", error);  
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

export async function getAllSousStatutName(req, res) {
  try {
    const sousStatut = await findAllSousStatut();
    res.json(sousStatut);
  } catch (error) {
    console.error("Erreur récupération sous_statut :", error);  
    res.status(500).json({ message: "Erreur serveur", error });
  }
}
