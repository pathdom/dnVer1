import React, { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';

export default function OverviewPage({ setCurrentPage, setSelectedStudentId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/overview')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  const getStampClass = (status) => {
    switch (status) {
      case 'visa': return 'stamp stamp-visa';
      case 'processing': return 'stamp stamp-processing';
      case 'new': return 'stamp stamp-new';
      case 'submitted': return 'stamp stamp-submitted';
      default: return 'stamp stamp-new';
    }
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow="Thứ Tư, 19/08/2026"
        title="Chào mừng trở lại, Hằng 👋"
        subtitle="Đây là tình hình hoạt động của trung tâm hôm nay."
        searchPlaceholder="Tìm học viên, hồ sơ..."
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--teal-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
            </div>
            <div className="stat-trend trend-up">↑ 8.2%</div>
          </div>
          <div className="stat-value">{data?.stats?.activeStudents || 156}</div>
          <div className="stat-label">Học viên đang xử lý</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--gold-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>
            </div>
            <div className="stat-trend trend-up">↑ 12%</div>
          </div>
          <div className="stat-value">{data?.stats?.newProfilesMonth || 24}</div>
          <div className="stat-label">Hồ sơ mới trong tháng</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: '#E7EEFC' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div className="stat-trend trend-flat">Hôm nay</div>
          </div>
          <div className="stat-value">05</div>
          <div className="stat-label">Buổi tư vấn hôm nay</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--green-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
            <div className="stat-trend trend-up">↑ 5.4%</div>
          </div>
          <div className="stat-value">{data?.stats?.monthlyRevenue || '1.85 tỷ'}</div>
          <div className="stat-label">Doanh thu tháng này (₫)</div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-head">
            <h3>Học viên cập nhật gần đây</h3>
            <span className="link" onClick={() => setCurrentPage('students')}>Xem tất cả →</span>
          </div>
          <div className="panel-body">
            <table className="table">
              <thead>
                <tr><th>Học viên</th><th>Quốc gia</th><th>Trạng thái</th></tr>
              </thead>
              <tbody>
                {(data?.recentStudents || []).map((s) => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedStudentId(s.id); setCurrentPage('student-detail'); }}>
                    <td>
                      <div className="cell-person">
                        <div className="avatar">{s.avatar}</div>
                        <div>
                          <div className="cell-name">{s.name}</div>
                          <div className="cell-sub">{s.program}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.country}</td>
                    <td><span className={getStampClass(s.status)}>{s.statusText}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Quốc gia du học</h3></div>
          <div className="dest-list">
            {(data?.destinations || []).map((d, i) => (
              <div className="dest-row" key={i}>
                <span className="dest-name">{d.country}</span>
                <div className="dest-bar-track">
                  <div className="dest-bar-fill" style={{ width: `${d.percent}%` }}></div>
                </div>
                <span className="dest-count">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
