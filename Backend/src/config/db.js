// src/config/db.js
import "dotenv/config";
import mysql from "mysql2/promise";
import { AsyncLocalStorage } from "async_hooks";

/** Fabrique un pool à partir d'un préfixe: TUNIS_, SOUSSE_, FRANCE_ */
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

// Un seul process, plusieurs pools
const pools = {
  tunis:  makePool("TUNIS_"),
  sousse: makePool("SOUSSE_"),
  newok: makePool("NewOk_"),
};

const DEFAULT_REGION = (process.env.DEFAULT_REGION || "Notdef").toLowerCase();

// --- AsyncLocalStorage pour avoir un "pool courant" par requête ---
const als = new AsyncLocalStorage();

export function getPool(region) {
  const key = (region || "").toLowerCase();
  return pools[key] || pools[DEFAULT_REGION];
}

export function regionMiddleware(req, _res, next) {
  const region = (req.header("x-region") || req.query.region || DEFAULT_REGION).toLowerCase();
  const db = getPool(region);       
  req.region = region;
  req.db = db;

  als.enterWith({ db, region });    
  next();

}

function currentDb() {
  return als.getStore()?.db || getPool(DEFAULT_REGION);
}

// Compatibilité avec ton "principe":
// on exporte un "pool proxy" qui redirige toutes les méthodes vers le pool courant.
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
