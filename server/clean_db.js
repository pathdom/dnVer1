const mysql = require('mysql2/promise');

async function cleanData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mmm1108',
      database: 'quan_ly_trung_tam'
    });

    console.log('--- BEFORE CLEANUP ---');
    const [hBefore] = await connection.query('SELECT ma_hoc_vien, ho_ten FROM hoc_vien');
    console.log('Học viên hiện tại:', hBefore);

    // Delete generated mock records (HV-2451, HV-2453, HV-2456, HV-2457, HV-2458, HV-2461)
    await connection.query("DELETE FROM hoc_vien WHERE ma_hoc_vien LIKE 'HV-%'");
    await connection.query("DELETE FROM nhan_vien WHERE ma_nhan_vien LIKE 'NV1%'");
    await connection.query("DELETE FROM du_an WHERE ma_du_an LIKE 'SCH-%'");

    console.log('\n--- AFTER CLEANUP (CHỈ GIỮ LẠI DỮ LIỆU GỐC CỦA BẠN) ---');
    const [hAfter] = await connection.query('SELECT ma_hoc_vien, ho_ten, email, quoc_gia_den, trang_thai_ho_so FROM hoc_vien');
    const [nAfter] = await connection.query('SELECT ma_nhan_vien, ho_ten, email, bo_phan, chuc_danh FROM nhan_vien');

    console.log('Học viên CSDL gốc của bạn:', hAfter);
    console.log('Nhân viên CSDL gốc của bạn:', nAfter);

    await connection.end();
  } catch (err) {
    console.error('Lỗi dọn dẹp:', err.message);
  }
}

cleanData();
