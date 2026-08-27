// One-time (idempotent) migration: creates lich_tu_van (consultation appointments)
// so the "Lịch tư vấn" page and the Overview week panel show real scheduled data.
// Run with: node server/migrations/setup_appointments.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lich_tu_van (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tieu_de VARCHAR(255) NOT NULL,
      thoi_gian DATETIME NOT NULL,
      loai ENUM('khach_hang','hoc_vien','du_an','khac') NOT NULL DEFAULT 'khac',
      khach_hang_id INT NULL,
      hoc_vien_id INT NULL,
      nhan_vien_id INT NULL,
      ghi_chu VARCHAR(255) NULL,
      trang_thai ENUM('Đã đặt lịch','Đã hoàn thành','Đã hủy') NOT NULL DEFAULT 'Đã đặt lịch',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_lich_khach_hang FOREIGN KEY (khach_hang_id) REFERENCES khach_hang(id) ON DELETE SET NULL,
      CONSTRAINT fk_lich_hoc_vien FOREIGN KEY (hoc_vien_id) REFERENCES hoc_vien(id) ON DELETE SET NULL,
      CONSTRAINT fk_lich_nhan_vien FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE SET NULL,
      INDEX idx_lich_thoi_gian (thoi_gian)
    )
  `);
  console.log('Ensured table lich_tu_van');
  console.log('Appointments migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
