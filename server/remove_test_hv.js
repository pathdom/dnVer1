const mysql = require('mysql2/promise');

async function removeTestHV() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mmm1108',
      database: 'quan_ly_trung_tam'
    });

    await connection.query("DELETE FROM hoc_vien WHERE ma_hoc_vien NOT IN ('HV001', 'HV002')");
    console.log('✅ Dọn dẹp xong!');
    await connection.end();
  } catch (err) {
    console.error(err);
  }
}

removeTestHV();
