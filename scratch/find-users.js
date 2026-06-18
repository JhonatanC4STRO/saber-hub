const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT u.id, u.nombre, r.nombre as rol
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE r.nombre IN ('admin', 'instructor')
      LIMIT 10
    `);
    console.log('=== USERS FOUND ===');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();
