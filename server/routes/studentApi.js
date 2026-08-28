const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
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

// Student Login: hoc_vien holds the profile, tai_khoan_hoc_vien holds the credentials
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) {
      return res.status(400).json({ success: false, error: 'Thiếu mã học viên hoặc mật khẩu' });
    }

    const [rows] = await db.query(`
      SELECT hv.id, hv.ma_hoc_vien, hv.ho_ten, hv.email, hv.so_dien_thoai, hv.avatar_url,
        hv.lo_trinh, hv.trang_thai_ho_so, hv.tien_da_dong, hv.tong_tien,
        qg.ten_quoc_gia as country, tk.id as tkId, tk.password_hash
      FROM hoc_vien hv
      JOIN tai_khoan_hoc_vien tk ON tk.id = hv.tai_khoan_hoc_vien_id
      LEFT JOIN quoc_gia qg ON qg.id = hv.quoc_gia_id
      WHERE hv.ma_hoc_vien = ? OR hv.email = ? OR tk.username = ?
    `, [studentId, studentId, studentId]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Sai mã học viên hoặc mật khẩu' });
    }

    const s = rows[0];
    const match = await verifyPassword(password, s.password_hash || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Sai mã học viên hoặc mật khẩu' });
    }

    await db.query('UPDATE tai_khoan_hoc_vien SET last_login = NOW() WHERE id = ?', [s.tkId]);

    const token = jwt.sign({ id: s.id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      student: {
        id: s.ma_hoc_vien || 'HV-' + s.id,
        dbId: s.id,
        name: s.ho_ten,
        email: s.email,
        phone: s.so_dien_thoai,
        country: s.country,
        program: s.lo_trinh,
        statusText: s.trang_thai_ho_so,
        paidAmount: s.tien_da_dong,
        totalAmount: s.tong_tien,
        avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV',
        avatarUrl: s.avatar_url || null
      }
    });
  } catch (err) {
    console.error('Lỗi login student:', err);
    res.status(500).json({ error: 'Database authentication error' });
  }
});

router.use(requireAuth('student'));

// Student Profile API from DB — scoped to the logged-in student
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        h.*,
        IFNULL(DATE_FORMAT(h.ngay_nhap_hoc, '%d/%m/%Y'), '') as ngayNhapHocFormatted,
        qg.ten_quoc_gia as country,
        nv.ho_ten as advisorName,
        cd.ten_chuc_danh as advisorRole,
        bp.ten_bo_phan as advisorDept,
        nv.so_dien_thoai as advisorPhone
      FROM hoc_vien h
      LEFT JOIN nhan_vien nv ON h.nhan_vien_id = nv.id
      LEFT JOIN quoc_gia qg ON qg.id = h.quoc_gia_id
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      WHERE h.id = ?
    `, [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy học viên' });
    }

    const s = rows[0];
    res.json({
      id: s.ma_hoc_vien,
      name: s.ho_ten,
      email: s.email,
      phone: s.so_dien_thoai,
      country: s.country,
      program: s.lo_trinh,
      statusText: s.trang_thai_ho_so,
      ngayNhapHoc: s.ngayNhapHocFormatted,
      paidAmount: s.tien_da_dong,
      totalAmount: s.tong_tien,
      avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV',
      avatarUrl: s.avatar_url || null,
      advisor: s.advisorName ? {
        name: s.advisorName,
        role: s.advisorRole || s.advisorDept || 'Tư vấn viên phụ trách',
        phone: s.advisorPhone
      } : null
    });
  } catch (err) {
    console.error('Lỗi API /api/student/profile:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// GET /api/student/grades — bảng điểm 3 học kỳ x 5 kỹ năng của chính học viên
const GRADE_SKILLS = [
  { col: 'Từ vựng', key: 'tuVung' },
  { col: 'Ngữ pháp', key: 'nguPhap' },
  { col: 'Hán tự', key: 'hanTu' },
  { col: 'Nghe', key: 'nghe' },
  { col: 'Hội thoại', key: 'hoiThoai' }
];
router.get('/grades', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT thang, ky_nang, diem FROM bang_diem WHERE hoc_vien_id = ?',
      [req.user.id]
    );
    const grades = { thang1: {}, thang2: {}, thang3: {}, thang4: {}, thang5: {}, thang6: {} };
    for (const r of rows) {
      const skill = GRADE_SKILLS.find(s => s.col === r.ky_nang);
      if (skill) grades[`thang${r.thang}`][skill.key] = Number(r.diem);
    }
    res.json({ grades });
  } catch (err) {
    console.error('Lỗi API /api/student/grades:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// POST /api/student/change-password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const [rows] = await db.query(
      'SELECT tk.id as tkId, tk.password_hash FROM hoc_vien hv JOIN tai_khoan_hoc_vien tk ON tk.id = hv.tai_khoan_hoc_vien_id WHERE hv.id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

    const match = await verifyPassword(currentPassword, rows[0].password_hash || '');
    if (!match) return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE tai_khoan_hoc_vien SET password_hash = ? WHERE id = ?', [newHash, rows[0].tkId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi đổi mật khẩu học viên:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// POST /api/student/upload-avatar
router.post('/upload-avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Vui lòng chọn một ảnh' });
    const avatarUrl = '/uploads/avatars/' + req.file.filename;
    await db.query('UPDATE hoc_vien SET avatar_url = ? WHERE id = ?', [avatarUrl, req.user.id]);
    res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Lỗi tải ảnh đại diện học viên:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
