// src/config/db.js
import "dotenv/config";
import mysql from "mysql2/promise";
import { AsyncLocalStorage } from "async_hooks";

/** Fabrique un pool à partir d'un préfixe: TUNIS_, SOUSSE_, NEWOK_ */
function makePool(prefix) {
  const host = process.env[`${prefix}DB_HOST`];
  if (!host) return null;
  return mysql.createPool({
    host,
    port: Number(process.env[`${prefix}DB_PORT`] || 3306),
    user: process.env[`${prefix}DB_USER`],
    password: process.env[`${prefix}DB_PASSWORD`],
    database: process.env[`${prefix}DB_NAME`],
    timezone: process.env[`${prefix}DB_TIMEZONE`] || "Z",
    waitForConnections: true,
    connectionLimit: Number(process.env[`${prefix}DB_POOL_SIZE`] || 10),
    queueLimit: 0,
    connectTimeout: 10000,
    ssl: /^(true|1)$/i.test(process.env[`${prefix}DB_SSL`] || "false") ? {} : undefined,
  });
}

// Pools disponibles (⚠️ harmonise le préfixe NewOk -> NEWOK_ si tes vars sont NEWOK_DB_*)
export const pools = {
  tunis:  makePool("TUNIS_"),
  sousse: makePool("SOUSSE_"),
  newok:  makePool("NewOk_"), // si tes variables sont NEWOK_DB_*, mets "NEWOK_" ici
};

// --- Contexte par requête
const als = new AsyncLocalStorage();

export function getPool(region) {
  const key = (region || "").toLowerCase();
  const candidate = pools[key];
  if (!candidate) {
    throw new Error(`[DB] Région inconnue ou non configurée: "${region}".`);
  }
  return candidate;
}

function currentDb() {
  const store = als.getStore();
  if (!store?.db) {
    throw new Error(`[DB] Aucune région active (middleware manquant ou en-tête "x-region" absent).`);
  }
  return store.db;
}

// Middleware OBLIGATOIRE: exige x-region (ou ?region=)
export function regionMiddleware(req, res, next) {
  try {
    const region = (req.header("x-region") || req.query.region || "").toLowerCase();
    if (!region) {
      return res.status(400).json({
        message: `Paramètre région requis. Envoyez l'en-tête "x-region" (tunis|sousse|newok)`,
      });
    }
    const db = getPool(region); // lève si inconnue/non configurée
    req.region = region;
    req.db = db;
    als.enterWith({ db, region });
    next();
  } catch (e) {
    console.error("[regionMiddleware]", e.message);
    res.status(400).json({ message: e.message });
  }
}

// Proxy: redirige vers le pool courant (échoue si pas de région)
const poolProxy = new Proxy({}, {
  get(_t, prop) {
    const db = currentDb();
    const val = db[prop];
    return typeof val === "function" ? val.bind(db) : val;
  }
});
export default poolProxy;

export async function initDB() {
  for (const [name, pool] of Object.entries(pools)) {
    if (!pool) { console.warn(`⚠️ Région non configurée: ${name}`); continue; }
    try {
      const c = await pool.getConnection();
      await c.ping();
      c.release();
      console.log(`✅ MySQL OK (${name})`);
    } catch (e) {
      console.error(`❌ MySQL KO (${name}):`, e.message);
    }
  }
}
