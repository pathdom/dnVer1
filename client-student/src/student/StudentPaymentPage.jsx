import React, { useEffect, useState } from 'react';

export default function StudentPaymentPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/student/payments')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(err => console.error(err));
  }, []);

  const getStampClass = (status) => {
    switch (status) {
      case 'paid': return 'stamp stamp-green';
      case 'urgent': return 'stamp stamp-coral';
      case 'upcoming': return 'stamp stamp-gold';
      default: return 'stamp stamp-gold';
    }
  };

  return (
    <section className="portal-page active">
      <div className="page-title-row">
        <div>
          <h1>Học phí</h1>
          <p>Theo dõi tiến độ thanh toán học phí và các khoản chi phí liên quan.</p>
        </div>
      </div>

      <div className="pay-stat-grid">
        <div className="pay-stat-card"><div className="lbl">Tổng học phí chương trình</div><div className="val">{data?.summary?.total || '1.2 tỷ ₫'}</div></div>
        <div className="pay-stat-card"><div className="lbl">Đã thanh toán</div><div className="val" style={{ color: 'var(--green)' }}>{data?.summary?.paid || '300 triệu ₫'}</div></div>
        <div className="pay-stat-card"><div className="lbl">Còn lại</div><div className="val" style={{ color: 'var(--coral)' }}>{data?.summary?.remaining || '900 triệu ₫'}</div></div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Các đợt thanh toán</h3></div>
        <table className="table">
          <thead>
            <tr><th>Đợt thanh toán</th><th>Số tiền</th><th>Hạn thanh toán</th><th>Trạng thái</th></tr>
          </thead>
          <tbody>
            {(data?.installments || [
              { desc: 'Đặt cọc giữ chỗ', amount: '50 triệu ₫', dueDate: '01/06/2026', status: 'paid', statusText: 'Đã thanh toán' },
              { desc: 'Học phí kỳ 1 — đợt 1', amount: '250 triệu ₫', dueDate: '15/08/2026', status: 'paid', statusText: 'Đã thanh toán' },
              { desc: 'Học phí kỳ 1 — đợt 2', amount: '300 triệu ₫', dueDate: '20/09/2026', status: 'urgent', statusText: 'Sắp đến hạn' },
              { desc: 'Học phí kỳ 2', amount: '600 triệu ₫', dueDate: '15/01/2027', status: 'upcoming', statusText: 'Chưa đến hạn' }
            ]).map((item, idx) => (
              <tr key={idx}>
                <td>{item.desc}</td>
                <td>{item.amount}</td>
                <td>{item.dueDate}</td>
                <td><span className={getStampClass(item.status)}>{item.statusText}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
