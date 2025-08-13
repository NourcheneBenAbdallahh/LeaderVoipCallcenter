import express from "express";
import { getAllAppels,filterJournalAppels } from "../controllers/appelControllers.js";

const router = express.Router();

router.get("/appels", getAllAppels);

//Filtre  POST /api/journalappels/filter
router.post("/journalappels/filter", filterJournalAppels);
export default router;
