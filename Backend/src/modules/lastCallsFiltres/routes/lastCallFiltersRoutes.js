import express from "express";
import { lastCalls } from "../controllers/lastCallFiltersControllers.js";
const router = express.Router();

router.get("/last-calls-filters", lastCalls);

export default router;
