import { findAllStatut ,
  findAllSousStatut,
  findStatuts,
  findAllSousStatutsauf,
  findAppelSelectedStatutEdit

} from "../services/statutService.js";

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
//exclure a appeler
export async function getStatut(req, res) {
  try {
    const sousStatut = await findStatuts();
    res.json(sousStatut);
  } catch (error) {
    console.error("Erreur récupération sous_statut :", error);  
    res.status(500).json({ message: "Erreur serveur", error });
  }
}
//exclure a appeler
export async function getStatutsauf(req, res) {
  try {
    const sousStatut = await findAllSousStatutsauf();
    res.json(sousStatut);
  } catch (error) {
    console.error("Erreur récupération sous_statut sauf:", error);  
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

export async function getAppelsAEditer(req, res) {
  try {
    const appels = await findAppelSelectedStatutEdit();
    res.json(appels);
  } catch (error) {
    console.error("Erreur get apels editer:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}