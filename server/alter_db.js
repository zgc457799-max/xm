const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '170314',
    database: 'educode_ai',
    charset: 'utf8mb4'
};

async function run() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Adding email column...');
        await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE DEFAULT NULL COMMENT '邮箱账号';");
        console.log('Success!');
    } catch (err) {
        console.log('Error (might already exist):', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

run();
