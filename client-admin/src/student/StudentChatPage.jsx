import React, { useEffect, useState } from 'react';

export default function StudentChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    fetch('/api/student/chat')
      .then(res => res.json())
      .then(msgs => setMessages(msgs))
      .catch(err => console.error(err));
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;

    fetch('/api/student/chat', {
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

  return (
    <section className="portal-page active">
      <div className="page-title-row">
        <div>
          <h1>Tin nhắn</h1>
          <p>Trao đổi trực tiếp với tư vấn viên phụ trách hồ sơ của bạn.</p>
        </div>
      </div>

      <div className="chat-wrap">
        <div className="chat-head">
          <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '13px' }}>TK</div>
          <div>
            <div className="name">Trần Minh Khoa</div>
            <div className="role">Tư vấn viên phụ trách · Đang hoạt động</div>
          </div>
        </div>

        <div className="chat-body">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-row ${msg.isMe ? 'me' : 'them'}`}>
              <div className="avatar">{msg.avatar || (msg.isMe ? 'LA' : 'TK')}</div>
              <div>
                <div className="chat-bubble">{msg.text}</div>
                <div className="chat-stamp">{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            className="chat-input"
            type="text"
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="chat-send" onClick={handleSend}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
