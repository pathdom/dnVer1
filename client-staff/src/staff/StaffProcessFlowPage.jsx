import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';

const STEP_TYPES = [
  { value: 'work', label: 'Công việc', stampClass: 'stamp-teal' },
  { value: 'approve', label: 'Phê duyệt', stampClass: 'stamp-green' },
  { value: 'notify', label: 'Thông báo', stampClass: 'stamp-coral' }
];
function stepTypeInfo(value) { return STEP_TYPES.find(t => t.value === value) || STEP_TYPES[0]; }
function totalDays(flow) { return flow.steps.reduce((sum, s) => sum + (Number(s.slaDays) || 0), 0); }

export default function StaffProcessFlowPage() {
  const [flow, setFlow] = useState(null);
  const [sentAt, setSentAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/staff/process-flow')
      .then(res => res.json())
      .then(d => { setFlow(d.flow || null); setSentAt(d.sentAt || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="page active">
        <div className="topbar">
          <div className="page-heading"><h1>Quy trình xử lý</h1></div>
        </div>
        <div className="panel" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải quy trình...</div>
      </section>
    );
  }

  if (!flow) {
    return (
      <section className="page active">
        <div className="topbar">
          <div className="page-heading">
            <div className="eyebrow">Quy trình xử lý</div>
            <h1>Quy trình xử lý hồ sơ</h1>
            <p>Sơ đồ các bước xử lý do quản trị viên chia sẻ.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🧭</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--navy)', marginBottom: 6 }}>Chưa có quy trình nào được gửi</div>
          <p style={{ fontSize: 13.5, color: 'var(--text-soft)', maxWidth: 380, margin: '0 auto' }}>
            Khi quản trị viên gửi thông báo về quy trình xử lý hồ sơ, sơ đồ sẽ hiển thị tại đây.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">{sentAt ? `Cập nhật lúc ${sentAt}` : 'Quy trình xử lý'}</div>
          <h1>Quy trình xử lý hồ sơ</h1>
          <p>Sơ đồ các bước xử lý do quản trị viên chia sẻ.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 600, color: 'var(--navy)' }}>{flow.name}</h2>
          <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'var(--teal-soft)', color: 'var(--teal)' }}>{flow.group}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', marginBottom: 18 }}>{flow.description || 'Chưa có mô tả'}</p>

        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 0 }}>
          <div className="stat-card" style={{ boxShadow: 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{flow.steps.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>Số bước trong quy trình</div>
          </div>
          <div className="stat-card" style={{ boxShadow: 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{totalDays(flow)} ngày</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>Tổng thời hạn dự kiến</div>
          </div>
          <div className="stat-card" style={{ boxShadow: 'none' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-display)' }}>{flow.group}</div>
            <div style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4 }}>Nhóm quy trình</div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px 22px', marginBottom: 16, overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 'max-content' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--teal-soft)', color: 'var(--teal)' }}>BẮT ĐẦU</span>
          {flow.steps.map((step, i) => {
            const typeInfo = stepTypeInfo(step.type);
            return (
              <React.Fragment key={step.id || i}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                <div style={{ width: 168, flexShrink: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: 'var(--teal-soft)', color: 'var(--teal)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <span className={`stamp ${typeInfo.stampClass}`} style={{ padding: '3px 7px', fontSize: 9 }}>{typeInfo.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', marginBottom: 6, lineHeight: 1.3 }}>{step.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{step.owner} · {step.slaDays} ngày</div>
                </div>
              </React.Fragment>
            );
          })}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'var(--coral-soft)', color: 'var(--coral)' }}>KẾT THÚC</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h3>Chi tiết các bước</h3></div>
        <table className="table">
          <thead>
            <tr><th>Bước</th><th>Loại</th><th>Phụ trách</th><th style={{ textAlign: 'right' }}>Thời hạn</th></tr>
          </thead>
          <tbody>
            {flow.steps.map((step, i) => {
              const typeInfo = stepTypeInfo(step.type);
              return (
                <tr key={step.id || i}>
                  <td>
                    <div className="cell-person">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 11 }}>{i + 1}</div>
                      <div className="cell-name">{step.name}</div>
                    </div>
                  </td>
                  <td><span className={`stamp ${typeInfo.stampClass}`}>{typeInfo.label}</span></td>
                  <td>
                    <span style={{ fontSize: '10.5px', fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'var(--teal-soft)', color: 'var(--teal)' }}>{step.owner}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{step.slaDays} ngày</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
