import express from "express";
import { getAllAgents } from "../controllers/agentControllers.js";

const router = express.Router();

router.get("/agents", getAllAgents);

export default router;
