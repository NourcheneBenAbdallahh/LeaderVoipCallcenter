import { 

  creerAppel 
} from "../services/affectationService.js";



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
}
