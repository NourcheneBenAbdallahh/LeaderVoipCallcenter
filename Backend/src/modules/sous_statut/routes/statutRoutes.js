import express from "express";
import { getAllSousStatut, getAllSousStatutName} from "../controllers/statutControllers.js";


const router = express.Router();

router.get("/sous_statuts", getAllSousStatut);
router.get("/sous_statuts/name", getAllSousStatutName);


export default router;
