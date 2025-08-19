import express from "express";
import { getAllAppels,filterJournalAppels,getAppelsAAppeler} from "../controllers/appelControllers.js";
import { affecter} from "../controllers/affectationController.js";

const router = express.Router();

router.get("/appels", getAllAppels);

//Filtre  POST /api/journalappels/filter
router.post("/journalappels/filter", filterJournalAppels);

//affecter POST /api/journalappels/affecter
router.post("/journalappels/affecter",affecter);

// Get /api/journalappels/aapeller
router.get("/journalappels/aapeller", getAppelsAAppeler);

export default router;
