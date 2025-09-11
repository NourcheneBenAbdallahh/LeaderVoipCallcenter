import express from "express";
import {
  latestByClientPhone,
  historyByClientId,
  searchClientsByPhone
} from "../controllers/dernierParClientControllers.js";

const router = express.Router();

/**
 * POST /api/client/latestByPhone
 * Body: { "phone": "" }
 * Retourne les clients avec ce téléphone et leur dernier appel
 */
router.post("/client/latestByPhone", latestByClientPhone);

/**
 * POST /api/client/:id/history
 * Body: { "page": 1, "limit": 10, ...filters }
 * Historique des appels d'un client spécifique
 */
router.post("/client/:id/history", historyByClientId);

/**
 * GET /api/client/searchByPhone/:phone
 * Recherche de clients par téléphone
 */
router.get("/client/searchByPhone/:phone", searchClientsByPhone);

export default router;