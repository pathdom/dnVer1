const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');

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

// GET /api/overview
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) as totalStudents FROM hoc_vien');
    const [[{ activeEmployees }]] = await db.query("SELECT COUNT(*) as activeEmployees FROM nhan_vien WHERE trang_thai = 'Đang làm việc'");
    const [[{ totalProjects }]] = await db.query('SELECT COUNT(*) as totalProjects FROM du_an');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(tien_da_dong), 0) as totalRevenue FROM hoc_vien');
    const [[{ totalCustomers }]] = await db.query('SELECT COUNT(*) as totalCustomers FROM khach_hang');

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

    res.json({
      stats: {
        totalStudents,
        activeEmployees,
        partnerSchools: totalProjects,
        totalCustomers,
        revenue: formatVND(totalRevenue)
      },
      recentStudents: recentStudents.map(s => ({
        ...s,
        id: s.maHV || 'HV' + String(s.id).padStart(3, '0'),
        tienDaDongFormatted: formatVND(s.tienDaDong),
        tongTienFormatted: formatVND(s.tongTien),
        avatar: s.name ? s.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV'
      }))
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

    const [beforeRows] = await db.query('SELECT id, tien_da_dong FROM hoc_vien WHERE ma_hoc_vien = ? OR id = ?', [targetId, targetId]);
    const before = beforeRows[0];

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
      WHERE ma_hoc_vien = ? OR id = ?
    `, [
      name,
      email || null,
      phone || null,
      hometown || null,
      country || 'Nhật Bản',
      statusText || 'Đang học tiếng',
      ngayNhapHoc || null,
      Number(tienDaDong) || 0,
      Number(tongTien) || 0,
      targetId,
      targetId
    ]);

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
    const [result] = await db.query('DELETE FROM hoc_vien WHERE ma_hoc_vien = ? OR id = ?', [targetId, targetId]);

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
      WHERE ma_nhan_vien = ? OR id = ?
    `, [targetId, targetId]);

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
      department || 'Tư vấn tuyển sinh',
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
      WHERE ma_nhan_vien = ? OR id = ?
    `, [
      name,
      email || null,
      phone || null,
      department || 'Tư vấn tuyển sinh',
      role || 'Chuyên viên tư vấn',
      workType || 'Chính thức',
      statusText || 'Đang làm việc',
      startDate || null,
      targetId,
      targetId
    ]);

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
    const [result] = await db.query('DELETE FROM nhan_vien WHERE ma_nhan_vien = ? OR id = ?', [targetId, targetId]);

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
    const { name, phone, nhanVienId, ngayDangKy, country, statusText, note } = req.body;

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
      WHERE ma_kh = ? OR id = ?
    `, [
      name,
      phone || null,
      nhanVienId || null,
      ngayDangKy || null,
      country || null,
      statusText || 'Mới tiếp nhận',
      note || null,
      targetId,
      targetId
    ]);

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
    const [result] = await db.query('DELETE FROM khach_hang WHERE ma_kh = ? OR id = ?', [targetId, targetId]);

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

module.exports = router;
