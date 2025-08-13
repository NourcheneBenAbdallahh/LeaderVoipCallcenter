import express from "express";
import cors from "cors";
import agentRoutes from "./src/modules/agent/routes/agentRoutes.js";
import clientRoutes from "./src/modules/client/routes/clientRoutes.js";
import appelRoutes from "./src/modules/appel/routes/appelRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", agentRoutes);
app.use("/api", clientRoutes);  
app.use("/api", appelRoutes);  

const PORT = process.env.PORT || 5000;
app.get("/test", (req, res) => {
  res.send("✅ Serveur fonctionne !");
});

app.listen(PORT, () => {
  console.log(`✅ Backend lancé sur http://localhost:${PORT}`);
});
