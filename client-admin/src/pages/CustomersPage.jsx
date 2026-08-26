import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const STATUS_OPTIONS = ['Mới tiếp nhận', 'Đang tư vấn', 'Tiềm năng cao', 'Đã chốt (thành học viên)', 'Hủy'];
const COUNTRY_OPTIONS = ['Nhật Bản', 'Hàn Quốc', 'Đức', 'Mỹ', 'Úc', 'Anh', 'Canada'];

function getStampClass(statusText) {
  switch (statusText) {
    case 'Mới tiếp nhận': return 'stamp stamp-new';
    case 'Đang tư vấn': return 'stamp stamp-processing';
    case 'Tiềm năng cao': return 'stamp stamp-visa';
    case 'Đã chốt (thành học viên)': return 'stamp stamp-submitted';
    case 'Hủy': return 'stamp stamp-leave';
    default: return 'stamp stamp-new';
  }
}

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State (Thêm & Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '', phone: '', nhanVienId: '', ngayDangKy: '', country: COUNTRY_OPTIONS[0], statusText: STATUS_OPTIONS[0], note: ''
  });

  const fetchCustomers = () => {
    setLoading(true);
    apiFetch('/api/customers')
      .then(res => res.json())
      .then(d => {
        setCustomers(d.customers || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
    apiFetch('/api/employees')
      .then(res => res.json())
      .then(d => setStaffList(d.employees || []))
      .catch(() => {});
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', nhanVienId: '', ngayDangKy: '', country: COUNTRY_OPTIONS[0], statusText: STATUS_OPTIONS[0], note: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      nhanVienId: customer.nhanVienId || '',
      ngayDangKy: customer.ngayDangKyRaw || '',
      country: customer.country || COUNTRY_OPTIONS[0],
      statusText: customer.statusText || STATUS_OPTIONS[0],
      note: customer.note || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = (customer) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customer.name}" (${customer.id}) khỏi CSDL?`)) {
      apiFetch(`/api/customers/${customer.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToastMessage(data.message || `Đã xóa khách hàng ${customer.name}`);
            setTimeout(() => setToastMessage(''), 4000);
            fetchCustomers();
          } else {
            alert(data.error || 'Lỗi khi xóa khách hàng');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }
    setSubmitting(true);
    const isEdit = !!editingCustomer;
    const url = isEdit ? `/api/customers/${editingCustomer.id}` : '/api/customers';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setIsModalOpen(false);
          setToastMessage(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm khách hàng thành công!'));
          setTimeout(() => setToastMessage(''), 4000);
          fetchCustomers();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => {
        setSubmitting(false);
        alert('Lỗi kết nối máy chủ: ' + err.message);
      });
  };

  const removeAccents = (str) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const filtered = customers.filter(c => {
    const matchFilter = filter === 'all' || c.statusText === filter;

    let matchSearch = true;
    if (search.trim() !== '') {
      const q = removeAccents(search);
      const nameMatch = removeAccents(c.name).includes(q);
      const idMatch = removeAccents(c.id).includes(q);
      const phoneMatch = removeAccents(c.phone).includes(q);
      const countryMatch = removeAccents(c.country).includes(q);
      const staffMatch = removeAccents(c.staffName).includes(q);
      matchSearch = nameMatch || idMatch || phoneMatch || countryMatch || staffMatch;
    }

    return matchFilter && matchSearch;
  });

  const resetFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = customers.filter(c => c.createdAtRaw && new Date(c.createdAtRaw).getTime() >= weekAgo).length;
  const countByStatus = (st) => customers.filter(c => c.statusText === st).length;

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${customers.length} khách hàng CSDL`}
        title="Quản lý khách hàng"
        subtitle="Theo dõi khách hàng tiềm năng và tiến độ chăm sóc trước khi chuyển thành học viên."
        rightAction={
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm khách hàng
          </button>
        }
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--green)', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> {toastMessage}
        </div>
      )}

      {/* THỐNG KÊ THẺ ĐẦU TRANG */}
      <div className="stat-grid" style={{ marginBottom: '18px' }}>
        <div className="stat-card">
          <div className="stat-value">{customers.length}</div>
          <div className="stat-label">Tổng khách hàng CSDL</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{newThisWeek}</div>
          <div className="stat-label">Mới trong tuần</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{countByStatus('Đang tư vấn')}</div>
          <div className="stat-label">Đang tư vấn</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{countByStatus('Đã chốt (thành học viên)')}</div>
          <div className="stat-label">Đã chuyển thành học viên</div>
        </div>
      </div>

      {/* THANH LỌC & TÌM KIẾM */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', background: 'var(--surface)', padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả ({customers.length})</div>
          {STATUS_OPTIONS.map(st => (
            <div key={st} className={`chip ${filter === st ? 'active' : ''}`} onClick={() => setFilter(st)}>{st} ({countByStatus(st)})</div>
          ))}
        </div>

        <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '280px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, nhân viên tư vấn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '14px', padding: '0 4px' }}>✕</button>
          )}
        </div>

        {(filter !== 'all' || search !== '') && (
          <button onClick={resetFilters} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '12.5px', color: 'var(--coral)', borderColor: 'var(--coral-soft)' }}>
            🔄 Xóa bộ lọc
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: '500' }}>
          Hiển thị <span style={{ fontWeight: '700', color: 'var(--navy)' }}>{filtered.length}</span> / {customers.length} khách hàng
        </div>
      </div>

      {/* BẢNG DỮ LIỆU KHÁCH HÀNG */}
      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mã KH</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Tên khách hàng</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số điện thoại</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Quốc gia quan tâm</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhân viên tư vấn</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày đăng ký</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ghi chú</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Đang tải danh sách khách hàng từ CSDL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                    Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                    <div>
                      <button onClick={resetFilters} style={{ marginTop: '10px', background: 'var(--teal-soft)', color: 'var(--teal)', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px' }}>
                        Xóa bộ lọc tìm kiếm
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--teal)' }}>
                      {c.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{initialsOf(c.name)}</div>
                        <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{c.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{c.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600' }}>✈️ {c.country}</td>
                    <td style={{ padding: '14px 16px' }}>{c.staffName}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={getStampClass(c.statusText)}>{c.statusText}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {c.ngayDangKy || 'Chưa xếp'}
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span className="cell-note" title={c.note || 'Chưa có ghi chú'}>{c.note || 'Chưa có ghi chú'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          className="row-action"
                          title="Chỉnh sửa thông tin"
                          onClick={() => handleOpenEditModal(c)}
                          style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          className="row-action"
                          title="Xóa khách hàng"
                          onClick={() => handleDeleteCustomer(c)}
                          style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        >
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

      {/* MODAL THÊM / SỬA KHÁCH HÀNG */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingCustomer ? `✏️ Chỉnh sửa khách hàng ${editingCustomer.id}` : '➕ Thêm khách hàng mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên khách hàng *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Nguyễn Văn A" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Số điện thoại</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="09xx xxx xxx" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Quốc gia quan tâm</label>
                  <select name="country" value={formData.country} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>✈️ {c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhân viên tư vấn</label>
                  <select name="nhanVienId" value={formData.nhanVienId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="">Chưa phân công</option>
                    {staffList.map(s => <option key={s.dbId} value={s.dbId}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái</label>
                  <select name="statusText" value={formData.statusText} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày đăng ký</label>
                  <input type="date" name="ngayDangKy" value={formData.ngayDangKy} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ghi chú</label>
                <input name="note" value={formData.note} onChange={handleInputChange} placeholder="VD: Biết đến qua Facebook Ads, quan tâm học bổng..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu CSDL...' : editingCustomer ? 'Lưu thay đổi CSDL' : 'Lưu khách hàng vào CSDL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
