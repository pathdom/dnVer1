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
  if (m.text) return m.text;
  if (m.image_path) return 'Hình ảnh';
  if (m.file_name) return m.file_name;
  return '';
}
async function isParticipant(conversationId, role, id) {
  const [rows] = await db.query(
    'SELECT * FROM chat_participants WHERE conversation_id = ? AND user_role = ? AND user_id = ? LIMIT 1',
    [conversationId, role, id]
  );
  return rows[0] || null;
}
async function getMessage(id) {
  const [rows] = await db.query('SELECT * FROM chat_messages WHERE id = ?', [id]);
  return rows[0] || null;
}
async function hydrateMessage(m, viewerRole, viewerId) {
  const author = await getUser(m.sender_role, m.sender_id);
  let replyAuthor, replyText;
  if (m.reply_to_id) {
    const r = await getMessage(m.reply_to_id);
    if (r) {
      const rAuthor = await getUser(r.sender_role, r.sender_id);
      replyAuthor = rAuthor ? rAuthor.name : 'Người dùng';
      replyText = previewOf(r);
    }
  }
  const [reactionRows] = await db.query('SELECT emoji, user_role, user_id FROM chat_reactions WHERE message_id = ?', [m.id]);
  const reactionMap = {};
  for (const r of reactionRows) {
    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { emoji: r.emoji, count: 0, mine: false };
    reactionMap[r.emoji].count++;
    if (r.user_role === viewerRole && r.user_id === viewerId) reactionMap[r.emoji].mine = true;
  }
  const [[{ threadCount }]] = await db.query('SELECT COUNT(*) as threadCount FROM chat_thread_replies WHERE parent_message_id = ?', [m.id]);
  const [savedRows] = await db.query(
    'SELECT 1 FROM chat_saved_messages WHERE message_id = ? AND user_role = ? AND user_id = ?',
    [m.id, viewerRole, viewerId]
  );

  const deleted = !!m.deleted;
  return {
    id: m.id,
    conversationId: m.conversation_id,
    author: author ? author.name : 'Người dùng',
    initials: author ? author.initials : '?',
    me: m.sender_role === viewerRole && m.sender_id === viewerId,
    time: formatTime(m.created_at),
    deleted,
    edited: !!m.edited,
    pinned: !!m.pinned,
    saved: savedRows.length > 0,
    text: deleted ? undefined : (m.text || undefined),
    image: deleted ? undefined : (m.image_path || undefined),
    file: deleted ? undefined : (m.file_name || undefined),
    fileMeta: deleted ? undefined : (m.file_name ? fileMetaOf(m) : undefined),
    filePath: deleted ? undefined : (m.file_path || undefined),
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
    const [convs] = await db.query(
      `SELECT c.id, c.kind, c.name, c.created_at, p.pinned, p.last_read_message_id
       FROM chat_conversations c
       JOIN chat_participants p ON p.conversation_id = c.id AND p.user_role = ? AND p.user_id = ?
       ORDER BY c.id DESC`,
      [role, id]
    );

    const result = [];
    for (const c of convs) {
      const [others] = await db.query(
        `SELECT user_role, user_id FROM chat_participants
         WHERE conversation_id = ? AND NOT (user_role = ? AND user_id = ?)`,
        [c.id, role, id]
      );
      let name = c.name, initials = initialsOf(c.name, 'NH'), otherRole, otherId;
      if (c.kind === 'dm') {
        const other = others[0];
        const otherUser = other ? await getUser(other.user_role, other.user_id) : null;
        name = otherUser ? otherUser.name : 'Người dùng';
        initials = otherUser ? otherUser.initials : '?';
        if (other) { otherRole = other.user_role; otherId = other.user_id; }
      }
      const [msgRows] = await db.query(
        `SELECT id, sender_role, sender_id, text, image_path, file_name, deleted, created_at
         FROM chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1`,
        [c.id]
      );
      const lastMsg = msgRows[0];
      const [[{ unread }]] = await db.query(
        `SELECT COUNT(*) as unread FROM chat_messages
         WHERE conversation_id = ? AND id > ? AND deleted = 0 AND NOT (sender_role = ? AND sender_id = ?)`,
        [c.id, c.last_read_message_id || 0, role, id]
      );
      result.push({
        id: c.id,
        kind: c.kind,
        name,
        initials,
        otherRole,
        otherId,
        members: c.kind === 'group' ? others.length + 1 : undefined,
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
    const { kind, participant, name, participants } = req.body;

    if (kind === 'group') {
      if (!Array.isArray(participants) || participants.length === 0 || !name) {
        return res.status(400).json({ error: 'Thiếu tên nhóm hoặc thành viên' });
      }
      const [r] = await db.query(
        'INSERT INTO chat_conversations (kind, name, created_by_role, created_by_id) VALUES (?, ?, ?, ?)',
        ['group', name, role, id]
      );
      const convId = r.insertId;
      await db.query('INSERT INTO chat_participants (conversation_id, user_role, user_id) VALUES (?, ?, ?)', [convId, role, id]);
      for (const p of participants) {
        if (p.role === role && p.id === id) continue;
        await db.query(
          'INSERT IGNORE INTO chat_participants (conversation_id, user_role, user_id) VALUES (?, ?, ?)',
          [convId, p.role, p.id]
        );
      }
      return res.status(201).json({ id: convId });
    }

    if (!participant || !participant.role || !participant.id) {
      return res.status(400).json({ error: 'Thiếu người nhận' });
    }
    const [existing] = await db.query(
      `SELECT c.id FROM chat_conversations c
       JOIN chat_participants p1 ON p1.conversation_id = c.id AND p1.user_role = ? AND p1.user_id = ?
       JOIN chat_participants p2 ON p2.conversation_id = c.id AND p2.user_role = ? AND p2.user_id = ?
       WHERE c.kind = 'dm' LIMIT 1`,
      [role, id, participant.role, participant.id]
    );
    if (existing.length) return res.json({ id: existing[0].id });

    const [r] = await db.query(
      'INSERT INTO chat_conversations (kind, created_by_role, created_by_id) VALUES (?, ?, ?)',
      ['dm', role, id]
    );
    const convId = r.insertId;
    await db.query('INSERT INTO chat_participants (conversation_id, user_role, user_id) VALUES (?, ?, ?)', [convId, role, id]);
    await db.query('INSERT INTO chat_participants (conversation_id, user_role, user_id) VALUES (?, ?, ?)', [convId, participant.role, participant.id]);
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
    await db.query(
      'UPDATE chat_participants SET pinned = ? WHERE conversation_id = ? AND user_role = ? AND user_id = ?',
      [conv.pinned ? 0 : 1, req.params.id, role, id]
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
    await db.query('DELETE FROM chat_participants WHERE conversation_id = ? AND user_role = ? AND user_id = ?', [req.params.id, role, id]);
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
      'SELECT COALESCE(MAX(id), 0) as maxId FROM chat_messages WHERE conversation_id = ?', [req.params.id]
    );
    await db.query(
      'UPDATE chat_participants SET last_read_message_id = ? WHERE conversation_id = ? AND user_role = ? AND user_id = ?',
      [maxId, req.params.id, role, id]
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
    let sql = 'SELECT * FROM chat_messages WHERE conversation_id = ?';
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
    const image_path = isImage ? '/uploads/chat/' + file.filename : null;
    const file_path = (file && !isImage) ? '/uploads/chat/' + file.filename : null;
    const file_name = (file && !isImage) ? file.originalname : null;
    const file_size = (file && !isImage) ? file.size : null;

    const [r] = await db.query(
      `INSERT INTO chat_messages
        (conversation_id, sender_role, sender_id, text, reply_to_id, image_path, file_path, file_name, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.params.id, role, id, text || null, replyToId, image_path, file_path, file_name, file_size]
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
    if (m.sender_role !== role || m.sender_id !== id) return res.status(403).json({ error: 'Không thể sửa tin nhắn của người khác' });
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Nội dung trống' });
    await db.query('UPDATE chat_messages SET text = ?, edited = 1 WHERE id = ?', [text, m.id]);
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
    if (m.sender_role !== role || m.sender_id !== id) return res.status(403).json({ error: 'Không thể thu hồi tin nhắn của người khác' });
    await db.query(
      `UPDATE chat_messages SET deleted = 1, pinned = 0, text = NULL, image_path = NULL,
       file_path = NULL, file_name = NULL, file_size = NULL WHERE id = ?`,
      [m.id]
    );
    await db.query('DELETE FROM chat_reactions WHERE message_id = ?', [m.id]);
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
    const conv = await isParticipant(m.conversation_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const nowPinned = !m.pinned;
    await db.query('UPDATE chat_messages SET pinned = 0 WHERE conversation_id = ?', [m.conversation_id]);
    if (nowPinned) await db.query('UPDATE chat_messages SET pinned = 1 WHERE id = ?', [m.id]);
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
    const conv = await isParticipant(m.conversation_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const [existing] = await db.query(
      'SELECT id FROM chat_saved_messages WHERE message_id = ? AND user_role = ? AND user_id = ?',
      [m.id, role, id]
    );
    if (existing.length) {
      await db.query('DELETE FROM chat_saved_messages WHERE id = ?', [existing[0].id]);
      return res.json({ saved: false });
    }
    await db.query('INSERT INTO chat_saved_messages (user_role, user_id, message_id) VALUES (?, ?, ?)', [role, id, m.id]);
    res.json({ saved: true });
  } catch (err) {
    console.error('Lỗi lưu tin nhắn:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
});

router.get('/saved', async (req, res) => {
  try {
    const { role, id } = req.user;
    const [rows] = await db.query(
      `SELECT m.*, sm.saved_at, c.name as conv_name, c.kind as conv_kind
       FROM chat_saved_messages sm
       JOIN chat_messages m ON m.id = sm.message_id
       JOIN chat_conversations c ON c.id = m.conversation_id
       WHERE sm.user_role = ? AND sm.user_id = ? ORDER BY sm.saved_at DESC`,
      [role, id]
    );
    const items = [];
    for (const row of rows) {
      const hydrated = await hydrateMessage(row, role, id);
      let convName = row.conv_name;
      if (row.conv_kind === 'dm') {
        const [others] = await db.query(
          `SELECT user_role, user_id FROM chat_participants WHERE conversation_id = ? AND NOT (user_role = ? AND user_id = ?)`,
          [row.conversation_id, role, id]
        );
        const other = others[0] ? await getUser(others[0].user_role, others[0].user_id) : null;
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
    const conv = await isParticipant(m.conversation_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const [existing] = await db.query(
      'SELECT id FROM chat_reactions WHERE message_id = ? AND user_role = ? AND user_id = ? AND emoji = ?',
      [m.id, role, id, emoji]
    );
    if (existing.length) {
      await db.query('DELETE FROM chat_reactions WHERE id = ?', [existing[0].id]);
    } else {
      await db.query('INSERT INTO chat_reactions (message_id, user_role, user_id, emoji) VALUES (?, ?, ?, ?)', [m.id, role, id, emoji]);
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
    const conv = await isParticipant(m.conversation_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    const [rows] = await db.query('SELECT * FROM chat_thread_replies WHERE parent_message_id = ? ORDER BY id ASC', [m.id]);
    const replies = [];
    for (const t of rows) {
      const author = await getUser(t.sender_role, t.sender_id);
      replies.push({
        id: t.id,
        author: author ? author.name : 'Người dùng',
        initials: author ? author.initials : '?',
        me: t.sender_role === role && t.sender_id === id,
        time: formatTime(t.created_at),
        text: t.text
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
    const conv = await isParticipant(m.conversation_id, role, id);
    if (!conv) return res.status(403).json({ error: 'Không có quyền truy cập hội thoại này' });
    await db.query(
      'INSERT INTO chat_thread_replies (parent_message_id, sender_role, sender_id, text) VALUES (?, ?, ?, ?)',
      [m.id, role, id, text]
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
    const [rows] = await db.query(
      `SELECT m.* FROM chat_messages m
       JOIN chat_participants p ON p.conversation_id = m.conversation_id AND p.user_role = ? AND p.user_id = ?
       WHERE m.deleted = 0 AND m.text LIKE ? ORDER BY m.id DESC LIMIT 30`,
      [role, id, '%' + q + '%']
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
