const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { DEPARTMENTS, computeXepLoai } = require('../lib/competency');

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

// GET /api/overview
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) as totalStudents FROM hoc_vien');
    const [[{ activeEmployees }]] = await db.query("SELECT COUNT(*) as activeEmployees FROM nhan_vien WHERE trang_thai = 'Đang làm việc'");
    const [[{ totalProjects }]] = await db.query('SELECT COUNT(*) as totalProjects FROM du_an');
    const [[{ totalCollaborators }]] = await db.query('SELECT COUNT(*) as totalCollaborators FROM cong_tac_vien');
    const [[{ totalCompetencyExams }]] = await db.query('SELECT COUNT(*) as totalCompetencyExams FROM de_thi');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(tien_da_dong), 0) as totalRevenue FROM hoc_vien');
    const [[{ totalCustomers }]] = await db.query('SELECT COUNT(*) as totalCustomers FROM khach_hang');
    const [[{ unassignedCustomers }]] = await db.query('SELECT COUNT(*) as unassignedCustomers FROM khach_hang WHERE nhan_vien_id IS NULL');

    const [recentStudents] = await db.query(`
      SELECT
        id,
        ma_hoc_vien as maHV,
        ho_ten as name,
        email,
        so_dien_thoai as phone,
        que_quan as hometown,
        quoc_gia_den as country,
        trang_thai_ho_so as statusText,
        lo_trinh as program,
        IFNULL(DATE_FORMAT(ngay_nhap_hoc, '%d/%m/%Y'), DATE_FORMAT(created_at, '%d/%m/%Y')) as ngayNhapHoc,
        IFNULL(tien_da_dong, 0) as tienDaDong,
        IFNULL(tong_tien, 0) as tongTien,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM hoc_vien
      ORDER BY id DESC
      LIMIT 6
    `);

    // Phân bố học viên theo quốc gia (cho biểu đồ tròn)
    const [countryRows] = await db.query(`
      SELECT COALESCE(quoc_gia_den, 'Chưa xác định') as country, COUNT(*) as count
      FROM hoc_vien
      GROUP BY COALESCE(quoc_gia_den, 'Chưa xác định')
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
        id,
        ma_hoc_vien as maHV,
        ho_ten as name,
        email,
        so_dien_thoai as phone,
        que_quan as hometown,
        quoc_gia_den as country,
        trang_thai_ho_so as statusText,
        lo_trinh as program,
        IFNULL(DATE_FORMAT(ngay_nhap_hoc, '%Y-%m-%d'), '') as ngayNhapHocRaw,
        IFNULL(DATE_FORMAT(ngay_nhap_hoc, '%d/%m/%Y'), DATE_FORMAT(created_at, '%d/%m/%Y')) as ngayNhapHoc,
        nhan_vien_id as nhanVienId,
        IFNULL(tien_da_dong, 0) as tienDaDong,
        IFNULL(tong_tien, 0) as tongTien,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM hoc_vien
      ORDER BY id DESC
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
    const [rows] = await db.query(`
      SELECT 
        h.id,
        h.ma_hoc_vien as maHV,
        h.ho_ten as name,
        h.email,
        h.so_dien_thoai as phone,
        h.que_quan as hometown,
        h.quoc_gia_den as country,
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
      WHERE h.ma_hoc_vien = ? OR h.id = ?
    `, [targetId, targetId]);

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

// POST /api/students (Thêm học viên)
router.post('/students', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      hometown,
      country,
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
      (ho_ten, email, so_dien_thoai, que_quan, quoc_gia_den, trang_thai_ho_so, lo_trinh, ngay_nhap_hoc, tien_da_dong, tong_tien, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name,
      email || null,
      phone || null,
      hometown || null,
      country || 'Nhật Bản',
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
      hometown,
      country,
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
      hometown || null,
      country || 'Nhật Bản',
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
        que_quan = ?,
        quoc_gia_den = ?,
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
        id,
        ma_nhan_vien as maNV,
        ho_ten as name,
        so_dien_thoai as phone,
        email,
        IFNULL(DATE_FORMAT(ngay_sinh, '%Y-%m-%d'), '') as ngaySinhRaw,
        IFNULL(DATE_FORMAT(ngay_sinh, '%d/%m/%Y'), 'Chưa cập nhật') as ngaySinh,
        bo_phan as department,
        chuc_danh as role,
        IFNULL(DATE_FORMAT(ngay_vao_lam, '%Y-%m-%d'), '') as startDateRaw,
        IFNULL(DATE_FORMAT(ngay_vao_lam, '%d/%m/%Y'), '01/01/2025') as startDate,
        hinh_thuc as workType,
        trang_thai as statusText,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM nhan_vien
      ORDER BY id ASC
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
        id,
        ma_nhan_vien as maNV,
        ho_ten as name,
        so_dien_thoai as phone,
        email,
        IFNULL(DATE_FORMAT(ngay_sinh, '%d/%m/%Y'), '15/08/1995') as dob,
        bo_phan as department,
        chuc_danh as role,
        IFNULL(DATE_FORMAT(ngay_vao_lam, '%d/%m/%Y'), '01/01/2025') as startDate,
        hinh_thuc as workType,
        trang_thai as statusText,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM nhan_vien
      WHERE ma_nhan_vien = ? ${isNumericId ? 'OR id = ?' : ''}
    `, isNumericId ? [targetId, targetId] : [targetId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }
    const emp = rows[0];

    // Lấy danh sách học viên do nhân viên này đảm nhận
    const [assignedStudents] = await db.query(`
      SELECT 
        id,
        ma_hoc_vien as maHV,
        ho_ten as name,
        quoc_gia_den as country,
        trang_thai_ho_so as statusText,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), '21/08/2026') as createdAt
      FROM hoc_vien
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
      department,
      role,
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
      (ho_ten, email, so_dien_thoai, bo_phan, chuc_danh, hinh_thuc, trang_thai, ngay_vao_lam, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      name,
      email || null,
      phone || null,
      department || 'Kinh doanh',
      role || 'Chuyên viên tư vấn',
      workType || 'Chính thức',
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
      department,
      role,
      workType,
      statusText,
      startDate
    } = req.body;

    const baseParams = [
      name,
      email || null,
      phone || null,
      department || 'Kinh doanh',
      role || 'Chuyên viên tư vấn',
      workType || 'Chính thức',
      statusText || 'Đang làm việc',
      startDate || null
    ];

    const [result] = await db.query(`
      UPDATE nhan_vien
      SET
        ho_ten = ?,
        email = ?,
        so_dien_thoai = ?,
        bo_phan = ?,
        chuc_danh = ?,
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
      SELECT COALESCE(hv.quoc_gia_den, 'Khác') as country, COALESCE(SUM(tt.so_tien),0) as total
      FROM thanh_toan tt
      JOIN hoc_vien hv ON hv.id = tt.hoc_vien_id
      GROUP BY COALESCE(hv.quoc_gia_den, 'Khác')
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
        d.quoc_gia as country,
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
        kh.quoc_gia_quan_tam as country,
        kh.trang_thai as statusText,
        kh.ghi_chu as note,
        kh.created_at as createdAtRaw,
        IFNULL(DATE_FORMAT(kh.created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM khach_hang kh
      LEFT JOIN nhan_vien nv ON nv.id = kh.nhan_vien_id
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
      country: r.country || 'Chưa xác định',
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
    const { name, phone, nhanVienId, ngayDangKy, country, statusText, note } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên khách hàng là bắt buộc' });
    }

    const [result] = await db.query(`
      INSERT INTO khach_hang (ma_kh, ho_ten, so_dien_thoai, nhan_vien_id, ngay_dang_ky, quoc_gia_quan_tam, trang_thai, ghi_chu, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'TEMP',
      name,
      phone || null,
      nhanVienId || null,
      ngayDangKy || null,
      country || null,
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
    const { name, phone, nhanVienId, ngayDangKy, country, statusText, note } = req.body;

    const updateParams = [
      name,
      phone || null,
      nhanVienId || null,
      ngayDangKy || null,
      country || null,
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
        quoc_gia_quan_tam = ?,
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
    const table = role === 'admin' ? 'admin' : 'nhan_vien';
    const [rows] = await db.query(`SELECT password_hash FROM ${table} WHERE id = ?`, [id]);
    const account = rows[0];
    if (!account) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

    const match = await bcrypt.compare(currentPassword, account.password_hash || '');
    if (!match) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [newHash, id]);
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
    const table = role === 'admin' ? 'admin' : 'nhan_vien';
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
        nguoi_gioi_thieu as referrer, trang_thai as statusText, ghi_chu as note,
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
    const { name, phone, referrer, statusText, registeredAt, note } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Tên cộng tác viên là bắt buộc' });
    }
    const [result] = await db.query(`
      INSERT INTO cong_tac_vien (ma_ctv, ho_ten, so_dien_thoai, nguoi_gioi_thieu, trang_thai, ngay_dang_ky, ghi_chu)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, ['TEMP', name, phone || null, referrer || null, statusText || 'Chờ duyệt', registeredAt || null, note || null]);

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
    const { name, phone, referrer, statusText, registeredAt, note } = req.body;
    const [result] = await db.query(`
      UPDATE cong_tac_vien
      SET ho_ten = ?, so_dien_thoai = ?, nguoi_gioi_thieu = ?, trang_thai = ?, ngay_dang_ky = ?, ghi_chu = ?
      WHERE ma_ctv = ? ${isNumericId ? 'OR id = ?' : ''}
    `, isNumericId
      ? [name, phone || null, referrer || null, statusText || 'Chờ duyệt', registeredAt || null, note || null, targetId, targetId]
      : [name, phone || null, referrer || null, statusText || 'Chờ duyệt', registeredAt || null, note || null, targetId]);

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

// ---- Test năng lực nhân viên (competency exams) ----

function mapQuestionRow(q) {
  return {
    id: q.id,
    order: q.thu_tu,
    content: q.noi_dung,
    optionA: q.dap_an_a,
    optionB: q.dap_an_b,
    optionC: q.dap_an_c,
    optionD: q.dap_an_d,
    correctAnswer: q.dap_an_dung
  };
}

// GET /api/competency-exams
router.get('/competency-exams', async (req, res) => {
  try {
    const { department } = req.query;
    const params = [];
    let where = '';
    if (department) { where = 'WHERE d.phong_ban = ?'; params.push(department); }
    const [rows] = await db.query(`
      SELECT
        d.id, d.ten_de as name, d.phong_ban as department, d.trang_thai as status,
        DATE_FORMAT(d.created_at, '%d/%m/%Y') as createdAt,
        (SELECT COUNT(*) FROM cau_hoi_test c WHERE c.de_thi_id = d.id) as questionCount,
        (SELECT COUNT(*) FROM bai_lam_test b WHERE b.de_thi_id = d.id) as attemptCount
      FROM de_thi d
      ${where}
      ORDER BY d.id DESC
    `, params);
    res.json({ exams: rows, departments: DEPARTMENTS });
  } catch (err) {
    console.error('Lỗi lấy danh sách đề thi:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/competency-exams/:id
router.get('/competency-exams/:id', async (req, res) => {
  try {
    const [[exam]] = await db.query(`
      SELECT id, ten_de as name, phong_ban as department, trang_thai as status,
        DATE_FORMAT(created_at, '%d/%m/%Y') as createdAt
      FROM de_thi WHERE id = ?
    `, [req.params.id]);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    const [questions] = await db.query('SELECT * FROM cau_hoi_test WHERE de_thi_id = ? ORDER BY thu_tu ASC, id ASC', [req.params.id]);
    res.json({ exam: { ...exam, questions: questions.map(mapQuestionRow) } });
  } catch (err) {
    console.error('Lỗi lấy chi tiết đề thi:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return 'Đề thi cần ít nhất 1 câu hỏi';
  for (const q of questions) {
    if (!q.content || !q.optionA || !q.optionB || !q.optionC || !q.optionD) return 'Vui lòng nhập đầy đủ nội dung và 4 đáp án cho mỗi câu hỏi';
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) return 'Vui lòng chọn đáp án đúng cho mỗi câu hỏi';
  }
  return null;
}

// POST /api/competency-exams
router.post('/competency-exams', async (req, res) => {
  const { name, department, questions } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tên đề thi là bắt buộc' });
  if (!DEPARTMENTS.includes(department)) return res.status(400).json({ error: 'Phòng ban không hợp lệ' });
  const qError = validateQuestions(questions);
  if (qError) return res.status(400).json({ error: qError });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO de_thi (ten_de, phong_ban, trang_thai, created_by) VALUES (?, ?, ?, ?)',
      [name, department, 'active', req.user?.id || null]
    );
    const examId = result.insertId;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await conn.query(
        'INSERT INTO cau_hoi_test (de_thi_id, thu_tu, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, dap_an_dung) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [examId, i, q.content, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer]
      );
    }
    await conn.commit();
    res.status(201).json({ success: true, message: `Đã tạo đề thi "${name}"!`, examId });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi tạo đề thi:', err);
    res.status(500).json({ error: 'Không thể tạo đề thi: ' + err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/competency-exams/:id
router.put('/competency-exams/:id', async (req, res) => {
  const { name, department, status, questions } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Tên đề thi là bắt buộc' });
  if (!DEPARTMENTS.includes(department)) return res.status(400).json({ error: 'Phòng ban không hợp lệ' });
  const qError = validateQuestions(questions);
  if (qError) return res.status(400).json({ error: qError });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'UPDATE de_thi SET ten_de = ?, phong_ban = ?, trang_thai = ? WHERE id = ?',
      [name, department, status === 'inactive' ? 'inactive' : 'active', req.params.id]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Không tìm thấy đề thi để cập nhật' });
    }
    await conn.query('DELETE FROM cau_hoi_test WHERE de_thi_id = ?', [req.params.id]);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await conn.query(
        'INSERT INTO cau_hoi_test (de_thi_id, thu_tu, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d, dap_an_dung) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, i, q.content, q.optionA, q.optionB, q.optionC, q.optionD, q.correctAnswer]
      );
    }
    await conn.commit();
    res.json({ success: true, message: `Đã cập nhật đề thi "${name}"!` });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi sửa đề thi:', err);
    res.status(500).json({ error: 'Không thể cập nhật đề thi: ' + err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/competency-exams/:id
router.delete('/competency-exams/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM de_thi WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Không tìm thấy đề thi để xóa' });
    res.json({ success: true, message: 'Đã xóa đề thi khỏi CSDL' });
  } catch (err) {
    console.error('Lỗi xóa đề thi:', err);
    res.status(500).json({ error: 'Không thể xóa đề thi: ' + err.message });
  }
});

// GET /api/competency-results
router.get('/competency-results', async (req, res) => {
  try {
    const { department, search } = req.query;
    const params = [];
    const clauses = [];
    if (department) { clauses.push('nv.bo_phan = ?'); params.push(department); }
    if (search && search.trim()) { clauses.push('nv.ho_ten LIKE ?'); params.push(`%${search.trim()}%`); }
    const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        b.id, b.so_cau_dung as correct, b.tong_cau as total,
        DATE_FORMAT(b.ngay_lam, '%d/%m/%Y') as takenAt,
        nv.id as employeeId, nv.ho_ten as employeeName, nv.bo_phan as department,
        d.ten_de as examName
      FROM bai_lam_test b
      JOIN nhan_vien nv ON nv.id = b.nhan_vien_id
      JOIN de_thi d ON d.id = b.de_thi_id
      ${where}
      ORDER BY b.id DESC
    `, params);

    res.json({
      results: rows.map(r => {
        const { label, tier } = computeXepLoai(r.correct, r.total);
        return {
          id: r.id,
          employeeName: r.employeeName,
          department: r.department,
          examName: r.examName,
          correct: r.correct,
          total: r.total,
          takenAt: r.takenAt,
          rating: label,
          ratingTier: tier
        };
      }),
      departments: DEPARTMENTS
    });
  } catch (err) {
    console.error('Lỗi lấy kết quả test năng lực:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;
