const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { verifyPassword } = require('../lib/password');

// Staff Login: nhan_vien holds the profile, tai_khoan_nhan_vien holds the credentials
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Thiếu email hoặc mật khẩu' });
    }

    const [staffs] = await db.query(`
      SELECT nv.id, nv.ma_nhan_vien, nv.ho_ten, nv.email, nv.avatar_url,
        cd.ten_chuc_danh, bp.ten_bo_phan, tk.id as tkId, tk.password_hash
      FROM nhan_vien nv
      JOIN tai_khoan_nhan_vien tk ON tk.id = nv.tai_khoan_nhan_vien_id
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      WHERE nv.email = ? OR tk.username = ?
    `, [email, email]);
    if (staffs.length === 0) {
      return res.status(401).json({ success: false, error: 'Sai email hoặc mật khẩu' });
    }

    const s = staffs[0];
    const match = await verifyPassword(password, s.password_hash || '');
    if (!match) {
      return res.status(401).json({ success: false, error: 'Sai email hoặc mật khẩu' });
    }

    await db.query('UPDATE tai_khoan_nhan_vien SET last_login = NOW() WHERE id = ?', [s.tkId]);

    const token = jwt.sign({ id: s.id, role: 'staff' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      staff: {
        id: s.ma_nhan_vien || 'NV-' + s.id,
        dbId: s.id,
        name: s.ho_ten,
        role: s.ten_chuc_danh || 'Nhân viên',
        department: s.ten_bo_phan || null,
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

// GET /api/staff/notifications — thông báo broadcast từ admin (VD: quy trình mới)
router.get('/notifications', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, tieu_de as title, noi_dung as message, loai as type,
        DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as time, created_at
       FROM thong_bao WHERE doi_tuong = 'staff' ORDER BY created_at DESC LIMIT 30`
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error('Lỗi GET /api/staff/notifications:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// GET /api/staff/process-flow — quy trình gần nhất mà admin đã gửi (nếu có)
router.get('/process-flow', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT du_lieu, DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as sentAt
       FROM thong_bao WHERE doi_tuong = 'staff' AND loai = 'quy_trinh' AND du_lieu IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`
    );
    if (rows.length === 0) return res.json({ flow: null });

    let flow = null;
    try { flow = JSON.parse(rows[0].du_lieu); } catch { flow = null; }
    res.json({ flow, sentAt: rows[0].sentAt });
  } catch (err) {
    console.error('Lỗi GET /api/staff/process-flow:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// GET /api/staff/profile — live name/role/avatar, so a long-lived session
// self-corrects after HR data changes instead of showing the stale snapshot
// captured at login time.
router.get('/profile', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT nv.id, nv.ma_nhan_vien, nv.ho_ten, nv.email, nv.avatar_url,
        cd.ten_chuc_danh, bp.ten_bo_phan
      FROM nhan_vien nv
      LEFT JOIN chuc_danh cd ON cd.id = nv.chuc_danh_id
      LEFT JOIN bo_phan bp ON bp.id = nv.bo_phan_id
      WHERE nv.id = ?
    `, [req.user.id]);
    const s = rows[0];
    if (!s) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    res.json({
      id: s.ma_nhan_vien || 'NV-' + s.id,
      dbId: s.id,
      name: s.ho_ten,
      role: s.ten_chuc_danh || s.ten_bo_phan || 'Nhân viên',
      department: s.ten_bo_phan || null,
      email: s.email,
      avatar: s.ho_ten ? s.ho_ten.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase() : 'NV',
      avatarUrl: s.avatar_url || null
    });
  } catch (err) {
    console.error('Lỗi lấy hồ sơ nhân viên:', err);
    res.status(500).json({ error: 'Database query error' });
  }
});

// Staff Overview API from DB
router.get('/overview', async (req, res) => {
  try {
    const [[{ totalAssigned }]] = await db.query('SELECT COUNT(*) as totalAssigned FROM hoc_vien');
    const [urgentList] = await db.query(`
      SELECT
        kh.ho_ten as name,
        qg.ten_quoc_gia as country,
        kh.trang_thai as statusText,
        kh.ghi_chu as description
      FROM khach_hang kh
      LEFT JOIN quoc_gia qg ON qg.id = kh.quoc_gia_id
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

// GET /api/staff/competency-results — nhân viên chỉ xem kết quả test năng lực của chính mình
// (kết quả được admin nhập thủ công vào bảng test_nang_luc sau khi chấm bài).
router.get('/competency-results', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, ten_bai_test as examName, diem_so as score, ket_qua as result,
        danh_gia_nhan_xet as note, DATE_FORMAT(ngay_lam_test, '%d/%m/%Y') as takenAt
      FROM test_nang_luc
      WHERE nhan_vien_id = ?
      ORDER BY id DESC
    `, [req.user.id]);
    res.json({
      results: rows.map(r => ({
        id: r.id,
        examName: r.examName,
        score: Number(r.score),
        result: r.result,
        ratingTier: r.result === 'Đạt' ? 'pass' : 'fail',
        note: r.note,
        takenAt: r.takenAt
      }))
    });
  } catch (err) {
    console.error('Lỗi lấy kết quả test năng lực của nhân viên:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// ---- Đề thi (bo_de_thi/cau_hoi/dap_an) — nhân viên xem & làm đề thuộc phòng ban mình ----

// GET /api/staff/exams — danh sách đề thi của phòng ban mình, kèm trạng thái đã làm
router.get('/exams', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.id, d.ma_bo_de as maBoDe, d.ten_bo_de as name,
        d.thoi_gian_lam_bai_phut as duration, d.diem_chuan_dat as passScore,
        (SELECT COUNT(*) FROM cau_hoi c WHERE c.bo_de_thi_id = d.id) as questionCount,
        t.diem_so as score, t.ket_qua as result, DATE_FORMAT(t.ngay_lam_test, '%d/%m/%Y') as takenAt
      FROM bo_de_thi d
      JOIN nhan_vien nv ON nv.bo_phan_id = d.bo_phan_id
      LEFT JOIN test_nang_luc t ON t.bo_de_thi_id = d.id AND t.nhan_vien_id = nv.id
      WHERE nv.id = ?
      ORDER BY d.id DESC
    `, [req.user.id]);

    res.json({
      exams: rows.map(r => ({
        id: r.id,
        maBoDe: r.maBoDe,
        name: r.name,
        duration: r.duration,
        passScore: Number(r.passScore),
        questionCount: r.questionCount,
        completed: r.score !== null,
        score: r.score !== null ? Number(r.score) : null,
        result: r.result,
        takenAt: r.takenAt
      }))
    });
  } catch (err) {
    console.error('Lỗi GET /api/staff/exams:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// GET /api/staff/exams/:id — câu hỏi để làm bài (ẩn đáp án đúng)
router.get('/exams/:id', async (req, res) => {
  try {
    const [examRows] = await db.query(
      'SELECT id, ten_bo_de as name, bo_phan_id as boPhanId, thoi_gian_lam_bai_phut as duration FROM bo_de_thi WHERE id = ?',
      [req.params.id]
    );
    if (examRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    const [meRows] = await db.query('SELECT bo_phan_id as boPhanId FROM nhan_vien WHERE id = ?', [req.user.id]);
    if (!meRows[0] || Number(meRows[0].boPhanId) !== Number(examRows[0].boPhanId)) {
      return res.status(403).json({ error: 'Đề thi này không thuộc phòng ban của bạn' });
    }

    const [existing] = await db.query(
      'SELECT id FROM test_nang_luc WHERE nhan_vien_id = ? AND bo_de_thi_id = ?',
      [req.user.id, req.params.id]
    );
    if (existing.length > 0) return res.status(409).json({ error: 'Bạn đã làm đề thi này rồi' });

    const [questions] = await db.query(
      'SELECT id, noi_dung_cau_hoi as content FROM cau_hoi WHERE bo_de_thi_id = ? ORDER BY id',
      [req.params.id]
    );
    const questionIds = questions.map(q => q.id);
    let answers = [];
    if (questionIds.length > 0) {
      const [answerRows] = await db.query(
        'SELECT id, cau_hoi_id as questionId, noi_dung_dap_an as content FROM dap_an WHERE cau_hoi_id IN (?) ORDER BY id',
        [questionIds]
      );
      answers = answerRows;
    }

    res.json({
      id: examRows[0].id,
      name: examRows[0].name,
      duration: examRows[0].duration,
      questions: questions.map(q => ({ ...q, answers: answers.filter(a => a.questionId === q.id) }))
    });
  } catch (err) {
    console.error('Lỗi GET /api/staff/exams/:id:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// POST /api/staff/exams/:id/submit — nộp bài, server tự chấm điểm (không tin điểm từ client)
router.post('/exams/:id/submit', async (req, res) => {
  try {
    const examId = req.params.id;
    const answers = req.body.answers || {}; // { [questionId]: answerId }

    const [examRows] = await db.query(
      'SELECT ten_bo_de as name, bo_phan_id as boPhanId, diem_chuan_dat as passScore FROM bo_de_thi WHERE id = ?',
      [examId]
    );
    if (examRows.length === 0) return res.status(404).json({ error: 'Không tìm thấy đề thi' });

    const [meRows] = await db.query('SELECT bo_phan_id as boPhanId FROM nhan_vien WHERE id = ?', [req.user.id]);
    if (!meRows[0] || Number(meRows[0].boPhanId) !== Number(examRows[0].boPhanId)) {
      return res.status(403).json({ error: 'Đề thi này không thuộc phòng ban của bạn' });
    }

    const [existing] = await db.query(
      'SELECT id FROM test_nang_luc WHERE nhan_vien_id = ? AND bo_de_thi_id = ?',
      [req.user.id, examId]
    );
    if (existing.length > 0) return res.status(409).json({ error: 'Bạn đã nộp bài đề thi này rồi' });

    const [questions] = await db.query('SELECT id FROM cau_hoi WHERE bo_de_thi_id = ?', [examId]);
    const questionIds = questions.map(q => q.id);
    let correctAnswers = [];
    if (questionIds.length > 0) {
      const [rows] = await db.query(
        'SELECT id, cau_hoi_id as questionId FROM dap_an WHERE cau_hoi_id IN (?) AND la_dap_an_dung = 1',
        [questionIds]
      );
      correctAnswers = rows;
    }

    let soCauDung = 0;
    for (const q of questions) {
      const correct = correctAnswers.find(a => a.questionId === q.id);
      const chosen = answers[q.id];
      if (correct && chosen && Number(chosen) === correct.id) soCauDung++;
    }

    const tongCau = questions.length;
    const diemSo = tongCau > 0 ? Math.round((soCauDung / tongCau) * 10 * 10) / 10 : 0;
    const ketQua = diemSo >= Number(examRows[0].passScore) ? 'Đạt' : 'Không đạt';

    await db.query(
      'INSERT INTO test_nang_luc (nhan_vien_id, bo_de_thi_id, ten_bai_test, ngay_lam_test, diem_so, ket_qua) VALUES (?, ?, ?, CURDATE(), ?, ?)',
      [req.user.id, examId, examRows[0].name, diemSo, ketQua]
    );

    res.json({ success: true, soCauDung, tongCau, diemSo, ketQua });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Bạn đã nộp bài đề thi này rồi' });
    }
    console.error('Lỗi nộp bài thi:', err);
    res.status(500).json({ error: 'Không thể nộp bài: ' + err.message });
  }
});

module.exports = router;
