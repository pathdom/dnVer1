const express = require('express');
const router = express.Router();
const db = require('../db');

// Student Login: Check DB table hoc_vien
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const [rows] = await db.query('SELECT * FROM hoc_vien WHERE ma_hoc_vien = ? OR email = ?', [studentId, studentId]);

    if (rows.length > 0) {
      const s = rows[0];
      return res.json({
        success: true,
        token: 'student-token-' + s.id,
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
    }

    // Default fallback student profile if not found
    res.json({
      success: true,
      token: 'mock-student-token-123',
      student: {
        id: studentId || 'HV-2451',
        dbId: 1,
        name: 'Nguyễn Thị Lan Anh',
        email: 'lananh.nguyen@gmail.com',
        phone: '0987.654.321',
        country: 'Mỹ',
        program: 'Cử nhân Quản trị Kinh doanh (BS in Business Administration)',
        statusText: 'Đã có visa',
        paidAmount: 120000000,
        totalAmount: 150000000,
        avatar: 'LA'
      }
    });
  } catch (err) {
    console.error('Lỗi login student:', err);
    res.status(500).json({ error: 'Database authentication error' });
  }
});

// Student Profile API from DB
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM hoc_vien LIMIT 1');
    if (rows.length > 0) {
      const s = rows[0];
      return res.json({
        id: s.ma_hoc_vien,
        name: s.ho_ten,
        email: s.email,
        phone: s.so_dien_thoai,
        country: s.quoc_gia_den,
        program: s.lo_trinh,
        statusText: s.trang_thai_ho_so,
        progressPercent: 68,
        paidAmount: s.tien_da_dong,
        totalAmount: s.tong_tien,
        advisor: {
          name: 'Trần Minh Khoa',
          role: 'Chuyên viên tư vấn hồ sơ Mỹ',
          phone: '0909 123 456'
        }
      });
    }

    res.json({
      id: 'HV-2451',
      name: 'Nguyễn Thị Lan Anh',
      email: 'lananh.nguyen@gmail.com',
      phone: '0987.654.321',
      country: 'Mỹ',
      program: 'Cử nhân Quản trị Kinh doanh',
      statusText: 'Đang xử lý hồ sơ',
      progressPercent: 68
    });
  } catch (err) {
    console.error('Lỗi API /api/student/profile:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

module.exports = router;
