const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'chen2005',
    database: 'educode_ai',
    multipleStatements: true,
    charset: 'utf8mb4'
};

async function run() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await connection.query("ALTER TABLE contest_results CHANGE COLUMN final_score score INT DEFAULT 0 COMMENT '得分';");
        await connection.query("ALTER TABLE contest_results ADD COLUMN certificate_code VARCHAR(64) DEFAULT NULL COMMENT '证书代码' AFTER award_name;");
        await connection.query("ALTER TABLE contest_results ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间';");
        console.log('Contest results columns updated successfully.');
    } catch (err) {
        console.error('SQL Execution Failed!', err);
    } finally {
        if (connection) await connection.end();
    }
}

run();
