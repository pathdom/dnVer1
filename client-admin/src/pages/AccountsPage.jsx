import React, { useState } from 'react';
import Topbar from '../components/Topbar';

const INITIAL_ACCOUNTS = [
  { id: 1, type: 'staff', name: 'Minh Hằng', email: 'admin@aladdin.vn', role: 'Quản trị viên', status: 'active', statusText: 'Đang hoạt động', lastLogin: '19/08/2026 09:12', avatar: 'MH' },
  { id: 2, type: 'staff', name: 'Trần Minh Khoa', email: 'khoa.tran@aladdin.vn', role: 'Trưởng nhóm tư vấn', status: 'active', statusText: 'Đang hoạt động', lastLogin: '19/08/2026 08:40', avatar: 'TK' },
  { id: 3, type: 'staff', name: 'Lê Thị Hồng', email: 'hong.le@aladdin.vn', role: 'Tư vấn viên', status: 'active', statusText: 'Đang hoạt động', lastLogin: '18/08/2026 17:02', avatar: 'LH' },
  { id: 4, type: 'staff', name: 'Phạm Thị Yến', email: 'yen.pham@aladdin.vn', role: 'Chuyên viên hồ sơ', status: 'locked', statusText: 'Đã khóa', lastLogin: '10/08/2026 14:30', avatar: 'PY' },
  { id: 5, type: 'student', name: 'Nguyễn Thị Lan Anh', email: 'lananh.nguyen@email.com', role: 'Mã HV-2451', status: 'active', statusText: 'Đang hoạt động', lastLogin: '19/08/2026 07:55', avatar: 'LA' },
  { id: 6, type: 'student', name: 'Phạm Đức Huy', email: 'duchuy.pham@email.com', role: 'Mã HV-2452', status: 'active', statusText: 'Đang hoạt động', lastLogin: '17/08/2026 20:11', avatar: 'ĐH' },
  { id: 7, type: 'student', name: 'Vũ Ngọc Mai', email: 'ngocmai.vu@email.com', role: 'Mã HV-2453', status: 'pending', statusText: 'Chờ kích hoạt', lastLogin: 'Chưa đăng nhập', avatar: 'NM' },
  { id: 8, type: 'student', name: 'Đỗ Gia Bảo', email: 'giabao.do@email.com', role: 'Mã HV-2454', status: 'active', statusText: 'Đang hoạt động', lastLogin: '16/08/2026 11:48', avatar: 'GB' },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals Open State
  const [activeModal, setActiveModal] = useState(null); // 'createStaff', 'createStudent', 'resetStaff', 'resetStudent'

  // Form States
  const [staffForm, setStaffForm] = useState({ name: '', email: '', dept: 'Tư vấn tuyển sinh', role: 'Nhân viên', password: 'Vb7x92Km' });
  const [studentForm, setStudentForm] = useState({ student: 'Nguyễn Thị Lan Anh — HV-2451', email: '', password: 'Hs4mQ81p' });
  const [resetStaffForm, setResetStaffForm] = useState({ staff: 'Minh Hằng — admin@aladdin.vn', password: 'Kt2vB58r' });
  const [resetStudentForm, setResetStudentForm] = useState({ student: 'Nguyễn Thị Lan Anh — HV-2451', password: 'Sv9pL34w' });

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

  const getInitials = (name) => {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Toggle Account Lock/Unlock
  const toggleAcctLock = (id) => {
    setAccounts(prev => prev.map(acct => {
      if (acct.id === id) {
        const isLocked = acct.status === 'locked';
        const nextStatus = isLocked ? 'active' : 'locked';
        const nextStatusText = isLocked ? 'Đang hoạt động' : 'Đã khóa';
        showToast(isLocked ? `Đã mở khóa tài khoản "${acct.name}"` : `Đã khóa tài khoản "${acct.name}"`);
        return { ...acct, status: nextStatus, statusText: nextStatusText };
      }
      return acct;
    }));
  };

  // Create Staff Account
  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name.trim()) return alert('Vui lòng nhập Họ và tên');

    const newAcct = {
      id: Date.now(),
      type: 'staff',
      name: staffForm.name.trim(),
      email: staffForm.email.trim() || 'nhanvien@aladdin.vn',
      role: staffForm.role,
      status: 'active',
      statusText: 'Đang hoạt động',
      lastLogin: 'Chưa đăng nhập',
      avatar: getInitials(staffForm.name)
    };

    setAccounts([newAcct, ...accounts]);
    setActiveModal(null);
    showToast(`Đã tạo tài khoản nhân viên cho "${staffForm.name}"`);
    setStaffForm({ name: '', email: '', dept: 'Tư vấn tuyển sinh', role: 'Nhân viên', password: generatePassword() });
  };

  // Create Student Account
  const handleCreateStudent = (e) => {
    e.preventDefault();
    const name = studentForm.student.split('—')[0].trim();
    const maHV = studentForm.student.split('—')[1]?.trim() || 'HV';

    const newAcct = {
      id: Date.now(),
      type: 'student',
      name,
      email: studentForm.email.trim() || 'hocvien@email.com',
      role: `Mã ${maHV}`,
      status: 'pending',
      statusText: 'Chờ kích hoạt',
      lastLogin: 'Chưa đăng nhập',
      avatar: getInitials(name)
    };

    setAccounts([newAcct, ...accounts]);
    setActiveModal(null);
    showToast(`Đã tạo tài khoản học viên cho "${name}"`);
    setStudentForm({ student: 'Nguyễn Thị Lan Anh — HV-2451', email: '', password: generatePassword() });
  };

  // Reset Staff Password
  const handleResetStaff = (e) => {
    e.preventDefault();
    const name = resetStaffForm.staff.split('—')[0].trim();
    setActiveModal(null);
    showToast(`Đã reset mật khẩu cho nhân viên "${name}"`);
  };

  // Reset Student Password
  const handleResetStudent = (e) => {
    e.preventDefault();
    const name = resetStudentForm.student.split('—')[0].trim();
    setActiveModal(null);
    showToast(`Đã reset mật khẩu cho học viên "${name}"`);
  };

  // Filtering
  const filteredAccounts = accounts.filter(a => {
    const matchType = filter === 'all' || a.type === filter;
    const matchSearch =
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.role || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const staffCount = accounts.filter(a => a.type === 'staff').length;
  const studentCount = accounts.filter(a => a.type === 'student').length;

  return (
    <section className="page active">
      <Topbar
        eyebrow={`${accounts.length} tài khoản`}
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
        <button className="action-card" onClick={() => setActiveModal('createStaff')}>
          <div className="action-card-icon" style={{ background: 'var(--teal-soft)' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg></div>
          <div className="action-card-title">Tạo tài khoản nhân viên</div>
          <div className="action-card-desc">Cấp tài khoản đăng nhập nội bộ cho nhân viên mới.</div>
          <div className="action-card-arrow">Tạo mới →</div>
        </button>

        <button className="action-card" onClick={() => setActiveModal('createStudent')}>
          <div className="action-card-icon" style={{ background: 'var(--gold-soft)' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 10v6"/></svg></div>
          <div className="action-card-title">Tạo tài khoản học viên</div>
          <div className="action-card-desc">Cấp tài khoản cổng thông tin cho học viên theo hồ sơ.</div>
          <div className="action-card-arrow">Tạo mới →</div>
        </button>

        <button className="action-card" onClick={() => setActiveModal('resetStaff')}>
          <div className="action-card-icon" style={{ background: '#E7EEFC' }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3B6FD1" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/><path d="M12 15v2"/></svg></div>
          <div className="action-card-title">Reset mật khẩu nhân viên</div>
          <div className="action-card-desc">Đặt lại mật khẩu khi nhân viên quên hoặc cần bảo mật lại.</div>
          <div className="action-card-arrow">Reset ngay →</div>
        </button>

        <button className="action-card" onClick={() => setActiveModal('resetStudent')}>
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
            placeholder="Tìm theo tên, email..."
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
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)' }}>
                    Không có tài khoản phù hợp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acct => (
                  <tr key={acct.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div className="cell-person" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>{acct.avatar}</div>
                        <div>
                          <div className="cell-name" style={{ fontWeight: '600', color: 'var(--navy)' }}>{acct.name}</div>
                          <div className="cell-sub" style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>{acct.email}</div>
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
                      <span className={`stamp ${acct.status === 'locked' ? 'stamp-hold' : acct.status === 'pending' ? 'stamp-processing' : 'stamp-green'}`}>
                        {acct.statusText}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{acct.lastLogin}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="acct-icon-btn"
                          title="Reset mật khẩu"
                          onClick={() => setActiveModal(acct.type === 'staff' ? 'resetStaff' : 'resetStudent')}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-soft)' }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                        </button>
                        <button
                          className={`acct-icon-btn ${acct.status !== 'locked' ? 'danger' : ''}`}
                          title={acct.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          onClick={() => toggleAcctLock(acct.id)}
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Họ và tên *</label>
                <input required type="text" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Email nội bộ</label>
                <input type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} placeholder="ten@aladdin.vn" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Phòng ban</label>
                  <select value={staffForm.dept} onChange={e => setStaffForm({ ...staffForm, dept: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                    <option>Tư vấn tuyển sinh</option>
                    <option>Xử lý hồ sơ</option>
                    <option>Marketing</option>
                    <option>Kế toán</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Vai trò</label>
                  <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                    <option>Nhân viên</option>
                    <option>Trưởng nhóm</option>
                    <option>Quản trị viên</option>
                  </select>
                </div>
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
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Tạo tài khoản</button>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Chọn học viên theo hồ sơ</label>
                <select value={studentForm.student} onChange={e => setStudentForm({ ...studentForm, student: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                  <option>Nguyễn Thị Lan Anh — HV-2451</option>
                  <option>Phạm Đức Huy — HV-2452</option>
                  <option>Vũ Ngọc Mai — HV-2453</option>
                  <option>Đỗ Gia Bảo — HV-2454</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Email đăng nhập</label>
                <input type="email" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} placeholder="email@vidu.com" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px' }} />
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
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Tạo tài khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET MẬT KHẨU NHÂN VIÊN */}
      {activeModal === 'resetStaff' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '600', color: 'var(--navy)' }}>Reset mật khẩu nhân viên</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleResetStaff} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Chọn nhân viên</label>
                <select value={resetStaffForm.staff} onChange={e => setResetStaffForm({ ...resetStaffForm, staff: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                  <option>Minh Hằng — admin@aladdin.vn</option>
                  <option>Trần Minh Khoa — khoa.tran@aladdin.vn</option>
                  <option>Lê Thị Hồng — hong.le@aladdin.vn</option>
                  <option>Phạm Thị Yến — yen.pham@aladdin.vn</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Mật khẩu mới</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly value={resetStaffForm.password} style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'var(--font-mono)' }} />
                  <button type="button" onClick={() => setResetStaffForm({ ...resetStaffForm, password: generatePassword() })} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>🔄</button>
                  <button type="button" onClick={() => copyPassword(resetStaffForm.password)} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>📋</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-ghost" style={{ padding: '8px 16px' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Xác nhận reset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RESET MẬT KHẨU HỌC VIÊN */}
      {activeModal === 'resetStudent' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 20, 35, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-card" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', margin: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '600', color: 'var(--navy)' }}>Reset mật khẩu học viên</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleResetStudent} style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Chọn học viên</label>
                <select value={resetStudentForm.student} onChange={e => setResetStudentForm({ ...resetStudentForm, student: e.target.value })} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', background: '#fff' }}>
                  <option>Nguyễn Thị Lan Anh — HV-2451</option>
                  <option>Phạm Đức Huy — HV-2452</option>
                  <option>Vũ Ngọc Mai — HV-2453</option>
                  <option>Đỗ Gia Bảo — HV-2454</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Mật khẩu mới</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" readOnly value={resetStudentForm.password} style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'var(--font-mono)' }} />
                  <button type="button" onClick={() => setResetStudentForm({ ...resetStudentForm, password: generatePassword() })} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>🔄</button>
                  <button type="button" onClick={() => copyPassword(resetStudentForm.password)} style={{ width: '38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}>📋</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-ghost" style={{ padding: '8px 16px' }}>Hủy</button>
                <button type="submit" className="btn-primary" style={{ padding: '8px 18px' }}>Xác nhận reset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
