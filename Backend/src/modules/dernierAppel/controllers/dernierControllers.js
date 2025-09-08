import { getLastCallByPhone, getCallHistoryByPhone } from "../services/dernierService.js";

/**
 * POST /api/appels/latestByPhone
 * Body: { numero: "216123456" }
 * -> renvoie { client, appel } (client peut être null si IDClient null)
 */
export async function latestByPhone(req, res) {
  try {
    const numero = (req.body.numero ?? "").toString().replace(/\D/g, "").trim();
    if (!numero) return res.status(400).json({ message: "Numéro requis" });

    const { appel, client } = await getLastCallByPhone(req, numero);
    return res.json({ client, appel });
  } catch (e) {
    console.error("latestByPhone error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}

/**
 * POST /api/appels/historyByPhone
 * Body: { numero: "216123456", page: 1, limit: 10, sort: "desc" }
 * -> renvoie { total, rows, page, limit }
 */
export async function historyByPhone(req, res) {
  try {
    const { numero, page, limit, sort } = req.body;
    const normalizedNumero = (numero ?? "").toString().replace(/\D/g, "").trim();
    if (!normalizedNumero) {
      return res.status(400).json({ message: "Numéro requis" });
    }
    const result = await getCallHistoryByPhone(req, normalizedNumero, { page, limit, sort });
    return res.json(result);
  } catch (e) {
    console.error("historyByPhone error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
}