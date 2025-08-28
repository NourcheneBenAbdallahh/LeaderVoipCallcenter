import  pool  from "../../../config/db.js";


async function q(sql, params = [], tries = 2) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (e) {
      lastErr = e;
      if (e.code !== "ETIMEDOUT") throw e;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function countAppelsAujourdHui() {
  const rows = await q("SELECT COUNT(*) AS total FROM `Appel` WHERE `Date` = CURDATE()");
  return rows[0]?.total ?? 0;
}

export async function countAppelsHier() {
  const rows = await q("SELECT COUNT(*) AS total FROM `Appel` WHERE `Date` = CURDATE() - INTERVAL 1 DAY");
  return rows[0]?.total ?? 0;
}