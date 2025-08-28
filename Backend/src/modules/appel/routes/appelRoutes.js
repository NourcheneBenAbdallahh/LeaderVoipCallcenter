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

export default router;
