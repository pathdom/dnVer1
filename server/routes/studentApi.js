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

// GET /api/student/grades?loai=tuan|thang — bảng điểm của chính học viên (read-only)
router.get('/grades', async (req, res) => {
  try {
    const loai = req.query.loai === 'thang' ? 'thang' : 'tuan';
    const [rows] = await db.query(
      'SELECT id, nhan, thu_tu, diem_tu_vung, diem_ngu_phap, diem_han_tu, diem_nghe, diem_hoi_thoai FROM bang_diem_ky WHERE hoc_vien_id = ? AND loai = ? ORDER BY thu_tu',
      [req.user.id, loai]
    );
    res.json({ rows });
  } catch (err) {
    console.error('Lỗi API /api/student/grades:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// GET /api/student/personal-profile — hồ sơ cá nhân tự khai của chính học viên
router.get('/personal-profile', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT *, DATE_FORMAT(ngay_cap_cccd, '%Y-%m-%d') as ngay_cap_cccd FROM ho_so_ca_nhan WHERE hoc_vien_id = ?",
      [req.user.id]
    );
    const [family] = await db.query(
      'SELECT id, quan_he, ho_ten, nam_sinh, nghe_nghiep FROM ho_so_gia_dinh WHERE hoc_vien_id = ? ORDER BY id',
      [req.user.id]
    );
    res.json({ profile: rows[0] || null, family });
  } catch (err) {
    console.error('Lỗi GET /api/student/personal-profile:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// PUT /api/student/personal-profile — học viên tự lưu hồ sơ cá nhân (upsert)
router.put('/personal-profile', async (req, res) => {
  try {
    const p = req.body.profile || {};
    const family = Array.isArray(req.body.family) ? req.body.family : [];

    await db.query(`
      INSERT INTO ho_so_ca_nhan (
        hoc_vien_id, so_cccd, ngay_cap_cccd, gioi_tinh, ton_giao, dan_toc, tinh_trang_hon_nhan,
        ho_khau_thuong_tru, noi_tam_tru, sdt_nguoi_than,
        truong_tieu_hoc, tieu_hoc_tu, tieu_hoc_den,
        truong_trung_hoc, trung_hoc_tu, trung_hoc_den,
        truong_thpt, thpt_tu, thpt_den,
        truong_cd_dh, cd_dh_tu, cd_dh_den,
        lich_su_lam_viec, diem_manh, diem_yeu, ly_do_sang_nhat, so_thich
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        so_cccd = VALUES(so_cccd), ngay_cap_cccd = VALUES(ngay_cap_cccd), gioi_tinh = VALUES(gioi_tinh),
        ton_giao = VALUES(ton_giao), dan_toc = VALUES(dan_toc), tinh_trang_hon_nhan = VALUES(tinh_trang_hon_nhan),
        ho_khau_thuong_tru = VALUES(ho_khau_thuong_tru), noi_tam_tru = VALUES(noi_tam_tru), sdt_nguoi_than = VALUES(sdt_nguoi_than),
        truong_tieu_hoc = VALUES(truong_tieu_hoc), tieu_hoc_tu = VALUES(tieu_hoc_tu), tieu_hoc_den = VALUES(tieu_hoc_den),
        truong_trung_hoc = VALUES(truong_trung_hoc), trung_hoc_tu = VALUES(trung_hoc_tu), trung_hoc_den = VALUES(trung_hoc_den),
        truong_thpt = VALUES(truong_thpt), thpt_tu = VALUES(thpt_tu), thpt_den = VALUES(thpt_den),
        truong_cd_dh = VALUES(truong_cd_dh), cd_dh_tu = VALUES(cd_dh_tu), cd_dh_den = VALUES(cd_dh_den),
        lich_su_lam_viec = VALUES(lich_su_lam_viec), diem_manh = VALUES(diem_manh), diem_yeu = VALUES(diem_yeu),
        ly_do_sang_nhat = VALUES(ly_do_sang_nhat), so_thich = VALUES(so_thich)
    `, [
      req.user.id,
      p.so_cccd || null, p.ngay_cap_cccd || null, p.gioi_tinh || null, p.ton_giao || null, p.dan_toc || null, p.tinh_trang_hon_nhan || null,
      p.ho_khau_thuong_tru || null, p.noi_tam_tru || null, p.sdt_nguoi_than || null,
      p.truong_tieu_hoc || null, p.tieu_hoc_tu || null, p.tieu_hoc_den || null,
      p.truong_trung_hoc || null, p.trung_hoc_tu || null, p.trung_hoc_den || null,
      p.truong_thpt || null, p.thpt_tu || null, p.thpt_den || null,
      p.truong_cd_dh || null, p.cd_dh_tu || null, p.cd_dh_den || null,
      p.lich_su_lam_viec || null, p.diem_manh || null, p.diem_yeu || null, p.ly_do_sang_nhat || null, p.so_thich || null
    ]);

    // Đơn giản & an toàn: xóa hết thành viên cũ rồi thêm lại toàn bộ danh sách mới
    await db.query('DELETE FROM ho_so_gia_dinh WHERE hoc_vien_id = ?', [req.user.id]);
    for (const m of family) {
      if (!m || !m.ho_ten || !m.ho_ten.trim()) continue;
      await db.query(
        'INSERT INTO ho_so_gia_dinh (hoc_vien_id, quan_he, ho_ten, nam_sinh, nghe_nghiep) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, m.quan_he || 'Khác', m.ho_ten.trim(), m.nam_sinh || null, m.nghe_nghiep || null]
      );
    }

    res.json({ success: true, message: 'Đã lưu hồ sơ cá nhân' });
  } catch (err) {
    console.error('Lỗi PUT /api/student/personal-profile:', err);
    res.status(500).json({ error: 'Không thể lưu hồ sơ cá nhân: ' + err.message });
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
