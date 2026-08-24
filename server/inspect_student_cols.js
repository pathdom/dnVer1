const db = require('./db');

async function inspectStudentCols() {
  try {
    const [rows] = await db.query('SELECT id, ma_hoc_vien, ho_ten, ngay_nhap_hoc, tien_da_dong, tong_tien, created_at FROM hoc_vien');
    console.log('RAW HOC_VIEN ROWS FROM DB:');
    console.log(rows);

    await db.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectStudentCols();
