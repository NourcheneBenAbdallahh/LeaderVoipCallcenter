
import "dotenv/config";

import express from "express";
import cors from "cors";
import agentRoutes from "./src/modules/agent/routes/agentRoutes.js";
import clientRoutes from "./src/modules/client/routes/clientRoutes.js";
import appelRoutes from "./src/modules/appel/routes/appelRoutes.js";
import sousStatutRoutes from "./src/modules/sous_statut/routes/statutRoutes.js";
import agentReceptionRoutes from "./src/modules/agentReception/routes/agentReceptionRoutes.js";
import JournalRoutes from "./src/modules/journalAppelAffetation/routes/JournalRoutes.js";
import authRoutes from "./src/modules/auth/routes/authRoutes.js";
//import { initDB } from "./src/config/db.js";



const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", agentRoutes);
app.use("/api", agentReceptionRoutes);  

app.use("/api", clientRoutes);  
app.use("/api", appelRoutes);  
app.use("/api", sousStatutRoutes);  
app.use("/api", JournalRoutes);  
app.use("/auth", authRoutes);


//auth
import dotenv from "dotenv";
dotenv.config();

//const PORT = process.env.DB_PORT ;
//local
const PORT =process.env.PORT;


app.get("/test", (req, res) => {
  res.send("✅ Serveur fonctionne !");
});

app.listen(PORT, () => {
 console.log(` Backend lancé sur ${PORT}`);
  // console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
});
/*
(async () => {
  await initDB({ retries: 3, delayMs: 1000 });
  app.listen(PORT, () => console.log(`✅ Backend lancé sur http://localhost:${PORT}`));
})();*/