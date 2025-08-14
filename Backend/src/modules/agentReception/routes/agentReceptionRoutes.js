import express from "express";
import { getAllAgentsReceptions } from "../controllers/agentReceptionControllers.js";


const router = express.Router();

router.get("/agentsReception", getAllAgentsReceptions);

export default router;
