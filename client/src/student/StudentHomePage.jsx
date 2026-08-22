import React from 'react';

export default function StudentHomePage({ setCurrentTab, profile }) {
  return (
    <section className="portal-page active">
      <div className="hero-card">
        <div className="hero-left">
          <div className="eyebrow">Hành trình du học của bạn</div>
          <h2>Chào {profile?.name?.split(' ').pop() || 'Lan Anh'}, bạn đang tiến rất tốt! 🎉</h2>
          <p>Hồ sơ của bạn đã hoàn tất 4/6 giai đoạn. Bước tiếp theo: chờ xác nhận nhập học và chuẩn bị lên đường vào 08/2027.</p>
          <button className="hero-cta" onClick={() => setCurrentTab('profile')}>
            Xem lộ trình chi tiết
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
        <div className="progress-ring">
          <div className="progress-ring-inner">
            <div className="progress-ring-value">68%</div>
            <div className="progress-ring-label">Hoàn thành</div>
          </div>
        </div>
      </div>

      <div className="quick-grid">
        <div className="quick-card">
          <div className="quick-icon" style={{ background: 'var(--teal-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
          </div>
          <div className="quick-value">{profile?.school || 'Boston University'}</div>
          <div className="quick-label">{profile?.program || 'Cử nhân QTKD'} · {profile?.intake || 'Thu 2027'}</div>
        </div>
        <div className="quick-card">
          <div className="quick-icon" style={{ background: '#E7EEFC' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </div>
          <div className="quick-value">22/08 · 15:00</div>
          <div className="quick-label">Buổi tư vấn tiếp theo — Online</div>
        </div>
        <div className="quick-card">
          <div className="quick-icon" style={{ background: 'var(--gold-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div className="quick-value">1 tài liệu</div>
          <div className="quick-label">Đang chờ bạn bổ sung</div>
        </div>
        <div className="quick-card">
          <div className="quick-icon" style={{ background: 'var(--coral-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          </div>
          <div className="quick-value">300 triệu ₫</div>
          <div className="quick-label">Học phí đợt 1 — hạn 20/09</div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-head">
            <h3>Tin nhắn gần đây</h3>
            <span className="link" onClick={() => setCurrentTab('chat')}>Xem tất cả →</span>
          </div>
          <div className="msg-preview">
            <div className="msg-preview-row">
              <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>TK</div>
              <div>
                <div className="msg-bubble-mini">Chào Lan Anh, thư mời nhập học của em đã được trường xác nhận rồi nhé. Chị sẽ gửi hướng dẫn bước tiếp theo qua email.</div>
                <div className="msg-time">Trần Minh Khoa · 2 giờ trước</div>
              </div>
            </div>
            <div className="msg-preview-row">
              <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>TK</div>
              <div>
                <div className="msg-bubble-mini">Em nhớ chuẩn bị hộ chiếu bản gốc cho buổi tư vấn ngày 22/08 nha.</div>
                <div className="msg-time">Trần Minh Khoa · Hôm qua</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Thông báo</h3></div>
          <div className="notif-list">
            <div className="notif-row">
              <div className="notif-dot" style={{ background: 'var(--green)' }}></div>
              <div><div className="notif-text">Hồ sơ visa của bạn đã được <strong>chấp thuận</strong>.</div><div className="notif-time">12/08/2026</div></div>
            </div>
            <div className="notif-row">
              <div className="notif-dot" style={{ background: 'var(--gold)' }}></div>
              <div><div className="notif-text">Vui lòng bổ sung <strong>thư mời nhập học bản dịch công chứng</strong>.</div><div className="notif-time">05/08/2026</div></div>
            </div>
            <div className="notif-row">
              <div className="notif-dot" style={{ background: 'var(--teal)' }}></div>
              <div><div className="notif-text">Lịch tư vấn mới đã được đặt: 22/08 lúc 15:00.</div><div class="notif-time">03/08/2026</div></div>
            </div>
            <div className="notif-row">
              <div className="notif-dot" style={{ background: 'var(--coral)' }}></div>
              <div><div className="notif-text">Học phí đợt 1 sẽ đến hạn trong <strong>31 ngày</strong>.</div><div className="notif-time">01/08/2026</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
