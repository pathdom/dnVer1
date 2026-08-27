// One-time (idempotent) migration: creates the employee competency test tables
// (de_thi / cau_hoi_test / bai_lam_test / bai_lam_chi_tiet).
// Run with: node server/migrations/setup_competency_tests.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS de_thi (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ten_de VARCHAR(200) NOT NULL,
      phong_ban VARCHAR(50) NOT NULL,
      trang_thai ENUM('active','inactive') NOT NULL DEFAULT 'active',
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Ensured table de_thi');

  await db.query(`
    CREATE TABLE IF NOT EXISTS cau_hoi_test (
      id INT AUTO_INCREMENT PRIMARY KEY,
      de_thi_id INT NOT NULL,
      thu_tu INT NOT NULL DEFAULT 0,
      noi_dung TEXT NOT NULL,
      dap_an_a VARCHAR(500) NOT NULL,
      dap_an_b VARCHAR(500) NOT NULL,
      dap_an_c VARCHAR(500) NOT NULL,
      dap_an_d VARCHAR(500) NOT NULL,
      dap_an_dung ENUM('A','B','C','D') NOT NULL,
      FOREIGN KEY (de_thi_id) REFERENCES de_thi(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured table cau_hoi_test');

  await db.query(`
    CREATE TABLE IF NOT EXISTS bai_lam_test (
      id INT AUTO_INCREMENT PRIMARY KEY,
      de_thi_id INT NOT NULL,
      nhan_vien_id INT NOT NULL,
      so_cau_dung INT NOT NULL DEFAULT 0,
      tong_cau INT NOT NULL DEFAULT 0,
      ngay_lam DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_attempt (de_thi_id, nhan_vien_id),
      FOREIGN KEY (de_thi_id) REFERENCES de_thi(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured table bai_lam_test');

  await db.query(`
    CREATE TABLE IF NOT EXISTS bai_lam_chi_tiet (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bai_lam_id INT NOT NULL,
      cau_hoi_id INT NOT NULL,
      dap_an_chon ENUM('A','B','C','D') NULL,
      dung_sai TINYINT(1) NOT NULL DEFAULT 0,
      FOREIGN KEY (bai_lam_id) REFERENCES bai_lam_test(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured table bai_lam_chi_tiet');

  console.log('Competency tests migration complete.');
  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
