import React from 'react';

function formatVND(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export default function StudentHomePage({ setCurrentTab, profile }) {
  const total = Number(profile?.totalAmount) || 0;
  const paid = Number(profile?.paidAmount) || 0;
  const remaining = total - paid;
  const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <section className="portal-page active">
      <div className="hero-card">
        <div className="hero-left">
          <h1>Chào {profile?.name?.split(' ').pop() || 'bạn'} 👋</h1>
          <p>Đây là tổng quan hồ sơ du học của bạn tại ALADDIN Education.</p>
          <div className="hero-meta">
            <div className="hero-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              {profile?.statusText || 'Đang cập nhật'}
            </div>
            <div className="hero-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
              {profile?.country || 'Chưa cập nhật'} · {profile?.program || 'Chưa cập nhật'}
            </div>
          </div>
          <button className="btn-primary" style={{ marginTop: '22px' }} onClick={() => setCurrentTab('profile')}>
            Xem chi tiết hồ sơ
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
        <div className="hero-right">
          <div className="progress-ring-card">
            <div>
              <div className="ring-val">{percentPaid}%</div>
              <div className="ring-lbl">Học phí đã đóng</div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-grid">
        <div className="quick-card" onClick={() => setCurrentTab('profile')}>
          <div className="quick-icon" style={{ background: 'var(--teal-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
          </div>
          <div>
            <div className="quick-title">{profile?.country || 'Chưa cập nhật'}</div>
            <div className="quick-sub">{profile?.program || 'Chương trình chưa cập nhật'}</div>
          </div>
        </div>

        <div className="quick-card" onClick={() => setCurrentTab('profile')}>
          <div className="quick-icon" style={{ background: '#E7EEFC' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="quick-title">{profile?.advisor?.name || 'Chưa phân công'}</div>
            <div className="quick-sub">{profile?.advisor?.role || 'Tư vấn viên phụ trách'}</div>
          </div>
        </div>

        <div className="quick-card" onClick={() => setCurrentTab('payment')}>
          <div className="quick-icon" style={{ background: 'var(--coral-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          </div>
          <div>
            <div className="quick-title">{formatVND(remaining)}</div>
            <div className="quick-sub">Học phí còn lại</div>
          </div>
        </div>
      </div>
    </section>
  );
}
