import mysql from 'mysql2/promise';

 const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // vide si tu n'as pas de mot de passe
  database: 'leader_prospect_db',
  port: 3308,
   dateStrings: true,   
  timezone: 'Z',      
});
export default pool;