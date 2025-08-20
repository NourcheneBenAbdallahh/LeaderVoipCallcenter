import { 
  creerAppel 
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

    // Créer l'appel et affecter le client
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
}export async function putUpdateAppel(req, res) {
  try {
    const id = req.params.id;
    const { Sous_Statut, Commentaire } = req.body ?? {};

    // Statuts que l'agent peut mettre
    if (typeof Sous_Statut !== "undefined") {
      const allowed = ["ne repond pas", "traité"];
      if (!allowed.includes(String(Sous_Statut).toLowerCase())) {
        return res.status(400).json({ error: "Statut non autorisé" });
      }
    }

    // ✅ d’abord vérifier que la ligne existe
    const exists = await existsAppel(id);
    if (!exists) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    // puis tenter la mise à jour
    const result = await updateAppelById(id, { Sous_Statut, Commentaire });

    // ✅ si la ligne existe mais rien n’a changé (mêmes valeurs), on retourne OK quand même
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