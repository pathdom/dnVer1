import React, { useEffect, useState } from 'react';

export default function StudentApptPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/student/appointments')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  const appt = data?.upcoming || {
    title: 'Tư vấn chuẩn bị nhập học',
    date: '22',
    month: 'Th8',
    time: '15:00 — 15:45',
    advisor: 'Trần Minh Khoa',
    mode: 'Online — Zoom'
  };

  return (
    <section className="portal-page active">
      <div className="page-title-row">
        <div>
          <h1>Lịch tư vấn</h1>
          <p>Các buổi tư vấn sắp tới và lịch sử làm việc với tư vấn viên.</p>
        </div>
        <button className="btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
          Đặt lịch mới
        </button>
      </div>

      <div className="appt-card">
        <div className="appt-left">
          <div className="appt-date-box">
            <div className="d">{appt.date}</div>
            <div className="m">{appt.month}</div>
          </div>
          <div className="appt-info">
            <div className="title">{appt.title}</div>
            <div className="meta">
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>{appt.time}</span>
              <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{appt.advisor}</span>
              <span className="stamp stamp-teal">{appt.mode}</span>
            </div>
          </div>
        </div>
        <div className="appt-actions">
          <button className="btn-ghost">Đổi lịch</button>
          <button className="btn-primary" onClick={() => window.open(appt.zoomLink || '#', '_blank')}>Tham gia ngay</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Lịch sử buổi tư vấn</h3></div>
        <div className="mini-timeline">
          {(data?.history || [
            { title: 'Luyện phỏng vấn Visa', date: '15/07/2026 · Trần Minh Khoa · Tại văn phòng' },
            { title: 'Hướng dẫn chuẩn bị hồ sơ', date: '15/04/2026 · Trần Minh Khoa · Online' },
            { title: 'Tư vấn chọn trường & ngành học', date: '18/02/2026 · Trần Minh Khoa · Tại văn phòng' }
          ]).map((item, idx) => (
            <div className="mini-timeline-item" key={idx}>
              <div className="mini-timeline-dot-col">
                <div className="mini-timeline-dot"></div>
                <div className="mini-timeline-track"></div>
              </div>
              <div>
                <div className="mini-timeline-title">{item.title}</div>
                <div className="mini-timeline-date">{item.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
