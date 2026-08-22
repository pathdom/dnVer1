const mysql = require('mysql2/promise');

async function seedData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'mmm1108',
      database: 'quan_ly_trung_tam'
    });

    console.log('🌱 Bắt đầu nạp thêm dữ liệu thực tế vào CSDL quan_ly_trung_tam...');

    // Nạp học viên
    await connection.query(`
      INSERT INTO hoc_vien (ma_hoc_vien, ho_ten, email, so_dien_thoai, que_quan, quoc_gia_den, trang_thai_ho_so, lo_trinh, ngay_nhap_hoc, nhan_vien_id, tien_da_dong, tong_tien, created_at)
      VALUES 
      ('HV-2451', 'Nguyễn Thị Lan Anh', 'lananh.nguyen@vietbridge.edu.vn', '0987654321', 'Hà Nội', 'Mỹ', 'Đã có visa', 'Cử nhân QTKD', '2026-09-01', 1, 120000000, 150000000, NOW()),
      ('HV-2453', 'Vũ Ngọc Mai', 'ngocmai.vu@vietbridge.edu.vn', '0976543210', 'Hải Phòng', 'Úc', 'Mới tiếp nhận', 'Cử nhân Thiết kế', '2026-10-15', 1, 30000000, 180000000, NOW()),
      ('HV-2456', 'Bùi Anh Tuấn', 'anhtuan.bui@vietbridge.edu.vn', '0965432109', 'Đà Nẵng', 'Đức', 'Tạm hoãn', 'Tiến sĩ Kỹ thuật PM', '2027-01-10', 2, 50000000, 220000000, NOW()),
      ('HV-2457', 'Trịnh Khánh Linh', 'khanhlinh.trinh@vietbridge.edu.vn', '0954321098', 'Cần Thơ', 'Hàn Quốc', 'Đang xử lý', 'Cử nhân Du lịch', '2026-11-01', 1, 45000000, 95000000, NOW()),
      ('HV-2458', 'Lý Minh Quân', 'minhquan.ly@vietbridge.edu.vn', '0943210987', 'Bình Dương', 'Mỹ', 'Đã nộp hồ sơ', 'Thạc sĩ Marketing', '2026-09-15', 2, 90000000, 160000000, NOW()),
      ('HV-2461', 'Trần Bảo Châu', 'baochau.tran@vietbridge.edu.vn', '0932109876', 'Quảng Ninh', 'Anh', 'Mới tiếp nhận', 'Cử nhân Truyền thông', '2026-10-01', 1, 20000000, 200000000, NOW())
      ON DUPLICATE KEY UPDATE ho_ten=VALUES(ho_ten);
    `);

    // Nạp nhân viên
    await connection.query(`
      INSERT INTO nhan_vien (ma_nhan_vien, ho_ten, so_dien_thoai, email, bo_phan, chuc_danh, ngay_vao_lam, hinh_thuc, trang_thai, created_at)
      VALUES 
      ('NV101', 'Trần Minh Khoa', '0912349999', 'khoa.tran@vietbridge.edu.vn', 'Tư vấn', 'Trưởng nhóm tư vấn', '2024-03-01', 'Full-time', 'Đang làm việc', NOW()),
      ('NV102', 'Lê Thị Hồng', '0912348888', 'hong.le@vietbridge.edu.vn', 'Tư vấn', 'Chuyên viên tư vấn', '2024-06-15', 'Full-time', 'Đang làm việc', NOW()),
      ('NV103', 'Vũ Hoàng Nam', '0912347777', 'nam.vu@vietbridge.edu.vn', 'Chăm sóc học viên', 'Chuyên viên CSKH', '2025-01-10', 'Full-time', 'Đang làm việc', NOW())
      ON DUPLICATE KEY UPDATE ho_ten=VALUES(ho_ten);
    `);

    // Nạp dự án trường học
    await connection.query(`
      INSERT INTO du_an (ma_du_an, ten_du_an, quoc_gia, ngay_bat_dau, ngay_ket_thuc, chi_tieu_so_luong, ngan_sach, nguoi_quan_ly_id, trang_thai, created_at)
      VALUES 
      ('SCH-US01', 'Đại học Washington State', 'Mỹ', '2026-01-01', '2026-12-31', 40, 500000000, 1, 'Đang triển khai', NOW()),
      ('SCH-AU02', 'Đại học Sydney Technology', 'Úc', '2026-02-01', '2026-11-30', 30, 400000000, 1, 'Đang triển khai', NOW()),
      ('SCH-DE03', 'Đại học Kỹ thuật Munich (TUM)', 'Đức', '2026-03-01', '2026-10-31', 25, 300000000, 2, 'Lên kế hoạch', NOW())
      ON DUPLICATE KEY UPDATE ten_du_an=VALUES(ten_du_an);
    `);

    console.log('✅ Đã nạp thành công dữ liệu mẫu vào MySQL CSDL [quan_ly_trung_tam]!');
    await connection.end();
  } catch (err) {
    console.error('Lỗi seed data:', err.message);
  }
}

seedData();
