import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

export default function EmployeesPage({ setCurrentPage, setSelectedEmpId }) {
  const [employees, setEmployees] = useState([]);
  const [filter, setFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State (Thêm & Sửa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Kinh doanh',
    role: 'Chuyên viên tư vấn',
    workType: 'Chính thức',
    statusText: 'Đang làm việc',
    startDate: ''
  });

  const fetchEmployees = () => {
    setLoading(true);
    apiFetch('/api/employees')
      .then(res => res.json())
      .then(d => {
        setEmployees(d.employees || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingEmp(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Kinh doanh',
      role: 'Chuyên viên tư vấn',
      workType: 'Chính thức',
      statusText: 'Đang làm việc',
      startDate: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      department: emp.department || 'Kinh doanh',
      role: emp.role || 'Chuyên viên tư vấn',
      workType: emp.workType || 'Chính thức',
      statusText: emp.statusText || 'Đang làm việc',
      startDate: emp.startDateRaw || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteEmp = (emp) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${emp.name}" (${emp.id}) khỏi CSDL?`)) {
      apiFetch(`/api/employees/${emp.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToastMessage(data.message || `Đã xóa nhân viên ${emp.name}`);
            setTimeout(() => setToastMessage(''), 4000);
            fetchEmployees();
          } else {
            alert(data.error || 'Lỗi khi xóa nhân viên');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập Họ và tên nhân viên!');
      return;
    }

    setSubmitting(true);
    const isEdit = !!editingEmp;
    const url = isEdit ? `/api/employees/${editingEmp.id}` : '/api/employees';
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
          setToastMessage(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm nhân viên thành công!'));
          setTimeout(() => setToastMessage(''), 4000);
          fetchEmployees();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => {
        setSubmitting(false);
        alert('Lỗi kết nối máy chủ: ' + err.message);
      });
  };

  // Tag styling cho phòng ban
  const getDeptTagStyle = (dept = '') => {
    if (dept.includes('Kinh doanh')) return { background: 'var(--teal-soft)', color: 'var(--teal)' };
    if (dept.includes('Marketing')) return { background: 'var(--gold-soft)', color: 'var(--gold)' };
    if (dept.includes('Đối ngoại')) return { background: 'var(--coral-soft)', color: 'var(--coral)' };
    if (dept.includes('Hồ sơ')) return { background: '#E7EEFC', color: '#3B6FD1' };
    if (dept.includes('Đào tạo')) return { background: 'var(--green-soft)', color: 'var(--green)' };
    if (dept.includes('Hành chính')) return { background: '#F1E9FB', color: '#7C3AED' };
    return { background: 'var(--teal-soft)', color: 'var(--teal)' };
  };

  const removeAccents = (str) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const filtered = employees.filter(e => {
    let matchFilter = true;
    if (filter !== 'all') {
      const dep = (e.department || '').toLowerCase();
      if (filter === 'tuvan') matchFilter = dep.includes('kinh doanh');
      else if (filter === 'hoso') matchFilter = dep.includes('hồ sơ');
      else if (filter === 'active') matchFilter = (e.statusText || '').toLowerCase().includes('làm');
    }

    let matchWorkType = true;
    if (workTypeFilter !== 'all') {
      matchWorkType = (e.workType || '').toLowerCase().includes(workTypeFilter.toLowerCase());
    }

    let matchSearch = true;
    if (search.trim() !== '') {
      const q = removeAccents(search);
      const nameMatch = removeAccents(e.name).includes(q);
      const idMatch = removeAccents(e.id).includes(q);
      const emailMatch = removeAccents(e.email).includes(q);
      const phoneMatch = removeAccents(e.phone).includes(q);
      const deptMatch = removeAccents(e.department).includes(q);
      const roleMatch = removeAccents(e.role).includes(q);

      matchSearch = nameMatch || idMatch || emailMatch || phoneMatch || deptMatch || roleMatch;
    }

    return matchFilter && matchWorkType && matchSearch;
  });

  const resetFilters = () => {
    setFilter('all');
    setWorkTypeFilter('all');
    setSearch('');
  };

  const kinhDoanhCount = employees.filter(e => (e.department || '').includes('Kinh doanh')).length;
  const hoSoCount = employees.filter(e => (e.department || '').includes('Hồ sơ')).length;
  const activeCount = employees.filter(e => (e.statusText || '').includes('làm')).length;

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${employees.length} nhân sự CSDL`}
        title="Quản lý nhân viên"
        subtitle="Danh sách bảng nhân sự, phòng ban và chức danh kết nối CSDL MySQL quan_ly_trung_tam."
        rightAction={
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm nhân viên mới
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
          <div className="stat-value">{employees.length}</div>
          <div className="stat-label">Tổng nhân viên CSDL</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{kinhDoanhCount}</div>
          <div className="stat-label">Phòng Kinh doanh</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{hoSoCount}</div>
          <div className="stat-label">Phòng xử lý hồ sơ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Đang làm việc</div>
        </div>
      </div>

      {/* THANH LỌC & TÌM KIẾM THÔNG MINH */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', background: 'var(--surface)', padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả ({employees.length})</div>
          <div className={`chip ${filter === 'tuvan' ? 'active' : ''}`} onClick={() => setFilter('tuvan')}>Phòng kinh doanh ({kinhDoanhCount})</div>
          <div className={`chip ${filter === 'hoso' ? 'active' : ''}`} onClick={() => setFilter('hoso')}>Phòng hồ sơ ({hoSoCount})</div>
          <div className={`chip ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Đang làm việc ({activeCount})</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={workTypeFilter}
            onChange={(e) => setWorkTypeFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg)', color: 'var(--navy)', fontWeight: '500', cursor: 'pointer' }}
          >
            <option value="all">💼 Tất cả hình thức</option>
            <option value="Chính thức">Chính thức</option>
            <option value="Thử việc">Thử việc</option>
            <option value="Thực tập">Thực tập</option>
          </select>
        </div>

        <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '280px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Tìm theo Mã NV, Tên, Email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '14px', padding: '0 4px' }}>✕</button>
          )}
        </div>

        {(filter !== 'all' || workTypeFilter !== 'all' || search !== '') && (
          <button onClick={resetFilters} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '12.5px', color: 'var(--coral)', borderColor: 'var(--coral-soft)' }}>
            🔄 Xóa bộ lọc
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: '500' }}>
          Hiển thị <span style={{ fontWeight: '700', color: 'var(--navy)' }}>{filtered.length}</span> / {employees.length} nhân viên
        </div>
      </div>

      {/* BẢNG DỮ LIỆU NHÂN VIÊN */}
      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mã NV</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Họ và tên / Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Số điện thoại</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Phòng ban / Chức danh</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Hình thức</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày vào làm</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Ngày tạo</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Đang tải danh sách nhân viên từ CSDL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                    Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                    <div>
                      <button onClick={resetFilters} style={{ marginTop: '10px', background: 'var(--teal-soft)', color: 'var(--teal)', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px' }}>
                        Xóa bộ lọc tìm kiếm
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--teal)' }}>
                      {emp.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{emp.avatar}</div>
                        <div>
                          <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{emp.name}</div>
                          <div className="cell-sub" style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{emp.email || 'Chưa có email'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)' }}>{emp.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--navy)' }}>{emp.role || 'Nhân viên'}</div>
                      <span className="dept-tag" style={{ ...getDeptTagStyle(emp.department), padding: '2px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '700', marginTop: '2px', display: 'inline-block' }}>
                        {emp.department || 'Kinh doanh'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '500' }}>{emp.workType || 'Chính thức'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="stamp stamp-green">{emp.statusText || 'Đang làm việc'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {emp.startDate || '01/01/2025'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                      {emp.createdAt || '21/08/2026'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {/* 👁️ Nút Xem chi tiết chuyển sang Trang Chi tiết nhân viên */}
                        <button
                          className="row-action"
                          title="Xem chi tiết nhân viên"
                          onClick={() => {
                            if (setSelectedEmpId) setSelectedEmpId(emp.id);
                            if (setCurrentPage) setCurrentPage('employee-detail');
                          }}
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>

                        {/* ✏️ Nút Chỉnh sửa */}
                        <button
                          className="row-action"
                          title="Chỉnh sửa thông tin"
                          onClick={() => handleOpenEditModal(emp)}
                          style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>

                        {/* 🗑️ Nút Xóa */}
                        <button
                          className="row-action"
                          title="Xóa nhân viên"
                          onClick={() => handleDeleteEmp(emp)}
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

      {/* MODAL THÊM / SỬA NHÂN VIÊN */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingEmp ? `✏️ Chỉnh sửa nhân viên ${editingEmp.id}` : '➕ Thêm nhân viên mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Họ và tên *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Lê Thu Hà" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="ha.le@aladdin.vn" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Số điện thoại</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0911223344" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Phòng ban</label>
                  <select name="department" value={formData.department} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="Hành chính kế toán">Hành chính kế toán</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Đối ngoại">Đối ngoại</option>
                    <option value="Hồ sơ">Hồ sơ</option>
                    <option value="Đào tạo">Đào tạo</option>
                    <option value="Kinh doanh">Kinh doanh</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Chức danh</label>
                  <input name="role" value={formData.role} onChange={handleInputChange} placeholder="Chuyên viên tư vấn / Trưởng nhóm" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Hình thức làm việc</label>
                  <select name="workType" value={formData.workType} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="Chính thức">Chính thức</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Thực tập">Thực tập</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái làm việc</label>
                  <select name="statusText" value={formData.statusText} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Tạm nghỉ">Tạm nghỉ</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày vào làm</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu CSDL...' : editingEmp ? 'Lưu thay đổi CSDL' : 'Lưu nhân viên vào CSDL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
