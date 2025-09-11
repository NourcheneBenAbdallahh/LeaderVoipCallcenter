// index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDB, regionMiddleware } from "./src/config/db.js";

import agentRoutes from "./src/modules/agent/routes/agentRoutes.js";
import clientRoutes from "./src/modules/client/routes/clientRoutes.js";
import appelRoutes from "./src/modules/appel/routes/appelRoutes.js";
import sousStatutRoutes from "./src/modules/sous_statut/routes/statutRoutes.js";
import agentReceptionRoutes from "./src/modules/agentReception/routes/agentReceptionRoutes.js";
import JournalRoutes from "./src/modules/journalAppelAffetation/routes/JournalRoutes.js";
import authRoutes from "./src/modules/auth/routes/authRoutes.js";
import dernierRoutes from "./src/modules/dernierAppel/routes/dernierRoutes.js";
import dernierClientRoutes from "./src/modules/dernierAppelParClient/routes/dernierClientRoutes.js";

import lastCallFiltersRoutes from "./src/modules/lastCallsFiltres/routes/lastCallFiltersRoutes.js";
const app = express();
app.use(cors());
app.use(express.json());


// Routes SANs DB (pas besoin de région)
app.get("/test", (_req, res) => res.send("✅ Serveur OK"));
app.get("/api/health", (req, res) => res.json({ ok: true }));


// Région obligatoire pour la suite
app.use(regionMiddleware);     

// ...


// Tests rapides
app.get("/test", (_req, res) => res.send("✅ Serveur OK"));
app.get("/api/health", (req, res) => res.json({ ok: true, region: req.region }));

// Routes API (⚠️ elles doivent utiliser pool à l'intérieur)
app.use("/api", agentRoutes);
app.use("/api", agentReceptionRoutes);
app.use("/api", clientRoutes);
app.use("/api", appelRoutes);
app.use("/api", sousStatutRoutes);
app.use("/api", JournalRoutes);
app.use("/auth", authRoutes);
app.use("/api", dernierRoutes);
app.use("/api", dernierClientRoutes);
app.use("/api", lastCallFiltersRoutes);


const PORT = Number(process.env.PORT || 5000);

(async () => {
 /* try {
    await initDB(); // ping des 3 pools configurés
  } catch (e) {
    console.error("🚫 initDB a des erreurs (certaines régions peuvent être KO). Le serveur démarre quand même.");
  }*/

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
  });
})();
