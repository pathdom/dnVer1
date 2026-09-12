// Migration chuẩn hóa Phòng ban & Chức danh — dọn 10 mục (bị dư do chạy nhầm bản insert cũ)
// về đúng 8 mục mỗi bảng, không mất gán nhân viên (tự chuyển nhân viên sang mục giữ lại trước khi xóa).
// An toàn để chạy lại nhiều lần (idempotent) — nếu đã dọn rồi thì các bước sẽ tự báo "không thấy / bỏ qua".
const db = require('../db');

async function run() {
  try {
    console.log('🔧 BỘ PHẬN — di chuyển nhân viên khỏi 2 mục sắp xóa...');
    await db.query(`
      UPDATE nhan_vien SET bo_phan_id = (SELECT id FROM bo_phan WHERE ten_bo_phan='Kế toán')
      WHERE bo_phan_id = (SELECT id FROM bo_phan WHERE ten_bo_phan='Hành chính kế toán')
    `);
    await db.query(`
      UPDATE nhan_vien SET bo_phan_id = (SELECT id FROM bo_phan WHERE ten_bo_phan='Truyền thông')
      WHERE bo_phan_id = (SELECT id FROM bo_phan WHERE ten_bo_phan='Đối ngoại')
    `);

    console.log('🔧 BỘ PHẬN — xóa 2 mục dư (Hành chính kế toán, Đối ngoại)...');
    const [delBP] = await db.query(
      "DELETE FROM bo_phan WHERE ten_bo_phan IN ('Hành chính kế toán', 'Đối ngoại')"
    );
    console.log(`  - Đã xóa ${delBP.affectedRows} dòng.`);

    console.log('🔧 BỘ PHẬN — đổi tên 8 mục còn lại thành "Phòng ..."...');
    const rename = [
      ['Ban Giám đốc', 'Phòng Giám Đốc'],
      ['Nhân sự', 'Phòng Nhân sự'],
      ['Kế toán', 'Phòng Kế toán'],
      ['Đào tạo', 'Phòng Đào Tạo'],
      ['Kinh doanh', 'Phòng Kinh Doanh'],
      ['Hồ sơ', 'Phòng Hồ sơ'],
      ['Truyền thông', 'Phòng Truyền thông'],
      ['Marketing', 'Phòng Marketing'],
    ];
    for (const [tenCu, tenMoi] of rename) {
      const [r] = await db.query('UPDATE bo_phan SET ten_bo_phan = ? WHERE ten_bo_phan = ?', [tenMoi, tenCu]);
      console.log(r.affectedRows ? `  ~ "${tenCu}" → "${tenMoi}"` : `  - Không thấy "${tenCu}" (bỏ qua, có thể đã đổi tên rồi)`);
    }
    console.log('✅ Xong Bộ phận — còn đúng 8 mục.\n');

    console.log('🔧 CHỨC DANH — di chuyển nhân viên "Chuyên viên" sang "Nhân viên"...');
    await db.query(`
      UPDATE nhan_vien SET chuc_danh_id = (SELECT id FROM chuc_danh WHERE ten_chuc_danh='Nhân viên')
      WHERE chuc_danh_id = (SELECT id FROM chuc_danh WHERE ten_chuc_danh='Chuyên viên')
    `);

    console.log('🔧 CHỨC DANH — xóa 2 mục dư (Chuyên viên, CTV)...');
    const [delCD] = await db.query(
      "DELETE FROM chuc_danh WHERE ten_chuc_danh IN ('Chuyên viên', 'CTV')"
    );
    console.log(`  - Đã xóa ${delCD.affectedRows} dòng.`);
    console.log('✅ Xong Chức danh — còn đúng 8 mục.\n');

    console.log('🎉 Hoàn tất migration.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi migration:', err);
    process.exit(1);
  }
}

run();