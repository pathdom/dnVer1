import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const STATUS_OPTIONS = ['Hoạt động', 'Tạm ngưng'];

function getStampClass(statusText) {
  switch (statusText) {
    case 'Hoạt động': return 'stamp stamp-visa';
    case 'Tạm ngưng': return 'stamp stamp-leave';
    default: return 'stamp stamp-new';
  }
}

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '', phone: '', referrer: '', statusText: STATUS_OPTIONS[0], registeredAt: ''
  });

  const fetchCollaborators = () => {
    setLoading(true);
    apiFetch('/api/collaborators')
      .then(res => res.json())
      .then(d => { setCollaborators(d.collaborators || []); setLoading(false); })
      .catch(err => { console.error('Fetch error:', err); setLoading(false); });
  };

  useEffect(() => { fetchCollaborators(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({ name: '', phone: '', referrer: '', statusText: STATUS_OPTIONS[0], registeredAt: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      phone: item.phone || '',
      referrer: item.referrer || '',
      statusText: item.statusText || STATUS_OPTIONS[0],
      registeredAt: item.registeredAtRaw || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa cộng tác viên "${item.name}" (${item.id}) khỏi CSDL?`)) {
      apiFetch(`/api/collaborators/${item.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToastMessage(data.message || `Đã xóa ${item.name}`);
            setTimeout(() => setToastMessage(''), 4000);
            fetchCollaborators();
          } else {
            alert(data.error || 'Lỗi khi xóa cộng tác viên');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên cộng tác viên!');
      return;
    }
    setSubmitting(true);
    const isEdit = !!editingItem;
    const url = isEdit ? `/api/collaborators/${editingItem.id}` : '/api/collaborators';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, { method, body: JSON.stringify(formData) })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setIsModalOpen(false);
          setToastMessage(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm cộng tác viên thành công!'));
          setTimeout(() => setToastMessage(''), 4000);
          fetchCollaborators();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const removeAccents = (str) => (str || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

  const filtered = collaborators.filter(c => {
    const matchFilter = filter === 'all' || c.statusText === filter;
    let matchSearch = true;
    if (search.trim()) {
      const q = removeAccents(search);
      matchSearch = [c.name, c.id, c.phone, c.referrer].some(v => removeAccents(v).includes(q));
    }
    return matchFilter && matchSearch;
  });

  const countByStatus = (st) => collaborators.filter(c => c.statusText === st).length;

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${collaborators.length} cộng tác viên CSDL`}
        title="Cộng tác viên"
        subtitle="Quản lý mạng lưới cộng tác viên giới thiệu học viên."
        rightAction={
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm cộng tác viên
          </button>
        }
      />

      {toastMessage && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--green)', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> {toastMessage}
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: '18px' }}>
        <div className="stat-card">
          <div className="stat-value">{collaborators.length}</div>
          <div className="stat-label">Tổng cộng tác viên</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{countByStatus('Hoạt động')}</div>
          <div className="stat-label">Đang hoạt động</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{countByStatus('Tạm ngưng')}</div>
          <div className="stat-label">Tạm ngưng</div>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', background: 'var(--surface)', padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả ({collaborators.length})</div>
          {STATUS_OPTIONS.map(st => (
            <div key={st} className={`chip ${filter === st ? 'active' : ''}`} onClick={() => setFilter(st)}>{st} ({countByStatus(st)})</div>
          ))}
        </div>
        <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '280px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text" placeholder="Tìm mã, tên, số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: '500' }}>
          Hiển thị <span style={{ fontWeight: '700', color: 'var(--navy)' }}>{filtered.length}</span> / {collaborators.length} cộng tác viên
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mã CTV</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên CTV</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số điện thoại</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Người giới thiệu</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày đăng ký</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải danh sách cộng tác viên...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Không tìm thấy cộng tác viên nào phù hợp.</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--teal)' }}>{c.id}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{initialsOf(c.name)}</div>
                        <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{c.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{c.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-soft)' }}>{c.referrer || 'Chưa rõ'}</td>
                    <td style={{ padding: '14px 16px' }}><span className={getStampClass(c.statusText)}>{c.statusText}</span></td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{c.registeredAt || 'Chưa rõ'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button className="row-action" title="Chỉnh sửa" onClick={() => handleOpenEditModal(c)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="row-action" title="Xóa" onClick={() => handleDelete(c)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingItem ? `✏️ Chỉnh sửa cộng tác viên ${editingItem.id}` : '➕ Thêm cộng tác viên mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên cộng tác viên *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Trần Thị Mai Anh" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Số điện thoại</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="09xx xxx xxx" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Người giới thiệu</label>
                  <input name="referrer" value={formData.referrer} onChange={handleInputChange} placeholder="VD: Lê Thu Trang, Website, Facebook Ads..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày đăng ký</label>
                  <input type="date" name="registeredAt" value={formData.registeredAt} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái</label>
                <select name="statusText" value={formData.statusText} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu CSDL...' : editingItem ? 'Lưu thay đổi CSDL' : 'Lưu vào CSDL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
