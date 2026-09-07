import React, { useState } from 'react';

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getStampClass(statusText) {
  switch (statusText) {
    case 'Mới tiếp nhận': return 'stamp stamp-new';
    case 'Đang tư vấn': return 'stamp stamp-processing';
    case 'Tiềm năng cao': return 'stamp stamp-visa';
    case 'Đã chốt': return 'stamp stamp-submitted';
    case 'Hoạt động': return 'stamp stamp-visa';
    case 'Hủy':
    case 'Tạm ngưng': return 'stamp stamp-leave';
    default: return 'stamp stamp-new';
  }
}

const MOCK_JOURNEY = [
  { title: 'Tiếp nhận thông tin ban đầu', date: '02/08/2026', desc: 'Ghi nhận qua kênh Facebook Ads, quan tâm chương trình du học.' },
  { title: 'Gọi điện tư vấn lần 1', date: '05/08/2026', desc: 'Tư vấn tổng quan lộ trình, chi phí và điều kiện hồ sơ.' },
  { title: 'Gửi hồ sơ mẫu & báo giá', date: '10/08/2026', desc: 'Gửi bộ hồ sơ tham khảo cùng bảng chi phí chi tiết qua email.' },
  { title: 'Hẹn gặp tư vấn trực tiếp', date: '18/08/2026', desc: 'Trao đổi sâu tại văn phòng, giải đáp thắc mắc về visa.' },
];

const MOCK_DOCS = [
  { name: 'CMND_CCCD_scan.pdf', date: '03/08/2026', status: 'Đã nhận' },
  { name: 'So_yeu_ly_lich.docx', date: '06/08/2026', status: 'Đã nhận' },
  { name: 'Bang_diem_hoc_tap.pdf', date: 'Chưa có', status: 'Đang chờ' },
];

const MOCK_NOTES = [
  { author: 'Minh Hằng (Admin)', date: '10/08/2026', content: 'Khách hàng tiềm năng, phản hồi nhanh, nên ưu tiên chăm sóc.' },
  { author: 'Lê Thu Hà (Nhân viên)', date: '05/08/2026', content: 'Đã tư vấn lần 1, khách cần thêm thời gian cân nhắc chi phí.' },
];

function DemoBadge() {
  return (
    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gold)', background: 'var(--gold-soft)', padding: '3px 10px', borderRadius: '20px' }}>
      🔧 Dữ liệu minh họa — sẽ nối CSDL sau
    </span>
  );
}

export default function RelationshipDetailView({ entity, type, backLabel, onBack }) {
  const [activeTab, setActiveTab] = useState('info');
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [newNote, setNewNote] = useState('');

  if (!entity) {
    return (
      <section className="page active" style={{ padding: '40px' }}>
        <button className="breadcrumb" onClick={onBack}>← {backLabel}</button>
        <div style={{ padding: '20px', background: 'var(--surface)', borderRadius: '16px', marginTop: '12px' }}>
          Không tìm thấy thông tin.
        </div>
      </section>
    );
  }

  const isCustomer = type === 'customer';

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes(prev => [{ author: 'Minh Hằng (Admin)', date: new Date().toLocaleDateString('vi-VN'), content: newNote.trim() }, ...prev]);
    setNewNote('');
  };

  const tabs = [
    { key: 'info', label: 'Thông tin chung', icon: '👤' },
    { key: 'journey', label: 'Hành trình tư vấn', icon: '🧭' },
    { key: 'docs', label: 'Hồ sơ & tài liệu', icon: '📂' },
    { key: 'notes', label: 'Ghi chú', icon: '📌' },
  ];

  return (
    <section className="page active">
      <button className="breadcrumb" onClick={onBack} style={{ cursor: 'pointer' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        {backLabel}
      </button>

      <div className="profile-header" style={{ marginTop: '12px' }}>
        <div className="profile-header-left">
          <div className="avatar profile-avatar" style={{ fontWeight: '700' }}>{initialsOf(entity.name)}</div>
          <div>
            <div className="profile-name-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="profile-name" style={{ fontSize: '22px', fontWeight: '700' }}>{entity.name}</span>
              <span className={getStampClass(entity.statusText)}>{entity.statusText}</span>
            </div>
            <div className="profile-meta" style={{ display: 'flex', gap: '16px', marginTop: '6px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-soft)' }}>
              <span>📋 Mã {entity.id}</span>
              <span>📞 {entity.phone || 'Chưa có SĐT'}</span>
              {isCustomer ? (
                <>
                  <span>🌍 {entity.country || 'Chưa rõ quốc gia'}</span>
                  <span>🧑‍💼 {entity.staffName || 'Chưa phân công'}</span>
                </>
              ) : (
                <span>🤝 Giới thiệu bởi: {entity.referrer || 'Chưa rõ'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {tabs.map(t => (
          <div key={t.key} className={`detail-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            <span>{t.icon}</span>{t.label}
          </div>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>👤 Thông tin chung</h3>
          </div>
          <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px' }}>
            <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{isCustomer ? 'Tên khách hàng' : 'Tên cộng tác viên'}</div><div style={{ fontWeight: '600' }}>{entity.name}</div></div>
            <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Số điện thoại</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entity.phone || 'N/A'}</div></div>
            {isCustomer ? (
              <>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Quốc gia quan tâm</div><div style={{ fontWeight: '600' }}>{entity.country || 'Chưa rõ'}</div></div>
                <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Nhân viên tư vấn</div><div style={{ fontWeight: '700', color: 'var(--teal)' }}>{entity.staffName || 'Chưa phân công'}</div></div>
              </>
            ) : (
              <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Người giới thiệu</div><div style={{ fontWeight: '600' }}>{entity.referrer || 'Chưa rõ'}</div></div>
            )}
            <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Trạng thái</div><div><span className={getStampClass(entity.statusText)} style={{ fontSize: '11px', padding: '4px 10px' }}>{entity.statusText}</span></div></div>
            <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày đăng ký</div><div style={{ fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{entity.ngayDangKy || entity.registeredAt || 'Chưa xếp'}</div></div>
            {isCustomer && (
              <div style={{ gridColumn: '1 / -1' }}><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ghi chú nhanh</div><div style={{ fontWeight: '600' }}>{entity.note || 'Chưa có ghi chú'}</div></div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'journey' && (
        <div className="panel" style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>🧭 Hành trình tư vấn</h3>
            <DemoBadge />
          </div>
          <div className="mini-timeline">
            {MOCK_JOURNEY.map((step, i) => (
              <div key={i} className="mini-timeline-item">
                <div className="mini-timeline-dot-col">
                  <div className="mini-timeline-dot" />
                  <div className="mini-timeline-track" />
                </div>
                <div className="mini-timeline-content">
                  <div className="mini-timeline-title">{step.title}</div>
                  <div className="mini-timeline-date">{step.date}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-soft)', marginTop: '4px' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📂 Hồ sơ & tài liệu</h3>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', marginBottom: '14px' }}>
            {MOCK_DOCS.map((doc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📄</span>
                  <span style={{ fontWeight: '600' }}>{doc.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{doc.date}</span>
                </div>
                <span className={doc.status === 'Đã nhận' ? 'stamp stamp-visa' : 'stamp stamp-processing'} style={{ fontSize: '10px' }}>{doc.status}</span>
              </div>
            ))}
          </div>
          <button
            className="btn-ghost"
            onClick={() => alert('Chức năng tải lên tài liệu sẽ được kết nối với CSDL sau.')}
            style={{ fontSize: '12.5px' }}
          >
            + Tải lên tài liệu
          </button>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="panel" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>📌 Ghi chú</h3>
            <DemoBadge />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {notes.map((note, i) => (
              <div key={i} style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--teal)' }}>{note.author}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{note.date}</span>
                </div>
                <div>{note.content}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Nhập ghi chú mới..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13px' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
            />
            <button className="btn-primary" onClick={handleAddNote} style={{ padding: '10px 18px' }}>Thêm</button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '8px' }}>
            * Ghi chú đang lưu tạm trên trình duyệt, sẽ đồng bộ vào CSDL khi nối backend.
          </div>
        </div>
      )}
    </section>
  );
}
