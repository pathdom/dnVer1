// Bảng điểm kiểu mới: mỗi dòng = 1 mốc thời gian (Tuần/Tháng tự đặt tên),
// cột là 5 kỹ năng cố định. Thay cho bảng bang_diem cũ (thang cố định 1-6).
// Bảng bang_diem cũ được GIỮ NGUYÊN (không xóa) để không mất dữ liệu điểm cũ trên production.
// An toàn để chạy lại nhiều lần (CREATE TABLE IF NOT EXISTS).
// Run with: node server/migrations/create_bang_diem_ky.js
const db = require('../db');

async function run() {
  try {
    console.log('🔧 Tạo bảng bang_diem_ky...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS bang_diem_ky (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hoc_vien_id INT NOT NULL,
        loai ENUM('tuan','thang') NOT NULL,
        nhan VARCHAR(50) NOT NULL,
        thu_tu INT NOT NULL DEFAULT 0,
        diem_tu_vung DECIMAL(4,1),
        diem_ngu_phap DECIMAL(4,1),
        diem_han_tu DECIMAL(4,1),
        diem_nghe DECIMAL(4,1),
        diem_hoi_thoai DECIMAL(4,1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (hoc_vien_id) REFERENCES hoc_vien(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Xong bảng bang_diem_ky.');

    console.log('🎉 Hoàn tất migration.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi migration:', err);
    process.exit(1);
  }
}

run();
