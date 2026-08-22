import React, { useEffect, useState } from 'react';
import Topbar from '../components/Topbar';

export default function RevenuePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/revenue')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="page active">
      <Topbar
        eyebrow="Tháng 08/2026"
        title="Báo cáo doanh thu"
        subtitle="Tổng quan doanh thu, học phí đã thu và cơ cấu theo nguồn."
        rightAction={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Tháng 08/2026
            </button>
            <button className="btn-primary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
              Xuất báo cáo
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
            <div className="stat-trend trend-up">↑ 5.4%</div>
          </div>
          <div className="stat-value">{data?.stats?.monthly || '1.85 tỷ'}</div>
          <div className="stat-label">Doanh thu tháng này (₫)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--teal-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><path d="M2 7h20v5H2z"/><path d="M12 22V7"/></svg>
            </div>
            <div className="stat-trend trend-up">↑ 11%</div>
          </div>
          <div className="stat-value">{data?.stats?.quarterly || '5.2 tỷ'}</div>
          <div className="stat-label">Doanh thu quý 3/2026 (₫)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: '#E7EEFC' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <div className="stat-trend trend-flat">82%</div>
          </div>
          <div className="stat-value">{data?.stats?.collected || '1.52 tỷ'}</div>
          <div className="stat-label">Đã thu trong tháng (₫)</div>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon" style={{ background: 'var(--coral-soft)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
            </div>
            <div className="stat-trend" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>18%</div>
          </div>
          <div className="stat-value">{data?.stats?.pending || '330 tr'}</div>
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
            {(data?.sources || []).map((src, idx) => (
              <div className="source-row" key={idx}>
                <span className="source-name">{src.name}</span>
                <div className="source-bar-track">
                  <div className="source-bar-fill" style={{ width: `${src.width}%`, background: src.color }}></div>
                </div>
                <span className="source-amount">{src.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-head"><h3>Giao dịch gần đây</h3><span className="link">Xem tất cả →</span></div>
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
          </tbody>
        </table>
      </div>
    </section>
  );
}
