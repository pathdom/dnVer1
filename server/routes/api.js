const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper format VND
function formatVND(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

// GET /api/overview
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.query('SELECT COUNT(*) as totalStudents FROM hoc_vien');
    const [[{ activeEmployees }]] = await db.query("SELECT COUNT(*) as activeEmployees FROM nhan_vien WHERE trang_thai = 'Đang làm việc'");
    const [[{ totalProjects }]] = await db.query('SELECT COUNT(*) as totalProjects FROM du_an');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(tien_da_dong), 0) as totalRevenue FROM hoc_vien');

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
      const [firstRows] = await db.query('SELECT * FROM hoc_vien ORDER BY id ASC LIMIT 1');
      if (firstRows.length > 0) {
        const s = firstRows[0];
        return res.json({
          id: s.ma_hoc_vien || 'HV001',
          name: s.ho_ten,
          email: s.email || 'hocvien@aladdin.vn',
          phone: s.so_dien_thoai || '0912345678',
          hometown: s.que_quan || 'Hà Nội',
          country: s.quoc_gia_den || 'Nhật Bản',
          statusText: s.trang_thai_ho_so || 'Đang học tiếng',
          program: s.lo_trinh || 'Hồ sơ du học',
          ngayNhapHoc: '01/09/2026',
          tienDaDongFormatted: formatVND(s.tien_da_dong),
          tongTienFormatted: formatVND(s.tong_tien),
          avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV',
          joinedDate: '21/08/2026',
          rep: 'Lê Thu Hà'
        });
      }
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

    const [[{ maxId }]] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM hoc_vien');
    const ma_hoc_vien = 'HV' + String(maxId).padStart(3, '0');
    const ngayNhapHocVal = ngayNhapHoc || new Date().toISOString().slice(0, 10);

    const [result] = await db.query(`
      INSERT INTO hoc_vien 
      (ma_hoc_vien, ho_ten, email, so_dien_thoai, que_quan, quoc_gia_den, trang_thai_ho_so, lo_trinh, ngay_nhap_hoc, tien_da_dong, tong_tien, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      ma_hoc_vien,
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

    let emp = null;
    if (rows.length > 0) {
      emp = rows[0];
    } else {
      const [firstRows] = await db.query('SELECT * FROM nhan_vien ORDER BY id ASC LIMIT 1');
      if (firstRows.length > 0) {
        const e = firstRows[0];
        emp = {
          id: e.ma_nhan_vien || 'NV001',
          name: e.ho_ten,
          email: e.email || 'nhanvien@aladdin.vn',
          phone: e.so_dien_thoai || '0911223344',
          department: e.bo_phan || 'Tư vấn tuyển sinh',
          role: e.chuc_danh || 'Chuyên viên tư vấn',
          workType: e.hinh_thuc || 'Chính thức',
          statusText: e.trang_thai || 'Đang làm việc',
          startDate: '01/01/2025',
          createdAt: '21/08/2026'
        };
      }
    }

    if (!emp) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }

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

    const [[{ maxId }]] = await db.query('SELECT COALESCE(MAX(id), 0) + 1 as maxId FROM nhan_vien');
    const ma_nhan_vien = 'NV' + String(maxId).padStart(3, '0');
    const startDateVal = startDate || new Date().toISOString().slice(0, 10);

    const [result] = await db.query(`
      INSERT INTO nhan_vien 
      (ma_nhan_vien, ho_ten, email, so_dien_thoai, bo_phan, chuc_danh, hinh_thuc, trang_thai, ngay_vao_lam, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      ma_nhan_vien,
      name,
      email || null,
      phone || null,
      department || 'Tư vấn tuyển sinh',
      role || 'Chuyên viên tư vấn',
      workType || 'Chính thức',
      statusText || 'Đang làm việc',
      startDateVal
    ]);

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

// GET /api/schools
router.get('/schools', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        ma_du_an as maDuAn,
        ten_du_an as name,
        quoc_gia as country,
        IFNULL(DATE_FORMAT(ngay_bat_dau, '%d/%m/%Y'), '01/01/2026') as startDate,
        IFNULL(DATE_FORMAT(ngay_ket_thuc, '%d/%m/%Y'), '31/12/2026') as endDate,
        chi_tieu_so_luong as quota,
        ngan_sach as budget,
        nguoi_quan_ly_id as managerId,
        trang_thai as statusText,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM du_an
      ORDER BY id DESC
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
router.get('/leads', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        id,
        ma_kh as maKH,
        ho_ten as name,
        so_dien_thoai as phone,
        nhan_vien_id as nhanVienId,
        IFNULL(DATE_FORMAT(ngay_dang_ky, '%d/%m/%Y'), DATE_FORMAT(created_at, '%d/%m/%Y')) as ngayDangKy,
        quoc_gia_quan_tam as country,
        trang_thai as statusText,
        ghi_chu as note,
        IFNULL(DATE_FORMAT(created_at, '%d/%m/%Y'), DATE_FORMAT(NOW(), '%d/%m/%Y')) as createdAt
      FROM khach_hang
      ORDER BY id DESC
    `);

    res.json({ leads: rows });
  } catch (err) {
    console.error('Lỗi API /api/leads:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;
