import "dotenv/config";
import mysql from "mysql2/promise";

const cfg = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  connectTimeout: 10000,
};


const pool = mysql.createPool(cfg);
export default pool;

export async function initDB({ retries = 3, delayMs = 1000 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      const conn = await pool.getConnection();
      await conn.ping();            
      conn.release();
      console.log("Connexion MySQL OK");
      return;
    } catch (err) {
      console.error("❌ Erreur connexion :", {
        message: err.message, code: err.code, address: err.address, port: err.port
      });
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}
