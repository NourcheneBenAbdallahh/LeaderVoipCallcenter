import express from "express";
import { getAllClients ,getFilteredClients } from "../controllers/clientControllers.js";

const router = express.Router();

router.get("/clients", getAllClients);
router.post("/clients/filter", getFilteredClients);

export default router;
