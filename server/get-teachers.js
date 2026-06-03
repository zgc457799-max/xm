const mysql = require('mysql2/promise');

async function getTeachers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '170314',
    database: 'educode_ai'
  });
  
  const [rows] = await connection.query("SELECT id, name, role FROM users WHERE role='TEACHER' OR role='ADMIN'");
  console.table(rows);
  
  process.exit(0);
}

getTeachers().catch(e => { console.error(e); process.exit(1); });
