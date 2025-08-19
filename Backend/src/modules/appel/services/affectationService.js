import { pool } from "../../../config/db.js";

// Vérifie si un agent existe
export async function findAgentById(idAgent) {
  const [rows] = await pool.query("SELECT * FROM agent WHERE IDAgent_Emmission = ?", [idAgent]);
  return rows[0];
}

// Vérifie si un client existe
export async function findClientById(idClient) {
  const [rows] = await pool.query("SELECT * FROM client WHERE IDClient = ?", [idClient]);
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
    INSERT INTO appel (
      Date, Heure, Type_Appel, Duree_Appel, Commentaire, Numero,
      IDClient, IDAgent_Reception, IDAgent_Emmission, Sous_Statut
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    dateSQL,
    heure,
    "AFFECTATION",
    0,
    commentaire || "",
    client.Numero || "",
    idClient,
    typeAgent === "reception" ? idAgent : null,
    typeAgent === "emission" ? idAgent : null,
    "À appeler"
  ];

  const [result] = await pool.query(sql, values);

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