// One-time (idempotent) migration: bổ sung thêm Phòng ban & Chức danh mới
// vào bo_phan/chuc_danh, dùng INSERT IGNORE để an toàn khi chạy lại nhiều lần.
// Run with: node server/migrations/update_bo_phan_chuc_danh.js
const db = require('../db');

async function run() {
  try {
    console.log('🔧 Đang thêm Phòng ban mới...');
    // Đã bỏ "Đào Tạo", "Hồ sơ", "Marketing" vì trùng ý nghĩa với dữ liệu cũ đã có sẵn
    const boPhanMoi = [
      ['BP_BGD', 'Ban Giám đốc'],
      ['BP_NS',  'Nhân sự'],
      ['BP_KT',  'Kế toán'],
      ['BP_KD',  'Kinh doanh'],
      ['BP_TT',  'Truyền thông'],
    ];
    for (const [ma, ten] of boPhanMoi) {
      const [result] = await db.query(
        'INSERT IGNORE INTO bo_phan (ma_bo_phan, ten_bo_phan) VALUES (?, ?)',
        [ma, ten]
      );
      console.log(result.affectedRows ? `  + Đã thêm: ${ten}` : `  - Bỏ qua (đã tồn tại): ${ten}`);
    }
    console.log('✅ Xong Phòng ban.\n');

    console.log('🔧 Đang thêm Chức danh mới...');
    // Không có mục nào trùng ý nghĩa với chức danh cũ
    const chucDanhMoi = [
      ['CD_TGD', 'Tổng giám đốc'],
      ['CD_PP',  'Phó phòng'],
      ['CD_NV',  'Nhân viên'],
      ['CD_GV',  'Giáo viên'],
      ['CD_TV',  'NV thử việc'],
    ];
    for (const [ma, ten] of chucDanhMoi) {
      const [result] = await db.query(
        'INSERT IGNORE INTO chuc_danh (ma_chuc_danh, ten_chuc_danh) VALUES (?, ?)',
        [ma, ten]
      );
      console.log(result.affectedRows ? `  + Đã thêm: ${ten}` : `  - Bỏ qua (đã tồn tại): ${ten}`);
    }
    console.log('✅ Xong Chức danh.\n');

    console.log('🎉 Hoàn tất migration.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi migration:', err);
    process.exit(1);
  }
}

run();
