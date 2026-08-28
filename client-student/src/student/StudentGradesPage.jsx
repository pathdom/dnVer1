import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const SKILLS = [
  { key: 'tuVung', label: 'Từ vựng' },
  { key: 'nguPhap', label: 'Ngữ pháp' },
  { key: 'hanTu', label: 'Hán tự' },
  { key: 'nghe', label: 'Nghe' },
  { key: 'hoiThoai', label: 'Hội thoại' }
];
const MONTHS = [1, 2, 3, 4, 5, 6];

function scoreColor(score) {
  if (score === null || score === undefined) return { text: 'var(--text-faint)', bg: 'transparent' };
  if (score >= 8) return { text: 'var(--green)', bg: 'var(--green-soft)' };
  if (score >= 6.5) return { text: 'var(--teal)', bg: 'var(--teal-soft)' };
  if (score >= 5) return { text: 'var(--gold)', bg: 'var(--gold-soft)' };
  return { text: 'var(--coral)', bg: 'var(--coral-soft)' };
}

function average(values) {
  const nums = values.filter(v => v !== null && v !== undefined);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/student/grades')
      .then(res => res.json())
      .then(d => { setGrades(d.grades || { thang1: {}, thang2: {}, thang3: {}, thang4: {}, thang5: {}, thang6: {} }); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const hasAnyData = grades && MONTHS.some(m => Object.keys(grades[`thang${m}`] || {}).length > 0);

  if (loading) {
    return (
      <section className="portal-page active">
        <div className="panel">
          <div className="panel-title">Bảng điểm theo tháng</div>
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải dữ liệu điểm...</div>
        </div>
      </section>
    );
  }

  if (!hasAnyData) {
    return (
      <section className="portal-page active">
        <div className="panel">
          <div className="panel-title">Bảng điểm theo tháng</div>
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div className="empty-state-title">Chưa có dữ liệu điểm</div>
            <div className="empty-state-sub">
              Kết quả học tập theo từng tháng sẽ được tư vấn viên và quản trị viên cập nhật tại đây khi hồ sơ của bạn có dữ liệu điểm.
            </div>
            <div className="semester-pill-row">
              {MONTHS.map(m => <span className="stamp stamp-teal" key={m}>Tháng {m}</span>)}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const monthAverages = MONTHS.map(m => average(SKILLS.map(s => grades[`thang${m}`]?.[s.key])));

  return (
    <section className="portal-page active">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        {MONTHS.map((m, i) => {
          const avg = monthAverages[i];
          const c = scoreColor(avg);
          return (
            <div key={m} style={{ flex: '1 1 0', minWidth: '120px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '19px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.text }}>{avg !== null ? avg.toFixed(1) : '—'}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginTop: '4px' }}>Tháng {m}</div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-title">Bảng điểm theo tháng</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-faint)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Kỹ năng</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-faint)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Tháng {m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SKILLS.map(skill => (
                <tr key={skill.key}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>{skill.label}</td>
                  {MONTHS.map(m => {
                    const score = grades[`thang${m}`]?.[skill.key] ?? null;
                    const c = scoreColor(score);
                    return (
                      <td key={m} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                        {score !== null ? (
                          <span style={{ display: 'inline-block', minWidth: '44px', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.text, background: c.bg }}>
                            {score.toFixed(1)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-faint)' }}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '12px', fontWeight: 700, color: 'var(--navy)' }}>Trung bình</td>
                {monthAverages.map((avg, i) => {
                  const c = scoreColor(avg);
                  return (
                    <td key={i} style={{ padding: '12px', textAlign: 'center' }}>
                      {avg !== null ? (
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.text }}>{avg.toFixed(1)}</span>
                      ) : (
                        <span style={{ color: 'var(--text-faint)' }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
