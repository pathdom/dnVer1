import React from 'react';

export default function StaffApptPage() {
  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">Thứ Tư, 19/08/2026</div>
          <h1>Lịch tư vấn</h1>
          <p>Các buổi hẹn với học viên trong ngày và tuần này.</p>
        </div>
        <div className="topbar-right">
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Đặt lịch mới
          </button>
        </div>
      </div>

      <div className="appt-card">
        <div className="appt-left">
          <div className="appt-date-box"><div className="d">09</div><div className="m">Th8</div></div>
          <div className="appt-info">
            <div className="title">Vũ Ngọc Mai</div>
            <div className="meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>09:00 — 09:45</span>
              <span className="stamp stamp-gold">Tại văn phòng</span>
            </div>
          </div>
        </div>
        <div className="appt-actions">
          <button className="btn-ghost">Đổi lịch</button>
          <button className="btn-primary">Xem hồ sơ</button>
        </div>
      </div>

      <div className="appt-card">
        <div className="appt-left">
          <div className="appt-date-box"><div className="d">10</div><div className="m">Th8</div></div>
          <div className="appt-info">
            <div className="title">Lý Minh Quân</div>
            <div className="meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>10:30 — 11:15</span>
              <span className="stamp stamp-teal">Online — Zoom</span>
            </div>
          </div>
        </div>
        <div className="appt-actions">
          <button className="btn-ghost">Đổi lịch</button>
          <button className="btn-primary">Tham gia</button>
        </div>
      </div>

      <div className="appt-card">
        <div className="appt-left">
          <div className="appt-date-box"><div className="d">15</div><div className="m">Th8</div></div>
          <div className="appt-info">
            <div className="title">Nguyễn Thị Lan Anh</div>
            <div className="meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>15:00 — 15:45</span>
              <span className="stamp stamp-teal">Online — Google Meet</span>
            </div>
          </div>
        </div>
        <div className="appt-actions">
          <button className="btn-ghost">Đổi lịch</button>
          <button className="btn-primary">Tham gia</button>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '6px' }}>
        <div className="panel-head"><h3>Lịch tuần này</h3></div>
        <div className="consult-list">
          <div className="consult-row"><div className="consult-time">T5</div><div className="cell-person"><div className="avatar">GB</div><div><div className="cell-name">Đỗ Gia Bảo</div><div className="cell-sub">09:30 · Online</div></div></div></div>
          <div className="consult-row"><div class="consult-time">T6</div><div className="cell-person"><div className="avatar">AT</div><div><div className="cell-name">Bùi Anh Tuấn</div><div className="cell-sub">14:00 · Tại văn phòng</div></div></div></div>
          <div className="consult-row"><div className="consult-time">T7</div><div className="cell-person"><div className="avatar">TT</div><div><div className="cell-name">Hoàng Thị Thu Trang</div><div className="cell-sub">10:00 · Online</div></div></div></div>
        </div>
      </div>
    </section>
  );
}
