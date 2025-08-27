import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/hello", (_req, res) => {
  res.json({ message: "✅ Hello from backend!" });
});

//const PORT =process.env.DB_PORT;
//local
const PORT =process.env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Backend is running on http://localhost:${PORT}`);
});
