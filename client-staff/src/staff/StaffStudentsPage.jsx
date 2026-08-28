import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import StaffStudentDetailPage from './StaffStudentDetailPage';

export default function StaffStudentsPage() {
  const [students, setStudents] = useState([]);
  const [tinhThanh, setTinhThanh] = useState([]);
  const [quocGia, setQuocGia] = useState([]);
  const [filter, setFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [viewingStudentId, setViewingStudentId] = useState(null);

  const emptyForm = () => ({
    name: '',
    email: '',
    phone: '',
    tinhThanhId: tinhThanh[0]?.id || '',
    quocGiaId: quocGia[0]?.id || '',
    statusText: 'Đang học tiếng',
    ngayNhapHoc: '',
    tienDaDong: '',
    tongTien: ''
  });
  const [formData, setFormData] = useState(emptyForm());

  const fetchStudents = () => {
    setLoading(true);
    apiFetch('/api/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchLookups = () => {
    apiFetch('/api/lookups')
      .then(res => res.json())
      .then(d => {
        setTinhThanh(d.tinhThanh || []);
        setQuocGia(d.quocGia || []);
      })
      .catch(err => console.error('Fetch lookups error:', err));
  };

  useEffect(() => {
    fetchStudents();
    fetchLookups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      tinhThanhId: student.tinhThanhId || tinhThanh[0]?.id || '',
      quocGiaId: student.quocGiaId || quocGia[0]?.id || '',
      statusText: student.statusText || 'Đang học tiếng',
      ngayNhapHoc: student.ngayNhapHocRaw || '',
      tienDaDong: student.tienDaDong || '',
      tongTien: student.tongTien || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (student) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa học viên "${student.name}" (${student.id}) khỏi CSDL?`)) {
      apiFetch(`/api/students/${student.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToastMessage(data.message || `Đã xóa học viên ${student.name}`);
            setTimeout(() => setToastMessage(''), 4000);
            fetchStudents();
          } else {
            alert(data.error || 'Lỗi khi xóa học viên');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập Họ và tên học viên!');
      return;
    }

    setSubmitting(true);
    const isEdit = !!editingStudent;
    const url = isEdit ? `/api/students/${editingStudent.id}` : '/api/students';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, program: 'Hồ sơ du học' })
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setIsModalOpen(false);
          setToastMessage(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm học viên thành công!'));
          setTimeout(() => setToastMessage(''), 4000);
          fetchStudents();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => {
        setSubmitting(false);
        alert('Lỗi kết nối máy chủ: ' + err.message);
      });
  };

  const getStampClass = (statusText) => {
    const st = (statusText || '').toLowerCase();
    if (st.includes('visa') || st.includes('tất')) return 'stamp stamp-green';
    if (st.includes('tiếng') || st.includes('xử lý')) return 'stamp stamp-gold';
    if (st.includes('tiếp')) return 'stamp stamp-teal';
    if (st.includes('nộp')) return 'stamp stamp-blue';
    if (st.includes('hoãn')) return 'stamp stamp-coral';
    return 'stamp stamp-teal';
  };

  const removeAccents = (str) => {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  const filtered = students.filter(s => {
    let matchFilter = true;
    if (filter !== 'all') {
      const st = (s.statusText || '').toLowerCase();
      if (filter === 'processing') matchFilter = st.includes('tiếng') || st.includes('xử lý');
      else if (filter === 'visa') matchFilter = st.includes('visa') || st.includes('tất');
      else if (filter === 'new') matchFilter = st.includes('tiếp');
    }

    let matchCountry = true;
    if (countryFilter !== 'all') {
      matchCountry = (s.country || '').toLowerCase().includes(countryFilter.toLowerCase());
    }

    let matchSearch = true;
    if (search.trim() !== '') {
      const q = removeAccents(search);
      const nameMatch = removeAccents(s.name).includes(q);
      const idMatch = removeAccents(s.id).includes(q);
      const emailMatch = removeAccents(s.email).includes(q);
      const phoneMatch = removeAccents(s.phone).includes(q);
      const hometownMatch = removeAccents(s.hometown).includes(q);
      const countryMatch = removeAccents(s.country).includes(q);
      const statusMatch = removeAccents(s.statusText).includes(q);

      matchSearch = nameMatch || idMatch || emailMatch || phoneMatch || hometownMatch || countryMatch || statusMatch;
    }

    return matchFilter && matchCountry && matchSearch;
  });

  const resetFilters = () => {
    setFilter('all');
    setCountryFilter('all');
    setSearch('');
  };

  if (viewingStudentId) {
    return (
      <StaffStudentDetailPage
        studentId={viewingStudentId}
        onBack={() => { setViewingStudentId(null); fetchStudents(); }}
      />
    );
  }

  return (
    <section className="page active">
      <div className="topbar">
        <div className="page-heading">
          <div className="eyebrow">{students.length} học viên CSDL</div>
          <h1>Học viên của tôi</h1>
          <p>Danh sách học viên bạn đang trực tiếp phụ trách từ CSDL MySQL.</p>
        </div>
        <div className="topbar-right">
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm học viên mới
          </button>
        </div>
      </div>

      {toastMessage && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--green)', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> {toastMessage}
        </div>
      )}

      {/* THANH LỌC & TÌM KIẾM THÔNG MINH */}
      <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', background: 'var(--surface)', padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả ({students.length})</div>
          <div className={`chip ${filter === 'processing' ? 'active' : ''}`} onClick={() => setFilter('processing')}>Đang học tiếng</div>
          <div className={`chip ${filter === 'visa' ? 'active' : ''}`} onClick={() => setFilter('visa')}>Hoàn tất hồ sơ / Visa</div>
          <div className={`chip ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>Mới tiếp nhận</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg)', color: 'var(--navy)', fontWeight: '500', cursor: 'pointer' }}
          >
            <option value="all">🌐 Tất cả quốc gia</option>
            {quocGia.map(q => <option key={q.id} value={q.name}>✈️ {q.name}</option>)}
          </select>
        </div>

        <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '280px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Tìm theo Mã HV, Tên, SĐT, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', fontSize: '14px', padding: '0 4px' }}>✕</button>
          )}
        </div>

        {(filter !== 'all' || countryFilter !== 'all' || search !== '') && (
          <button onClick={resetFilters} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '12.5px', color: 'var(--coral)', borderColor: 'var(--coral-soft)' }}>
            🔄 Xóa bộ lọc
          </button>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)', fontWeight: '500' }}>
          Hiển thị <span style={{ fontWeight: '700', color: 'var(--navy)' }}>{filtered.length}</span> / {students.length} học viên
        </div>
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                <th>Mã HV</th>
                <th>Học viên</th>
                <th>Số điện thoại</th>
                <th>Quê quán</th>
                <th>Quốc gia đến</th>
                <th>Trạng thái hồ sơ</th>
                <th>Ngày nhập học</th>
                <th style={{ textAlign: 'right' }}>Đã đóng / Tổng HP</th>
                <th style={{ textAlign: 'center' }}>Ngày tạo</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Đang tải dữ liệu học viên từ CSDL...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
                    Không tìm thấy học viên nào phù hợp với bộ lọc.
                    <div>
                      <button onClick={resetFilters} style={{ marginTop: '10px', background: 'var(--teal-soft)', color: 'var(--teal)', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12.5px' }}>
                        Xóa bộ lọc tìm kiếm
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--teal)' }}>{s.id}</td>
                    <td>
                      <div className="cell-person">
                        <div className="avatar" style={{ flex: 'none' }}>{s.avatar}</div>
                        <div className="cell-name">{s.name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{s.phone || 'N/A'}</td>
                    <td>{s.hometown || 'Chưa cập nhật'}</td>
                    <td style={{ fontWeight: '600' }}>✈️ {s.country}</td>
                    <td><span className={getStampClass(s.statusText)}>{s.statusText}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{s.ngayNhapHoc || 'Chưa xếp'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ fontWeight: '700', color: 'var(--green)' }}>{s.tienDaDongFormatted || '0 ₫'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{s.tongTienFormatted || '0 ₫'}</div>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-faint)' }}>
                      {s.createdAt || '21/08/2026'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button
                          className="row-action"
                          title="Xem chi tiết"
                          onClick={() => setViewingStudentId(s.id)}
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          className="row-action"
                          title="Chỉnh sửa thông tin"
                          onClick={() => handleOpenEditModal(s)}
                          style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          className="row-action"
                          title="Xóa học viên"
                          onClick={() => handleDeleteStudent(s)}
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

      {/* MODAL THÊM / SỬA HỌC VIÊN */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingStudent ? `✏️ Chỉnh sửa học viên ${editingStudent.id}` : '➕ Thêm học viên mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Họ và tên *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Nguyễn Văn Nam" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="nam.nguyen@gmail.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Số điện thoại</label>
                  <input name="phone" value={formData.phone} onChange={handleInputChange} placeholder="0912345678" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Quê quán</label>
                  <select name="tinhThanhId" value={formData.tinhThanhId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {tinhThanh.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Quốc gia đến</label>
                  <select name="quocGiaId" value={formData.quocGiaId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {quocGia.map(q => <option key={q.id} value={q.id}>✈️ {q.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái hồ sơ</label>
                  <select name="statusText" value={formData.statusText} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    <option value="Đang học tiếng">Đang học tiếng</option>
                    <option value="Mới tiếp nhận">Mới tiếp nhận</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Đã nộp hồ sơ">Đã nộp hồ sơ</option>
                    <option value="Hoàn tất hồ sơ">Hoàn tất hồ sơ</option>
                    <option value="Đã có visa">Đã có visa</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày nhập học</label>
                  <input type="date" name="ngayNhapHoc" value={formData.ngayNhapHoc} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tiền đã đóng (VNĐ)</label>
                  <input type="number" name="tienDaDong" value={formData.tienDaDong} onChange={handleInputChange} placeholder="30000000" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tổng học phí (VNĐ)</label>
                <input type="number" name="tongTien" value={formData.tongTien} onChange={handleInputChange} placeholder="120000000" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu CSDL...' : editingStudent ? 'Lưu thay đổi CSDL' : 'Lưu học viên vào CSDL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
