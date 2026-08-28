import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

export default function StaffCompetencyPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/staff/competency-results')
      .then(res => res.json())
      .then(d => { setResults(d.results || []); setLoading(false); })
      .catch(err => { console.error('Fetch error:', err); setLoading(false); });
  }, []);

  const passCount = results.filter(r => r.result === 'Đạt').length;
  const avgScore = results.length ? (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(1) : '0';

  return (
    <section className="page active">
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: '700', color: 'var(--navy)', margin: '0 0 4px' }}>Bài test</h1>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)' }}>Kết quả các bài test năng lực bạn đã làm, do quản trị viên nhập sau khi chấm.</div>
      </div>

      <div className="stat-grid" style={{ marginBottom: '18px' }}>
        <div className="stat-card">
          <div className="stat-value">{results.length}</div>
          <div className="stat-label">Tổng bài đã làm</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{passCount}</div>
          <div className="stat-label">Đạt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}</div>
          <div className="stat-label">Điểm trung bình</div>
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Bài test</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Điểm</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kết quả</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhận xét</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày làm</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải kết quả...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Bạn chưa có kết quả test năng lực nào.</td></tr>
              ) : (
                results.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--navy)' }}>{r.examName}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{r.score}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={r.ratingTier === 'pass' ? 'stamp stamp-green' : 'stamp stamp-gray'}>{r.result}</span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.note || 'Chưa có nhận xét'}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{r.takenAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
