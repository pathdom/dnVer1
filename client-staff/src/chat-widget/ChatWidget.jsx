import React, { useCallback, useEffect, useRef, useState } from 'react';
import { chatApi } from './chatApi';
import Topbar from '../components/Topbar';
import './chatWidget.css';

const EMOJIS = ['😀','😁','😂','🙂','😊','🤝','👍','🙏','🥲','😴','🤔','😅','😍','😮','💪','🔥','✅','❌','📌','📡','🎯','🎉','🚀','⏰','📎','❤️','😢','😡','🧠','🔧','⏳','🧩','🚦','🤷','🫡'];
const QUICK = ['👍','❤️','😂','😮','😢','🙏'];
const WAVE = [8,14,20,11,17,22,9,15,19,7,13,21,10,16,18,12,20,8,14,22,11,17,9,15];

function mmss(s) {
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}
function waveSpans() {
  return WAVE.map((h, i) => <span key={i} style={{ height: h + 'px' }} />);
}
function preview(m) {
  if (!m) return '';
  if (m.text) return m.text;
  if (m.file) return m.file;
  if (m.image) return 'Hình ảnh';
  return '';
}
function initialsOf(name, fallback) {
  if (!name) return fallback;
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}
function Avatar({ url, initials, className }) {
  return (
    <div className={className} style={{ overflow: 'hidden' }}>
      {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  );
}
function deptTagStyle(dept = '') {
  if (dept.includes('Tư vấn')) return { background: 'var(--teal-soft)', color: 'var(--teal)' };
  if (dept.includes('Hồ sơ')) return { background: '#E7EEFC', color: '#3B6FD1' };
  if (dept.includes('Marketing')) return { background: 'var(--gold-soft)', color: 'var(--gold)' };
  if (dept.includes('quản trị') || dept.includes('Quản trị')) return { background: 'var(--gold-soft)', color: 'var(--gold)' };
  return { background: 'var(--teal-soft)', color: 'var(--teal)' };
}
function readAppTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
}

export default function ChatWidget({ profile, onViewEmployee }) {
  const [theme, setTheme] = useState(readAppTheme);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState('');
  const [searchHits, setSearchHits] = useState([]);
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [reactBarId, setReactBarId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [threadId, setThreadId] = useState(null);
  const [threadReplies, setThreadReplies] = useState([]);
  const [threadDraft, setThreadDraft] = useState('');
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [people, setPeople] = useState([]);
  const [picked, setPicked] = useState([]);
  const [callKind, setCallKind] = useState(null);
  const [callSec, setCallSec] = useState(0);
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const msgsRef = useRef(null);
  const recTimer = useRef(null);
  const callTimer = useRef(null);

  const activeConv = conversations.find(c => c.id === activeId) || null;

  useEffect(() => {
    let stop = false;
    async function load() {
      try {
        const d = await chatApi.conversations();
        if (!stop) setConversations(d.conversations || []);
      } catch { /* ignore transient errors, next poll retries */ }
    }
    load();
    const t = setInterval(load, 15000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  useEffect(() => {
    chatApi.people().then(d => setPeople(d.people || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const sync = () => setTheme(readAppTheme());
    window.addEventListener('themeUpdated', sync);
    return () => window.removeEventListener('themeUpdated', sync);
  }, []);

  useEffect(() => {
    if (!activeId && conversations.length) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  const loadMessages = useCallback(async (id) => {
    try {
      const d = await chatApi.messages(id);
      setMessages(d.messages || []);
    } catch { /* ignore transient errors, next poll retries */ }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    chatApi.markRead(activeId).then(() => {
      setConversations(cs => cs.map(c => c.id === activeId ? { ...c, unread: 0 } : c));
    }).catch(() => {});
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    });
  }, [messages, activeId]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setSearchHits([]); return; }
    const t = setTimeout(() => {
      chatApi.search(q).then(d => setSearchHits(d.results || [])).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!threadId) { setThreadReplies([]); return; }
    let stop = false;
    async function load() {
      try {
        const d = await chatApi.thread(threadId);
        if (!stop) setThreadReplies(d.replies || []);
      } catch { /* ignore */ }
    }
    load();
    const t = setInterval(load, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [threadId]);

  useEffect(() => {
    if (!savedOpen) return;
    chatApi.saved().then(d => setSavedItems(d.saved || [])).catch(() => {});
  }, [savedOpen]);

  useEffect(() => {
    if (!recording) { clearInterval(recTimer.current); return; }
    recTimer.current = setInterval(() => setRecSec(s => s + 1), 1000);
    return () => clearInterval(recTimer.current);
  }, [recording]);

  useEffect(() => {
    if (!callKind) { clearInterval(callTimer.current); return; }
    callTimer.current = setInterval(() => setCallSec(s => s + 1), 1000);
    return () => clearInterval(callTimer.current);
  }, [callKind]);

  async function refreshActiveMessages() {
    if (activeId) await loadMessages(activeId);
  }
  async function refreshConversations() {
    const list = await chatApi.conversations();
    setConversations(list.conversations || []);
  }

  function selectConv(id) {
    setActiveId(id);
    setThreadId(null);
    setReplyTo(null);
    setEditingId(null);
    setDraft('');
    setEmojiOpen(false);
    setMentionOpen(false);
    setFindOpen(false);
    setFindText('');
  }

  async function startDm(person) {
    const d = await chatApi.createDm({ role: person.role, id: person.id });
    await refreshConversations();
    setGroupOpen(false);
    setGroupName('');
    setPicked([]);
    selectConv(d.id);
  }

  async function submitGroupModal() {
    if (picked.length === 1 && !groupName.trim()) {
      const person = people.find(p => p.role + p.id === picked[0]);
      if (person) { await startDm(person); return; }
    }
    if (!picked.length) { setGroupOpen(false); return; }
    const name = groupName.trim() || 'Nhóm mới';
    const participants = picked.map(key => {
      const p = people.find(x => x.role + x.id === key);
      return { role: p.role, id: p.id };
    });
    const d = await chatApi.createGroup(name, participants);
    await refreshConversations();
    setGroupOpen(false);
    setGroupName('');
    setPicked([]);
    selectConv(d.id);
  }

  async function pinConv(id, e) {
    e.stopPropagation();
    await chatApi.pinConversation(id);
    await refreshConversations();
  }
  async function leaveConv(id, e) {
    e.stopPropagation();
    await chatApi.leaveConversation(id);
    setConversations(cs => cs.filter(c => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function send() {
    const text = draft.trim();
    if (editingId) {
      if (!text) return;
      await chatApi.editMessage(editingId, text);
      setEditingId(null);
      setDraft('');
      refreshActiveMessages();
      return;
    }
    if (!text && !pendingFile) return;
    if (!activeId) return;
    setSending(true);
    try {
      await chatApi.sendMessage(activeId, {
        text,
        replyToId: replyTo ? replyTo.id : null,
        file: pendingFile ? pendingFile.file : null
      });
      setDraft('');
      setReplyTo(null);
      setPendingFile(null);
      setEmojiOpen(false);
      setMentionOpen(false);
      await refreshActiveMessages();
      await refreshConversations();
    } finally {
      setSending(false);
    }
  }

  function onDraftChange(v) {
    setDraft(v);
    setMentionOpen(/@[^\s@]*$/.test(v));
  }
  function pickMention(name) {
    setDraft(d => d.replace(/@[^@]*$/, '@' + name + ' '));
    setMentionOpen(false);
  }
  function pickEmoji(e) {
    setDraft(d => d + e);
  }

  function onAttach(kind) {
    if (kind === 'image') imageInputRef.current?.click();
    else fileInputRef.current?.click();
  }
  function onFileChosen(e, kind) {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile({
        kind,
        name: file.name,
        file
      });
    }
    e.target.value = '';
  }

  async function toggleReact(id, emoji) {
    setReactBarId(null);
    await chatApi.react(id, emoji);
    refreshActiveMessages();
  }
  async function togglePin(id) {
    await chatApi.pinMessage(id);
    refreshActiveMessages();
  }
  async function toggleSave(id) {
    await chatApi.saveMessage(id);
    refreshActiveMessages();
    if (savedOpen) chatApi.saved().then(d => setSavedItems(d.saved || []));
  }
  async function deleteMsg(id) {
    await chatApi.deleteMessage(id);
    refreshActiveMessages();
  }
  function startEdit(m) {
    setEditingId(m.id);
    setDraft(m.text || '');
    setReplyTo(null);
  }
  function startReply(m) {
    setReplyTo(m);
    setEditingId(null);
  }

  async function sendThreadReply() {
    const t = threadDraft.trim();
    if (!t || !threadId) return;
    await chatApi.replyThread(threadId, t);
    setThreadDraft('');
    const d = await chatApi.thread(threadId);
    setThreadReplies(d.replies || []);
    refreshActiveMessages();
  }

  function startRec() {
    if (recording) return;
    setRecording(true);
    setRecSec(0);
  }
  function cancelRec() {
    setRecording(false);
    setRecSec(0);
  }
  function sendRec() {
    setRecording(false);
    setRecSec(0);
  }

  function startCall(kind) {
    setCallKind(kind);
    setCallSec(0);
    setMoreOpen(false);
  }
  function endCall() {
    setCallKind(null);
    setCallSec(0);
  }

  const meInitials = profile?.avatar || initialsOf(profile?.name, '?');
  const meName = profile?.name || 'Bạn';

  const q = query.trim().toLowerCase();
  const visible = conversations.filter(c => !q || c.name.toLowerCase().includes(q) || (c.last || '').toLowerCase().includes(q));
  const pinnedList = visible.filter(c => c.pinned);
  const otherList = visible.filter(c => !c.pinned);
  const dmPeopleKeys = new Set(conversations.filter(c => c.kind === 'dm' && c.otherRole).map(c => c.otherRole + c.otherId));
  const quickContacts = people.filter(p => !dmPeopleKeys.has(p.role + p.id) && (!q || p.name.toLowerCase().includes(q)));
  const contactsByDept = [];
  for (const p of quickContacts) {
    const dept = p.department || 'Khác';
    let group = contactsByDept.find(g => g.dept === dept);
    if (!group) { group = { dept, items: [] }; contactsByDept.push(group); }
    group.items.push(p);
  }

  const ft = findText.trim().toLowerCase();
  const shownMessages = ft ? messages.filter(m => ((m.text || '') + (m.replyText || '')).toLowerCase().includes(ft)) : messages;
  const pinnedMsg = messages.find(m => m.pinned);
  const lastMine = messages.filter(m => m.me).slice(-1)[0];

  const mentionQuery = (draft.split('@').pop() || '').toLowerCase();
  const mentionList = people.filter(p => !mentionQuery || p.name.toLowerCase().includes(mentionQuery)).slice(0, 5);

  return (
    <section className="page active">
      <Topbar eyebrow="Giao tiếp nội bộ" title="Chat nội bộ" subtitle="Trò chuyện trực tiếp với quản trị viên và nhân viên trong hệ thống." />
      <div className="aladdin-chat-widget" data-theme={theme}>
      <div className="cw-panel">
        <div className="cw-rail">
          <div className="cw-rail-top">
            <Avatar url={profile?.avatarUrl} initials={meInitials} className="cw-av cw-av-32 cw-av-me" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="cw-me-name">{meName}</div>
              <div className="cw-me-sub"><span className="cw-dot" />Đang hoạt động</div>
            </div>
            <button className="cw-ib" title="Tin nhắn đã lưu" onClick={() => setSavedOpen(true)}><i className="ph ph-bookmark-simple" /></button>
          </div>
          <div className="cw-searchbar">
            <label className="cw-field">
              <i className="ph ph-magnifying-glass" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm người, nhóm, tin nhắn" />
            </label>
            <button className="cw-ib cw-ib-lg cw-ib-out" title="Trò chuyện mới" onClick={() => { setGroupOpen(true); setGroupName(''); setPicked([]); }}>
              <i className="ph ph-users-three" />
            </button>
          </div>
          <div className="cw-list cw-scr">
            {q && (
              <>
                <div className="cw-sec">Kết quả trong tin nhắn</div>
                {searchHits.map(m => (
                  <button key={m.id} className="cw-hit" onClick={() => { selectConv(m.conversationId); setQuery(''); }}>
                    <div className="cw-hit-t">{m.author}</div>
                    <div className="cw-hit-x">{preview(m)}</div>
                  </button>
                ))}
              </>
            )}
            {pinnedList.length > 0 && (
              <>
                <div className="cw-sec">Ghim</div>
                {pinnedList.map(c => (
                  <ConvRow key={c.id} c={c} active={c.id === activeId} onSelect={selectConv} onPin={pinConv} onLeave={leaveConv} />
                ))}
              </>
            )}
            {otherList.length > 0 && (
              <>
                <div className="cw-sec">Tin nhắn</div>
                {otherList.map(c => (
                  <ConvRow key={c.id} c={c} active={c.id === activeId} onSelect={selectConv} onPin={pinConv} onLeave={leaveConv} />
                ))}
              </>
            )}
            {contactsByDept.map(group => (
              <React.Fragment key={group.dept}>
                <div className="cw-sec">{group.dept}</div>
                {group.items.map(p => (
                  <button key={p.role + p.id} className="cw-hit" onClick={() => startDm(p)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <Avatar url={p.avatarUrl} initials={p.initials} className="cw-av cw-av-26" />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div className="cw-hit-t">{p.name}</div>
                        <div className="cw-hit-x">{p.roleLabel}</div>
                      </div>
                      <span className="dept-tag" style={deptTagStyle(group.dept)}>{group.dept}</span>
                    </div>
                  </button>
                ))}
              </React.Fragment>
            ))}
            {!visible.length && !quickContacts.length && <div className="cw-empty">Chưa có hội thoại nào.</div>}
          </div>
        </div>

        <div className="cw-chat">
          {!activeConv ? (
            <div className="cw-empty" style={{ margin: 'auto' }}>Chọn một hội thoại để bắt đầu trò chuyện</div>
          ) : (
            <>
              <div className="cw-chat-head">
                <Avatar url={activeConv.avatarUrl} initials={activeConv.initials} className="cw-av cw-av-34" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="cw-chat-name">{activeConv.name}</div>
                  <div className="cw-chat-sub">{activeConv.kind === 'group' ? (activeConv.members + ' thành viên') : 'Trò chuyện trực tiếp'}</div>
                </div>
                <button className="cw-ib cw-ib-lg" title="Tìm trong hội thoại" onClick={() => { setFindOpen(o => !o); setFindText(''); }}><i className="ph ph-magnifying-glass" /></button>
                <button className="cw-ib cw-ib-lg" title="Gọi thoại" onClick={() => startCall('voice')}><i className="ph ph-phone" /></button>
                <button className="cw-ib cw-ib-lg" title="Gọi video" onClick={() => startCall('video')}><i className="ph ph-video-camera" /></button>
                <div className="cw-menu-wrap">
                  <button className="cw-ib cw-ib-lg" title="Thêm" onClick={() => setMoreOpen(o => !o)}><i className="ph ph-dots-three-vertical" /></button>
                  <div className={'cw-menu' + (moreOpen ? ' cw-on' : '')}>
                    {onViewEmployee && activeConv.kind === 'dm' && activeConv.otherRole === 'staff' && (
                      <button onClick={() => { onViewEmployee(activeConv.otherId); setMoreOpen(false); }}><i className="ph ph-identification-card" />Xem hồ sơ nhân viên</button>
                    )}
                    <button onClick={() => { setGroupOpen(true); setGroupName(''); setPicked([]); setMoreOpen(false); }}><i className="ph ph-user-plus" />Thêm thành viên</button>
                    <button onClick={() => setMoreOpen(false)}><i className="ph ph-bell-slash" />Tắt thông báo</button>
                    <button onClick={() => { setSavedOpen(true); setMoreOpen(false); }}><i className="ph ph-bookmark-simple" />Tin nhắn đã lưu</button>
                    <button onClick={(e) => { leaveConv(activeConv.id, e); setMoreOpen(false); }}><i className="ph ph-sign-out" />Rời hội thoại</button>
                  </div>
                </div>
              </div>

              {findOpen && (
                <div className="cw-find">
                  <i className="ph ph-magnifying-glass" style={{ fontSize: 14, color: 'var(--cw-faint)' }} />
                  <input value={findText} onChange={e => setFindText(e.target.value)} placeholder="Tìm trong hội thoại này" />
                  <span style={{ fontSize: 11.5, color: 'var(--cw-muted)' }}>{ft ? shownMessages.length + ' kết quả' : ''}</span>
                  <button className="cw-ib" onClick={() => setFindOpen(false)}><i className="ph ph-x" style={{ fontSize: 14 }} /></button>
                </div>
              )}

              {pinnedMsg && (
                <div className="cw-pin-bar">
                  <i className="ph-fill ph-push-pin" style={{ fontSize: 14, color: 'var(--cw-accent)' }} />
                  <div className="cw-txt"><b>Đã ghim · </b>{preview(pinnedMsg)}</div>
                  <button className="cw-ib" title="Bỏ ghim" onClick={() => togglePin(pinnedMsg.id)}><i className="ph ph-x" style={{ fontSize: 13 }} /></button>
                </div>
              )}

              <div className="cw-msgs cw-scr" ref={msgsRef}>
                <div className="cw-daymark">Hôm nay</div>
                {shownMessages.map(m => (
                  <MessageRow
                    key={m.id}
                    m={m}
                    isLastMine={!!(lastMine && lastMine.id === m.id)}
                    reactBarId={reactBarId}
                    onReactBar={setReactBarId}
                    onQuickReact={toggleReact}
                    onReply={startReply}
                    onThread={setThreadId}
                    onPin={togglePin}
                    onSave={toggleSave}
                    onEdit={startEdit}
                    onDelete={deleteMsg}
                  />
                ))}
              </div>

              <div className="cw-composer">
                {replyTo && (
                  <div className="cw-banner">
                    <i className="ph ph-arrow-bend-up-left" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cw-a">Trả lời {replyTo.author}</div>
                      <div className="cw-x">{preview(replyTo)}</div>
                    </div>
                    <button className="cw-ib" onClick={() => setReplyTo(null)}><i className="ph ph-x" style={{ fontSize: 13 }} /></button>
                  </div>
                )}
                {editingId && (
                  <div className="cw-banner">
                    <i className="ph ph-pencil-simple" />
                    <div style={{ flex: 1, fontSize: 11.5, color: 'var(--cw-muted)' }}>Đang sửa tin nhắn</div>
                    <button className="cw-ib" onClick={() => { setEditingId(null); setDraft(''); }}><i className="ph ph-x" style={{ fontSize: 13 }} /></button>
                  </div>
                )}
                {pendingFile && (
                  <div className="cw-chips">
                    <div className="cw-chip">
                      <i className={'ph ph-' + (pendingFile.kind === 'image' ? 'image' : 'file-text')} />
                      {pendingFile.name}
                      <button onClick={() => setPendingFile(null)} style={{ color: 'var(--cw-muted)' }}><i className="ph ph-x" style={{ fontSize: 11 }} /></button>
                    </div>
                  </div>
                )}
                {recording && (
                  <div className="cw-rec">
                    <span className="cw-live" />
                    <span style={{ fontSize: 12, color: 'var(--cw-muted)' }}>Đang ghi âm</span>
                    <span className="cw-mono" style={{ fontSize: 12, color: 'var(--cw-accent)' }}>{mmss(recSec)}</span>
                    <div className="cw-wave">{waveSpans()}</div>
                    <button className="cw-btn" onClick={cancelRec}>Hủy</button>
                    <button className="cw-btn cw-btn-primary" onClick={sendRec}>Gửi</button>
                  </div>
                )}
                {emojiOpen && (
                  <div className="cw-pop">
                    <div className="cw-sec" style={{ padding: '0 0 7px' }}>Biểu tượng</div>
                    <div className="cw-emoji-grid">
                      {EMOJIS.map(e => <button key={e} onClick={() => pickEmoji(e)}>{e}</button>)}
                    </div>
                  </div>
                )}
                {mentionOpen && mentionList.length > 0 && (
                  <div className="cw-pop cw-mention">
                    {mentionList.map(p => (
                      <button key={p.role + p.id} onClick={() => pickMention(p.name)}>
                        <Avatar url={p.avatarUrl} initials={p.initials} className="cw-av cw-av-24" />
                        <span className="cw-n">{p.name}</span>
                        <span className="cw-r">{p.roleLabel}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="cw-cbar">
                  <button className="cw-ib" title="Biểu tượng" onClick={() => setEmojiOpen(o => !o)}><i className="ph ph-smiley" /></button>
                  <button className="cw-ib" title="Gửi tệp" onClick={() => onAttach('file')}><i className="ph ph-paperclip" /></button>
                  <button className="cw-ib" title="Gửi ảnh" onClick={() => onAttach('image')}><i className="ph ph-image" /></button>
                  <textarea
                    rows={1}
                    placeholder="Nhập tin nhắn, gõ @ để nhắc tên…"
                    value={draft}
                    onChange={e => onDraftChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  />
                  <button className="cw-ib" title="Tin nhắn thoại" onClick={startRec}><i className="ph ph-microphone" /></button>
                  <button className="cw-send" title="Gửi" onClick={send} disabled={sending}><i className="ph-fill ph-paper-plane-right" /></button>
                </div>
                <input ref={fileInputRef} type="file" hidden onChange={e => onFileChosen(e, 'file')} />
                <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={e => onFileChosen(e, 'image')} />
              </div>
            </>
          )}
        </div>

        {threadId && (
          <ThreadPane
            root={messages.find(m => m.id === threadId)}
            replies={threadReplies}
            draft={threadDraft}
            onDraftChange={setThreadDraft}
            onSend={sendThreadReply}
            onClose={() => setThreadId(null)}
          />
        )}

        {savedOpen && (
          <SavedModal
            items={savedItems}
            onClose={() => setSavedOpen(false)}
            onJump={(cid) => { selectConv(cid); setSavedOpen(false); }}
          />
        )}
        {groupOpen && (
          <GroupModal
            people={people}
            picked={picked}
            groupName={groupName}
            onGroupName={setGroupName}
            onTogglePick={(key) => setPicked(p => p.includes(key) ? p.filter(x => x !== key) : p.concat([key]))}
            onClose={() => setGroupOpen(false)}
            onSubmit={submitGroupModal}
          />
        )}
        {callKind && <CallModal conv={activeConv} kind={callKind} sec={callSec} onEnd={endCall} />}
      </div>
      </div>
    </section>
  );
}

function ConvRow({ c, active, onSelect, onPin, onLeave }) {
  return (
    <div className={'cw-conv' + (active ? ' cw-on' : '')}>
      <button className="cw-conv-btn" onClick={() => onSelect(c.id)}>
        <Avatar url={c.avatarUrl} initials={c.initials} className="cw-av cw-av-32" />
        <div className="cw-conv-mid">
          <div className="cw-conv-top">
            <span className="cw-conv-name">{c.name}</span>
            <span className="cw-conv-time">{c.time}</span>
          </div>
          <div className="cw-conv-last">{c.last}</div>
        </div>
        {c.unread > 0 && <span className="cw-badge">{c.unread}</span>}
      </button>
      <div className="cw-conv-tools">
        <button onClick={(e) => onPin(c.id, e)} title="Ghim hội thoại"><i className="ph ph-push-pin" /></button>
        <button className="cw-del" onClick={(e) => onLeave(c.id, e)} title="Rời hội thoại"><i className="ph ph-sign-out" /></button>
      </div>
    </div>
  );
}

function MessageRow({ m, isLastMine, reactBarId, onReactBar, onQuickReact, onReply, onThread, onPin, onSave, onEdit, onDelete }) {
  return (
    <div className="cw-msg">
      <div className={'cw-row' + (m.me ? ' cw-mine' : '')}>
        <Avatar url={m.avatarUrl} initials={m.initials} className="cw-av cw-av-28" />
        <div className="cw-stack">
          <div className="cw-meta">
            <span className="cw-who">{m.author}</span>
            <span className="cw-t">{m.time}</span>
            {m.edited && <span className="cw-e">· Đã sửa</span>}
            {m.saved && <i className="ph-fill ph-bookmark-simple" />}
            {m.pinned && <i className="ph-fill ph-push-pin" />}
          </div>
          <div className="cw-bub">
            {m.deleted ? (
              <span className="cw-gone">Tin nhắn đã được thu hồi</span>
            ) : (
              <>
                {m.replyAuthor && (
                  <div className="cw-quote">
                    <div className="cw-a">{m.replyAuthor}</div>
                    <div className="cw-x">{m.replyText}</div>
                  </div>
                )}
                {m.image && <img className="cw-img" src={m.image} alt="" />}
                {m.file && (
                  <a className="cw-file" href={m.filePath} download target="_blank" rel="noreferrer">
                    <i className="ph ph-file-text" style={{ fontSize: 20, color: 'var(--cw-accent)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cw-n">{m.file}</div>
                      <div className="cw-m">{m.fileMeta}</div>
                    </div>
                    <i className="ph ph-download-simple" style={{ fontSize: 16, color: 'var(--cw-muted)' }} />
                  </a>
                )}
                {m.text && <span>{m.text}</span>}
              </>
            )}
          </div>
          {!m.deleted && m.reactions?.length > 0 && (
            <div className="cw-reacts">
              {m.reactions.map(r => (
                <button key={r.emoji} className={r.mine ? 'cw-mine-react' : ''} onClick={() => onQuickReact(m.id, r.emoji)}>
                  {r.emoji}<span className="cw-n">{r.count}</span>
                </button>
              ))}
            </div>
          )}
          {!m.deleted && m.thread > 0 && (
            <button className="cw-thread-link" onClick={() => onThread(m.id)}>
              <i className="ph ph-chat-centered-dots" style={{ fontSize: 13 }} />{m.thread} trả lời trong luồng
            </button>
          )}
          {isLastMine && !m.deleted && <div className="cw-read"><i className="ph ph-checks" />Đã gửi</div>}
          {reactBarId === m.id && (
            <div className="cw-quickbar">
              {QUICK.map(e => <button key={e} onClick={() => onQuickReact(m.id, e)}>{e}</button>)}
            </div>
          )}
        </div>
        {!m.deleted && (
          <div className="cw-acts">
            <button title="Cảm xúc" onClick={() => onReactBar(reactBarId === m.id ? null : m.id)}><i className="ph ph-smiley" /></button>
            <button title="Trả lời" onClick={() => onReply(m)}><i className="ph ph-arrow-bend-up-left" /></button>
            <button title="Mở luồng phụ" onClick={() => onThread(m.id)}><i className="ph ph-chat-centered-dots" /></button>
            <button title="Ghim tin nhắn" onClick={() => onPin(m.id)}><i className="ph ph-push-pin" /></button>
            <button title="Lưu tin nhắn" onClick={() => onSave(m.id)}><i className={m.saved ? 'ph-fill ph-bookmark-simple' : 'ph ph-bookmark-simple'} /></button>
            {m.me && <button title="Sửa tin nhắn" onClick={() => onEdit(m)}><i className="ph ph-pencil-simple" /></button>}
            {m.me && <button title="Thu hồi" onClick={() => onDelete(m.id)}><i className="ph ph-trash" /></button>}
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadPane({ root, replies, draft, onDraftChange, onSend, onClose }) {
  if (!root) return null;
  return (
    <div className="cw-thread">
      <div className="cw-thread-head">
        <i className="ph ph-chat-centered-dots" />
        <div style={{ flex: 1 }}>Luồng phụ</div>
        <button className="cw-ib" onClick={onClose}><i className="ph ph-x" style={{ fontSize: 15 }} /></button>
      </div>
      <div className="cw-thread-body cw-scr">
        <div className="cw-thread-root">
          <div className="cw-a">{root.author}</div>
          <div className="cw-x">{preview(root)}</div>
        </div>
        {replies.map(t => (
          <div className="cw-treply" key={t.id}>
            <Avatar url={t.avatarUrl} initials={t.initials} className="cw-av cw-av-24" />
            <div style={{ minWidth: 0 }}>
              <div className="cw-top"><span className="cw-who">{t.author}</span><span className="cw-t">{t.time}</span></div>
              <div className="cw-x">{t.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="cw-thread-foot">
        <div className="cw-cbar">
          <input
            value={draft}
            onChange={e => onDraftChange(e.target.value)}
            placeholder="Trả lời trong luồng…"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSend(); } }}
          />
          <button className="cw-send" onClick={onSend}><i className="ph-fill ph-paper-plane-right" /></button>
        </div>
      </div>
    </div>
  );
}

function SavedModal({ items, onClose, onJump }) {
  return (
    <div className="cw-overlay" onClick={onClose}>
      <div className="cw-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
        <div className="cw-modal-head">
          <i className="ph-fill ph-bookmark-simple" />
          <div className="cw-t">Tin nhắn đã lưu</div>
          <button className="cw-ib" onClick={onClose}><i className="ph ph-x" /></button>
        </div>
        <div className="cw-scr" style={{ padding: 8, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.length ? items.map(m => (
            <button key={m.id} className="cw-saved-item" onClick={() => onJump(m.conversationId)}>
              <div className="cw-t">{m.conversationName} · {m.author} · {m.time}</div>
              <div className="cw-x">{preview(m)}</div>
            </button>
          )) : <div className="cw-empty">Chưa có tin nhắn nào được lưu. Đưa chuột lên một tin nhắn và bấm dấu trang.</div>}
        </div>
      </div>
    </div>
  );
}

function GroupModal({ people, picked, groupName, onGroupName, onTogglePick, onClose, onSubmit }) {
  const submitLabel = picked.length === 1 && !groupName.trim() ? 'Bắt đầu trò chuyện' : 'Tạo nhóm';
  return (
    <div className="cw-overlay" style={{ zIndex: 11 }} onClick={onClose}>
      <div className="cw-modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
        <div className="cw-modal-head">
          <i className="ph ph-users-three" style={{ fontSize: 17 }} />
          <div className="cw-t">Trò chuyện mới</div>
          <button className="cw-ib" onClick={onClose}><i className="ph ph-x" /></button>
        </div>
        <div className="cw-modal-body">
          <div>
            <div className="cw-lbl">Tên nhóm (bỏ trống nếu chỉ nhắn 1 người)</div>
            <input className="cw-inp" value={groupName} onChange={e => onGroupName(e.target.value)} placeholder="vd: Nhóm Kế hoạch tháng 9" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="cw-lbl">Thành viên · {picked.length} đã chọn</div>
            <div className="cw-picker cw-scr">
              {people.map(p => {
                const key = p.role + p.id;
                return (
                  <button key={key} onClick={() => onTogglePick(key)}>
                    <Avatar url={p.avatarUrl} initials={p.initials} className="cw-av cw-av-26" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="cw-n">{p.name}</div>
                      <div className="cw-r">{p.roleLabel}</div>
                    </div>
                    <i className={picked.includes(key) ? 'ph-fill ph-check-circle' : 'ph ph-circle'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="cw-modal-foot">
          <button className="cw-btn" onClick={onClose}>Hủy</button>
          <button className="cw-btn cw-btn-primary" onClick={onSubmit}>{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

function CallModal({ conv, kind, sec, onEnd }) {
  if (!conv) return null;
  return (
    <div className="cw-overlay" style={{ zIndex: 12, background: 'rgba(0,0,0,.62)' }}>
      <div className="cw-modal cw-call" onClick={e => e.stopPropagation()}>
        <Avatar url={conv.avatarUrl} initials={conv.initials} className="cw-big" />
        <div className="cw-nm">{conv.name}</div>
        <div className="cw-st">
          <i className={'ph ph-' + (kind === 'video' ? 'video-camera' : 'phone')} />
          {kind === 'video' ? 'Đang gọi video' : 'Đang gọi thoại'}
          <span className="cw-mono" style={{ color: 'var(--cw-accent)' }}>{mmss(sec)}</span>
        </div>
        <div className="cw-ctl">
          <button title="Tắt tiếng"><i className="ph ph-microphone-slash" /></button>
          <button title="Chia sẻ màn hình"><i className="ph ph-monitor-arrow-up" /></button>
          <button className="cw-end" onClick={onEnd} title="Kết thúc"><i className="ph-fill ph-phone-x" /></button>
        </div>
      </div>
    </div>
  );
}
