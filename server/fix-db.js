const mysql = require('mysql2/promise');

async function fixDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '170314',
    database: 'educode_ai'
  });
  
  try {
    await connection.query('ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE DEFAULT NULL;');
    console.log('Fixed DB: Added email column.');
  } catch(e) {
    if(e.code === 'ER_DUP_FIELDNAME') console.log('Column email already exists');
    else console.error(e);
  }
  
  const [rows] = await connection.query('SELECT id, name, role FROM users LIMIT 10;');
  console.log('--- AVAILABLE TEST ACCOUNTS ---');
  console.table(rows);
  
  process.exit(0);
}
fixDb().catch(e => { console.error(e); process.exit(1); });
