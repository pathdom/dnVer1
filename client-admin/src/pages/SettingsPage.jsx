import React, { useEffect, useRef, useState } from 'react';
import Topbar from '../components/Topbar';
import { apiFetch } from '../lib/apiFetch';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [toggles, setToggles] = useState({ n1: true, n2: true, n3: true, n4: true, n5: false });
  const [logo, setLogo] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    apiFetch('/api/settings/logo')
      .then(res => res.json())
      .then(d => setLogo(d.logoUrl || null))
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!');
      return;
    }
    const form = new FormData();
    form.append('logo', file);
    apiFetch('/api/settings/logo', { method: 'POST', body: form })
      .then(res => res.json())
      .then(d => {
        if (d.success) {
          setLogo(d.logoUrl);
          window.dispatchEvent(new Event('logoUpdated'));
          showToast('✅ Đã tải và thay đổi logo công ty thành công!');
        } else {
          alert(d.error || 'Không thể tải logo lên');
        }
      })
      .catch(err => alert('Lỗi kết nối máy chủ: ' + err.message));
  };

  const handleRemoveLogo = () => {
    if (window.confirm('Bạn có muốn khôi phục logo mặc định của hệ thống?')) {
      apiFetch('/api/settings/logo', { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
          setLogo(null);
          window.dispatchEvent(new Event('logoUpdated'));
          showToast('🔄 Đã khôi phục logo mặc định');
        })
        .catch(err => alert('Lỗi kết nối máy chủ: ' + err.message));
    }
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow="Quản trị hệ thống"
        title="Cài đặt"
        subtitle="Quản lý thông tin công ty, logo nhận diện thương hiệu và phân quyền người dùng."
      />

      {/* Hidden File Input for Logo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: 'var(--navy)', color: '#fff', padding: '12px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '9px', boxShadow: '0 12px 30px rgba(15,20,35,0.25)', zIndex: 2000 }}>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="settings-layout">
        <div className="settings-menu">
          <button className={`settings-menu-item ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
            Thông tin công ty
          </button>
          <button className={`settings-menu-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>
            Tài khoản của tôi
          </button>
          <button className={`settings-menu-item ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
            Phân quyền người dùng
          </button>
          <button className={`settings-menu-item ${activeTab === 'notif' ? 'active' : ''}`} onClick={() => setActiveTab('notif')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Thông báo
          </button>
        </div>

        <div className="settings-stack">
          {activeTab === 'company' && (
            <div className="settings-section active">
              <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy)' }}>Hồ sơ công ty</h3>
                </div>
                <div className="logo-upload-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                  <div className="logo-preview" style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {logo ? (
                      <img src={logo} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="30" height="30" viewBox="0 0 38 38" fill="none"><path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#4FC3B4" strokeWidth="2.4" strokeLinecap="round"/><circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/></svg>
                    )}
                  </div>
                  <div className="logo-upload-text">
                    <strong style={{ fontSize: '14.5px', color: 'var(--navy)', display: 'block' }}>Logo công ty</strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Hỗ trợ định dạng PNG, JPG, SVG (Tối đa 5MB)</span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {logo && (
                      <button type="button" onClick={handleRemoveLogo} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '12.5px', color: 'var(--coral)', borderColor: 'var(--coral-soft)' }}>
                        Xóa logo
                      </button>
                    )}
                    <button type="button" onClick={() => fileInputRef.current.click()} className="btn-primary" style={{ padding: '9px 18px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Tải logo mới
                    </button>
                  </div>
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Tên công ty</label><input type="text" defaultValue="Công ty CP Giáo dục ALADDIN" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Mã số thuế</label><input type="text" defaultValue="0109XXXXXX" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field full" style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Địa chỉ trụ sở</label><input type="text" defaultValue="Tầng 8, Tòa ABC, Q. Cầu Giấy, Hà Nội" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Hotline</label><input type="text" defaultValue="1900 6868" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Email liên hệ</label><input type="text" defaultValue="lienhe@aladdin.vn" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Website</label><input type="text" defaultValue="aladdin.vn" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Múi giờ</label><select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px', background: '#fff' }}><option>(GMT+7) Hà Nội</option></select></div>
                </div>

                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <button className="btn-ghost" style={{ padding: '10px 20px' }}>Hủy</button>
                  <button className="btn-primary" onClick={() => showToast('✅ Đã lưu cấu hình công ty!')} style={{ padding: '10px 24px' }}>Lưu thay đổi</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section active">
              <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy)' }}>Thông tin tài khoản</h3>
                </div>
                <div className="logo-upload-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg)', borderRadius: '14px', border: '1px solid var(--border)' }}>
                  <div className="avatar" style={{ width: '56px', height: '56px', fontSize: '20px', borderRadius: '14px' }}>MH</div>
                  <div className="logo-upload-text">
                    <strong style={{ fontSize: '15px', color: 'var(--navy)' }}>Minh Hằng</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Quản trị viên · minh.hang@aladdin.vn</div>
                  </div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Họ và tên</label><input type="text" defaultValue="Minh Hằng" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Email</label><input type="text" defaultValue="minh.hang@aladdin.vn" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Số điện thoại</label><input type="text" defaultValue="0987 654 321" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px' }} /></div>
                  <div className="form-field"><label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', marginBottom: '6px' }}>Vai trò</label><input type="text" defaultValue="Quản trị viên" disabled style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13.5px', background: 'var(--bg)' }} /></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="settings-section active">
              <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy)' }}>Người dùng & phân quyền</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="role-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg)', borderRadius: '10px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>MH</div>
                    <div><div style={{ fontWeight: '700', color: 'var(--navy)' }}>Minh Hằng</div><div style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>minh.hang@aladdin.vn</div></div>
                    <span className="role-badge" style={{ marginLeft: 'auto', background: 'var(--navy)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Quản trị viên</span>
                  </div>
                  <div className="role-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'var(--bg)', borderRadius: '10px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>TK</div>
                    <div><div style={{ fontWeight: '700', color: 'var(--navy)' }}>Trần Minh Khoa</div><div style={{ fontSize: '11.5px', color: 'var(--text-faint)' }}>khoa.tran@aladdin.vn</div></div>
                    <span className="role-badge" style={{ marginLeft: 'auto', background: 'var(--teal-soft)', color: 'var(--teal)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>Trưởng nhóm tư vấn</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notif' && (
            <div className="settings-section active">
              <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <div className="panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--navy)' }}>Cấu hình thông báo</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg)', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--navy)' }}>Thông báo học viên mới đăng ký</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Gửi email khi có học viên mới ghi danh trên cổng</div>
                    </div>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--teal)', width: '18px', height: '18px' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg)', borderRadius: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--navy)' }}>Cập nhật tiến độ Visa & Hồ sơ</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>Gửi thông báo đẩy khi trạng thái hồ sơ thay đổi</div>
                    </div>
                    <input type="checkbox" defaultChecked style={{ accentColor: 'var(--teal)', width: '18px', height: '18px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
