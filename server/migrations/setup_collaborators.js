// One-time (idempotent) migration: creates cong_tac_vien (collaborators/referral
// partners) as a standalone table — plain text fields, no FK to other tables,
// entered manually through the "Cộng tác viên" page.
// Run with: node server/migrations/setup_collaborators.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS cong_tac_vien (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ma_ctv VARCHAR(20) NOT NULL,
      ho_ten VARCHAR(100) NOT NULL,
      so_dien_thoai VARCHAR(15) NULL,
      nguoi_gioi_thieu VARCHAR(150) NULL,
      trang_thai ENUM('Đang hợp tác','Chờ duyệt','Tạm dừng') NOT NULL DEFAULT 'Chờ duyệt',
      ngay_dang_ky DATE NULL,
      ghi_chu VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Ensured table cong_tac_vien');
  console.log('Collaborators migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
