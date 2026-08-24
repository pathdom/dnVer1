import React from 'react';

function formatVND(n) {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

const STAGES = ['Tiếp nhận', 'Tư vấn & hồ sơ', 'Nộp hồ sơ', 'Kết quả Visa'];

function getStageInfo(statusText) {
  const st = (statusText || '').toLowerCase();
  if (st.includes('hoãn')) return { index: -1, stamp: 'stamp-coral' };
  if (st.includes('visa') || st.includes('tất')) return { index: 3, stamp: 'stamp-green' };
  if (st.includes('nộp')) return { index: 2, stamp: 'stamp-teal' };
  if (st.includes('tiếp')) return { index: 0, stamp: 'stamp-gold' };
  return { index: 1, stamp: 'stamp-teal' };
}

export default function StudentProfilePage({ profile }) {
  if (!profile) {
    return (
      <section className="portal-page active">
        <div className="panel"><p style={{ color: 'var(--text-soft)' }}>Đang tải dữ liệu...</p></div>
      </section>
    );
  }

  const stage = getStageInfo(profile.statusText);

  return (
    <section className="portal-page active">
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: stage.index >= 0 ? '24px' : 0 }}>
          <div className="panel-title" style={{ marginBottom: 0 }}>Tình trạng hồ sơ</div>
          <span className={`stamp ${stage.stamp}`}>{profile.statusText || 'Đang cập nhật'}</span>
        </div>

        {stage.index >= 0 && (
          <div className="stepper-h">
            {STAGES.map((label, idx) => (
              <div key={label} className={`step-node ${idx < stage.index ? 'completed' : idx === stage.index ? 'active' : ''}`}>
                <div className="step-circle">{idx < stage.index ? '✓' : idx + 1}</div>
                <div className="step-label">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2col">
        <div className="panel">
          <div className="panel-title">Thông tin cá nhân</div>
          <div className="info-grid">
            <div className="info-item"><div className="info-label">Họ và tên</div><div className="info-value">{profile.name}</div></div>
            <div className="info-item"><div className="info-label">Mã học viên</div><div className="info-value">{profile.id}</div></div>
            <div className="info-item"><div className="info-label">Email</div><div className="info-value">{profile.email || 'Chưa cập nhật'}</div></div>
            <div className="info-item"><div className="info-label">Số điện thoại</div><div className="info-value">{profile.phone || 'Chưa cập nhật'}</div></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Chương trình đăng ký</div>
          <div className="info-grid">
            <div className="info-item"><div className="info-label">Quốc gia du học</div><div className="info-value">{profile.country || 'Chưa cập nhật'}</div></div>
            <div className="info-item"><div className="info-label">Lộ trình / Chương trình</div><div className="info-value">{profile.program || 'Chưa cập nhật'}</div></div>
            <div className="info-item"><div className="info-label">Ngày nhập học dự kiến</div><div className="info-value">{profile.ngayNhapHoc || 'Chưa cập nhật'}</div></div>
            <div className="info-item"><div className="info-label">Học phí đã đóng</div><div className="info-value">{formatVND(profile.paidAmount)}</div></div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Tư vấn viên phụ trách</div>
        {profile.advisor ? (
          <div className="info-grid">
            <div className="info-item"><div className="info-label">Họ và tên</div><div className="info-value">{profile.advisor.name}</div></div>
            <div className="info-item"><div className="info-label">Vai trò</div><div className="info-value">{profile.advisor.role}</div></div>
            {profile.advisor.phone && (
              <div className="info-item"><div className="info-label">Điện thoại liên hệ</div><div className="info-value">{profile.advisor.phone}</div></div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: '13.5px', color: 'var(--text-soft)' }}>Hồ sơ của bạn chưa được phân công tư vấn viên phụ trách.</p>
        )}
      </div>
    </section>
  );
}
