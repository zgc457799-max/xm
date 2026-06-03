const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '170314',
    database: 'educode_ai'
  });
  
  try {
    await connection.query('ALTER TABLE coding_submissions ADD COLUMN contest_id VARCHAR(64) DEFAULT NULL;');
    console.log('Fixed DB: Added contest_id column.');
  } catch(e) {
    if(e.code === 'ER_DUP_FIELDNAME') console.log('Column contest_id already exists');
    else console.error(e);
  }
  
  try {
      console.log('Generating hash for 123456...');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('123456', salt);
      console.log('Updating all users passwords...');
      await connection.query('UPDATE users SET password_hash = ?', [password_hash]);
      console.log('All passwords have been reset to 123456.');
  } catch(e) {
      console.error(e);
  }

  process.exit(0);
}
fixDb().catch(e => { console.error(e); process.exit(1); });
