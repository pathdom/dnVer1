// Thêm cột ngay_sinh vào bảng hoc_vien trên production (đã có sẵn ở local, chưa có ở production)
// An toàn để chạy lại nhiều lần — tự kiểm tra cột đã tồn tại chưa trước khi ALTER TABLE.
const db = require('../db');

async function run() {
    try {
        const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hoc_vien' AND COLUMN_NAME = 'ngay_sinh'
    `);
        if (cols.length > 0) {
            console.log('✅ Cột ngay_sinh đã tồn tại trong bảng hoc_vien — bỏ qua.');
        } else {
            await db.query('ALTER TABLE hoc_vien ADD COLUMN ngay_sinh DATE NULL AFTER so_dien_thoai');
            console.log('✅ Đã thêm cột ngay_sinh vào bảng hoc_vien.');
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi migration:', err);
        process.exit(1);
    }
}

run();