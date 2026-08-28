// One-time (idempotent) migration: creates bang_diem for student grades —
// 6 tháng x 5 kỹ năng (Từ vựng, Ngữ pháp, Hán tự, Nghe, Hội thoại), thang điểm 10.
// Run with: node server/migrations/setup_bang_diem.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS bang_diem (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hoc_vien_id INT NOT NULL,
      thang TINYINT NOT NULL,
      ky_nang ENUM('Từ vựng','Ngữ pháp','Hán tự','Nghe','Hội thoại') NOT NULL,
      diem DECIMAL(4,1) NOT NULL,
      cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_bang_diem (hoc_vien_id, thang, ky_nang),
      FOREIGN KEY (hoc_vien_id) REFERENCES hoc_vien(id) ON DELETE CASCADE
    )
  `);
  console.log('bang_diem table ready.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
