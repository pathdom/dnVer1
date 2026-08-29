// One-time (idempotent) migration: creates thong_bao — simple broadcast
// notifications (e.g. admin gửi thông báo quy trình mới tới toàn bộ nhân viên).
// Run with: node server/migrations/setup_notifications.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS thong_bao (
      id INT AUTO_INCREMENT PRIMARY KEY,
      doi_tuong ENUM('admin','staff','student') NOT NULL,
      tieu_de VARCHAR(200) NOT NULL,
      noi_dung TEXT NULL,
      loai VARCHAR(50) NULL,
      du_lieu LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('thong_bao table ready.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
