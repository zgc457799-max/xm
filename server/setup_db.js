const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'chen2005',
    multipleStatements: true,
    charset: 'utf8mb4'
};

async function run() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);

        // Read init script
        const initSqlPath = path.resolve(__dirname, '../scripts/init_database.sql');
        const seedSqlPath = path.resolve(__dirname, '../scripts/seed_data.sql');

        console.log(`Reading SQL files from:\n${initSqlPath}\n${seedSqlPath}`);

        if (!fs.existsSync(initSqlPath)) {
            throw new Error(`File not found: ${initSqlPath}`);
        }
        if (!fs.existsSync(seedSqlPath)) {
            throw new Error(`File not found: ${seedSqlPath}`);
        }

        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        const seedSql = fs.readFileSync(seedSqlPath, 'utf8');

        console.log('Executing init_database.sql...');
        await connection.query(initSql);
        console.log('Database initialized successfully.');

        console.log('Executing seed_data.sql...');
        await connection.query(seedSql);
        console.log('Seed data inserted successfully.');

    } catch (err) {
        console.error('SQL Execution Failed!');
        const errorLog = `Message: ${err.message}\nSQL Snippet: ${err.sql ? err.sql.substring(0, 200) : 'N/A'}\nStack: ${err.stack}`;
        fs.writeFileSync(path.resolve(__dirname, 'db_error.log'), errorLog);
        console.error('Error details written to db_error.log');
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

run();
