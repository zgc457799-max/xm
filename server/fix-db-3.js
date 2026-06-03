const mysql = require('mysql2/promise');
async function fixDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '170314',
    database: 'educode_ai'
  });
  
  try {
    await connection.query('ALTER TABLE coding_submissions ADD COLUMN error_message TEXT DEFAULT NULL;');
    console.log('Fixed DB: Added error_message column.');
  } catch(e) {
    if(e.code === 'ER_DUP_FIELDNAME') console.log('Column error_message already exists');
    else console.error(e);
  }
  process.exit(0);
}
fixDb().catch(e => { console.error(e); process.exit(1); });
