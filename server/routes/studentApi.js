const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Student Login: check DB table hoc_vien
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    if (!studentId || !password) {
      return res.status(400).json({ success: false, error: 'Thiếu mã học viên hoặc mật khẩu' });
    }

    const [rows] = await db.query('SELECT * FROM hoc_vien WHERE ma_hoc_vien = ? OR email = ?', [studentId, studentId]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Sai mã học viên hoặc mật khẩu' });
    }

    const s = rows[0];
    const match = await bcrypt.compare(password, s.password_hash || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Sai mã học viên hoặc mật khẩu' });
    }

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
        country: s.quoc_gia_den,
        program: s.lo_trinh,
        statusText: s.trang_thai_ho_so,
        paidAmount: s.tien_da_dong,
        totalAmount: s.tong_tien,
        avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'HV'
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
        nv.ho_ten as advisorName,
        nv.chuc_danh as advisorRole,
        nv.bo_phan as advisorDept,
        nv.so_dien_thoai as advisorPhone
      FROM hoc_vien h
      LEFT JOIN nhan_vien nv ON h.nhan_vien_id = nv.id
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
      country: s.quoc_gia_den,
      program: s.lo_trinh,
      statusText: s.trang_thai_ho_so,
      ngayNhapHoc: s.ngayNhapHocFormatted,
      paidAmount: s.tien_da_dong,
      totalAmount: s.tong_tien,
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

module.exports = router;
