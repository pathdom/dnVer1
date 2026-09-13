// Tạo 2 bảng mới cho tính năng "Hồ sơ cá nhân" của học viên
// An toàn để chạy lại nhiều lần (CREATE TABLE IF NOT EXISTS).
// Run with: node server/migrations/create_ho_so_ca_nhan.js
const db = require('../db');

async function run() {
  try {
    console.log('🔧 Tạo bảng ho_so_ca_nhan (1-1 với hoc_vien)...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS ho_so_ca_nhan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hoc_vien_id INT NOT NULL UNIQUE,
        so_cccd VARCHAR(20),
        ngay_cap_cccd DATE,
        gioi_tinh ENUM('Nam','Nữ','Khác'),
        ton_giao VARCHAR(50),
        dan_toc VARCHAR(50),
        tinh_trang_hon_nhan VARCHAR(50),
        ho_khau_thuong_tru TEXT,
        noi_tam_tru TEXT,
        sdt_nguoi_than VARCHAR(20),
        truong_tieu_hoc VARCHAR(150), tieu_hoc_tu VARCHAR(10), tieu_hoc_den VARCHAR(10),
        truong_trung_hoc VARCHAR(150), trung_hoc_tu VARCHAR(10), trung_hoc_den VARCHAR(10),
        truong_thpt VARCHAR(150), thpt_tu VARCHAR(10), thpt_den VARCHAR(10),
        truong_cd_dh VARCHAR(150), cd_dh_tu VARCHAR(10), cd_dh_den VARCHAR(10),
        lich_su_lam_viec TEXT,
        diem_manh TEXT,
        diem_yeu TEXT,
        ly_do_sang_nhat TEXT,
        so_thich TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (hoc_vien_id) REFERENCES hoc_vien(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Xong bảng ho_so_ca_nhan.\n');

    console.log('🔧 Tạo bảng ho_so_gia_dinh (1-nhiều với hoc_vien)...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS ho_so_gia_dinh (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hoc_vien_id INT NOT NULL,
        quan_he VARCHAR(50) NOT NULL,
        ho_ten VARCHAR(100) NOT NULL,
        nam_sinh VARCHAR(10),
        nghe_nghiep VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hoc_vien_id) REFERENCES hoc_vien(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Xong bảng ho_so_gia_dinh.\n');

    console.log('🎉 Hoàn tất migration.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi migration:', err);
    process.exit(1);
  }
}

run();
