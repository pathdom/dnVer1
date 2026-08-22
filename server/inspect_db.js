const mysql = require('mysql2/promise');

async function inspectDB() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mmm1108',
      database: 'quan_ly_trung_tam'
    });

    console.log('--- TABLES IN quan_ly_trung_tam ---');
    const [tables] = await connection.query('SHOW TABLES');
    console.log(tables);

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n=================== TABLE: ${tableName} ===================`);
      const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
      console.log('COLUMNS:', columns.map(c => `${c.Field} (${c.Type})`));

      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 5`);
      console.log(`ROWS (${rows.length} sample records):`, rows);
    }

    await connection.end();
  } catch (err) {
    console.error('DB Inspection Error:', err.message);
  }
}

inspectDB();
