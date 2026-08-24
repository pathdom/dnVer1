import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

export default function ConsultPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch('/api/consultations')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="page active">
      <Topbar
        eyebrow={data?.date || "Thứ Tư, 19/08/2026"}
        title="Lịch tư vấn"
        subtitle="Các buổi hẹn tư vấn trong ngày hôm nay."
        rightAction={
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Đặt lịch mới
          </button>
        }
      />

      <div className="panel">
        <div className="panel-head">
          <h3>Hôm nay — {data?.count || 5} buổi hẹn</h3>
        </div>
        <div className="consult-list">
          {(data?.schedule || []).map((item) => (
            <div className="consult-row" key={item.id}>
              <div className="consult-time">{item.time}</div>
              <div className="cell-person">
                <div className="avatar">{item.avatar}</div>
                <div className="consult-info">
                  <div className="cell-name">
                    {item.name} {item.isNew && <span className="stamp stamp-new" style={{ transform: 'none', padding: '2px 6px', fontSize: '9px' }}>Khách mới</span>}
                  </div>
                  <div className="cell-sub">Tư vấn viên: {item.advisor}</div>
                </div>
              </div>
              <span className={`consult-mode ${item.mode === 'office' ? 'mode-office' : 'mode-online'}`}>
                {item.modeText}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
