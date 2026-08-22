import React, { useEffect, useState } from 'react';

export default function StaffPerformancePage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/staff/performance')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">Tháng 08/2026</div>
          <h1>Hiệu suất làm việc</h1>
          <p>Theo dõi kết quả tư vấn và mục tiêu cá nhân của bạn.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="stat-card">
          <div className="stat-value">{data?.kpis?.consultedCount || 18}</div>
          <div className="stat-label">Học viên tư vấn tháng này</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.kpis?.submittedCount || 14}</div>
          <div className="stat-label">Hồ sơ nộp thành công</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.kpis?.conversionRate || '92%'}</div>
          <div className="stat-label">Tỷ lệ chuyển đổi</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data?.kpis?.avgRating || '4.9'}</div>
          <div className="stat-label">Đánh giá trung bình</div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-head"><h3>Mục tiêu quý 3/2026</h3></div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
              <span>{data?.q3Goal?.current || 32} / {data?.q3Goal?.target || 40} học viên</span>
              <span style={{ color: 'var(--teal)' }}>{data?.q3Goal?.percent || 80}%</span>
            </div>
            <div className="goal-bar-track">
              <div className="goal-bar-fill" style={{ width: `${data?.q3Goal?.percent || 80}%` }}></div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '10px' }}>
              {data?.q3Goal?.note || 'Còn 8 học viên nữa để đạt mục tiêu quý này. Tốc độ hiện tại: ~4 học viên/tuần.'}
            </p>
          </div>

          <div className="panel-head" style={{ borderTop: '1px solid var(--border)' }}><h3>Học viên đạt visa theo tháng</h3></div>
          <div className="dest-list">
            {(data?.monthlyVisa || [
              { month: 'Th4', count: 4, width: 40 },
              { month: 'Th5', count: 6, width: 55 },
              { month: 'Th6', count: 5, width: 50 },
              { month: 'Th7', count: 8, width: 70 },
              { month: 'Th8', count: 9, width: 80 }
            ]).map((item, idx) => (
              <div className="dest-row" key={idx}>
                <span className="dest-name">{item.month}</span>
                <div className="dest-bar-track"><div className="dest-bar-fill" style={{ width: `${item.width}%` }}></div></div>
                <span className="dest-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-stack">
          <div className="panel">
            <div className="panel-head"><h3>Đánh giá từ học viên</h3></div>
            <div className="rating-row">
              <div className="rating-stars">★★★★★</div>
              <div>
                <div className="cell-name">4.9 / 5.0</div>
                <div className="cell-sub">Dựa trên 27 lượt đánh giá</div>
              </div>
            </div>
            <div className="mini-timeline" style={{ paddingTop: 0 }}>
              {(data?.reviews || [
                { text: '"Chị Khoa tư vấn rất tận tâm và phản hồi nhanh"', author: 'Nguyễn Thị Lan Anh' },
                { text: '"Hướng dẫn hồ sơ rất chi tiết, dễ hiểu"', author: 'Vũ Ngọc Mai' }
              ]).map((rev, idx) => (
                <div className="mini-timeline-item" key={idx}>
                  <div className="mini-timeline-dot-col"><div className="mini-timeline-dot"></div></div>
                  <div>
                    <div className="mini-timeline-title">{rev.text}</div>
                    <div className="mini-timeline-date">{rev.author}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
