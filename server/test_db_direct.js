const db = require('./db');

async function testDirect() {
  try {
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) as totalStudents FROM hoc_vien');
    const [[{ activeEmployees }]] = await db.query("SELECT COUNT(*) as activeEmployees FROM nhan_vien WHERE trang_thai = 'Đang làm việc'");
    const [students] = await db.query('SELECT ma_hoc_vien, ho_ten, quoc_gia_den, trang_thai_ho_so, tien_da_dong FROM hoc_vien');
    const [employees] = await db.query('SELECT ma_nhan_vien, ho_ten, bo_phan, chuc_danh FROM nhan_vien');

    console.log('✅ KẾT NỐI & QUY TRÌNH TRUY VẤN CSDL MYSQL THÀNH CÔNG:');
    console.log(`- Tổng số học viên trong DB: ${totalStudents}`);
    console.log(`- Tổng số nhân viên đang làm việc trong DB: ${activeEmployees}`);
    console.log('- Danh sách học viên thực từ CSDL:', students);
    console.log('- Danh sách nhân viên thực từ CSDL:', employees);

    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  }
}

testDirect();
