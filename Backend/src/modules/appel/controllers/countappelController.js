
import { countAppelsAujourdHui, countAppelsHier } from "../services/countappelService.js";

export async function getAppelsAujourdHui(req, res) {
  try {
    const total = await countAppelsAujourdHui();
    return res.json({ total });
  } catch (e) {
    console.error("count-today ERROR:", e);
    return res
      .status(e.code === "ETIMEDOUT" ? 503 : 500)
      .json({ message: "count-today failed", code: e.code, error: e.message });
  }
}

export async function getAppelsHier(req, res) {
  try {
    const total = await countAppelsHier();
    return res.json({ total });
  } catch (e) {
    console.error("count-yesterday ERROR:", e);
    return res
      .status(e.code === "ETIMEDOUT" ? 503 : 500)
      .json({ message: "count-yesterday failed", code: e.code, error: e.message });
  }
}
