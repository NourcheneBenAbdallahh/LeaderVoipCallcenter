import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool  from "../../../config/db.js";

export async function findUserByLogin(login) {
  const [rows] = await pool.query(`SELECT * FROM agent WHERE Login = ? LIMIT 1`, [login]);
  return rows[0];
}
/*Pass avec hash
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}*/
export async function verifyPassword(password, hash) {
  return password === hash; // comparaison directe pour test
}

export function generateToken(user) {
  const payload = {
    id: user.IDAgent, 
    nom: user.Nom,      
    prenom: user.Prenom,
    type: user.Type_Agent,
    admin: Number(user.Administrateur) === 1,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "12h" });
}
