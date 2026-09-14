import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const SKILLS = [
  { key: 'diem_tu_vung', label: 'Từ vựng' },
  { key: 'diem_ngu_phap', label: 'Ngữ pháp' },
  { key: 'diem_han_tu', label: 'Hán tự' },
  { key: 'diem_nghe', label: 'Nghe' },
  { key: 'diem_hoi_thoai', label: 'Hội thoại' }
];

function scoreColor(score) {
  if (score === null || score === undefined) return { text: 'var(--text-faint)', bg: 'transparent' };
  if (score >= 8) return { text: 'var(--green)', bg: 'var(--green-soft)' };
  if (score >= 6.5) return { text: 'var(--teal)', bg: 'var(--teal-soft)' };
  if (score >= 5) return { text: 'var(--gold)', bg: 'var(--gold-soft)' };
  return { text: 'var(--coral)', bg: 'var(--coral-soft)' };
}

function rowAverage(row) {
  const vals = SKILLS.map(s => row[s.key]).filter(v => v !== null && v !== undefined && v !== '').map(Number);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export default function StudentGradesPage() {
  const [gradeType, setGradeType] = useState('tuan');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/student/grades?loai=${gradeType}`)
      .then(res => res.json())
      .then(d => setRows(d.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [gradeType]);

  const filterToggle = (
    <div style={{ display: 'flex', border: '1.5px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
      {[{ key: 'tuan', label: 'Tuần' }, { key: 'thang', label: 'Tháng' }].map(t => (
        <button
          key={t.key} type="button" onClick={() => setGradeType(t.key)}
          style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', background: gradeType === t.key ? 'var(--teal)' : 'var(--bg)', color: gradeType === t.key ? '#fff' : 'var(--text)' }}
        >{t.label}</button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <section className="portal-page active">
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Bảng điểm học tập</div>
            {filterToggle}
          </div>
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải dữ liệu điểm...</div>
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="portal-page active">
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="panel-title" style={{ marginBottom: 0 }}>Bảng điểm học tập</div>
            {filterToggle}
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div className="empty-state-title">Chưa có dữ liệu điểm</div>
            <div className="empty-state-sub">
              Kết quả học tập theo {gradeType === 'tuan' ? 'tuần' : 'tháng'} sẽ được tư vấn viên và quản trị viên cập nhật tại đây khi hồ sơ của bạn có dữ liệu điểm.
            </div>
          </div>
        </div>
      </section>
    );
  }

  const rowAverages = rows.map(r => rowAverage(r));

  return (
    <section className="portal-page active">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto' }}>
        {rows.map((r, i) => {
          const avg = rowAverages[i];
          const c = scoreColor(avg);
          return (
            <div key={i} style={{ flex: '1 1 0', minWidth: '120px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow)', padding: '14px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '19px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.text }}>{avg !== null ? avg.toFixed(1) : '—'}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginTop: '4px' }}>{r.nhan}</div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>Bảng điểm học tập</div>
          {filterToggle}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-faint)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Thời gian</th>
                {SKILLS.map(s => (
                  <th key={s.key} style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-faint)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{s.label}</th>
                ))}
                <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-faint)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>Điểm TB</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--navy)', borderBottom: '1px solid var(--border)' }}>{r.nhan}</td>
                  {SKILLS.map(s => {
                    const score = r[s.key] !== null && r[s.key] !== undefined ? Number(r[s.key]) : null;
                    const c = scoreColor(score);
                    return (
                      <td key={s.key} style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
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
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                    {rowAverages[i] !== null ? (
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: scoreColor(rowAverages[i]).text }}>{rowAverages[i].toFixed(1)}</span>
                    ) : (
                      <span style={{ color: 'var(--text-faint)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
