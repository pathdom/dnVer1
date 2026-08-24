import React from 'react';

function formatVND(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

export default function StudentPaymentPage({ profile }) {
  const total = Number(profile?.totalAmount) || 0;
  const paid = Number(profile?.paidAmount) || 0;
  const remaining = total - paid;
  const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  return (
    <section className="portal-page active">
      <div className="quick-grid">
        <div className="quick-card" style={{ cursor: 'default' }}>
          <div className="quick-icon" style={{ background: '#E7EEFC' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          </div>
          <div>
            <div className="quick-title">{formatVND(total)}</div>
            <div className="quick-sub">Tổng học phí chương trình</div>
          </div>
        </div>

        <div className="quick-card" style={{ cursor: 'default' }}>
          <div className="quick-icon" style={{ background: 'var(--green-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <div>
            <div className="quick-title">{formatVND(paid)}</div>
            <div className="quick-sub">Đã thanh toán</div>
          </div>
        </div>

        <div className="quick-card" style={{ cursor: 'default' }}>
          <div className="quick-icon" style={{ background: 'var(--coral-soft)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div>
            <div className="quick-title">{formatVND(remaining)}</div>
            <div className="quick-sub">Còn lại</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Tiến độ thanh toán</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13.5px', fontWeight: 600, color: 'var(--navy)' }}>
          <span>Đã đóng {percentPaid}%</span>
          <span style={{ color: 'var(--text-soft)', fontWeight: 500 }}>{formatVND(paid)} / {formatVND(total)}</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${percentPaid}%` }}></div>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text-soft)', marginTop: '20px', lineHeight: 1.6 }}>
          Liên hệ tư vấn viên phụ trách nếu bạn cần thông tin chi tiết các đợt đóng học phí hoặc muốn cập nhật kế hoạch thanh toán.
        </p>
      </div>
    </section>
  );
}
