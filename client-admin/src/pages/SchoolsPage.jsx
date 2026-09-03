import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const COUNTRY_FLAGS = {
  'Nhật Bản': '🇯🇵', 'Hàn Quốc': '🇰🇷', 'Đức': '🇩🇪', 'Úc': '🇦🇺', 'Canada': '🇨🇦',
  'Mỹ': '🇺🇸', 'Anh': '🇬🇧', 'Pháp': '🇫🇷', 'Đài Loan': '🇹🇼', 'Singapore': '🇸🇬',
  'Trung Quốc': '🇨🇳', 'New Zealand': '🇳🇿', 'Hà Lan': '🇳🇱'
};
function countryFlag(country) {
  return COUNTRY_FLAGS[country] || '🌍';
}
function statusStampClass(status = '') {
  if (status.includes('triển khai') || status.includes('Hoạt động')) return 'stamp stamp-active';
  if (status.includes('Hoàn thành')) return 'stamp stamp-submitted';
  if (status.includes('dừng') || status.includes('hoãn') || status.includes('Hủy')) return 'stamp stamp-hold';
  if (status.includes('kế hoạch') || status.includes('Chuẩn bị')) return 'stamp stamp-processing';
  return 'stamp stamp-new';
}

const STATUS_OPTIONS = ['Lên kế hoạch', 'Đang triển khai', 'Hoàn thành', 'Tạm dừng'];

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quocGia, setQuocGia] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [detailSchool, setDetailSchool] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const emptyForm = () => ({
    name: '',
    quocGiaId: quocGia[0]?.id || '',
    startDate: '',
    endDate: '',
    quota: '',
    budget: '',
    managerId: '',
    statusText: 'Lên kế hoạch'
  });
  const [formData, setFormData] = useState(emptyForm());

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };

  const fetchSchools = () => {
    setLoading(true);
    apiFetch('/api/schools')
      .then(res => res.json())
      .then(d => setSchools(d.schools || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchLookups = () => {
    apiFetch('/api/lookups')
      .then(res => res.json())
      .then(d => setQuocGia(d.quocGia || []))
      .catch(err => console.error(err));
    apiFetch('/api/employees')
      .then(res => res.json())
      .then(d => setEmployees(d.employees || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchSchools();
    fetchLookups();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || '',
      quocGiaId: school.quocGiaId || quocGia[0]?.id || '',
      startDate: school.startDateRaw || '',
      endDate: school.endDateRaw || '',
      quota: school.quota || '',
      budget: school.budget || '',
      managerId: school.managerId || '',
      statusText: school.statusText || 'Lên kế hoạch'
    });
    setIsModalOpen(true);
    setDetailSchool(null);
  };

  const handleDeleteSchool = (school) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa dự án "${school.name}" (${school.maDuAn}) khỏi CSDL?`)) return;
    apiFetch(`/api/schools/${school.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(data.message || `Đã xóa dự án ${school.name}`);
          setDetailSchool(null);
          fetchSchools();
        } else {
          alert(data.error || 'Lỗi khi xóa dự án');
        }
      })
      .catch(err => alert('Lỗi máy chủ: ' + err.message));
  };

  const handleOpenDetail = (school) => {
    setDetailLoading(true);
    setDetailSchool(school);
    apiFetch(`/api/schools/${school.id}`)
      .then(res => res.json())
      .then(d => { if (!d.error) setDetailSchool(d); })
      .catch(err => console.error(err))
      .finally(() => setDetailLoading(false));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên dự án!');
      return;
    }

    setSubmitting(true);
    const isEdit = !!editingSchool;
    const url = isEdit ? `/api/schools/${editingSchool.id}` : '/api/schools';
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
          showToast(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm dự án thành công!'));
          fetchSchools();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => {
        setSubmitting(false);
        alert('Lỗi kết nối máy chủ: ' + err.message);
      });
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${schools.length} dự án`}
        title="Trường đối tác"
        subtitle="Các chiến dịch tuyển sinh du học đang triển khai theo từng quốc gia đối tác."
        rightAction={
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm dự án
          </button>
        }
      />

      {toastMessage && (
        <div style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--green)', marginBottom: '16px', fontWeight: '600', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✅</span> {toastMessage}
        </div>
      )}

      {!loading && schools.length === 0 && (
        <div className="school-card" style={{ textAlign: 'center', color: 'var(--text-soft)' }}>
          Chưa có dự án tuyển sinh nào được tạo.
        </div>
      )}

      <div className="school-grid">
        {schools.map((s) => (
          <div className="school-card" key={s.id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => handleOpenDetail(s)}>
            <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 4 }}>
              <button
                className="row-action"
                title="Sửa dự án"
                onClick={(e) => { e.stopPropagation(); handleOpenEditModal(s); }}
                style={{ width: 26, height: 26 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button
                className="row-action"
                title="Xóa dự án"
                onClick={(e) => { e.stopPropagation(); handleDeleteSchool(s); }}
                style={{ width: 26, height: 26, color: 'var(--coral)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>

            <div className="school-top" style={{ paddingRight: 56 }}>
              <div className="school-logo">{countryFlag(s.country)}</div>
              <div>
                <div className="school-name">{s.name}</div>
                <div className="school-country">{s.country} · {s.maDuAn}</div>
              </div>
            </div>

            <div className="school-stats">
              <div>
                <div className="school-stat-num">{s.quota}</div>
                <div className="school-stat-label">Chỉ tiêu</div>
              </div>
              <div>
                <div className="school-stat-num" style={{ fontSize: 14.5 }}>{s.budgetFormatted}</div>
                <div className="school-stat-label">Ngân sách</div>
              </div>
            </div>

            <div className="tag-row" style={{ marginBottom: 10 }}>
              <span className={statusStampClass(s.statusText)}>{s.statusText}</span>
            </div>
            <div className="tag-row">
              <span className="tag">{s.startDate} → {s.endDate}</span>
              <span className="tag">{s.managerName ? 'QL: ' + s.managerName : 'Chưa phân công'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL THÊM / SỬA DỰ ÁN */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '19px', fontWeight: '600', color: 'var(--navy)' }}>
                {editingSchool ? `✏️ Chỉnh sửa dự án ${editingSchool.maDuAn}` : '➕ Thêm dự án mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên dự án *</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Tuyển sinh Du học Nhật T10/2026" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Quốc gia đối tác</label>
                  <select name="quocGiaId" value={formData.quocGiaId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {quocGia.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Trạng thái</label>
                  <select name="statusText" value={formData.statusText} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {STATUS_OPTIONS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày bắt đầu</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày kết thúc</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Chỉ tiêu (số lượng)</label>
                  <input type="number" min="0" name="quota" value={formData.quota} onChange={handleInputChange} placeholder="50" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngân sách (VNĐ)</label>
                  <input type="number" min="0" name="budget" value={formData.budget} onChange={handleInputChange} placeholder="50000000" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Người quản lý</label>
                <select name="managerId" value={formData.managerId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                  <option value="">Chưa phân công</option>
                  {employees.map(e => <option key={e.dbId} value={e.dbId}>{e.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {submitting ? 'Đang lưu CSDL...' : editingSchool ? 'Lưu thay đổi CSDL' : 'Lưu dự án vào CSDL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT DỰ ÁN */}
      {detailSchool && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '600', color: 'var(--navy)' }}>Chi tiết dự án</h3>
              <button onClick={() => setDetailSchool(null)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <div style={{ padding: '24px' }}>
              {detailLoading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>Đang tải chi tiết dự án...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div className="school-logo" style={{ width: 52, height: 52, fontSize: 20 }}>{countryFlag(detailSchool.country)}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--navy)' }}>{detailSchool.name}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-soft)', marginTop: 2 }}>{detailSchool.country} · {detailSchool.maDuAn}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <span className={statusStampClass(detailSchool.statusText)}>{detailSchool.statusText}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13.5px', marginBottom: 8 }}>
                    <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Chỉ tiêu</div><div style={{ fontWeight: '700', color: 'var(--navy)', fontSize: 16 }}>{detailSchool.quota}</div></div>
                    <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngân sách</div><div style={{ fontWeight: '700', color: 'var(--green)', fontSize: 16 }}>{detailSchool.budgetFormatted}</div></div>
                    <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày bắt đầu</div><div style={{ fontWeight: '600' }}>{detailSchool.startDate}</div></div>
                    <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày kết thúc</div><div style={{ fontWeight: '600' }}>{detailSchool.endDate}</div></div>
                    <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Người quản lý</div><div style={{ fontWeight: '600' }}>{detailSchool.managerName || 'Chưa phân công'}</div></div>
                    <div><div style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Ngày khởi tạo CSDL</div><div style={{ fontWeight: '600' }}>{detailSchool.createdAt}</div></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <button className="btn-ghost" style={{ color: 'var(--coral)', borderColor: 'var(--coral-soft)' }} onClick={() => handleDeleteSchool(detailSchool)}>🗑️ Xóa dự án</button>
                    <button className="btn-primary" onClick={() => handleOpenEditModal(detailSchool)}>✏️ Chỉnh sửa</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
