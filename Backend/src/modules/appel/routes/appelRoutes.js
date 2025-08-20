import express from "express";
import { getAllAppels,
    filterJournalAppels,
    getAppelsAAppeler,
    getSelectedAppels
} from "../controllers/appelControllers.js";
import { affecter ,
    putUpdateAppel
} from "../controllers/affectationController.js";

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

export default router;
