const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { computeXepLoai } = require('../lib/competency');

// Staff Login: check DB table nhan_vien
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Thiếu email hoặc mật khẩu' });
    }

    const [staffs] = await db.query('SELECT * FROM nhan_vien WHERE email = ?', [email]);
    if (staffs.length === 0) {
      return res.status(401).json({ success: false, error: 'Sai email hoặc mật khẩu' });
    }

    const s = staffs[0];
    const match = await bcrypt.compare(password, s.password_hash || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Sai email hoặc mật khẩu' });
    }

    const token = jwt.sign({ id: s.id, role: 'staff' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      staff: {
        id: s.ma_nhan_vien || 'NV-' + s.id,
        dbId: s.id,
        name: s.ho_ten,
        role: s.chuc_danh || s.bo_phan || 'Chuyên viên tư vấn',
        email: s.email,
        avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'NV',
        avatarUrl: s.avatar_url || null,
        assignedStudentsCount: 0
      }
    });
  } catch (err) {
    console.error('Lỗi login staff:', err);
    res.status(500).json({ error: 'Database authentication error' });
  }
});

router.use(requireAuth('staff'));

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

// ---- Test năng lực nhân viên (competency exams, staff side) ----

// GET /api/staff/competency-exams
router.get('/competency-exams', async (req, res) => {
  try {
    const [[me]] = await db.query('SELECT bo_phan FROM nhan_vien WHERE id = ?', [req.user.id]);
    const department = me?.bo_phan || null;
    if (!department) return res.json({ exams: [], department: null });

    const [rows] = await db.query(`
      SELECT
        d.id, d.ten_de as name,
        (SELECT COUNT(*) FROM cau_hoi_test c WHERE c.de_thi_id = d.id) as questionCount,
        b.so_cau_dung as correct, b.tong_cau as total,
        DATE_FORMAT(b.ngay_lam, '%d/%m/%Y') as takenAt
      FROM de_thi d
      LEFT JOIN bai_lam_test b ON b.de_thi_id = d.id AND b.nhan_vien_id = ?
      WHERE d.phong_ban = ? AND d.trang_thai = 'active'
      ORDER BY d.id DESC
    `, [req.user.id, department]);

    res.json({
      department,
      exams: rows.map(r => {
        const completed = r.total !== null;
        const rating = completed ? computeXepLoai(r.correct, r.total) : null;
        return {
          id: r.id,
          name: r.name,
          questionCount: r.questionCount,
          completed,
          correct: r.correct,
          total: r.total,
          takenAt: r.takenAt,
          rating: rating?.label || null,
          ratingTier: rating?.tier || null
        };
      })
    });
  } catch (err) {
    console.error('Lỗi lấy danh sách đề thi cho nhân viên:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/staff/competency-exams/:id
router.get('/competency-exams/:id', async (req, res) => {
  try {
    const [[me]] = await db.query('SELECT bo_phan FROM nhan_vien WHERE id = ?', [req.user.id]);
    const [[exam]] = await db.query('SELECT id, ten_de as name, phong_ban as department, trang_thai as status FROM de_thi WHERE id = ?', [req.params.id]);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    if (exam.status !== 'active') return res.status(403).json({ error: 'Đề thi này hiện không hoạt động' });
    if (!me?.bo_phan || me.bo_phan !== exam.department) return res.status(403).json({ error: 'Đề thi không thuộc phòng ban của bạn' });

    const [[existing]] = await db.query('SELECT id FROM bai_lam_test WHERE de_thi_id = ? AND nhan_vien_id = ?', [req.params.id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Bạn đã hoàn thành bài test này rồi' });

    const [questions] = await db.query('SELECT id, thu_tu, noi_dung, dap_an_a, dap_an_b, dap_an_c, dap_an_d FROM cau_hoi_test WHERE de_thi_id = ? ORDER BY thu_tu ASC, id ASC', [req.params.id]);
    res.json({
      exam: {
        id: exam.id,
        name: exam.name,
        questions: questions.map(q => ({
          id: q.id, order: q.thu_tu, content: q.noi_dung,
          optionA: q.dap_an_a, optionB: q.dap_an_b, optionC: q.dap_an_c, optionD: q.dap_an_d
        }))
      }
    });
  } catch (err) {
    console.error('Lỗi lấy đề thi cho nhân viên:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/staff/competency-exams/:id/submit
router.post('/competency-exams/:id/submit', async (req, res) => {
  const { answers } = req.body;
  if (!answers || typeof answers !== 'object') return res.status(400).json({ error: 'Thiếu dữ liệu bài làm' });

  const conn = await db.getConnection();
  try {
    const [[me]] = await conn.query('SELECT bo_phan FROM nhan_vien WHERE id = ?', [req.user.id]);
    const [[exam]] = await conn.query('SELECT id, phong_ban as department, trang_thai as status FROM de_thi WHERE id = ?', [req.params.id]);
    if (!exam) return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    if (exam.status !== 'active') return res.status(403).json({ error: 'Đề thi này hiện không hoạt động' });
    if (!me?.bo_phan || me.bo_phan !== exam.department) return res.status(403).json({ error: 'Đề thi không thuộc phòng ban của bạn' });

    const [[existing]] = await conn.query('SELECT id FROM bai_lam_test WHERE de_thi_id = ? AND nhan_vien_id = ?', [req.params.id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Bạn đã hoàn thành bài test này rồi' });

    const [questions] = await conn.query('SELECT id, dap_an_dung FROM cau_hoi_test WHERE de_thi_id = ?', [req.params.id]);
    if (questions.length === 0) return res.status(400).json({ error: 'Đề thi chưa có câu hỏi' });

    let correctCount = 0;
    const details = questions.map(q => {
      const chosen = answers[q.id] || null;
      const isCorrect = chosen === q.dap_an_dung;
      if (isCorrect) correctCount++;
      return { questionId: q.id, chosen, isCorrect };
    });

    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO bai_lam_test (de_thi_id, nhan_vien_id, so_cau_dung, tong_cau, ngay_lam) VALUES (?, ?, ?, ?, NOW())',
      [req.params.id, req.user.id, correctCount, questions.length]
    );
    const attemptId = result.insertId;
    for (const d of details) {
      await conn.query(
        'INSERT INTO bai_lam_chi_tiet (bai_lam_id, cau_hoi_id, dap_an_chon, dung_sai) VALUES (?, ?, ?, ?)',
        [attemptId, d.questionId, d.chosen, d.isCorrect ? 1 : 0]
      );
    }
    await conn.commit();

    const rating = computeXepLoai(correctCount, questions.length);
    res.json({ success: true, correct: correctCount, total: questions.length, rating: rating.label, ratingTier: rating.tier });
  } catch (err) {
    await conn.rollback();
    console.error('Lỗi nộp bài test năng lực:', err);
    res.status(500).json({ error: 'Không thể nộp bài: ' + err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
