const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { getUser, listPeople, initialsOf } = require('../lib/chatUsers');

const uploadDir = path.join(__dirname, '..', 'uploads', 'chat');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// The real schema (phong_chat / thanh_vien_phong_chat / tin_nhan) only has
// columns for nhan_vien (staff). Admin participation is added via nullable
// admin_id / admin_gui_id columns — a row/message belongs to exactly one of
// the two actor columns, chosen by role.
function actorCol(role) { return role === 'admin' ? 'admin_id' : 'nhan_vien_id'; }
function actorSenderCol(role) { return role === 'admin' ? 'admin_gui_id' : 'nhan_vien_gui_id'; }
function memberOf(row) { return row.admin_id != null ? { role: 'admin', id: row.admin_id } : { role: 'staff', id: row.nhan_vien_id }; }
function senderOf(m) { return m.admin_gui_id != null ? { role: 'admin', id: m.admin_gui_id } : { role: 'staff', id: m.nhan_vien_gui_id }; }
function kindOf(loaiPhong) { return loaiPhong === 'NHOM' ? 'group' : 'dm'; }

function formatTime(d) {
  const dt = new Date(d);
  return String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
}
function fileMetaOf(m) {
  const ext = (m.file_name || '').split('.').pop().toUpperCase();
  const kb = m.file_size ? Math.max(1, Math.round(m.file_size / 1024)) : 0;
  return ext + ' · ' + kb + ' KB';
}
function previewOf(m) {
  if (m.deleted) return 'Tin nhắn đã được thu hồi';
  if (m.noi_dung) return m.noi_dung;
  if (m.loai_tin_nhan === 'IMAGE') return 'Hình ảnh';
  if (m.loai_tin_nhan === 'FILE') return m.file_name || 'Tệp đính kèm';
  return '';
}
async function isParticipant(phongChatId, role, id) {
  const col = actorCol(role);
  const [rows] = await db.query(
    `SELECT * FROM thanh_vien_phong_chat WHERE phong_chat_id = ? AND ${col} = ? LIMIT 1`,
    [phongChatId, id]
  );
  return rows[0] || null;
}
async function getMessage(id) {
  const [rows] = await db.query('SELECT * FROM tin_nhan WHERE id = ?', [id]);
  return rows[0] || null;
}
async function hydrateMessage(m, viewerRole, viewerId) {
  const sender = senderOf(m);
  const author = await getUser(sender.role, sender.id);
  let replyAuthor, replyText;
  if (m.reply_to_id) {
    const r = await getMessage(m.reply_to_id);
    if (r) {
      const rSender = senderOf(r);
      const rAuthor = await getUser(rSender.role, rSender.id);
      replyAuthor = rAuthor ? rAuthor.name : 'Người dùng';
      replyText = previewOf(r);
    }
  }
  const [reactionRows] = await db.query('SELECT emoji, nhan_vien_id, admin_id FROM cam_xuc_tin_nhan WHERE tin_nhan_id = ?', [m.id]);
  const reactionMap = {};
  for (const r of reactionRows) {
    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { emoji: r.emoji, count: 0, mine: false };
    reactionMap[r.emoji].count++;
    const actor = memberOf(r);
    if (actor.role === viewerRole && actor.id === viewerId) reactionMap[r.emoji].mine = true;
  }
  const [[{ threadCount }]] = await db.query('SELECT COUNT(*) as threadCount FROM tra_loi_luong WHERE tin_nhan_goc_id = ?', [m.id]);
  const viewerCol = actorCol(viewerRole);
  const [savedRows] = await db.query(`SELECT 1 FROM tin_nhan_da_luu WHERE tin_nhan_id = ? AND ${viewerCol} = ?`, [m.id, viewerId]);

  const deleted = !!m.deleted;
  const isImage = m.loai_tin_nhan === 'IMAGE';
  const isFile = m.loai_tin_nhan === 'FILE';
  return {
    id: m.id,
    conversationId: m.phong_chat_id,
    author: author ? author.name : 'Người dùng',
    initials: author ? author.initials : '?',
    avatarUrl: deleted ? undefined : (author ? author.avatarUrl : undefined),
    me: sender.role === viewerRole && sender.id === viewerId,
    time: formatTime(m.created_at),
    deleted,
    edited: !!m.edited,
    pinned: !!m.pinned,
    saved: savedRows.length > 0,
    text: deleted ? undefined : (m.noi_dung || undefined),
    image: deleted ? undefined : (isImage ? m.file_url : undefined),
    file: deleted ? undefined : (isFile ? m.file_name : undefined),
    fileMeta: deleted ? undefined : (isFile ? fileMetaOf(m) : undefined),
    filePath: deleted ? undefined : (isFile ? m.file_url : undefined),
    replyAuthor: deleted ? undefined : replyAuthor,
    replyText: deleted ? undefined : replyText,
    reactions: deleted ? [] : Object.values(reactionMap),
    thread: threadCount
  };
}

// ---- People (for starting DMs / building groups) ----
router.get('/people', async (req, res) => {
  try {
    const people = await listPeople(req.user.role, req.user.id);
    res.json({ people });
  } catch (err) {
    console.error('Lỗi lấy danh sách người dùng chat:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ---- Conversations ----
router.get('/conversations', async (req, res) => {
  try {
    const { role, id } = req.user;
    const viewerCol = actorCol(role);
    const senderCol = actorSenderCol(role);
    const [convs] = await db.query(
      `SELECT pc.id, pc.loai_phong, pc.ten_phong, pc.created_at, t.pinned, t.last_read_message_id
       FROM phong_chat pc
       JOIN thanh_vien_phong_chat t ON t.phong_chat_id = pc.id AND t.${viewerCol} = ?
       ORDER BY pc.id DESC`,
      [id]
    );

    const result = [];
    for (const c of convs) {
      const [others] = await db.query(
        `SELECT nhan_vien_id, admin_id FROM thanh_vien_phong_chat
         WHERE phong_chat_id = ? AND NOT (${viewerCol} <=> ?)`,
        [c.id, id]
      );
      const kind = kindOf(c.loai_phong);
      let name = c.ten_phong, initials = initialsOf(c.ten_phong, 'NH'), avatarUrl, otherRole, otherId;
      if (kind === 'dm') {
        const otherActor = others[0] ? memberOf(others[0]) : null;
        const otherUser = otherActor ? await getUser(otherActor.role, otherActor.id) : null;
        name = otherUser ? otherUser.name : 'Người dùng';
        initials = otherUser ? otherUser.initials : '?';
        avatarUrl = otherUser ? otherUser.avatarUrl : undefined;
        if (otherActor) { otherRole = otherActor.role; otherId = otherActor.id; }
      }
      const [msgRows] = await db.query(
        `SELECT id, nhan_vien_gui_id, admin_gui_id, noi_dung, loai_tin_nhan, file_name, deleted, created_at
         FROM tin_nhan WHERE phong_chat_id = ? ORDER BY id DESC LIMIT 1`,
        [c.id]
      );
      const lastMsg = msgRows[0];
      const [[{ unread }]] = await db.query(
        `SELECT COUNT(*) as unread FROM tin_nhan
         WHERE phong_chat_id = ? AND id > ? AND deleted = 0 AND NOT (${senderCol} <=> ?)`,
        [c.id, c.last_read_message_id || 0, id]
      );
      result.push({
        id: c.id,
        kind,
        name,
        initials,
        avatarUrl,
        otherRole,
        otherId,
        members: kind === 'group' ? others.length + 1 : undefined,
        pinned: !!c.pinned,
        unread,
        last: lastMsg ? previewOf(lastMsg) : 'Bắt đầu trò chuyện',
        time: lastMsg ? formatTime(lastMsg.created_at) : formatTime(c.created_at)
      });
    }
    res.json({ conversations: result });
  } catch (err) {
    console.error('Lỗi lấy hội thoại chat:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const { role, id } = req.user;
    const selfCol = actorCol(role);
    const { kind, participant, name, participants } = req.body;

    if (kind === 'group') {
      if (!Array.isArray(participants) || participants.length === 0 || !name) {
        return res.status(400).json({ error: 'Thiếu tên nhóm hoặc thành viên' });
      }
      const [r] = await db.query('INSERT INTO phong_chat (ten_phong, loai_phong) VALUES (?, ?)', [name, 'NHOM']);
      const convId = r.insertId;
      await db.query(`INSERT INTO thanh_vien_phong_chat (phong_chat_id, ${selfCol}) VALUES (?, ?)`, [convId, id]);
      for (const p of participants) {
        if (p.role === role && p.id === id) continue;
        const col = actorCol(p.role);
        await db.query(`INSERT IGNORE INTO thanh_vien_phong_chat (phong_chat_id, ${col}) VALUES (?, ?)`, [convId, p.id]);
      }
      return res.status(201).json({ id: convId });
    }

    if (!participant || !participant.role || !participant.id) {
      return res.status(400).json({ error: 'Thiếu người nhận' });
    }
    const otherCol = actorCol(participant.role);
    const [existing] = await db.query(
      `SELECT pc.id FROM phong_chat pc
       JOIN thanh_vien_phong_chat p1 ON p1.phong_chat_id = pc.id AND p1.${selfCol} = ?
       JOIN thanh_vien_phong_chat p2 ON p2.phong_chat_id = pc.id AND p2.${otherCol} = ?
       WHERE pc.loai_phong = 'CA_NHAN' LIMIT 1`,
      [id, participant.id]
    );
    if (existing.length) return res.json({ id: existing[0].id });

    const [r] = await db.query('INSERT INTO phong_chat (loai_phong) VALUES (?)', ['CA_NHAN']);
    const convId = r.insertId;
    await db.query(`INSERT INTO thanh_vien_phong_chat (phong_chat_id, ${selfCol}) VALUES (?, ?)`, [convId, id]);
    await db.query(`INSERT INTO thanh_vien_phong_chat (phong_chat_id, ${otherCol}) VALUES (?, ?)`, [convId, participant.id]);
    res.status(201).json({ id: convId });
  } catch (err) {
    console.error('Lỗi tạo hội thoại chat:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.patch('/conversations/:id/pin', async (req, res) => {
  try {
    const { role, id } = req.user;
    const conv = await isParticipant(req.params.id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const col = actorCol(role);
    await db.query(
      `UPDATE thanh_vien_phong_chat SET pinned = ? WHERE phong_chat_id = ? AND ${col} = ?`,
      [conv.pinned ? 0 : 1, req.params.id, id]
    );
    res.json({ pinned: !conv.pinned });
  } catch (err) {
    console.error('Lỗi ghim hội thoại:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    const { role, id } = req.user;
    const conv = await isParticipant(req.params.id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const col = actorCol(role);
    await db.query(`DELETE FROM thanh_vien_phong_chat WHERE phong_chat_id = ? AND ${col} = ?`, [req.params.id, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi rời hội thoại:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.patch('/conversations/:id/read', async (req, res) => {
  try {
    const { role, id } = req.user;
    const conv = await isParticipant(req.params.id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const [[{ maxId }]] = await db.query(
      'SELECT COALESCE(MAX(id), 0) as maxId FROM tin_nhan WHERE phong_chat_id = ?', [req.params.id]
    );
    const col = actorCol(role);
    await db.query(
      `UPDATE thanh_vien_phong_chat SET last_read_message_id = ? WHERE phong_chat_id = ? AND ${col} = ?`,
      [maxId, req.params.id, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi cập nhật đã đọc:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ---- Messages ----
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { role, id } = req.user;
    const conv = await isParticipant(req.params.id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const before = Number(req.query.before) || null;
    const params = [req.params.id];
    let sql = 'SELECT * FROM tin_nhan WHERE phong_chat_id = ?';
    if (before) { sql += ' AND id < ?'; params.push(before); }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    const messages = [];
    for (const m of rows.reverse()) messages.push(await hydrateMessage(m, role, id));
    res.json({ messages });
  } catch (err) {
    console.error('Lỗi lấy tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/conversations/:id/messages', upload.single('attachment'), async (req, res) => {
  try {
    const { role, id } = req.user;
    const conv = await isParticipant(req.params.id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });

    const text = (req.body.text || '').trim();
    const replyToId = req.body.replyToId ? Number(req.body.replyToId) : null;
    const file = req.file;
    if (!text && !file) return res.status(400).json({ error: 'Tin nhắn trống' });

    const isImage = file && file.mimetype.startsWith('image/');
    const loai = file ? (isImage ? 'IMAGE' : 'FILE') : 'TEXT';
    const file_url = file ? '/uploads/chat/' + file.filename : null;
    const file_name = file ? file.originalname : null;
    const file_size = file ? file.size : null;

    const senderCol = actorSenderCol(role);
    const [r] = await db.query(
      `INSERT INTO tin_nhan
        (phong_chat_id, ${senderCol}, noi_dung, reply_to_id, loai_tin_nhan, file_url, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, id, text || null, replyToId, loai, file_url, file_name, file_size]
    );
    const m = await getMessage(r.insertId);
    res.status(201).json({ message: await hydrateMessage(m, role, id) });
  } catch (err) {
    console.error('Lỗi gửi tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.patch('/messages/:id', async (req, res) => {
  try {
    const { role, id } = req.user;
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const sender = senderOf(m);
    if (sender.role !== role || sender.id !== id) return res.status(403).json({ error: 'Không thể sửa tin nhắn của người khác' });
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Nội dung trống' });
    await db.query('UPDATE tin_nhan SET noi_dung = ?, edited = 1 WHERE id = ?', [text, m.id]);
    res.json({ message: await hydrateMessage(await getMessage(m.id), role, id) });
  } catch (err) {
    console.error('Lỗi sửa tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.delete('/messages/:id', async (req, res) => {
  try {
    const { role, id } = req.user;
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const sender = senderOf(m);
    if (sender.role !== role || sender.id !== id) return res.status(403).json({ error: 'Không thể thu hồi tin nhắn của người khác' });
    await db.query(
      `UPDATE tin_nhan SET deleted = 1, pinned = 0, noi_dung = NULL,
       file_url = NULL, file_name = NULL, file_size = NULL WHERE id = ?`,
      [m.id]
    );
    await db.query('DELETE FROM cam_xuc_tin_nhan WHERE tin_nhan_id = ?', [m.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Lỗi thu hồi tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/messages/:id/pin', async (req, res) => {
  try {
    const { role, id } = req.user;
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const conv = await isParticipant(m.phong_chat_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const nowPinned = !m.pinned;
    await db.query('UPDATE tin_nhan SET pinned = 0 WHERE phong_chat_id = ?', [m.phong_chat_id]);
    if (nowPinned) await db.query('UPDATE tin_nhan SET pinned = 1 WHERE id = ?', [m.id]);
    res.json({ pinned: nowPinned });
  } catch (err) {
    console.error('Lỗi ghim tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/messages/:id/save', async (req, res) => {
  try {
    const { role, id } = req.user;
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const conv = await isParticipant(m.phong_chat_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const col = actorCol(role);
    const [existing] = await db.query(
      `SELECT id FROM tin_nhan_da_luu WHERE tin_nhan_id = ? AND ${col} = ?`,
      [m.id, id]
    );
    if (existing.length) {
      await db.query('DELETE FROM tin_nhan_da_luu WHERE id = ?', [existing[0].id]);
      return res.json({ saved: false });
    }
    await db.query(`INSERT INTO tin_nhan_da_luu (tin_nhan_id, ${col}) VALUES (?, ?)`, [m.id, id]);
    res.json({ saved: true });
  } catch (err) {
    console.error('Lỗi lưu tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.get('/saved', async (req, res) => {
  try {
    const { role, id } = req.user;
    const col = actorCol(role);
    const [rows] = await db.query(
      `SELECT tn.*, s.created_at as saved_at, pc.ten_phong as conv_name, pc.loai_phong
       FROM tin_nhan_da_luu s
       JOIN tin_nhan tn ON tn.id = s.tin_nhan_id
       JOIN phong_chat pc ON pc.id = tn.phong_chat_id
       WHERE s.${col} = ? ORDER BY s.created_at DESC`,
      [id]
    );
    const items = [];
    for (const row of rows) {
      const hydrated = await hydrateMessage(row, role, id);
      let convName = row.conv_name;
      if (row.loai_phong === 'CA_NHAN') {
        const [others] = await db.query(
          `SELECT nhan_vien_id, admin_id FROM thanh_vien_phong_chat WHERE phong_chat_id = ? AND NOT (${col} <=> ?)`,
          [row.phong_chat_id, id]
        );
        const otherActor = others[0] ? memberOf(others[0]) : null;
        const other = otherActor ? await getUser(otherActor.role, otherActor.id) : null;
        convName = other ? other.name : 'Người dùng';
      }
      items.push({ ...hydrated, conversationName: convName });
    }
    res.json({ saved: items });
  } catch (err) {
    console.error('Lỗi lấy tin nhắn đã lưu:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/messages/:id/react', async (req, res) => {
  try {
    const { role, id } = req.user;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Thiếu emoji' });
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const conv = await isParticipant(m.phong_chat_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const col = actorCol(role);
    const [existing] = await db.query(
      `SELECT id FROM cam_xuc_tin_nhan WHERE tin_nhan_id = ? AND ${col} = ? AND emoji = ?`,
      [m.id, id, emoji]
    );
    if (existing.length) {
      await db.query('DELETE FROM cam_xuc_tin_nhan WHERE id = ?', [existing[0].id]);
    } else {
      await db.query(`INSERT INTO cam_xuc_tin_nhan (tin_nhan_id, ${col}, emoji) VALUES (?, ?, ?)`, [m.id, id, emoji]);
    }
    res.json({ message: await hydrateMessage(await getMessage(m.id), role, id) });
  } catch (err) {
    console.error('Lỗi thả cảm xúc:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ---- Threads ----
router.get('/messages/:id/thread', async (req, res) => {
  try {
    const { role, id } = req.user;
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const conv = await isParticipant(m.phong_chat_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const [rows] = await db.query('SELECT * FROM tra_loi_luong WHERE tin_nhan_goc_id = ? ORDER BY id ASC', [m.id]);
    const replies = [];
    for (const t of rows) {
      const actor = memberOf(t);
      const author = await getUser(actor.role, actor.id);
      replies.push({
        id: t.id,
        author: author ? author.name : 'Người dùng',
        initials: author ? author.initials : '?',
        avatarUrl: author ? author.avatarUrl : undefined,
        me: actor.role === role && actor.id === id,
        time: formatTime(t.created_at),
        text: t.noi_dung
      });
    }
    res.json({ replies });
  } catch (err) {
    console.error('Lỗi lấy luồng phụ:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.post('/messages/:id/thread', async (req, res) => {
  try {
    const { role, id } = req.user;
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Nội dung trống' });
    const m = await getMessage(req.params.id);
    if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn' });
    const conv = await isParticipant(m.phong_chat_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const col = actorCol(role);
    await db.query(
      `INSERT INTO tra_loi_luong (tin_nhan_goc_id, ${col}, noi_dung) VALUES (?, ?, ?)`,
      [m.id, id, text]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Lỗi trả lời luồng phụ:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

// ---- Search ----
router.get('/search', async (req, res) => {
  try {
    const { role, id } = req.user;
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ results: [] });
    const col = actorCol(role);
    const [rows] = await db.query(
      `SELECT tn.* FROM tin_nhan tn
       JOIN thanh_vien_phong_chat t ON t.phong_chat_id = tn.phong_chat_id AND t.${col} = ?
       WHERE tn.deleted = 0 AND tn.noi_dung LIKE ? ORDER BY tn.id DESC LIMIT 30`,
      [id, '%' + q + '%']
    );
    const results = [];
    for (const m of rows) results.push(await hydrateMessage(m, role, id));
    res.json({ results });
  } catch (err) {
    console.error('Lỗi tìm kiếm tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

module.exports = router;
