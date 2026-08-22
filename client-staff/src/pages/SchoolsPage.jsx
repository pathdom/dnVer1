import React, { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    fetch('/api/schools')
      .then(res => res.json())
      .then(d => setSchools(d.schools))
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${schools.length} đối tác`}
        title="Trường đối tác"
        subtitle="Danh sách trường quốc tế đang liên kết tuyển sinh với VietBridge."
        rightAction={
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm trường
          </button>
        }
      />

      <div className="school-grid">
        {schools.map((s) => (
          <div className="school-card" key={s.id}>
            <div className="school-top">
              <div className="school-logo">{s.logo}</div>
              <div>
                <div className="school-name">{s.name}</div>
                <div className="school-country">{s.country}</div>
              </div>
            </div>
            <div className="school-stats">
              <div>
                <div className="school-stat-num">{s.students}</div>
                <div className="school-stat-label">Du học sinh</div>
              </div>
              <div>
                <div className="school-stat-num">{s.rating}</div>
                <div className="school-stat-label">Đánh giá</div>
              </div>
            </div>
            <div className="tag-row">
              {s.tags.map((tag, idx) => (
                <span className="tag" key={idx}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
