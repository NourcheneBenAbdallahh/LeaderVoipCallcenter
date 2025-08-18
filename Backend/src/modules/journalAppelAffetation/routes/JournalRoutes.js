import express from "express";
import { getAllAffectation } from "../controllers/JournalControllers.js";

const router = express.Router();

router.get("/affectation", getAllAffectation);

export default router;
