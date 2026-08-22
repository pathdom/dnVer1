import React, { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';

export default function InternalChatPage() {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState('members');
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetch('/api/chat/channels')
      .then(res => res.json())
      .then(data => {
        setChannels(data);
        if (data.length > 1) {
          setActiveChannel(data[1]); // Default to 'Phòng Tư vấn tuyển sinh'
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetch(`/api/chat/messages/${activeChannel.id}`)
        .then(res => res.json())
        .then(msgs => setMessages(msgs))
        .catch(err => console.error(err));
    }
  }, [activeChannel]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannel) return;

    fetch(`/api/chat/messages/${activeChannel.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText })
    })
      .then(res => res.json())
      .then(newMsg => {
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
      })
      .catch(err => console.error(err));
  };

  const addEmoji = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${channels.length} hội thoại`}
        title="Chat nội bộ"
        subtitle="Trao đổi công việc trực tiếp với các phòng ban và đồng nghiệp."
      />

      <div className="ichat-layout">
        {/* SIDEBAR */}
        <div className="ichat-panel">
          <div className="ichat-sidebar-head">
            <div className="ichat-search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Tìm cuộc trò chuyện..." />
            </div>
            <button className="ichat-newgroup-btn" onClick={() => setShowCreateModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
              Tạo nhóm mới
            </button>
          </div>

          <div className="ichat-list">
            <div className="ichat-section-label">Nhóm</div>
            {channels.filter(c => c.type === 'group').map((c) => (
              <div
                key={c.id}
                className={`ichat-row ${activeChannel?.id === c.id ? 'active' : ''}`}
                onClick={() => setActiveChannel(c)}
              >
                <div className="ichat-row-icon" style={{ background: c.bg || 'var(--teal)' }}>{c.icon || '👥'}</div>
                <div className="ichat-row-info">
                  <div className="ichat-row-name">{c.name}</div>
                  <div className="ichat-row-preview">{c.preview}</div>
                </div>
                <div className="ichat-row-meta">
                  <span className="ichat-row-time">{c.time}</span>
                  {c.unread && <span className="ichat-unread">{c.unread}</span>}
                </div>
              </div>
            ))}

            <div className="ichat-section-label">Tin nhắn trực tiếp</div>
            {channels.filter(c => c.type === 'dm').map((c) => (
              <div
                key={c.id}
                className={`ichat-row ${activeChannel?.id === c.id ? 'active' : ''}`}
                onClick={() => setActiveChannel(c)}
              >
                <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '13px' }}>{c.avatar}</div>
                <div className="ichat-row-info">
                  <div className="ichat-row-name">{c.name}</div>
                  <div className="ichat-row-preview">{c.preview}</div>
                </div>
                <div className="ichat-row-meta">
                  <span className="ichat-row-time">{c.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MAIN CHAT */}
        <div className="ichat-panel ichat-main">
          <div className="ichat-header">
            <div className="ichat-header-left">
              <div className="ichat-header-icon" style={{ background: activeChannel?.bg || 'var(--teal)' }}>
                {activeChannel?.icon || activeChannel?.avatar || '👥'}
              </div>
              <div>
                <div className="ichat-header-title">{activeChannel?.name || 'Phòng Tư vấn tuyển sinh'}</div>
                <div className="ichat-header-sub">{activeChannel?.sub || '4 thành viên'}</div>
              </div>
            </div>
            <div className="ichat-header-actions">
              <button className="ichat-icon-btn" title="Tìm kiếm"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg></button>
              <button className={`ichat-icon-btn ${showInfoPanel && activeInfoTab === 'pins' ? 'on' : ''}`} title="Ghim" onClick={() => { setShowInfoPanel(true); setActiveInfoTab('pins'); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
              </button>
              <button className={`ichat-icon-btn ${showInfoPanel ? 'on' : ''}`} title="Thông tin" onClick={() => setShowInfoPanel(!showInfoPanel)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </button>
            </div>
          </div>

          <div className="ichat-pinned">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
            <span><strong>Trần Minh Khoa đã ghim:</strong> Checklist hồ sơ mới áp dụng từ 01/09 — xem file đính kèm</span>
            <span className="link" onClick={() => { setShowInfoPanel(true); setActiveInfoTab('pins'); }}>Xem tất cả (2) →</span>
          </div>

          <div className="ichat-body">
            <div className="ichat-date-divider"><span>Hôm nay, 19/08/2026</span></div>

            {messages.map((msg) => (
              <div key={msg.id} className={`ichat-msg ${msg.isMe ? 'me' : ''} ${msg.isPinned ? 'pinned' : ''}`}>
                <div className="avatar">{msg.avatar}</div>
                <div className="ichat-msg-content">
                  <div className="ichat-msg-meta">
                    <span className="ichat-msg-name">{msg.name}</span>
                    <span className="ichat-msg-time">{msg.time}</span>
                  </div>
                  <div className="ichat-bubble">{msg.text}</div>

                  {msg.file && (
                    <div className="ichat-file-card" style={{ marginTop: '8px' }}>
                      <div className="ichat-file-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>
                      <div className="ichat-file-info"><div className="ichat-file-name">{msg.file.name}</div><div className="ichat-file-size">{msg.file.size}</div></div>
                      <svg className="ichat-file-dl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
                    </div>
                  )}

                  {msg.images && (
                    <div className="ichat-img-grid" style={{ marginTop: '8px' }}>
                      {msg.images.map((img, idx) => (
                        <div key={idx} className="ichat-img-thumb" style={{ background: idx === 0 ? 'linear-gradient(135deg, var(--teal), #1d7a70)' : 'linear-gradient(135deg, var(--gold), #b97e26)' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                          <span>{img}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.reactions && (
                    <div className="ichat-reactions">
                      {msg.reactions.map((r, idx) => (
                        <span key={idx} className="ichat-reaction">{r.emoji} {r.count}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="ichat-input-wrap">
            {showEmoji && (
              <div className="ichat-emoji-popup open">
                {['😀', '😂', '😍', '👍', '🙏', '🎉', '❤️', '😢', '🔥', '👏', '✅', '😅', '🤔', '🙌'].map((e, idx) => (
                  <button key={idx} className="ichat-emoji-item" onClick={() => addEmoji(e)}>{e}</button>
                ))}
              </div>
            )}
            <div className="ichat-toolbar">
              <button className="ichat-tool-btn" title="Emoji" onClick={() => setShowEmoji(!showEmoji)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>
              </button>
              <button className="ichat-tool-btn" title="Đính kèm tệp"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button>
              <button className="ichat-tool-btn" title="Gửi ảnh"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></button>
              <button className="ichat-tool-btn" title="Nhắc tên">@</button>
            </div>
            <div className="ichat-input-row">
              <input
                className="ichat-input"
                type="text"
                placeholder={`Nhập tin nhắn tới ${activeChannel?.name || 'Phòng Tư vấn tuyển sinh'}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="ichat-send" onClick={handleSendMessage}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT INFO PANEL */}
        {showInfoPanel && (
          <div className="ichat-panel">
            <div className="ichat-info-tabs">
              <button className={`ichat-info-tab ${activeInfoTab === 'members' ? 'active' : ''}`} onClick={() => setActiveInfoTab('members')}>Thành viên</button>
              <button className={`ichat-info-tab ${activeInfoTab === 'pins' ? 'active' : ''}`} onClick={() => setActiveInfoTab('pins')}>Đã ghim</button>
              <button className={`ichat-info-tab ${activeInfoTab === 'files' ? 'active' : ''}`} onClick={() => setActiveInfoTab('files')}>Tệp</button>
            </div>

            <div className="ichat-info-body">
              {activeInfoTab === 'members' && (
                <div className="ichat-info-section active">
                  <div className="ichat-member-row"><div className="avatar">TK</div><div><div className="ichat-member-name">Trần Minh Khoa</div><div className="ichat-member-role">Trưởng nhóm tư vấn</div></div><span className="ichat-member-status" style={{ background: 'var(--green)' }}></span></div>
                  <div className="ichat-member-row"><div className="avatar">LH</div><div><div className="ichat-member-name">Lê Thị Hồng</div><div className="ichat-member-role">Tư vấn viên</div></div><span className="ichat-member-status" style={{ background: 'var(--green)' }}></span></div>
                  <div className="ichat-member-row"><div className="avatar">VN</div><div><div className="ichat-member-name">Vũ Hoàng Nam</div><div className="ichat-member-role">Chăm sóc khách hàng</div></div><span className="ichat-member-status" style={{ background: 'var(--green)' }}></span></div>
                  <div className="ichat-member-row"><div className="avatar">MH</div><div><div className="ichat-member-name">Minh Hằng</div><div className="ichat-member-role">Quản trị viên</div></div><span className="ichat-member-status" style={{ background: 'var(--text-faint)' }}></span></div>
                </div>
              )}

              {activeInfoTab === 'pins' && (
                <div className="ichat-info-section active">
                  <div className="ichat-pin-item">
                    <div className="ichat-pin-item-head"><span className="ichat-pin-item-name">Trần Minh Khoa</span><span className="ichat-pin-item-date">19/08</span></div>
                    <div className="ichat-pin-item-text">Checklist hồ sơ mới áp dụng từ 01/09 — xem file đính kèm.</div>
                  </div>
                  <div className="ichat-pin-item">
                    <div className="ichat-pin-item-head"><span className="ichat-pin-item-name">Minh Hằng</span><span className="ichat-pin-item-date">02/08</span></div>
                    <div className="ichat-pin-item-text">Lịch họp giao ban hàng tuần: 9h00 sáng thứ Hai tại phòng họp A.</div>
                  </div>
                </div>
              )}

              {activeInfoTab === 'files' && (
                <div className="ichat-info-section active">
                  <div className="ichat-attach-row">
                    <div className="ichat-attach-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg></div>
                    <div><div className="ichat-attach-name">Checklist_HoSo_Visa_My_2026.pdf</div><div className="ichat-attach-meta">2.4 MB · 19/08</div></div>
                  </div>
                  <div className="ichat-attach-row">
                    <div className="ichat-attach-icon" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>
                    <div><div className="ichat-attach-name">IMG_2451.jpg</div><div className="ichat-attach-meta">1.1 MB · 19/08</div></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="modal-overlay open" onClick={(e) => e.target.classList.contains('modal-overlay') && setShowCreateModal(false)}>
          <div className="modal-card">
            <div className="modal-head">
              <h3>Tạo nhóm mới</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-field"><label>Tên nhóm</label><input type="text" placeholder="VD: Phòng Marketing" /></div>
              <div className="form-field"><label>Mô tả (không bắt buộc)</label><input type="text" placeholder="Chủ đề trao đổi của nhóm..." /></div>
              <div className="form-field">
                <label>Thêm thành viên</label>
                <div className="modal-member-list">
                  <div className="modal-member-row"><div className="avatar">TK</div><label>Trần Minh Khoa</label><input type="checkbox" defaultChecked /></div>
                  <div className="modal-member-row"><div className="avatar">LH</div><label>Lê Thị Hồng</label><input type="checkbox" defaultChecked /></div>
                  <div className="modal-member-row"><div className="avatar">NĐ</div><label>Nguyễn Văn Đạt</label><input type="checkbox" /></div>
                  <div className="modal-member-row"><div className="avatar">QB</div><label>Đặng Quốc Bảo</label><input type="checkbox" /></div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={() => setShowCreateModal(false)}>Tạo nhóm</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
