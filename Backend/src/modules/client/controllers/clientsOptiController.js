/*import  pool  from "../../../config/db.js";

export async function getClientsOpti(req, res) {
  try {
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const emisMin = Number(req.query.appelsEmisMin ?? 0);
    const emisMax = Number(req.query.appelsEmisMax ?? 1000000);
    const recuMin = Number(req.query.appelsRecusMin ?? 0);
    const recuMax = Number(req.query.appelsRecusMax ?? 1000000);

    const q = (req.query.q || "").trim();

    // ⚠️ Adapte les noms de colonnes à ta table Client si besoin
    const where = [
      "NB_appel_Emis BETWEEN ? AND ?",
      "NB_Appel_Recu BETWEEN ? AND ?",
    ];
    const params = [emisMin, emisMax, recuMin, recuMax];

    if (q) {
      where.push(`(
        IDClient LIKE ? OR
        Nom LIKE ? OR
        Prenom LIKE ? OR
        Numero LIKE ? OR
        Adresse LIKE ?
      )`);
      // 5 fois le même pattern pour chaque colonne ci-dessus
      for (let i = 0; i < 5; i++) params.push(`%${q}%`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // total filtré
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM Client ${whereSql}`,
      params
    );
    const total = countRows[0]?.total ?? 0;

    // page filtrée
    const [rows] = await pool.query(
      `
      SELECT
        IDClient, Nom, Prenom, Numero, Adresse,
        NB_appel_Emis, NB_Appel_Recu, Dernier_Sous_Statut, Dernier_Appel_At
      FROM Client
      ${whereSql}
      ORDER BY IDClient DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    res.json({ total, clients: rows });
  } catch (e) {
    console.error("getClientsOpti error:", e);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
*/