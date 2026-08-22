import React, { useState } from 'react';

export default function StaffChatPage() {
  const [activeContact, setActiveContact] = useState('LA');
  const [messages, setMessages] = useState([
    { id: 1, text: 'Chào Lan Anh, chúc mừng em đã được cấp Visa F-1! 🎉', time: '09:02', isMe: true, avatar: 'TK' },
    { id: 2, text: 'Dạ em cảm ơn chị nhiều ạ, em vui quá! Bước tiếp theo em cần chuẩn bị gì ạ?', time: '09:05', isMe: false, avatar: 'LA' },
    { id: 3, text: 'Em chờ trường gửi thư xác nhận nhập học chính thức nhé. Trong lúc đó chuẩn bị bản dịch công chứng thư mời nhập học giúp chị.', time: '09:07', isMe: true, avatar: 'TK' },
    { id: 4, text: 'Dạ em hiểu rồi ạ, em sẽ làm ngay trong tuần này.', time: '09:10', isMe: false, avatar: 'LA' }
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMsg = {
      id: Date.now(),
      text: inputText,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      avatar: 'TK'
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">3 hội thoại</div>
          <h1>Tin nhắn</h1>
          <p>Trao đổi với các học viên bạn đang phụ trách.</p>
        </div>
      </div>

      <div className="chat-layout">
        <div className="chat-contacts">
          <div className={`contact-row ${activeContact === 'LA' ? 'active' : ''}`} onClick={() => setActiveContact('LA')}>
            <div className="avatar">LA</div>
            <div className="contact-info">
              <div className="contact-name">Nguyễn Thị Lan Anh</div>
              <div className="contact-preview">Dạ em cảm ơn chị nhiều ạ...</div>
            </div>
            <div className="contact-meta"><span className="contact-time">09:10</span></div>
          </div>
          <div className={`contact-row ${activeContact === 'KL' ? 'active' : ''}`} onClick={() => setActiveContact('KL')}>
            <div className="avatar">KL</div>
            <div className="contact-info">
              <div className="contact-name">Trịnh Khánh Linh</div>
              <div className="contact-preview">Em chưa rõ về học bổng ạ...</div>
            </div>
            <div className="contact-meta">
              <span className="contact-time">Hôm qua</span>
              <span className="unread-dot"></span>
            </div>
          </div>
          <div className={`contact-row ${activeContact === 'BC' ? 'active' : ''}`} onClick={() => setActiveContact('BC')}>
            <div className="avatar">BC</div>
            <div className="contact-info">
              <div className="contact-name">Trần Bảo Châu</div>
              <div className="contact-preview">Em cảm ơn anh đã tư vấn</div>
            </div>
            <div className="contact-meta"><span className="contact-time">2 ngày</span></div>
          </div>
        </div>

        <div className="chat-wrap">
          <div className="chat-head">
            <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '13px' }}>{activeContact}</div>
            <div>
              <div className="name">{activeContact === 'LA' ? 'Nguyễn Thị Lan Anh' : activeContact === 'KL' ? 'Trịnh Khánh Linh' : 'Trần Bảo Châu'}</div>
              <div className="role">Học viên phụ trách · Đang hoạt động</div>
            </div>
          </div>
          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-row ${msg.isMe ? 'me' : 'them'}`}>
                <div className="avatar">{msg.avatar}</div>
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
