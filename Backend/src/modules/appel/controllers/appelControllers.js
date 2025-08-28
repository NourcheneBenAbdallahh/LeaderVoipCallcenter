// src/modules/appel/controllers/appelControllers.js
import {
  findAllAppels,
  getFilteredJournalAppels,
  findAppelsAAppeler,
  findAppelSelectedStatut,
  updateAppelById,
  existsAppel
} from "../services/appelService.js";

import { creerAppel } from "../services/affectationService.js";

// -------------------- CRUD LECTURE --------------------

export async function getAllAppels(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 300;
    const appels = await findAllAppels(limit);
    res.json(appels);
  } catch (error) {
    console.error("Erreur récupération appels :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getSelectedAppels(req, res) {
  try {
    const appels = await findAppelSelectedStatut();
    res.json(appels);
  } catch (error) {
    console.error("Erreur récupération appels non à appeler :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function filterJournalAppels(req, res) {
  try {
    const filters = req.body || {};
    const result = await getFilteredJournalAppels(filters);
    res.json(result);
  } catch (err) {
    console.error("Erreur filtrage journal appels :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getAppelsAAppeler(req, res) {
  try {
    const appels = await findAppelsAAppeler();
    res.json(appels);
  } catch (error) {
    console.error("Erreur getAppelsAAppeler:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}


// -------------------- AFFECTATION --------------------

export async function affecter(req, res) {
  try {
    const { idClient, idAgent, typeAgent, date, commentaire } = req.body;

    if (!idClient || !idAgent || !typeAgent) {
      return res.status(400).json({
        success: false,
        message: "Champs manquants (idClient, idAgent, typeAgent)",
      });
    }

    const nouvelAppel = await creerAppel({ idClient, idAgent, typeAgent, date, commentaire });

    res.json({
      success: true,
      message: "Nouvel appel créé et affecté avec succès",
      appel: nouvelAppel,
    });
  } catch (error) {
    console.error("Erreur affecter:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

// -------------------- UPDATE --------------------

/**
 * PUT /api/journalappels/:id
 * Body: { Sous_Statut?: string, Commentaire?: string }
 * Statuts modifiables par l’agent : "ne repond pas", "traité"
 */
export async function putUpdateAppel(req, res) {
  try {
    const id = req.params.id;
    const { Sous_Statut, Commentaire } = req.body ?? {};

    if (typeof Sous_Statut !== "undefined") {
      const allowed = ["ne repond pas", "traité"];
      if (!allowed.includes(String(Sous_Statut).toLowerCase())) {
        return res.status(400).json({ error: "Statut non autorisé" });
      }
    }

    // Vérifie l’existence (sinon 404)
    const exists = await existsAppel(id);
    if (!exists) {
      return res.status(404).json({ error: "Appel introuvable" });
    }

    const result = await updateAppelById(id, { Sous_Statut, Commentaire });

    // Même si changedRows = 0 (mêmes valeurs), on retourne OK
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
