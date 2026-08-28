const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyPassword } = require('../lib/password');

// Admin Login: check DB table `tai_khoan_admin`
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
    }

    const [rows] = await db.query('SELECT * FROM tai_khoan_admin WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const a = rows[0];
    const match = await verifyPassword(password, a.password_hash || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    await db.query('UPDATE tai_khoan_admin SET last_login = NOW() WHERE id = ?', [a.id]);

    const token = jwt.sign({ id: a.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      admin: {
        id: a.id,
        username: a.username,
        name: a.ho_ten,
        role: a.vai_tro,
        email: a.email,
        avatar: a.ho_ten ? a.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'AD',
        avatarUrl: a.avatar_url || null
      }
    });
  } catch (err) {
    console.error('Lỗi login admin:', err);
    res.status(500).json({ error: 'Database authentication error' });
  }
});

module.exports = router;
