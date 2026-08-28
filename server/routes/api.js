const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { verifyPassword } = require('../lib/password');

const avatarUploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(avatarUploadDir, { recursive: true });
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarUploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/'))
});

// Company logo — a single shared file (any authenticated portal can read it),
// so admin/staff/student all show the same real logo instead of each app
// keeping its own separate copy in browser localStorage.
const logoUploadDir = path.join(__dirname, '..', 'uploads', 'company');
fs.mkdirSync(logoUploadDir, { recursive: true });
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, logoUploadDir),
    filename: (req, file, cb) => cb(null, 'logo' + path.extname(file.originalname))
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/'))
});
function currentLogoFile() {
  const existing = fs.readdirSync(logoUploadDir).filter(f => f.startsWith('logo.'));
  return existing[0] || null;
}

// Helper format VND
function formatVND(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}
function formatCompactVND(val) {
  const num = Number(val) || 0;
  if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1).replace('.', ',') + ' tỷ';
  if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1).replace('.', ',') + ' tr';
  return formatVND(num);
}
function pctChange(cur, prev) {
  if (!prev) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}
// datetime-local inputs send "YYYY-MM-DDTHH:mm"; MySQL DATETIME wants a space separator.
function normalizeDatetime(val) {
  return (val || '').replace('T', ' ');
}

// GET /api/lookups — danh mục phòng ban / chức danh / quốc gia / tỉnh thành dùng chung
router.get('/lookups', async (req, res) => {
  try {
    const [boPhan] = await db.query('SELECT id, ten_bo_phan as name FROM bo_phan ORDER BY id');
    const [chucDanh] = await db.query('SELECT id, ten_chuc_danh as name FROM chuc_danh ORDER BY id');
    const [quocGia] = await db.query('SELECT id, ten_quoc_gia as name FROM quoc_gia ORDER BY id');
    const [tinhThanh] = await db.query('SELECT id, ten_tinh as name FROM tinh_thanh ORDER BY id');
    res.json({ boPhan, chucDanh, quocGia, tinhThanh });
  } catch (err) {
    console.error('Lỗi API /api/lookups:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/overview
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) as totalStudents FROM hoc_vien');
    const [[{ activeEmployees }]] = await db.query("SELECT COUNT(*) as activeEmployees FROM nhan_vien WHERE trang_thai = 'Đang làm việc'");
    const [[{ totalProjects }]] = await db.query('SELECT COUNT(*) as totalProjects FROM du_an');
    const [[{ totalCollaborators }]] = await db.query('SELECT COUNT(*) as totalCollaborators FROM cong_tac_vien');
    const [[{ totalCompetencyExams }]] = await db.query('SELECT COUNT(*) as totalCompetencyExams FROM test_nang_luc');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(tien_da_dong), 0) as totalRevenue FROM hoc_vien');
    const [[{ totalCustomers }]] = await db.query('SELECT COUNT(*) as totalCustomers FROM khach_hang');
    const [[{ unassignedCustomers }]] = await db.query('SELECT COUNT(*) as unassignedCustomers FROM khach_hang WHERE nhan_vien_id IS NULL');

    const [recentStudents] = await db.query(`
      SELECT
        hv.id,
        hv.ma_hoc_vien as maHV,
        hv.ho_ten as name,
        hv.email,
        hv.so_dien_thoai as phone,
        tt.ten_tinh as hometown,
        qg.ten_quoc_gia as country,
        hv.trang_thai_ho_so as statusText,
        hv.lo_trinh as program,
        IFNULL(DATE_FORMAT(hv.ngay_nhap_hoc, '%d/%m/%Y'), DATE_FORMAT(hv.created_at, '%d/%m/%Y')) as ngayNhapHoc,
        IFNULL(hv.tien_da_dong, 0) as tienDaDong,
        IFNULL(hv.tong_tien, 0) as tongTien,
        IFNULL(DATE_FORMAT(hv.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM hoc_vien hv
      LEFT JOIN tinh_thanh tt ON tt.id = hv.tinh_thanh_id
      LEFT JOIN quoc_gia qg ON qg.id = hv.quoc_gia_id
      ORDER BY hv.id DESC
      LIMIT 6
    `);

    // Phân bố học viên theo quốc gia (cho biểu đồ tròn)
    const [countryRows] = await db.query(`
      SELECT COALESCE(qg.ten_quoc_gia, 'Chưa xác định') as country, COUNT(*) as count
      FROM hoc_vien hv
      LEFT JOIN quoc_gia qg ON qg.id = hv.quoc_gia_id
      GROUP BY COALESCE(qg.ten_quoc_gia, 'Chưa xác định')
      ORDER BY count DESC
    `);
    const destinations = countryRows.map(r => ({
      country: r.country,
      count: r.count,
      percent: totalStudents ? Math.round((r.count / totalStudents) * 1000) / 10 : 0
    }));

    // Thống kê theo trạng thái hồ sơ (cho dải tổng kết dưới danh sách học viên)
    const [stageRows] = await db.query(`
      SELECT COALESCE(trang_thai_ho_so, 'Chưa cập nhật') as stage, COUNT(*) as count
      FROM hoc_vien
      GROUP BY COALESCE(trang_thai_ho_so, 'Chưa cập nhật')
    `);

    // Lịch tư vấn tuần này (Thứ Hai → Chủ Nhật của tuần hiện tại)
    const [[weekRange]] = await db.query(`
      SELECT
        DATE_FORMAT(DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY), '%Y-%m-%d') as weekStart,
        DATE_FORMAT(DATE_ADD(NOW(), INTERVAL (6 - WEEKDAY(NOW())) DAY), '%Y-%m-%d') as weekEnd,
        DATE_FORMAT(DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY), '%d/%m') as weekStartLabel,
        DATE_FORMAT(DATE_ADD(NOW(), INTERVAL (6 - WEEKDAY(NOW())) DAY), '%d/%m') as weekEndLabel
    `);
    const [weekApptRows] = await db.query(
      APPOINTMENT_SELECT + ' WHERE DATE(lv.thoi_gian) BETWEEN ? AND ? ORDER BY lv.thoi_gian ASC',
      [weekRange.weekStart, weekRange.weekEnd]
    );
    const weekAppointments = weekApptRows.map(mapAppointmentRow);

    // Danh sách "Cần xử lý" — chỉ những tín hiệu tính được từ dữ liệu thật, không bịa
    const [outstandingStudents] = await db.query(`
      SELECT ho_ten as name, (tong_tien - tien_da_dong) as remaining
      FROM hoc_vien
      WHERE tien_da_dong < tong_tien
      ORDER BY remaining DESC
      LIMIT 3
    `);
    const [expiringProjects] = await db.query(`
      SELECT ten_du_an as name, ngay_ket_thuc as endDate
      FROM du_an
      WHERE ngay_ket_thuc IS NOT NULL AND ngay_ket_thuc <= DATE_ADD(NOW(), INTERVAL 60 DAY)
      ORDER BY ngay_ket_thuc ASC
      LIMIT 3
    `);

    const tasks = [];
    if (unassignedCustomers > 0) {
      tasks.push({
        title: `${unassignedCustomers} khách hàng chưa được phân công`,
        subtitle: 'Xem ở mục Quản lý khách hàng',
        hot: true
      });
    }
    outstandingStudents.forEach(s => {
      tasks.push({
        title: `Học phí còn thiếu · ${s.name}`,
        subtitle: `Còn lại ${formatVND(s.remaining)}`,
        hot: false
      });
    });
    expiringProjects.forEach(p => {
      tasks.push({
        title: `Dự án sắp kết thúc · ${p.name}`,
        subtitle: `Hạn ${new Date(p.endDate).toLocaleDateString('vi-VN')}`,
        hot: new Date(p.endDate) <= new Date()
      });
    });

    res.json({
      stats: {
        totalStudents,
        activeEmployees,
        partnerSchools: totalProjects,
        totalCustomers,
        totalCollaborators,
        totalCompetencyExams,
        unassignedCustomers,
        weekAppointments: weekAppointments.length,
        revenue: formatVND(totalRevenue)
      },
      recentStudents: recentStudents.map(s => ({
        ...s,
        id: s.maHV || 'HV' + String(s.id).padStart(3, '0'),
        tienDaDongFormatted: formatVND(s.tienDaDong),
        tongTienFormatted: formatVND(s.tongTien),
        avatar: s.name ? s.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV'
      })),
      destinations,
      stages: stageRows,
      tasks,
      week: {
        start: weekRange.weekStart,
        end: weekRange.weekEnd,
        label: `${weekRange.weekStartLabel} – ${weekRange.weekEndLabel}`
      },
      weekAppointments
    });
  } catch (err) {
    console.error('Lỗi API /api/overview:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/students (Danh sách)
router.get('/students', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        hv.id,
        hv.ma_hoc_vien as maHV,
        hv.ho_ten as name,
        hv.email,
        hv.so_dien_thoai as phone,
        hv.tinh_thanh_id as tinhThanhId,
        tt.ten_tinh as hometown,
        hv.quoc_gia_id as quocGiaId,
        qg.ten_quoc_gia as country,
        hv.trang_thai_ho_so as statusText,
        hv.lo_trinh as program,
        IFNULL(DATE_FORMAT(hv.ngay_nhap_hoc, '%Y-%m-%d'), '') as ngayNhapHocRaw,
        IFNULL(DATE_FORMAT(hv.ngay_nhap_hoc, '%d/%m/%Y'), DATE_FORMAT(hv.created_at, '%d/%m/%Y')) as ngayNhapHoc,
        hv.nhan_vien_id as nhanVienId,
        IFNULL(hv.tien_da_dong, 0) as tienDaDong,
        IFNULL(hv.tong_tien, 0) as tongTien,
        IFNULL(DATE_FORMAT(hv.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM hoc_vien hv
      LEFT JOIN tinh_thanh tt ON tt.id = hv.tinh_thanh_id
      LEFT JOIN quoc_gia qg ON qg.id = hv.quoc_gia_id
      ORDER BY hv.id DESC
    `);

    const students = rows.map(s => {
      let statusKey = 'processing';
      const st = s.statusText || '';
      if (st.includes('visa') || st.includes('tất')) statusKey = 'visa';
      else if (st.includes('tiếp')) statusKey = 'new';
      else if (st.includes('nộp')) statusKey = 'submitted';
      else if (st.includes('hoãn')) statusKey = 'hold';

      return {
        ...s,
        dbId: s.id,
        id: s.maHV || 'HV' + String(s.id).padStart(3, '0'),
        status: statusKey,
        ngayNhapHoc: s.ngayNhapHoc || '01/09/2026',
        createdAt: s.createdAt || new Date().toLocaleDateString('vi-VN'),
        tienDaDongFormatted: formatVND(s.tienDaDong),
        tongTienFormatted: formatVND(s.tongTien),
        avatar: s.name ? s.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV'
      };
    });

    res.json({ students });
  } catch (err) {
    console.error('Lỗi API /api/students:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/students/:id (Xem CHI TIẾT 1 học viên)
router.get('/students/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const [rows] = await db.query(`
      SELECT
        h.id,
        h.ma_hoc_vien as maHV,
        h.ho_ten as name,
        h.email,
        h.so_dien_thoai as phone,
        h.tinh_thanh_id as tinhThanhId,
        tt.ten_tinh as hometown,
        h.quoc_gia_id as quocGiaId,
        qg.ten_quoc_gia as country,
        h.trang_thai_ho_so as statusText,
        h.lo_trinh as program,
        IFNULL(DATE_FORMAT(h.ngay_nhap_hoc, '%d/%m/%Y'), '01/09/2026') as ngayNhapHoc,
        h.nhan_vien_id as nhanVienId,
        nv.ho_ten as repName,
        IFNULL(h.tien_da_dong, 0) as tienDaDong,
        IFNULL(h.tong_tien, 0) as tongTien,
        IFNULL(DATE_FORMAT(h.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM hoc_vien h
      LEFT JOIN nhan_vien nv ON h.nhan_vien_id = nv.id
      LEFT JOIN tinh_thanh tt ON tt.id = h.tinh_thanh_id
      LEFT JOIN quoc_gia qg ON qg.id = h.quoc_gia_id
      WHERE h.ma_hoc_vien = ? ${isNumericId ? 'OR h.id = ?' : ''}
    `, isNumericId ? [targetId, targetId] : [targetId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học viên' });
    }

    const s = rows[0];
    const student = {
      ...s,
      id: s.maHV || 'HV' + String(s.id).padStart(3, '0'),
      tienDaDongFormatted: formatVND(s.tienDaDong),
      tongTienFormatted: formatVND(s.tongTien),
      avatar: s.name ? s.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV',
      joinedDate: s.createdAt,
      rep: s.repName || 'Lê Thu Hà',
      dob: '14/03/2005',
      gender: 'Nữ',
      passport: 'P' + String(s.id).padStart(7, '0'),
      school: 'THPT Chu Văn An, Hà Nội',
      address: s.hometown || 'Hà Nội',
      parentContact: 'Phụ huynh học viên — 0908 111 222',
      targetSchool: s.country === 'Đức' ? 'Đại học Munich' : s.country === 'Mỹ' ? 'Boston University' : 'Đại học Tokyo',
      intake: 'Kỳ Thu 2026 (09/2026)',
      english: s.country === 'Đức' ? 'Tiếng Đức B1' : 'IELTS 6.5 / N3',
      budget: formatVND(s.tongTien)
    };

    res.json(student);
  } catch (err) {
    console.error('Lỗi GET /api/students/:id:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Bảng điểm: 3 học kỳ x 5 kỹ năng, thang điểm 10
const GRADE_SKILLS = [
  { col: 'Từ vựng', key: 'tuVung' },
  { col: 'Ngữ pháp', key: 'nguPhap' },
  { col: 'Hán tự', key: 'hanTu' },
  { col: 'Nghe', key: 'nghe' },
  { col: 'Hội thoại', key: 'hoiThoai' }
];

async function resolveHocVienId(targetId) {
  const isNumericId = /^\d+$/.test(targetId);
  const [rows] = await db.query(
    `SELECT id FROM hoc_vien WHERE ma_hoc_vien = ? ${isNumericId ? 'OR id = ?' : ''}`,
    isNumericId ? [targetId, targetId] : [targetId]
  );
  return rows[0] ? rows[0].id : null;
}

// GET /api/students/:id/grades
router.get('/students/:id/grades', async (req, res) => {
  try {
    const hocVienId = await resolveHocVienId(req.params.id);
    if (!hocVienId) return res.status(404).json({ error: 'Không tìm thấy học viên' });

    const [rows] = await db.query(
      'SELECT thang, ky_nang, diem FROM bang_diem WHERE hoc_vien_id = ?',
      [hocVienId]
    );

    const grades = { thang1: {}, thang2: {}, thang3: {}, thang4: {}, thang5: {}, thang6: {} };
    for (const r of rows) {
      const skill = GRADE_SKILLS.find(s => s.col === r.ky_nang);
      if (skill) grades[`thang${r.thang}`][skill.key] = Number(r.diem);
    }
    res.json({ grades });
  } catch (err) {
    console.error('Lỗi GET /api/students/:id/grades:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// PUT /api/students/:id/grades — cập nhật điểm 1 tháng
router.put('/students/:id/grades', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const hocVienId = await resolveHocVienId(req.params.id);
    if (!hocVienId) return res.status(404).json({ error: 'Không tìm thấy học viên' });

    const thang = Number(req.body.thang);
    if (![1, 2, 3, 4, 5, 6].includes(thang)) {
      return res.status(400).json({ error: 'Tháng không hợp lệ' });
    }
    const grades = req.body.grades || {};

    await conn.beginTransaction();
    for (const skill of GRADE_SKILLS) {
      const val = grades[skill.key];
      if (val === null || val === undefined || val === '') {
        await conn.query('DELETE FROM bang_diem WHERE hoc_vien_id = ? AND thang = ? AND ky_nang = ?', [hocVienId, thang, skill.col]);
        continue;
      }
      const diem = Number(val);
      if (Number.isNaN(diem) || diem < 0 || diem > 10) {
        await conn.rollback();
        return res.status(400).json({ error: `Điểm ${skill.col} phải từ 0 đến 10` });
      }
      await conn.query(
        `INSERT INTO bang_diem (hoc_vien_id, thang, ky_nang, diem) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE diem = VALUES(diem)`,
        [hocVienId, thang, skill.col, diem]
      );
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi PUT /api/students/:id/grades:', err);
    res.status(500).json({ error: 'Database query failed' });
  } finally {
    conn.release();
  }
});

// POST /api/students (Thêm học viên)
router.post('/students', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      tinhThanhId,
      quocGiaId,
      program,
      statusText,
      ngayNhapHoc,
      tienDaDong,
      tongTien
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên học viên là bắt buộc' });
    }

    const ngayNhapHocVal = ngayNhapHoc || new Date().toISOString().slice(0, 10);

    const [result] = await db.query(`
      INSERT INTO hoc_vien
      (ma_hoc_vien, ho_ten, email, so_dien_thoai, tinh_thanh_id, quoc_gia_id, trang_thai_ho_so, lo_trinh, ngay_nhap_hoc, tien_da_dong, tong_tien, created_at)
      VALUES ('TEMP', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name,
      email || null,
      phone || null,
      tinhThanhId || null,
      quocGiaId || null,
      statusText || 'Đang học tiếng',
      program || 'Hồ sơ du học',
      ngayNhapHocVal,
      Number(tienDaDong) || 0,
      Number(tongTien) || 0
    ]);

    const ma_hoc_vien = 'HV' + String(result.insertId).padStart(3, '0');
    await db.query('UPDATE hoc_vien SET ma_hoc_vien = ? WHERE id = ?', [ma_hoc_vien, result.insertId]);

    const initialPaid = Number(tienDaDong) || 0;
    if (initialPaid > 0) {
      await db.query(
        'INSERT INTO thanh_toan (hoc_vien_id, so_tien, ghi_chu) VALUES (?, ?, ?)',
        [result.insertId, initialPaid, 'Khởi tạo hồ sơ học viên']
      );
    }

    res.status(201).json({
      success: true,
      message: `Đã thêm thành công học viên ${name} (${ma_hoc_vien}) vào CSDL!`,
      insertedId: result.insertId,
      ma_hoc_vien
    });
  } catch (err) {
    console.error('Lỗi thêm mới học viên:', err);
    res.status(500).json({ error: 'Không thể thêm học viên vào CSDL: ' + err.message });
  }
});

// PUT /api/students/:id (Sửa học viên)
router.put('/students/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const {
      name,
      email,
      phone,
      tinhThanhId,
      quocGiaId,
      statusText,
      ngayNhapHoc,
      tienDaDong,
      tongTien
    } = req.body;

    const isNumericId = /^\d+$/.test(targetId);
    const [beforeRows] = await db.query(
      `SELECT id, tien_da_dong FROM hoc_vien WHERE ma_hoc_vien = ? ${isNumericId ? 'OR id = ?' : ''}`,
      isNumericId ? [targetId, targetId] : [targetId]
    );
    const before = beforeRows[0];

    const updateParams = [
      name,
      email || null,
      phone || null,
      tinhThanhId || null,
      quocGiaId || null,
      statusText || 'Đang học tiếng',
      ngayNhapHoc || null,
      Number(tienDaDong) || 0,
      Number(tongTien) || 0
    ];

    const [result] = await db.query(`
      UPDATE hoc_vien
      SET
        ho_ten = ?,
        email = ?,
        so_dien_thoai = ?,
        tinh_thanh_id = ?,
        quoc_gia_id = ?,
        trang_thai_ho_so = ?,
        ngay_nhap_hoc = ?,
        tien_da_dong = ?,
        tong_tien = ?
      WHERE ma_hoc_vien = ? ${isNumericId ? 'OR id = ?' : ''}
    `, isNumericId ? [...updateParams, targetId, targetId] : [...updateParams, targetId]);

    if (before) {
      const delta = (Number(tienDaDong) || 0) - (Number(before.tien_da_dong) || 0);
      if (delta !== 0) {
        await db.query(
          'INSERT INTO thanh_toan (hoc_vien_id, so_tien, ghi_chu) VALUES (?, ?, ?)',
          [before.id, delta, delta > 0 ? 'Cập nhật thanh toán' : 'Điều chỉnh giảm']
        );
      }
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học viên để cập nhật' });
    }

    res.json({ success: true, message: `Đã cập nhật thành công học viên ${name}!` });
  } catch (err) {
    console.error('Lỗi sửa học viên:', err);
    res.status(500).json({ error: 'Không thể cập nhật học viên: ' + err.message });
  }
});

// DELETE /api/students/:id (Xóa học viên)
router.delete('/students/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const [result] = await db.query(
      `DELETE FROM hoc_vien WHERE ma_hoc_vien = ? ${isNumericId ? 'OR id = ?' : ''}`,
      isNumericId ? [targetId, targetId] : [targetId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học viên để xóa' });
    }

    res.json({ success: true, message: `Đã xóa thành công học viên (${targetId}) khỏi CSDL!` });
  } catch (err) {
    console.error('Lỗi xóa học viên:', err);
    res.status(500).json({ error: 'Không thể xóa học viên: ' + err.message });
  }
});

// GET /api/employees (Danh sách)
router.get('/employees', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        nv.id,
        nv.ma_nhan_vien as maNV,
        nv.ho_ten as name,
        nv.so_dien_thoai as phone,
        nv.email,
        IFNULL(DATE_FORMAT(nv.ngay_sinh, '%Y-%m-%d'), '') as ngaySinhRaw,
        IFNULL(DATE_FORMAT(nv.ngay_sinh, '%d/%m/%Y'), 'Chưa cập nhật') as ngaySinh,
        nv.bo_phan_id as departmentId,
        bp.ten_bo_phan as department,
        nv.chuc_danh_id as roleId,
        cd.ten_chuc_danh as role,
        IFNULL(DATE_FORMAT(nv.ngay_vao_lam, '%Y-%m-%d'), '') as startDateRaw,
        IFNULL(DATE_FORMAT(nv.ngay_vao_lam, '%d/%m/%Y'), '01/01/2025') as startDate,
        nv.hinh_thuc as workType,
        nv.trang_thai as statusText,
        IFNULL(DATE_FORMAT(nv.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM nhan_vien nv
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
      ORDER BY nv.id ASC
    `);

    const employees = rows.map(e => ({
      ...e,
      dbId: e.id,
      id: e.maNV || 'NV' + String(e.id).padStart(3, '0'),
      avatar: e.name ? e.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'NV'
    }));

    res.json({ employees });
  } catch (err) {
    console.error('Lỗi API /api/employees:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/employees/:id (Xem CHI TIẾT 1 nhân viên)
router.get('/employees/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const [rows] = await db.query(`
      SELECT
        nv.id,
        nv.ma_nhan_vien as maNV,
        nv.ho_ten as name,
        nv.so_dien_thoai as phone,
        nv.email,
        IFNULL(DATE_FORMAT(nv.ngay_sinh, '%d/%m/%Y'), '15/08/1995') as dob,
        nv.bo_phan_id as departmentId,
        bp.ten_bo_phan as department,
        nv.chuc_danh_id as roleId,
        cd.ten_chuc_danh as role,
        IFNULL(DATE_FORMAT(nv.ngay_vao_lam, '%d/%m/%Y'), '01/01/2025') as startDate,
        nv.hinh_thuc as workType,
        nv.trang_thai as statusText,
        IFNULL(DATE_FORMAT(nv.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM nhan_vien nv
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
      WHERE nv.ma_nhan_vien = ? ${isNumericId ? 'OR nv.id = ?' : ''}
    `, isNumericId ? [targetId, targetId] : [targetId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }
    const emp = rows[0];

    // Lấy danh sách học viên do nhân viên này đảm nhận
    const [assignedStudents] = await db.query(`
      SELECT
        hv.id,
        hv.ma_hoc_vien as maHV,
        hv.ho_ten as name,
        qg.ten_quoc_gia as country,
        hv.trang_thai_ho_so as statusText,
        IFNULL(DATE_FORMAT(hv.created_at, '%d/%m/%Y'), '21/08/2026') as createdAt
      FROM hoc_vien hv
      LEFT JOIN quoc_gia qg ON qg.id = hv.quoc_gia_id
      LIMIT 10
    `);

    res.json({
      ...emp,
      id: emp.maNV || emp.id || 'NV001',
      avatar: emp.name ? emp.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'NV',
      gender: 'Nữ',
      passport: '001195001234',
      address: 'Q. Cầu Giấy, Hà Nội',
      contractType: 'Hợp đồng lao động xác định thời hạn (2 năm)',
      manager: 'Minh Hằng (Quản trị viên)',
      assignedStudentsCount: assignedStudents.length,
      kpiRate: '96%',
      assignedStudents: assignedStudents.map(s => ({
        ...s,
        id: s.maHV || 'HV' + String(s.id).padStart(3, '0')
      }))
    });
  } catch (err) {
    console.error('Lỗi GET /api/employees/:id:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/employees (Thêm nhân viên)
router.post('/employees', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      departmentId,
      roleId,
      workType,
      statusText,
      startDate
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tên nhân viên là bắt buộc' });
    }

    const startDateVal = startDate || new Date().toISOString().slice(0, 10);

    const [result] = await db.query(`
      INSERT INTO nhan_vien
      (ma_nhan_vien, ho_ten, email, so_dien_thoai, bo_phan_id, chuc_danh_id, hinh_thuc, trang_thai, ngay_vao_lam, created_at)
      VALUES ('TEMP', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name,
      email || null,
      phone || null,
      departmentId || null,
      roleId || null,
      workType || 'Full-time',
      statusText || 'Đang làm việc',
      startDateVal
    ]);

    const ma_nhan_vien = 'NV' + String(result.insertId).padStart(3, '0');
    await db.query('UPDATE nhan_vien SET ma_nhan_vien = ? WHERE id = ?', [ma_nhan_vien, result.insertId]);

    res.status(201).json({
      success: true,
      message: `Đã thêm thành công nhân viên ${name} (${ma_nhan_vien}) vào CSDL!`,
      insertedId: result.insertId,
      ma_nhan_vien
    });
  } catch (err) {
    console.error('Lỗi thêm nhân viên:', err);
    res.status(500).json({ error: 'Không thể thêm nhân viên: ' + err.message });
  }
});

// PUT /api/employees/:id (Sửa nhân viên)
router.put('/employees/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const {
      name,
      email,
      phone,
      departmentId,
      roleId,
      workType,
      statusText,
      startDate
    } = req.body;

    const baseParams = [
      name,
      email || null,
      phone || null,
      departmentId || null,
      roleId || null,
      workType || 'Full-time',
      statusText || 'Đang làm việc',
      startDate || null
    ];

    const [result] = await db.query(`
      UPDATE nhan_vien
      SET
        ho_ten = ?,
        email = ?,
        so_dien_thoai = ?,
        bo_phan_id = ?,
        chuc_danh_id = ?,
        hinh_thuc = ?,
        trang_thai = ?,
        ngay_vao_lam = ?
      WHERE ma_nhan_vien = ? ${isNumericId ? 'OR id = ?' : ''}
    `, isNumericId ? [...baseParams, targetId, targetId] : [...baseParams, targetId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên để cập nhật' });
    }

    res.json({ success: true, message: `Đã cập nhật thành công nhân viên ${name}!` });
  } catch (err) {
    console.error('Lỗi sửa nhân viên:', err);
    res.status(500).json({ error: 'Không thể cập nhật nhân viên: ' + err.message });
  }
});

// DELETE /api/employees/:id (Xóa nhân viên)
router.delete('/employees/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const [result] = await db.query(
      `DELETE FROM nhan_vien WHERE ma_nhan_vien = ? ${isNumericId ? 'OR id = ?' : ''}`,
      isNumericId ? [targetId, targetId] : [targetId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên để xóa' });
    }

    res.json({ success: true, message: `Đã xóa thành công nhân viên (${targetId}) khỏi CSDL!` });
  } catch (err) {
    console.error('Lỗi xóa nhân viên:', err);
    res.status(500).json({ error: 'Không thể xóa nhân viên: ' + err.message });
  }
});

// GET /api/revenue — monthly/yearly revenue report built from `thanh_toan`
// (a running log of each payment change made on a student's hồ sơ).
router.get('/revenue', async (req, res) => {
  try {
    async function sumWhere(whereSql, params) {
      const [[row]] = await db.query(`SELECT COALESCE(SUM(so_tien),0) as total FROM thanh_toan WHERE ${whereSql}`, params);
      return Number(row.total) || 0;
    }

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const curQuarter = Math.floor((curMonth - 1) / 3) + 1;

    const monthly = await sumWhere('YEAR(ngay_thanh_toan) = ? AND MONTH(ngay_thanh_toan) = ?', [curYear, curMonth]);
    const prevMonthDate = new Date(curYear, curMonth - 2, 1);
    const prevMonthTotal = await sumWhere('YEAR(ngay_thanh_toan) = ? AND MONTH(ngay_thanh_toan) = ?', [prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1]);

    const qStartMonth = (curQuarter - 1) * 3 + 1;
    const qEndMonth = qStartMonth + 2;
    const quarterly = await sumWhere('YEAR(ngay_thanh_toan) = ? AND MONTH(ngay_thanh_toan) BETWEEN ? AND ?', [curYear, qStartMonth, qEndMonth]);
    let pqStart = qStartMonth - 3, pqEnd = qEndMonth - 3, pqYear = curYear;
    if (pqStart < 1) { pqStart += 12; pqEnd += 12; pqYear -= 1; }
    const prevQuarterTotal = await sumWhere('YEAR(ngay_thanh_toan) = ? AND MONTH(ngay_thanh_toan) BETWEEN ? AND ?', [pqYear, pqStart, pqEnd]);

    const yearly = await sumWhere('YEAR(ngay_thanh_toan) = ?', [curYear]);
    const prevYearTotal = await sumWhere('YEAR(ngay_thanh_toan) = ?', [curYear - 1]);

    const [[{ outstanding }]] = await db.query('SELECT COALESCE(SUM(tong_tien - tien_da_dong),0) as outstanding FROM hoc_vien');

    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      const y = d.getFullYear(), m = d.getMonth() + 1;
      const total = await sumWhere('YEAR(ngay_thanh_toan) = ? AND MONTH(ngay_thanh_toan) = ?', [y, m]);
      monthlyChart.push({ month: m, total, isCurrent: i === 0 });
    }
    const maxChartVal = Math.max(1, ...monthlyChart.map(c => c.total));

    const [countryRows] = await db.query(`
      SELECT COALESCE(qg.ten_quoc_gia, 'Khác') as country, COALESCE(SUM(tt.so_tien),0) as total
      FROM thanh_toan tt
      JOIN hoc_vien hv ON hv.id = tt.hoc_vien_id
      LEFT JOIN quoc_gia qg ON qg.id = hv.quoc_gia_id
      GROUP BY COALESCE(qg.ten_quoc_gia, 'Khác')
      ORDER BY total DESC
    `);
    const maxCountry = Math.max(1, ...countryRows.map(r => Number(r.total)));
    const countryColors = ['var(--teal)', 'var(--gold)', 'var(--coral)', 'var(--green)', '#3B6FD1'];

    const [txRows] = await db.query(`
      SELECT tt.so_tien, tt.ngay_thanh_toan, tt.ghi_chu, hv.ho_ten
      FROM thanh_toan tt
      JOIN hoc_vien hv ON hv.id = tt.hoc_vien_id
      ORDER BY tt.ngay_thanh_toan DESC, tt.id DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        monthly: formatVND(monthly),
        monthlyTrendPct: pctChange(monthly, prevMonthTotal),
        quarterly: formatVND(quarterly),
        quarterlyTrendPct: pctChange(quarterly, prevQuarterTotal),
        yearly: formatVND(yearly),
        yearlyTrendPct: pctChange(yearly, prevYearTotal),
        outstanding: formatVND(outstanding)
      },
      period: { month: curMonth, quarter: curQuarter, year: curYear },
      monthlyChart: monthlyChart.map(c => ({
        month: `T${c.month}`,
        val: formatCompactVND(c.total),
        height: Math.round((c.total / maxChartVal) * 100),
        target: c.isCurrent
      })),
      sources: countryRows.map((r, idx) => ({
        name: r.country,
        amount: formatVND(r.total),
        width: Math.round((Number(r.total) / maxCountry) * 100),
        color: countryColors[idx % countryColors.length]
      })),
      recentTransactions: txRows.map(t => {
        const amt = Number(t.so_tien);
        const name = t.ho_ten || 'Học viên';
        return {
          student: name,
          avatar: name.split(' ').filter(Boolean).slice(-2).map(n => n[0]).join('').toUpperCase() || 'HV',
          desc: t.ghi_chu || (amt >= 0 ? 'Học viên đóng học phí' : 'Điều chỉnh giảm'),
          amount: (amt >= 0 ? '+' : '') + formatVND(amt),
          date: new Date(t.ngay_thanh_toan).toLocaleDateString('vi-VN'),
          status: amt >= 0 ? 'paid' : 'adjust',
          statusText: amt >= 0 ? 'Đã thu' : 'Điều chỉnh'
        };
      })
    });
  } catch (err) {
    console.error('Lỗi API /api/revenue:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/schools
router.get('/schools', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.id,
        d.ma_du_an as maDuAn,
        d.ten_du_an as name,
        qg.ten_quoc_gia as country,
        IFNULL(DATE_FORMAT(d.ngay_bat_dau, '%d/%m/%Y'), '01/01/2026') as startDate,
        IFNULL(DATE_FORMAT(d.ngay_ket_thuc, '%d/%m/%Y'), '31/12/2026') as endDate,
        d.chi_tieu_so_luong as quota,
        d.ngan_sach as budget,
        d.nguoi_quan_ly_id as managerId,
        nv.ho_ten as managerName,
        d.trang_thai as statusText,
        IFNULL(DATE_FORMAT(d.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM du_an d
      LEFT JOIN nhan_vien nv ON nv.id = d.nguoi_quan_ly_id
      LEFT JOIN quoc_gia qg ON qg.id = d.quoc_gia_id
      ORDER BY d.id DESC
    `);

    const schools = rows.map(s => ({
      ...s,
      budgetFormatted: formatVND(s.budget)
    }));

    res.json({ schools });
  } catch (err) {
    console.error('Lỗi API /api/schools:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/leads
// GET /api/customers (Quản lý khách hàng)
router.get('/customers', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        kh.id,
        kh.ma_kh as maKH,
        kh.ho_ten as name,
        kh.so_dien_thoai as phone,
        kh.nhan_vien_id as nhanVienId,
        nv.ho_ten as staffName,
        kh.ngay_dang_ky as ngayDangKyRaw,
        IFNULL(DATE_FORMAT(kh.ngay_dang_ky, '%d/%m/%Y'), DATE_FORMAT(kh.created_at, '%d/%m/%Y')) as ngayDangKy,
        kh.quoc_gia_id as quocGiaId,
        qg.ten_quoc_gia as country,
        kh.tinh_thanh_id as tinhThanhId,
        tt.ten_tinh as province,
        kh.trang_thai as statusText,
        kh.ghi_chu as note,
        kh.created_at as createdAtRaw,
        IFNULL(DATE_FORMAT(kh.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM khach_hang kh
      LEFT JOIN nhan_vien nv ON nv.id = kh.nhan_vien_id
      LEFT JOIN quoc_gia qg ON qg.id = kh.quoc_gia_id
      LEFT JOIN tinh_thanh tt ON tt.id = kh.tinh_thanh_id
      ORDER BY kh.id DESC
    `);

    const customers = rows.map(r => ({
      id: r.maKH,
      dbId: r.id,
      maKH: r.maKH,
      name: r.name,
      phone: r.phone,
      nhanVienId: r.nhanVienId,
      staffName: r.staffName || 'Chưa phân công',
      ngayDangKyRaw: r.ngayDangKyRaw ? new Date(r.ngayDangKyRaw).toISOString().slice(0, 10) : '',
      ngayDangKy: r.ngayDangKy,
      quocGiaId: r.quocGiaId,
      country: r.country || 'Chưa xác định',
      tinhThanhId: r.tinhThanhId,
      province: r.province || 'Chưa xác định',
      statusText: r.statusText || 'Mới tiếp nhận',
      note: r.note,
      createdAt: r.createdAt,
      createdAtRaw: r.createdAtRaw
    }));

    res.json({ customers });
  } catch (err) {
    console.error('Lỗi API /api/customers:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/customers (Thêm khách hàng)
router.post('/customers', async (req, res) => {
  try {
    const { name, phone, nhanVienId, ngayDangKy, quocGiaId, tinhThanhId, statusText, note } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên khách hàng là bắt buộc' });
    }

    const [result] = await db.query(`
      INSERT INTO khach_hang (ma_kh, ho_ten, so_dien_thoai, nhan_vien_id, ngay_dang_ky, quoc_gia_id, tinh_thanh_id, trang_thai, ghi_chu, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'TEMP',
      name,
      phone || null,
      nhanVienId || null,
      ngayDangKy || null,
      quocGiaId || null,
      tinhThanhId || null,
      statusText || 'Mới tiếp nhận',
      note || null
    ]);

    const ma_kh = 'KH' + String(result.insertId).padStart(3, '0');
    await db.query('UPDATE khach_hang SET ma_kh = ? WHERE id = ?', [ma_kh, result.insertId]);

    res.status(201).json({
      success: true,
      message: `Đã thêm khách hàng ${name} (${ma_kh}) vào CSDL!`,
      insertedId: result.insertId,
      ma_kh
    });
  } catch (err) {
    console.error('Lỗi thêm mới khách hàng:', err);
    res.status(500).json({ error: 'Không thể thêm khách hàng vào CSDL: ' + err.message });
  }
});

// PUT /api/customers/:id (Sửa khách hàng)
router.put('/customers/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const { name, phone, nhanVienId, ngayDangKy, quocGiaId, tinhThanhId, statusText, note } = req.body;

    const updateParams = [
      name,
      phone || null,
      nhanVienId || null,
      ngayDangKy || null,
      quocGiaId || null,
      tinhThanhId || null,
      statusText || 'Mới tiếp nhận',
      note || null
    ];

    const [result] = await db.query(`
      UPDATE khach_hang
      SET
        ho_ten = ?,
        so_dien_thoai = ?,
        nhan_vien_id = ?,
        ngay_dang_ky = ?,
        quoc_gia_id = ?,
        tinh_thanh_id = ?,
        trang_thai = ?,
        ghi_chu = ?
      WHERE ma_kh = ? ${isNumericId ? 'OR id = ?' : ''}
    `, isNumericId ? [...updateParams, targetId, targetId] : [...updateParams, targetId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng để cập nhật' });
    }

    res.json({ success: true, message: `Đã cập nhật thành công khách hàng ${name}!` });
  } catch (err) {
    console.error('Lỗi sửa khách hàng:', err);
    res.status(500).json({ error: 'Không thể cập nhật khách hàng: ' + err.message });
  }
});

// DELETE /api/customers/:id (Xóa khách hàng)
router.delete('/customers/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const [result] = await db.query(
      `DELETE FROM khach_hang WHERE ma_kh = ? ${isNumericId ? 'OR id = ?' : ''}`,
      isNumericId ? [targetId, targetId] : [targetId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy khách hàng để xóa' });
    }

    res.json({ success: true, message: 'Đã xóa khách hàng khỏi CSDL' });
  } catch (err) {
    console.error('Lỗi xóa khách hàng:', err);
    res.status(500).json({ error: 'Không thể xóa khách hàng: ' + err.message });
  }
});

// POST /api/change-password — works for both admin and staff (this router is
// mounted behind requireAuth('admin','staff'), so req.user.role is always one of the two).
router.post('/change-password', async (req, res) => {
  try {
    const { role, id } = req.user;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }
    let accountTable, accountId, passwordHash;
    if (role === 'admin') {
      const [rows] = await db.query('SELECT password_hash FROM tai_khoan_admin WHERE id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
      accountTable = 'tai_khoan_admin';
      accountId = id;
      passwordHash = rows[0].password_hash;
    } else {
      const [rows] = await db.query('SELECT tai_khoan_nhan_vien_id, tk.password_hash FROM nhan_vien nv JOIN tai_khoan_nhan_vien tk ON tk.id = nv.tai_khoan_nhan_vien_id WHERE nv.id = ?', [id]);
      if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
      accountTable = 'tai_khoan_nhan_vien';
      accountId = rows[0].tai_khoan_nhan_vien_id;
      passwordHash = rows[0].password_hash;
    }

    const match = await verifyPassword(currentPassword, passwordHash);
    if (!match) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE ${accountTable} SET password_hash = ? WHERE id = ?`, [newHash, accountId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/upload-avatar — works for both admin and staff, same reasoning as /change-password.
router.post('/upload-avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { role, id } = req.user;
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn một ảnh' });
    const table = role === 'admin' ? 'tai_khoan_admin' : 'nhan_vien';
    const avatarUrl = '/uploads/avatars/' + req.file.filename;
    await db.query(`UPDATE ${table} SET avatar_url = ? WHERE id = ?`, [avatarUrl, id]);
    res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Lỗi tải ảnh đại diện:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ---- Lịch tư vấn (consultation appointments) ----
function mapAppointmentRow(r) {
  const linkedName = r.khachHangName || r.hocVienName || null;
  return {
    id: r.id,
    title: r.tieu_de,
    displayTitle: linkedName ? `${r.tieu_de} · ${linkedName}` : r.tieu_de,
    date: r.date,
    time: r.time,
    type: r.loai,
    khachHangId: r.khach_hang_id,
    hocVienId: r.hoc_vien_id,
    nhanVienId: r.nhan_vien_id,
    nhanVienName: r.nhanVienName,
    note: r.ghi_chu,
    status: r.trang_thai
  };
}

const APPOINTMENT_SELECT = `
  SELECT
    lv.id, lv.tieu_de, lv.loai, lv.khach_hang_id, lv.hoc_vien_id, lv.nhan_vien_id, lv.ghi_chu, lv.trang_thai,
    DATE_FORMAT(lv.thoi_gian, '%Y-%m-%d') as date,
    DATE_FORMAT(lv.thoi_gian, '%H:%i') as time,
    kh.ho_ten as khachHangName,
    hv.ho_ten as hocVienName,
    nv.ho_ten as nhanVienName
  FROM lich_tu_van lv
  LEFT JOIN khach_hang kh ON kh.id = lv.khach_hang_id
  LEFT JOIN hoc_vien hv ON hv.id = lv.hoc_vien_id
  LEFT JOIN nhan_vien nv ON nv.id = lv.nhan_vien_id
`;

// GET /api/appointments?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/appointments', async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = APPOINTMENT_SELECT;
    const params = [];
    if (start && end) {
      sql += ' WHERE DATE(lv.thoi_gian) BETWEEN ? AND ?';
      params.push(start, end);
    }
    sql += ' ORDER BY lv.thoi_gian ASC';
    const [rows] = await db.query(sql, params);
    res.json({ appointments: rows.map(mapAppointmentRow) });
  } catch (err) {
    console.error('Lỗi API /api/appointments:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/appointments (Thêm lịch tư vấn)
router.post('/appointments', async (req, res) => {
  try {
    const { title, datetime, type, khachHangId, hocVienId, nhanVienId, note, status } = req.body;
    if (!title || !datetime) {
      return res.status(400).json({ error: 'Thiếu tiêu đề hoặc thời gian' });
    }
    const [result] = await db.query(`
      INSERT INTO lich_tu_van (tieu_de, thoi_gian, loai, khach_hang_id, hoc_vien_id, nhan_vien_id, ghi_chu, trang_thai)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title,
      normalizeDatetime(datetime),
      type || 'khac',
      khachHangId || null,
      hocVienId || null,
      nhanVienId || null,
      note || null,
      status || 'Đã đặt lịch'
    ]);
    res.status(201).json({ success: true, message: 'Đã thêm lịch tư vấn mới', insertedId: result.insertId });
  } catch (err) {
    console.error('Lỗi thêm lịch tư vấn:', err);
    res.status(500).json({ error: 'Không thể thêm lịch tư vấn: ' + err.message });
  }
});

// PUT /api/appointments/:id (Sửa lịch tư vấn)
router.put('/appointments/:id', async (req, res) => {
  try {
    const { title, datetime, type, khachHangId, hocVienId, nhanVienId, note, status } = req.body;
    const [result] = await db.query(`
      UPDATE lich_tu_van
      SET tieu_de = ?, thoi_gian = ?, loai = ?, khach_hang_id = ?, hoc_vien_id = ?, nhan_vien_id = ?, ghi_chu = ?, trang_thai = ?
      WHERE id = ?
    `, [
      title,
      normalizeDatetime(datetime),
      type || 'khac',
      khachHangId || null,
      hocVienId || null,
      nhanVienId || null,
      note || null,
      status || 'Đã đặt lịch',
      req.params.id
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lịch tư vấn để cập nhật' });
    }
    res.json({ success: true, message: 'Đã cập nhật lịch tư vấn!' });
  } catch (err) {
    console.error('Lỗi sửa lịch tư vấn:', err);
    res.status(500).json({ error: 'Không thể cập nhật lịch tư vấn: ' + err.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/appointments/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM lich_tu_van WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lịch tư vấn để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa lịch tư vấn' });
  } catch (err) {
    console.error('Lỗi xóa lịch tư vấn:', err);
    res.status(500).json({ error: 'Không thể xóa lịch tư vấn: ' + err.message });
  }
});

// ---- Cộng tác viên (referral collaborators — standalone, no FK to other tables) ----

// GET /api/collaborators
router.get('/collaborators', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id, ma_ctv as maCTV, ho_ten as name, so_dien_thoai as phone,
        nguoi_gioi_thieu as referrer, trang_thai as statusText,
        DATE_FORMAT(ngay_dang_ky, '%Y-%m-%d') as registeredAtRaw,
        IFNULL(DATE_FORMAT(ngay_dang_ky, '%d/%m/%Y'), DATE_FORMAT(created_at, '%d/%m/%Y')) as registeredAt,
        created_at as createdAtRaw
      FROM cong_tac_vien
      ORDER BY id DESC
    `);
    res.json({ collaborators: rows.map(r => ({ ...r, id: r.maCTV, dbId: r.id })) });
  } catch (err) {
    console.error('Lỗi API /api/collaborators:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/collaborators (Thêm cộng tác viên)
router.post('/collaborators', async (req, res) => {
  try {
    const { name, phone, referrer, statusText, registeredAt } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên cộng tác viên là bắt buộc' });
    }
    const [result] = await db.query(`
      INSERT INTO cong_tac_vien (ma_ctv, ho_ten, so_dien_thoai, nguoi_gioi_thieu, trang_thai, ngay_dang_ky)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['TEMP', name, phone || null, referrer || null, statusText || 'Hoạt động', registeredAt || null]);

    const ma_ctv = 'CTV-' + String(result.insertId).padStart(4, '0');
    await db.query('UPDATE cong_tac_vien SET ma_ctv = ? WHERE id = ?', [ma_ctv, result.insertId]);

    res.status(201).json({ success: true, message: `Đã thêm cộng tác viên ${name} (${ma_ctv})!`, insertedId: result.insertId, ma_ctv });
  } catch (err) {
    console.error('Lỗi thêm cộng tác viên:', err);
    res.status(500).json({ error: 'Không thể thêm cộng tác viên: ' + err.message });
  }
});

// PUT /api/collaborators/:id (Sửa cộng tác viên)
router.put('/collaborators/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const { name, phone, referrer, statusText, registeredAt } = req.body;
    const [result] = await db.query(`
      UPDATE cong_tac_vien
      SET ho_ten = ?, so_dien_thoai = ?, nguoi_gioi_thieu = ?, trang_thai = ?, ngay_dang_ky = ?
      WHERE ma_ctv = ? ${isNumericId ? 'OR id = ?' : ''}
    `, isNumericId
      ? [name, phone || null, referrer || null, statusText || 'Hoạt động', registeredAt || null, targetId, targetId]
      : [name, phone || null, referrer || null, statusText || 'Hoạt động', registeredAt || null, targetId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy cộng tác viên để cập nhật' });
    }
    res.json({ success: true, message: `Đã cập nhật thông tin ${name}!` });
  } catch (err) {
    console.error('Lỗi sửa cộng tác viên:', err);
    res.status(500).json({ error: 'Không thể cập nhật cộng tác viên: ' + err.message });
  }
});

// DELETE /api/collaborators/:id
router.delete('/collaborators/:id', async (req, res) => {
  try {
    const targetId = req.params.id;
    const isNumericId = /^\d+$/.test(targetId);
    const [result] = await db.query(
      `DELETE FROM cong_tac_vien WHERE ma_ctv = ? ${isNumericId ? 'OR id = ?' : ''}`,
      isNumericId ? [targetId, targetId] : [targetId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Không tìm thấy cộng tác viên để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa cộng tác viên khỏi CSDL' });
  } catch (err) {
    console.error('Lỗi xóa cộng tác viên:', err);
    res.status(500).json({ error: 'Không thể xóa cộng tác viên: ' + err.message });
  }
});

// ---- Test năng lực nhân viên (kết quả nhập thủ công — bảng test_nang_luc) ----

function ratingStampTier(ketQua) {
  return ketQua === 'Đạt' ? 'pass' : 'fail';
}

// GET /api/competency-results
router.get('/competency-results', async (req, res) => {
  try {
    const { department, search } = req.query;
    const clauses = [];
    const params = [];
    if (department) { clauses.push('bp.ten_bo_phan = ?'); params.push(department); }
    if (search && search.trim()) { clauses.push('nv.ho_ten LIKE ?'); params.push(`%${search.trim()}%`); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        t.id, t.ten_bai_test as examName,
        t.diem_so as score, t.ket_qua as result, t.danh_gia_nhan_xet as note,
        DATE_FORMAT(t.ngay_lam_test, '%Y-%m-%d') as takenAtRaw,
        DATE_FORMAT(t.ngay_lam_test, '%d/%m/%Y') as takenAt,
        nv.id as employeeId, nv.ma_nhan_vien as employeeCode, nv.ho_ten as employeeName,
        bp.ten_bo_phan as department
      FROM test_nang_luc t
      JOIN nhan_vien nv ON nv.id = t.nhan_vien_id
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      ${where}
      ORDER BY t.id DESC
    `, params);

    res.json({
      results: rows.map(r => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeCode: r.employeeCode,
        employeeName: r.employeeName,
        department: r.department || 'Chưa xác định',
        examName: r.examName,
        score: Number(r.score),
        result: r.result,
        ratingTier: ratingStampTier(r.result),
        note: r.note,
        takenAtRaw: r.takenAtRaw,
        takenAt: r.takenAt
      }))
    });
  } catch (err) {
    console.error('Lỗi lấy kết quả test năng lực:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/competency-results
router.post('/competency-results', async (req, res) => {
  try {
    const { employeeId, examName, score, result, takenAt, note } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Vui lòng chọn nhân viên' });
    if (!examName || !examName.trim()) return res.status(400).json({ error: 'Tên bài test là bắt buộc' });
    if (!['Đạt', 'Không đạt'].includes(result)) return res.status(400).json({ error: 'Kết quả không hợp lệ' });

    const [insertResult] = await db.query(
      'INSERT INTO test_nang_luc (nhan_vien_id, ten_bai_test, ngay_lam_test, diem_so, ket_qua, danh_gia_nhan_xet) VALUES (?, ?, ?, ?, ?, ?)',
      [employeeId, examName, takenAt || new Date().toISOString().slice(0, 10), Number(score) || 0, result, note || null]
    );
    res.status(201).json({ success: true, message: 'Đã thêm kết quả test năng lực!', insertedId: insertResult.insertId });
  } catch (err) {
    console.error('Lỗi thêm kết quả test năng lực:', err);
    res.status(500).json({ error: 'Không thể thêm kết quả: ' + err.message });
  }
});

// PUT /api/competency-results/:id
router.put('/competency-results/:id', async (req, res) => {
  try {
    const { employeeId, examName, score, result, takenAt, note } = req.body;
    if (!employeeId) return res.status(400).json({ error: 'Vui lòng chọn nhân viên' });
    if (!examName || !examName.trim()) return res.status(400).json({ error: 'Tên bài test là bắt buộc' });
    if (!['Đạt', 'Không đạt'].includes(result)) return res.status(400).json({ error: 'Kết quả không hợp lệ' });

    const [updateResult] = await db.query(
      'UPDATE test_nang_luc SET nhan_vien_id = ?, ten_bai_test = ?, ngay_lam_test = ?, diem_so = ?, ket_qua = ?, danh_gia_nhan_xet = ? WHERE id = ?',
      [employeeId, examName, takenAt || new Date().toISOString().slice(0, 10), Number(score) || 0, result, note || null, req.params.id]
    );
    if (updateResult.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy kết quả để cập nhật' });
    res.json({ success: true, message: 'Đã cập nhật kết quả test năng lực!' });
  } catch (err) {
    console.error('Lỗi sửa kết quả test năng lực:', err);
    res.status(500).json({ error: 'Không thể cập nhật kết quả: ' + err.message });
  }
});

// DELETE /api/competency-results/:id
router.delete('/competency-results/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM test_nang_luc WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy kết quả để xóa' });
    res.json({ success: true, message: 'Đã xóa kết quả khỏi CSDL' });
  } catch (err) {
    console.error('Lỗi xóa kết quả test năng lực:', err);
    res.status(500).json({ error: 'Không thể xóa kết quả: ' + err.message });
  }
});

// ---- Company logo (shared across admin/staff/student portals) ----
router.get('/settings/logo', (req, res) => {
  const file = currentLogoFile();
  res.json({ logoUrl: file ? '/uploads/company/' + file : null });
});

router.post('/settings/logo', logoUpload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn một ảnh' });
  const existing = fs.readdirSync(logoUploadDir).filter(f => f.startsWith('logo.') && f !== req.file.filename);
  for (const f of existing) fs.unlinkSync(path.join(logoUploadDir, f));
  res.json({ success: true, logoUrl: '/uploads/company/' + req.file.filename });
});

router.delete('/settings/logo', (req, res) => {
  const existing = fs.readdirSync(logoUploadDir).filter(f => f.startsWith('logo.'));
  for (const f of existing) fs.unlinkSync(path.join(logoUploadDir, f));
  res.json({ success: true });
});

// ---- Accounts (tạo tài khoản đăng nhập + reset mật khẩu + khóa/mở khóa) ----
const ACCOUNT_TABLES = { admin: 'tai_khoan_admin', staff: 'tai_khoan_nhan_vien', student: 'tai_khoan_hoc_vien' };

function formatDateTime(val) {
  if (!val) return null;
  const d = new Date(val);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

router.get('/accounts', async (req, res) => {
  try {
    const [admins] = await db.query(`
      SELECT ta.id as accountId, ta.username, ta.trang_thai, ta.last_login,
        ta.ho_ten as name, ta.email, ta.avatar_url,
        CASE ta.vai_tro WHEN 'SUPER_ADMIN' THEN 'Quản trị viên cấp cao' WHEN 'MANAGER' THEN 'Quản lý' ELSE 'Quản trị viên' END as role
      FROM tai_khoan_admin ta
    `);
    const [staff] = await db.query(`
      SELECT tk.id as accountId, tk.username, tk.trang_thai, tk.last_login,
        nv.ho_ten as name, nv.email, nv.avatar_url, IFNULL(cd.ten_chuc_danh, 'Nhân viên') as role
      FROM tai_khoan_nhan_vien tk
      JOIN nhan_vien nv ON nv.tai_khoan_nhan_vien_id = tk.id
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
    `);
    const [students] = await db.query(`
      SELECT tk.id as accountId, tk.username, tk.trang_thai, tk.last_login,
        hv.ho_ten as name, hv.email, hv.avatar_url, hv.ma_hoc_vien
      FROM tai_khoan_hoc_vien tk
      JOIN hoc_vien hv ON hv.tai_khoan_hoc_vien_id = tk.id
    `);

    const mapRow = (r, accountType) => ({
      accountId: r.accountId,
      accountType,
      type: accountType === 'student' ? 'student' : 'staff',
      username: r.username,
      name: r.name,
      email: r.email || null,
      role: accountType === 'student' ? ('Mã ' + (r.ma_hoc_vien || '')) : r.role,
      status: r.trang_thai === 'Khóa' ? 'locked' : 'active',
      statusText: r.trang_thai === 'Khóa' ? 'Đã khóa' : 'Đang hoạt động',
      lastLogin: formatDateTime(r.last_login) || 'Chưa đăng nhập',
      avatarUrl: r.avatar_url || null,
      avatar: getInitials(r.name)
    });

    const accounts = [
      ...admins.map(r => mapRow(r, 'admin')),
      ...staff.map(r => mapRow(r, 'staff')),
      ...students.map(r => mapRow(r, 'student'))
    ];

    res.json({ accounts });
  } catch (err) {
    console.error('Lỗi GET /api/accounts:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Nhân viên / học viên chưa có tài khoản đăng nhập — dùng cho dropdown "Tạo tài khoản"
router.get('/accounts/available-employees', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, ma_nhan_vien, ho_ten, email FROM nhan_vien WHERE tai_khoan_nhan_vien_id IS NULL ORDER BY ho_ten'
    );
    res.json({ employees: rows.map(r => ({ id: r.id, maNhanVien: r.ma_nhan_vien, name: r.ho_ten, email: r.email })) });
  } catch (err) {
    console.error('Lỗi GET /api/accounts/available-employees:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

router.get('/accounts/available-students', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, ma_hoc_vien, ho_ten, email FROM hoc_vien WHERE tai_khoan_hoc_vien_id IS NULL ORDER BY ho_ten'
    );
    res.json({ students: rows.map(r => ({ id: r.id, maHocVien: r.ma_hoc_vien, name: r.ho_ten, email: r.email })) });
  } catch (err) {
    console.error('Lỗi GET /api/accounts/available-students:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/accounts/staff — cấp tài khoản đăng nhập cho 1 nhân viên đã tồn tại
router.post('/accounts/staff', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { nhanVienId, email, username, password } = req.body;
    if (!nhanVienId || !username || !password) {
      conn.release();
      return res.status(400).json({ error: 'Thiếu nhân viên, tên đăng nhập hoặc mật khẩu' });
    }

    const [existing] = await conn.query('SELECT tai_khoan_nhan_vien_id FROM nhan_vien WHERE id = ?', [nhanVienId]);
    if (!existing[0]) { conn.release(); return res.status(404).json({ error: 'Không tìm thấy nhân viên' }); }
    if (existing[0].tai_khoan_nhan_vien_id) { conn.release(); return res.status(409).json({ error: 'Nhân viên này đã có tài khoản' }); }

    const [dup] = await conn.query('SELECT id FROM tai_khoan_nhan_vien WHERE username = ?', [username]);
    if (dup[0]) { conn.release(); return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' }); }

    const hash = await bcrypt.hash(password, 10);
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO tai_khoan_nhan_vien (username, password_hash, trang_thai) VALUES (?, ?, ?)',
      [username, hash, 'Hoạt động']
    );
    if (email) {
      await conn.query('UPDATE nhan_vien SET tai_khoan_nhan_vien_id = ?, email = ? WHERE id = ?', [result.insertId, email, nhanVienId]);
    } else {
      await conn.query('UPDATE nhan_vien SET tai_khoan_nhan_vien_id = ? WHERE id = ?', [result.insertId, nhanVienId]);
    }
    await conn.commit();
    res.status(201).json({ success: true, message: 'Đã tạo tài khoản nhân viên' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi tạo tài khoản nhân viên:', err);
    res.status(500).json({ error: 'Không thể tạo tài khoản: ' + err.message });
  } finally {
    conn.release();
  }
});

// POST /api/accounts/student — cấp tài khoản đăng nhập cho 1 học viên đã tồn tại
router.post('/accounts/student', async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { hocVienId, email, username, password } = req.body;
    if (!hocVienId || !username || !password) {
      conn.release();
      return res.status(400).json({ error: 'Thiếu học viên, tên đăng nhập hoặc mật khẩu' });
    }

    const [existing] = await conn.query('SELECT tai_khoan_hoc_vien_id FROM hoc_vien WHERE id = ?', [hocVienId]);
    if (!existing[0]) { conn.release(); return res.status(404).json({ error: 'Không tìm thấy học viên' }); }
    if (existing[0].tai_khoan_hoc_vien_id) { conn.release(); return res.status(409).json({ error: 'Học viên này đã có tài khoản' }); }

    const [dup] = await conn.query('SELECT id FROM tai_khoan_hoc_vien WHERE username = ?', [username]);
    if (dup[0]) { conn.release(); return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' }); }

    const hash = await bcrypt.hash(password, 10);
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO tai_khoan_hoc_vien (username, password_hash, trang_thai) VALUES (?, ?, ?)',
      [username, hash, 'Hoạt động']
    );
    if (email) {
      await conn.query('UPDATE hoc_vien SET tai_khoan_hoc_vien_id = ?, email = ? WHERE id = ?', [result.insertId, email, hocVienId]);
    } else {
      await conn.query('UPDATE hoc_vien SET tai_khoan_hoc_vien_id = ? WHERE id = ?', [result.insertId, hocVienId]);
    }
    await conn.commit();
    res.status(201).json({ success: true, message: 'Đã tạo tài khoản học viên' });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi tạo tài khoản học viên:', err);
    res.status(500).json({ error: 'Không thể tạo tài khoản: ' + err.message });
  } finally {
    conn.release();
  }
});

router.post('/accounts/:accountType/:accountId/reset-password', async (req, res) => {
  try {
    const table = ACCOUNT_TABLES[req.params.accountType];
    if (!table) return res.status(400).json({ error: 'Loại tài khoản không hợp lệ' });
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [hash, req.params.accountId]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    res.json({ success: true, message: 'Đã đặt lại mật khẩu' });
  } catch (err) {
    console.error('Lỗi reset mật khẩu:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/accounts/:accountType/:accountId/toggle-lock', async (req, res) => {
  try {
    const table = ACCOUNT_TABLES[req.params.accountType];
    if (!table) return res.status(400).json({ error: 'Loại tài khoản không hợp lệ' });

    const [rows] = await db.query(`SELECT trang_thai FROM ${table} WHERE id = ?`, [req.params.accountId]);
    if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

    const next = rows[0].trang_thai === 'Khóa' ? 'Hoạt động' : 'Khóa';
    await db.query(`UPDATE ${table} SET trang_thai = ? WHERE id = ?`, [next, req.params.accountId]);
    res.json({ success: true, status: next });
  } catch (err) {
    console.error('Lỗi khóa/mở khóa tài khoản:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
