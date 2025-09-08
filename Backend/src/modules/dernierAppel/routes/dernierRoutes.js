import express from "express";
import { latestByPhone, historyByPhone } from "../controllers/dernierControllers.js";

const router = express.Router();

/**
 * POST /api/appels/latestByPhone
 * Body: { "numero": "0892470506" }
 */
router.post("/appels/latestByPhone", latestByPhone);

/**
 * POST /api/appels/historyByPhone
 * Body: { "numero": "0892470506", "page": 1, "limit": 10, "sort": "desc" }
 */
router.post("/appels/historyByPhone", historyByPhone);

export default router;