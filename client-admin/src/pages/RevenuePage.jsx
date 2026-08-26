import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

function TrendBadge({ pct }) {
  if (pct > 0) return <div className="stat-trend trend-up">↑ {pct}%</div>;
  if (pct < 0) return <div className="stat-trend" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>↓ {Math.abs(pct)}%</div>;
  return <div className="stat-trend trend-flat">0%</div>;
}

export default function RevenuePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    apiFetch('/api/revenue')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  const period = data?.period;
  const periodLabel = period ? `Tháng ${String(period.month).padStart(2, '0')}/${period.year}` : '';

  return (
    <section className="page active">
      <Topbar
        eyebrow={periodLabel}
        title="Báo cáo doanh thu"
        subtitle="Tổng hợp từ số tiền học viên đóng, cập nhật mỗi khi hồ sơ học viên thay đổi."
        rightAction={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              {periodLabel}
            </button>
          </div>
        }
      />

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--green-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            </div>
            {data && <TrendBadge pct={data.stats.monthlyTrendPct} />}
          </div>
          <div className="stat-value">{data?.stats?.monthly || '—'}</div>
          <div className="stat-label">Doanh thu tháng này (₫)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--teal-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/></svg>
            </div>
            {data && <TrendBadge pct={data.stats.quarterlyTrendPct} />}
          </div>
          <div className="stat-value">{data?.stats?.quarterly || '—'}</div>
          <div className="stat-label">Doanh thu quý {period ? `${period.quarter}/${period.year}` : ''} (₫)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: '#E7EEFC' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            {data && <TrendBadge pct={data.stats.yearlyTrendPct} />}
          </div>
          <div className="stat-value">{data?.stats?.yearly || '—'}</div>
          <div className="stat-label">Doanh thu năm {period ? period.year : ''} (₫)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--coral-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            </div>
          </div>
          <div className="stat-value">{data?.stats?.outstanding || '—'}</div>
          <div className="stat-label">Còn phải thu (₫)</div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-head"><h3>Doanh thu 6 tháng gần nhất</h3></div>
          <div className="bar-chart">
            {(data?.monthlyChart || []).map((col, idx) => (
              <div className="bar-col" key={idx}>
                <div className="bar-col-track">
                  <div className={`bar-fill ${col.target ? 'target' : ''}`} style={{ height: `${col.height}%` }}></div>
                </div>
                <div className="bar-value">{col.val}</div>
                <div className="bar-label">{col.month}</div>
              </div>
            ))}
          </div>
          <div className="legend-row">
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--teal)' }}></span>Doanh thu thực tế</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--gold)' }}></span>Tháng hiện tại</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Doanh thu theo quốc gia</h3></div>
          <div className="source-list">
            {(data?.sources || []).length ? data.sources.map((src, idx) => (
              <div className="source-row" key={idx}>
                <span className="source-name">{src.name}</span>
                <div className="source-bar-track">
                  <div className="source-bar-fill" style={{ width: `${src.width}%`, background: src.color }}></div>
                </div>
                <span className="source-amount">{src.amount}</span>
              </div>
            )) : <div style={{ padding: '16px 0', color: 'var(--text-faint)', fontSize: 13 }}>Chưa có giao dịch nào.</div>}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-head"><h3>Giao dịch gần đây</h3></div>
        <table className="table">
          <thead>
            <tr><th>Học viên</th><th>Nội dung</th><th>Số tiền</th><th>Ngày</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {(data?.recentTransactions || []).map((tx, idx) => (
              <tr key={idx}>
                <td>
                  <div className="cell-person">
                    <div className="avatar">{tx.avatar}</div>
                    <div className="cell-name">{tx.student}</div>
                  </div>
                </td>
                <td>{tx.desc}</td>
                <td>{tx.amount}</td>
                <td>{tx.date}</td>
                <td><span className={`stamp ${tx.status === 'paid' ? 'stamp-visa' : 'stamp-processing'}`}>{tx.statusText}</span></td>
              </tr>
            ))}
            {data && !data.recentTransactions.length && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '18px 0' }}>Chưa có giao dịch nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
