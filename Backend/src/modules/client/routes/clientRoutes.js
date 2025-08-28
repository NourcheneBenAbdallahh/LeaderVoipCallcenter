import express from "express";
import { getAllClients ,getFilteredClients } from "../controllers/clientControllers.js";

const router = express.Router();

router.get("/clients", getAllClients);
router.post("/clients/filter", getFilteredClients);


//optimized
import {
  getClients,
  filterClients,
  getClientsCount,
} from "../controllers/clientoptiController.js";


router.get("/clientsopti", getClients);
router.post("/clientsopti/filter", filterClients);
router.get("/clientsopti/count", getClientsCount);
export default router;
