const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDb() {
  console.log('Connecting to MySQL...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '170314',
    multipleStatements: true
  });
  
  console.log('Creating database educode_ai if not exists...');
  await connection.query('CREATE DATABASE IF NOT EXISTS educode_ai;');
  await connection.query('USE educode_ai;');
  
  const sqlFile = path.join(__dirname, '../educode_ai_2026-04-30_14-42-50_mysql_data_LfR45.sql');
  console.log('Reading SQL file: ' + sqlFile);
  const sqlText = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('Executing SQL (This might take a moment)...');
  await connection.query(sqlText);
  console.log('SQL Import Successfully Completed!');
  process.exit(0);
}

importDb().catch(e => {
  console.error('Failed to import database: ', e);
  process.exit(1);
});
