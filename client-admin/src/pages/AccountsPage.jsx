import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import Topbar from '../components/Topbar';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals Open State
  const [activeModal, setActiveModal] = useState(null); // 'createStaff', 'createStudent', 'resetStaff', 'resetStudent'
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [staffForm, setStaffForm] = useState({ nhanVienId: '', email: '', username: '', password: '' });
  const [studentForm, setStudentForm] = useState({ hocVienId: '', email: '', username: '', password: '' });
  const [resetForm, setResetForm] = useState({ accountId: '', password: '' });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  };

  const copyPassword = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép mật khẩu vào bộ nhớ tạm');
  };

  const fetchAccounts = () => {
    setLoading(true);
    apiFetch('/api/accounts')
      .then(res => res.json())
      .then(d => { setAccounts(d.accounts || []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const fetchAvailableEmployees = () => {
    apiFetch('/api/accounts/available-employees')
      .then(res => res.json())
      .then(d => setAvailableEmployees(d.employees || []))
      .catch(err => console.error(err));
  };

  const fetchAvailableStudents = () => {
    apiFetch('/api/accounts/available-students')
      .then(res => res.json())
      .then(d => setAvailableStudents(d.students || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateStaff = () => {
    fetchAvailableEmployees();
    setStaffForm({ nhanVienId: '', email: '', username: '', password: generatePassword() });
    setActiveModal('createStaff');
  };

  const openCreateStudent = () => {
    fetchAvailableStudents();
    setStudentForm({ hocVienId: '', email: '', username: '', password: generatePassword() });
    setActiveModal('createStudent');
  };

  const openReset = (accountType, accountId) => {
    setResetForm({ accountId, password: generatePassword() });
    setActiveModal(accountType === 'student' ? 'resetStudent' : 'resetStaff');
  };

  // Create Staff Account
  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!staffForm.nhanVienId) return alert('Vui lòng chọn nhân viên');
    if (!staffForm.username.trim()) return alert('Vui lòng nhập tên đăng nhập');

    setSubmitting(true);
    apiFetch('/api/accounts/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffForm)
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setActiveModal(null);
          showToast(data.message || 'Đã tạo tài khoản nhân viên');
          fetchAccounts();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  // Create Student Account
  const handleCreateStudent = (e) => {
    e.preventDefault();
    if (!studentForm.hocVienId) return alert('Vui lòng chọn học viên');
    if (!studentForm.username.trim()) return alert('Vui lòng nhập tên đăng nhập');

    setSubmitting(true);
    apiFetch('/api/accounts/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentForm)
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setActiveModal(null);
          showToast(data.message || 'Đã tạo tài khoản học viên');
          fetchAccounts();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  // Reset Password (dùng chung cho cả nhân viên & học viên)
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!resetForm.accountId) return alert('Vui lòng chọn tài khoản');

    const target = accounts.find(a => `${a.accountType}-${a.accountId}` === resetForm.accountId);
    if (!target) return alert('Không tìm thấy tài khoản đã chọn');

    setSubmitting(true);
    apiFetch(`/api/accounts/${target.accountType}/${target.accountId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: resetForm.password })
    })
      .then(res => res.json())
      .then(data => {
        setSubmitting(false);
        if (data.success) {
          setActiveModal(null);
          showToast(`Đã reset mật khẩu cho "${target.name}"`);
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => { setSubmitting(false); alert('Lỗi kết nối máy chủ: ' + err.message); });
  };

  // Toggle Account Lock/Unlock
  const toggleAcctLock = (acct) => {
    apiFetch(`/api/accounts/${acct.accountType}/${acct.accountId}/toggle-lock`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(data.status === 'Khóa' ? `Đã khóa tài khoản "${acct.name}"` : `Đã mở khóa tài khoản "${acct.name}"`);
          fetchAccounts();
        } else {
          alert(data.error || 'Có lỗi xảy ra');
        }
      })
      .catch(err => alert('Lỗi kết nối máy chủ: ' + err.message));
  };

  // Filtering
  const filteredAccounts = accounts.filter(a => {
    const matchType = filter === 'all' || a.type === filter;
    const matchSearch =
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const staffCount = accounts.filter(a => a.type === 'staff').length;
  const studentCount = accounts.filter(a => a.type === 'student').length;

  const resetableAccounts = accounts.filter(a => a.type === (activeModal === 'resetStudent' ? 'student' : 'staff'));

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${accounts.length} tài khoản CSDL`}
        title="Quản lý tài khoản"
        subtitle="Tạo mới và quản lý tài khoản đăng nhập cho nhân viên và học viên."
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 12px 30px rgba(15,20,35,0.25)', zIndex: 2000 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5"/></svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ACTION CARDS GRID */}
      <div className="action-grid">
        <button className="action-card" onClick={openCreateStaff}>
          <div className="action-card-icon" style={{ background: 'var(--teal-soft)' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg></div>
          <div className="action-card-title">Tạo tài khoản nhân viên</div>
          <div className="action-card-desc">Cấp tài khoản đăng nhập nội bộ cho nhân viên mới.</div>
          <div className="action-card-arrow">Tạo mới →</div>
        </button>

        <button className="action-card" onClick={openCreateStudent}>
          <div className="action-card-icon" style={{ background: 'var(--gold-soft)' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 10v6"/></svg></div>
          <div className="action-card-title">Tạo tài khoản học viên</div>
          <div className="action-card-desc">Cấp tài khoản cổng thông tin cho học viên theo hồ sơ.</div>
          <div className="action-card-arrow">Tạo mới →</div>
        </button>

        <button className="action-card" onClick={() => { setResetForm({ accountId: '', password: generatePassword() }); setActiveModal('resetStaff'); }}>
          <div className="action-card-icon" style={{ background: '#E7EEFC' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><path d="M12 15v2"/></svg></div>
          <div className="action-card-title">Reset mật khẩu nhân viên</div>
          <div className="action-card-desc">Đặt lại mật khẩu khi nhân viên quên hoặc cần bảo mật lại.</div>
          <div className="action-card-arrow">Reset ngay →</div>
        </button>

        <button className="action-card" onClick={() => { setResetForm({ accountId: '', password: generatePassword() }); setActiveModal('resetStudent'); }}>
          <div className="action-card-icon" style={{ background: 'var(--coral-soft)' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--coral)" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><path d="M12 15v2"/></svg></div>
          <div className="action-card-title">Reset mật khẩu học viên</div>
          <div className="action-card-desc">Đặt lại mật khẩu đăng nhập cổng thông tin học viên.</div>
          <div className="action-card-arrow">Reset ngay →</div>
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <div className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả ({accounts.length})</div>
        <div className={`chip ${filter === 'staff' ? 'active' : ''}`} onClick={() => setFilter('staff')}>Nhân viên ({staffCount})</div>
        <div className={`chip ${filter === 'student' ? 'active' : ''}`} onClick={() => setFilter('student')}>Học viên ({studentCount})</div>
        <div className="filter-search" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '9px 14px', width: '260px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, tài khoản..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* ACCOUNTS TABLE */}
      <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Tài khoản</th>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Loại</th>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Vai trò</th>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Trạng thái</th>
                <th style={{ padding: '12px 18px', textAlign: 'left' }}>Đăng nhập gần nhất</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Đang tải danh sách tài khoản từ CSDL...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Không có tài khoản phù hợp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acct => (
                  <tr key={`${acct.accountType}-${acct.accountId}`} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px', overflow: 'hidden' }}>
                          {acct.avatarUrl ? <img src={acct.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : acct.avatar}
                        </div>
                        <div>
                          <div className="cell-name" style={{ fontWeight: '600', color: 'var(--navy)' }}>{acct.name}</div>
                          <div className="cell-sub" style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{acct.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`acct-type ${acct.type === 'staff' ? 'acct-type-staff' : 'acct-type-student'}`} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: '700' }}>
                        {acct.type === 'staff' ? 'Nhân viên' : 'Học viên'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '500' }}>{acct.role}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`stamp ${acct.status === 'locked' ? 'stamp-hold' : 'stamp-green'}`}>
                        {acct.statusText}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{acct.lastLogin}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="acct-icon-btn"
                          title="Reset mật khẩu"
                          onClick={() => openReset(acct.accountType, acct.accountId)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-soft)' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        </button>
                        <button
                          className={`acct-icon-btn ${acct.status !== 'locked' ? 'danger' : ''}`}
                          title={acct.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          onClick={() => toggleAcctLock(acct)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px', color: acct.status === 'locked' ? 'var(--teal)' : 'var(--coral)' }}
                        >
                          {acct.status === 'locked' ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          )}
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

      {/* MODAL 1: TẠO TÀI KHOẢN NHÂN VIÊN */}
      {activeModal === 'createStaff' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '600', color: 'var(--navy)' }}>Tạo tài khoản nhân viên</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateStaff} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Chọn nhân viên (chưa có tài khoản) *</label>
                <select required value={staffForm.nhanVienId} onChange={e => setStaffForm({ ...staffForm, nhanVienId: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                  <option value="">-- Chọn nhân viên --</option>
                  {availableEmployees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.maNhanVien}</option>)}
                </select>
                {availableEmployees.length === 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '6px' }}>Tất cả nhân viên trong CSDL đã có tài khoản.</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Email nội bộ (dùng để đăng nhập)</label>
                <input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="ten@aladdin.vn" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Tên đăng nhập *</label>
                <input required type="text" value={staffForm.username} onChange={e => setStaffForm({ ...staffForm, username: e.target.value })} placeholder="nv_ten" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Mật khẩu tạm thời</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly value={staffForm.password} style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'var(--font-mono)' }} />
                  <button type="button" onClick={() => setStaffForm({ ...staffForm, password: generatePassword() })} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>🔄</button>
                  <button type="button" onClick={() => copyPassword(staffForm.password)} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>📋</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-ghost" style={{ padding: '8px 16px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 18px' }}>{submitting ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TẠO TÀI KHOẢN HỌC VIÊN */}
      {activeModal === 'createStudent' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '600', color: 'var(--navy)' }}>Tạo tài khoản học viên</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateStudent} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Chọn học viên theo hồ sơ (chưa có tài khoản) *</label>
                <select required value={studentForm.hocVienId} onChange={e => setStudentForm({ ...studentForm, hocVienId: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                  <option value="">-- Chọn học viên --</option>
                  {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name} — {s.maHocVien}</option>)}
                </select>
                {availableStudents.length === 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-faint)', marginTop: '6px' }}>Tất cả học viên trong CSDL đã có tài khoản.</div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Email đăng nhập</label>
                <input type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="email@vidu.com" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Tên đăng nhập *</label>
                <input required type="text" value={studentForm.username} onChange={e => setStudentForm({ ...studentForm, username: e.target.value })} placeholder="hv_ten" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Mật khẩu tạm thời</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly value={studentForm.password} style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'var(--font-mono)' }} />
                  <button type="button" onClick={() => setStudentForm({ ...studentForm, password: generatePassword() })} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>🔄</button>
                  <button type="button" onClick={() => copyPassword(studentForm.password)} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>📋</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-ghost" style={{ padding: '8px 16px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 18px' }}>{submitting ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3 & 4: RESET MẬT KHẨU (dùng chung UI cho nhân viên & học viên) */}
      {(activeModal === 'resetStaff' || activeModal === 'resetStudent') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '600', color: 'var(--navy)' }}>
                {activeModal === 'resetStudent' ? 'Reset mật khẩu học viên' : 'Reset mật khẩu nhân viên'}
              </h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleResetPassword} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>{activeModal === 'resetStudent' ? 'Chọn học viên' : 'Chọn nhân viên'}</label>
                <select required value={resetForm.accountId} onChange={e => setResetForm({ ...resetForm, accountId: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                  <option value="">-- Chọn tài khoản --</option>
                  {resetableAccounts.map(a => (
                    <option key={`${a.accountType}-${a.accountId}`} value={`${a.accountType}-${a.accountId}`}>{a.name} — {a.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Mật khẩu mới</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly value={resetForm.password} style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'var(--font-mono)' }} />
                  <button type="button" onClick={() => setResetForm({ ...resetForm, password: generatePassword() })} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>🔄</button>
                  <button type="button" onClick={() => copyPassword(resetForm.password)} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>📋</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-ghost" style={{ padding: '8px 16px' }}>Hủy</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 18px' }}>{submitting ? 'Đang lưu...' : 'Xác nhận reset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
