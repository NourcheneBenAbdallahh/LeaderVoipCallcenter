import { 
  creerAppel ,getDerniersAppels

} from "../services/affectationService.js";


import { 
updateAppelById ,existsAppel
} from "../services/appelService.js";


// Création et affectation d'un appel
export async function affecter(req, res) {
  try {
    const { idClient, idAgent, typeAgent, date, commentaire } = req.body;

    // Vérification des champs obligatoires
    if (!idClient || !idAgent || !typeAgent) {
      return res.status(400).json({ 
        success: false, 
        message: "Champs manquants (idClient, idAgent, typeAgent)" 
      });
    }

    const nouvelAppel = await creerAppel({ idClient, idAgent, typeAgent, date, commentaire });

    res.json({
      success: true,
      message: "Nouvel appel créé et affecté avec succès",
      appel: nouvelAppel
    });
  } catch (error) {
    console.error("Erreur affecter:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function putUpdateAppel(req, res) {
  try {
    const id = req.params.id;
    const { Sous_Statut, Commentaire } = req.body ?? {};

    if (typeof Sous_Statut !== "undefined") {
      const allowed = ["ne repond pas", "traite"];
      if (!allowed.includes(String(Sous_Statut).toLowerCase())) {
        return res.status(400).json({ error: "Statut non autorisé" });
      }
    }

const exists = await existsAppel(id);
    if (!exists) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

const result = await updateAppelById(id, { Sous_Statut, Commentaire });

    return res.json({
      ok: true,
      id,
      changedRows: result.changedRows ?? 0,
      info: result.info ?? undefined,
    });
  } catch (error) {
    console.error("Erreur update appel :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getDerniersAppelsController(req, res) {
  try {
    const { limit } = req.query; // ?limit=10
    const rows = await getDerniersAppels(limit);
    res.json(rows);
  } catch (err) {
    console.error("Erreur getDerniersAppels :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}