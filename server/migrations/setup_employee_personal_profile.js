// Idempotent migration: hồ sơ cá nhân tự khai + tài liệu đính kèm cho nhân viên.
// Run with: node server/migrations/setup_employee_personal_profile.js
const db = require('../db');

(async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ho_so_ca_nhan_nhan_vien (
      nhan_vien_id INT PRIMARY KEY,
      so_cccd VARCHAR(30),
      ngay_cap_cccd DATE,
      noi_cap_cccd VARCHAR(150),
      dia_chi_thuong_tru VARCHAR(255),
      dia_chi_hien_tai VARCHAR(255),
      lien_he_ho_ten VARCHAR(150),
      lien_he_sdt VARCHAR(20),
      lien_he_quan_he VARCHAR(100),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_hscn_nv FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE CASCADE
    )
  `);
  console.log('OK: ho_so_ca_nhan_nhan_vien');

  await db.query(`
    CREATE TABLE IF NOT EXISTS tai_lieu_nhan_vien (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nhan_vien_id INT NOT NULL,
      ten_goc VARCHAR(255) NOT NULL,
      duong_dan VARCHAR(500) NOT NULL,
      loai VARCHAR(20),
      kich_thuoc INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tlnv_nv FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE CASCADE
    )
  `);
  console.log('OK: tai_lieu_nhan_vien');

  process.exit(0);
})().catch(err => {
  console.error(err);
  process.exit(1);
});
