import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

const RESULT_OPTIONS = ['Đạt', 'Không đạt'];

function initialsOf(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const removeAccents = (str) => (str || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export default function CompetencyTestPage() {
  const [results, setResults] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const emptyForm = () => ({
    employeeId: employees[0]?.dbId || '',
    examName: '',
    score: '',
    result: RESULT_OPTIONS[0],
    takenAt: new Date().toISOString().slice(0, 10),
    note: ''
  });
  const [formData, setFormData] = useState(emptyForm());

  const fetchResults = () => {
    setLoading(true);
    apiFetch('/api/competency-results')
      .then(res => res.json())
      .then(d => { setResults(d.results || []); setLoading(false); })
      .catch(err => { console.error('Fetch error:', err); setLoading(false); });
  };

  useEffect(() => {
    fetchResults();
    apiFetch('/api/employees')
      .then(res => res.json())
      .then(d => setEmployees(d.employees || []))
      .catch(() => {});
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData(emptyForm());
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId,
      examName: item.examName || '',
      score: item.score,
      result: item.result || RESULT_OPTIONS[0],
      takenAt: item.takenAtRaw || new Date().toISOString().slice(0, 10),
      note: item.note || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (item) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa kết quả "${item.examName}" của ${item.employeeName}?`)) {
      apiFetch(`/api/competency-results/${item.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setToastMessage(data.message || 'Đã xóa kết quả');
            setTimeout(() => setToastMessage(''), 4000);
            fetchResults();
          } else {
            alert(data.error || 'Lỗi khi xóa kết quả');
          }
        })
        .catch(err => alert('Lỗi máy chủ: ' + err.message));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId) { alert('Vui lòng chọn nhân viên!'); return; }
    if (!formData.examName.trim()) { alert('Vui lòng nhập tên bài test!'); return; }

    setSubmitting(true);
    const isEdit = !!editingItem;
    const url = isEdit ? `/api/competency-results/${editingItem.id}` : '/api/competency-results';
    const method = isEdit ? 'PUT' : 'POST';

    apiFetch(url, { method, body: JSON.stringify(formData) })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setIsModalOpen(false);
          setToastMessage(data.message || (isEdit ? 'Cập nhật thành công!' : 'Thêm kết quả thành công!'));
          setTimeout(() => setToastMessage(''), 4000);
          fetchResults();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  const departments = [...new Set(results.map(r => r.department))];

  const filtered = results.filter(r => {
    const matchDept = deptFilter === 'all' || r.department === deptFilter;
    let matchSearch = true;
    if (search.trim()) {
      const q = removeAccents(search);
      matchSearch = [r.employeeName, r.examName, r.employeeCode].some(v => removeAccents(v).includes(q));
    }
    return matchDept && matchSearch;
  });

  const passCount = results.filter(r => r.result === 'Đạt').length;
  const failCount = results.filter(r => r.result === 'Không đạt').length;
  const avgScore = results.length ? (results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length).toFixed(1) : '0';

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${results.length} lượt làm bài CSDL`}
        title="Bài test"
        subtitle="Kết quả bài test năng lực được nhập thủ công sau khi chấm cho từng nhân viên."
        rightAction={
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
            Thêm kết quả
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
          <div className="stat-value">{results.length}</div>
          <div className="stat-label">Tổng lượt làm bài</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{passCount}</div>
          <div className="stat-label">Đạt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{failCount}</div>
          <div className="stat-label">Không đạt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{avgScore}</div>
          <div className="stat-label">Điểm trung bình</div>
        </div>
      </div>

      <div className="filter-bar" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className={`chip ${deptFilter === 'all' ? 'active' : ''}`} onClick={() => setDeptFilter('all')}>Tất cả ({results.length})</div>
          {departments.map(dep => (
            <div key={dep} className={`chip ${deptFilter === dep ? 'active' : ''}`} onClick={() => setDeptFilter(dep)}>
              {dep} ({results.filter(r => r.department === dep).length})
            </div>
          ))}
        </div>
        <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '260px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Tìm tên nhân viên, bài test..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }} />
        </div>
      </div>

      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhân viên</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Bài test</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Điểm</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Kết quả</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nhận xét</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ngày làm</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>Đang tải kết quả...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-faint)' }}>Chưa có kết quả nào phù hợp.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{initialsOf(r.employeeName)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="cell-name" style={{ fontWeight: '700', color: 'var(--navy)' }}>{r.employeeName}</div>
                          <div className="cell-sub" style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{r.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-soft)' }}>{r.examName}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: '700' }}>{r.score}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={r.ratingTier === 'pass' ? 'stamp stamp-visa' : 'stamp stamp-leave'}>{r.result}</span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span title={r.note || 'Chưa có nhận xét'}>{r.note || 'Chưa có nhận xét'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{r.takenAt}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <button className="row-action" title="Chỉnh sửa" onClick={() => handleOpenEditModal(r)} style={{ background: 'var(--teal-soft)', border: '1px solid var(--teal-light)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="row-action" title="Xóa" onClick={() => handleDelete(r)} style={{ background: 'var(--coral-soft)', border: '1px solid var(--coral)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}>
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
                {editingItem ? '✏️ Chỉnh sửa kết quả' : '➕ Thêm kết quả test năng lực'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--bg)', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhân viên *</label>
                <select name="employeeId" value={formData.employeeId} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                  {employees.map(e => <option key={e.dbId} value={e.dbId}>{e.name} ({e.id})</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Tên bài test *</label>
                <input name="examName" value={formData.examName} onChange={handleInputChange} placeholder="VD: Kỹ năng tư vấn du học Nhật Bản" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Điểm số</label>
                  <input type="number" step="0.1" min="0" max="10" name="score" value={formData.score} onChange={handleInputChange} placeholder="8.5" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Kết quả</label>
                  <select name="result" value={formData.result} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px', background: '#fff' }}>
                    {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Ngày làm</label>
                <input type="date" name="takenAt" value={formData.takenAt} onChange={handleInputChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' }}>Nhận xét</label>
                <input name="note" value={formData.note} onChange={handleInputChange} placeholder="Nhận xét thêm (không bắt buộc)" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border)', fontSize: '13.5px' }} />
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
