const db = require('./db');

async function inspectDB() {
  try {
    console.log('--- TABLES IN quan_ly_trung_tam ---');
    const [tables] = await db.query('SHOW TABLES');
    console.log(tables);

    for (let tableObj of tables) {
      const tableName = Object.values(tableObj)[0];
      console.log(`\n=================== TABLE: ${tableName} ===================`);
      const [columns] = await db.query(`DESCRIBE \`${tableName}\``);
      console.log('COLUMNS:', columns.map(c => `${c.Field} (${c.Type})`));

      const [rows] = await db.query(`SELECT * FROM \`${tableName}\` LIMIT 5`);
      console.log(`ROWS (${rows.length} sample records):`, rows);
    }

    await db.end();
  } catch (err) {
    console.error('DB Inspection Error:', err.message);
  }
}

inspectDB();
