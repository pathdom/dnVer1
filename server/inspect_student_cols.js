const mysql = require('mysql2/promise');

async function inspectStudentCols() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mmm1108',
      database: 'quan_ly_trung_tam'
    });

    const [rows] = await connection.query('SELECT id, ma_hoc_vien, ho_ten, ngay_nhap_hoc, tien_da_dong, tong_tien, created_at FROM hoc_vien');
    console.log('RAW HOC_VIEN ROWS FROM DB:');
    console.log(rows);

    await connection.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectStudentCols();
