import  pool  from "../../../config/db.js";

// Vérifie si un agent existe
export async function findAgentById(idAgent) {
  const [rows] = await pool.query("SELECT * FROM Agent WHERE IDAgent_Emmission = ?", [idAgent]);
  return rows[0];
}

// Vérifie si un client existe
export async function findClientById(idClient) {
  const [rows] = await pool.query("SELECT * FROM Client WHERE IDClient = ?", [idClient]);
  return rows[0];
}

// Créer un nouvel appel pour un client (sans mise à jour du client)
export async function creerAppel({ idClient, idAgent, typeAgent, date, commentaire }) {
  // Vérification agent
  const agent = await findAgentById(idAgent);
  if (!agent) throw new Error("Agent introuvable");

  // Vérification client
  const client = await findClientById(idClient);
  if (!client) throw new Error("Client introuvable");

  // Préparer date et heure
  const now = new Date();
  const heure = now.toTimeString().split(" ")[0];
  const dateSQL = date ? new Date(date).toISOString().split("T")[0] : now.toISOString().split("T")[0];

  // Insérer l'appel
  const sql = `
    INSERT INTO Appel (
      Date, Heure, Type_Appel, Duree_Appel, Commentaire, Numero,
      IDClient, IDAgent_Reception, IDAgent_Emmission, Sous_Statut
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    dateSQL,
    heure,
    "0",
    0,
    commentaire || "",
    client.Telephone || "",
    idClient,
    typeAgent === "reception" ? idAgent : null,
    typeAgent === "emission" ? idAgent : null,
    "À appeler"
  ];

  const [result] = await pool.query(sql, values);
console.log("Client récupéré :", client);

  return {
    IDAppel: result.insertId,
    IDClient: idClient,
    IDAgent: idAgent,
    typeAgent,
    Sous_Statut: "À appeler",
    Date: dateSQL,
    Heure: heure
  };
}


export async function getDerniersAppels(limit = 10) {
  const lim = Number(limit) > 0 ? Number(limit) : 10;

  // Si vous avez une colonne datetime (ex: CreatedAt), préférez ORDER BY CreatedAt DESC
  const sql = `
    SELECT 
      IDAppel, Date, Heure, Type_Appel, Duree_Appel, Numero, IDClient, Sous_Statut
    FROM Appel
    ORDER BY
      -- On privilégie l'ordre par Date+Heure si présents
      COALESCE(CONCAT(Date, ' ', Heure), '1970-01-01 00:00:00') DESC,
      IDAppel DESC
    LIMIT ?
  `;

  const [rows] = await pool.query(sql, [lim]);
  return rows;
}