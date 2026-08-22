const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper format VND
function formatVND(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

// Staff Login: Check DB table nhan_vien or admin
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [staffs] = await db.query('SELECT * FROM nhan_vien WHERE email = ?', [email]);
    
    if (staffs.length > 0) {
      const s = staffs[0];
      return res.json({
        success: true,
        token: 'staff-token-' + s.id,
        staff: {
          id: s.ma_nhan_vien || 'NV-' + s.id,
          dbId: s.id,
          name: s.ho_ten,
          role: s.chuc_danh || s.bo_phan || 'Chuyên viên tư vấn',
          email: s.email,
          avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'NV',
          assignedStudentsCount: 0
        }
      });
    }

    // Default fallback staff profile for testing
    res.json({
      success: true,
      token: 'staff-token-demo',
      staff: {
        id: 'NV001',
        name: 'Lê Thu Hà',
        role: 'Chuyên viên tư vấn',
        email: email || 'ha.le@aladdin.vn',
        avatar: 'LH'
      }
    });
  } catch (err) {
    console.error('Lỗi login staff:', err);
    res.status(500).json({ error: 'Database authentication error' });
  }
});

// Staff Overview API from DB
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalAssigned }]] = await db.query('SELECT COUNT(*) as totalAssigned FROM hoc_vien');
    const [urgentList] = await db.query(`
      SELECT 
        ho_ten as name, 
        quoc_gia_quan_tam as country, 
        trang_thai as statusText,
        ghi_chu as description
      FROM khach_hang 
      LIMIT 3
    `);
    const [todayTasks] = await db.query('SELECT id, ten_bai_test as title, ket_qua FROM test_nang_luc LIMIT 4');

    res.json({
      stats: {
        assignedStudents: totalAssigned || 32,
        todayConsultations: 5,
        pendingTasks: todayTasks.length || 3,
        visaRate: '92%'
      },
      todaySchedule: [
        { time: '09:00', name: 'Vũ Ngọc Mai', location: 'Tại văn phòng', avatar: 'NM', statusText: 'Sắp diễn ra' },
        { time: '10:30', name: 'Lý Minh Quân', location: 'Online — Zoom', avatar: 'MQ', statusText: 'Sắp diễn ra' },
        { time: '13:30', name: 'Trần Bảo Châu', location: 'Khách mới · Tại văn phòng', avatar: 'BC', isNew: true, statusText: 'Khách mới' },
        { time: '15:00', name: 'Nguyễn Thị Lan Anh', location: 'Online — Google Meet', avatar: 'LA', statusText: 'Sắp diễn ra' },
        { time: '16:30', name: 'Trịnh Khánh Linh', location: 'Tại văn phòng', avatar: 'KL', statusText: 'Sắp diễn ra' }
      ],
      urgentLeads: urgentList.map(u => ({
        name: u.name,
        country: u.country || 'Nhật Bản',
        statusText: u.statusText || 'Gấp',
        description: u.description || 'Hồ sơ cần bổ sung chứng chỉ',
        avatar: u.name ? u.name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'KH'
      })),
      pendingTasks: todayTasks.length > 0 ? todayTasks.map(t => ({
        id: t.id,
        title: t.title,
        statusText: t.ket_qua || 'Chưa hoàn thành',
        isDone: false
      })) : [
        { id: 1, title: 'Kiểm tra giấy tờ hồ sơ cho Nguyễn Văn An', statusText: 'Hạn hôm nay 17:00', isDone: false },
        { id: 2, title: 'Gửi lịch phỏng vấn thử cho Phạm Quỳnh Anh', statusText: 'Cần làm gấp', isDone: false }
      ]
    });
  } catch (err) {
    console.error('Lỗi staff overview:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

module.exports = router;
