import express from "express";
import { getAllAppels,
    filterJournalAppels,
    getAppelsAAppeler,
    getSelectedAppels
} from "../controllers/appelControllers.js";
import { affecter ,
    putUpdateAppel,getDerniersAppelsController
} from "../controllers/affectationController.js";

import { getAppelsAujourdHui, getAppelsHier } from "../controllers/countappelController.js";

import { getJournalAppelsOpti, getJournalAppelsAggregatesController } from "../controllers/appeloptiController.js";




import {
  getClientLastCalls,
  getClientLastCallsAggregates,
  getSingleClientLastCall,
} from "../controllers/latestPerClientController.js";

const router = express.Router();

router.get("/appels", getAllAppels);
router.get("/appelsselect", getSelectedAppels);

//Filtre  POST /api/journalappels/filter
router.post("/journalappels/filter", filterJournalAppels);

//affecter POST /api/journalappels/affecter
router.post("/journalappels/affecter",affecter);

// Get /api/journalappels/aapeller
router.get("/journalappels/aapeller", getAppelsAAppeler);


//updateappel
router.put("/journalappels/:id", putUpdateAppel);

//count Get /api/count-today
router.get("/count-today", getAppelsAujourdHui);
router.get("/count-yesterday", getAppelsHier);


//dashbor  Get /api/recents
router.get("/recents", getDerniersAppelsController);


//VersionOptimisé
//cest Historiques appels de Journals Appels qui rend tout les appels
router.get("/journalappels/opti", getJournalAppelsOpti);

router.get("/journalappels/opti/aggregates", getJournalAppelsAggregatesController);



// Nouveau endpoint
// GET /api/journalappels/latest-per-client
router.get("/last-calls", getClientLastCalls);
router.get("/last-calls/aggregates", getClientLastCallsAggregates);
router.get("/:idClient/last-call", getSingleClientLastCall);


export default router;
