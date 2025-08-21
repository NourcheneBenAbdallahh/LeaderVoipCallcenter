import express from "express";
import { getAllSousStatut,
    getAppelsAEditer,
    getAllSousStatutName,
    getStatut,
    getStatutsauf} from "../controllers/statutControllers.js";


const router = express.Router();

router.get("/sous_statuts", getAllSousStatut);
router.get("/sous_statuts/name", getAllSousStatutName);
router.get("/sous_statuts_sauf_aapeller", getStatut);
router.get("/sous_statuts_sauf_aapellername", getStatutsauf);

//get /api/journalappels/edd
router.get("/sous_statutsedd", getAppelsAEditer);

export default router;
