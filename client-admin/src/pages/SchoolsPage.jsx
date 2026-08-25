import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const COUNTRY_FLAGS = {
  'Nhật Bản': '🇯🇵', 'Hàn Quốc': '🇰🇷', 'Đức': '🇩🇪', 'Úc': '🇦🇺', 'Canada': '🇨🇦',
  'Mỹ': '🇺🇸', 'Anh': '🇬🇧', 'Pháp': '🇫🇷', 'Đài Loan': '🇹🇼', 'Singapore': '🇸🇬',
  'Trung Quốc': '🇨🇳', 'New Zealand': '🇳🇿', 'Hà Lan': '🇳🇱'
};
function countryFlag(country) {
  return COUNTRY_FLAGS[country] || '🌍';
}
function statusStampClass(status = '') {
  if (status.includes('triển khai') || status.includes('Hoạt động')) return 'stamp stamp-active';
  if (status.includes('Hoàn thành')) return 'stamp stamp-submitted';
  if (status.includes('dừng') || status.includes('hoãn') || status.includes('Hủy')) return 'stamp stamp-hold';
  if (status.includes('kế hoạch') || status.includes('Chuẩn bị')) return 'stamp stamp-processing';
  return 'stamp stamp-new';
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/schools')
      .then(res => res.json())
      .then(d => setSchools(d.schools || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${schools.length} dự án`}
        title="Trường đối tác"
        subtitle="Các chiến dịch tuyển sinh du học đang triển khai theo từng quốc gia đối tác."
        rightAction={
          <button className="btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm dự án
          </button>
        }
      />

      {!loading && schools.length === 0 && (
        <div className="school-card" style={{ textAlign: 'center', color: 'var(--text-soft)' }}>
          Chưa có dự án tuyển sinh nào được tạo.
        </div>
      )}

      <div className="school-grid">
        {schools.map((s) => (
          <div className="school-card" key={s.id}>
            <div className="school-top">
              <div className="school-logo">{countryFlag(s.country)}</div>
              <div>
                <div className="school-name">{s.name}</div>
                <div className="school-country">{s.country} · {s.maDuAn}</div>
              </div>
            </div>

            <div className="school-stats">
              <div>
                <div className="school-stat-num">{s.quota}</div>
                <div className="school-stat-label">Chỉ tiêu</div>
              </div>
              <div>
                <div className="school-stat-num" style={{ fontSize: 14.5 }}>{s.budgetFormatted}</div>
                <div className="school-stat-label">Ngân sách</div>
              </div>
            </div>

            <div className="tag-row" style={{ marginBottom: 10 }}>
              <span className={statusStampClass(s.statusText)}>{s.statusText}</span>
            </div>
            <div className="tag-row">
              <span className="tag">{s.startDate} → {s.endDate}</span>
              <span className="tag">{s.managerName ? 'QL: ' + s.managerName : 'Chưa phân công'}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
