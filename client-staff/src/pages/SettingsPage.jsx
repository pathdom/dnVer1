import React, { useState } from 'react';
import Topbar from '../components/Topbar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [toggles, setToggles] = useState({ n1: true, n2: true, n3: true, n4: true, n5: false });

  const toggleSwitch = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="page active">
      <Topbar
        eyebrow="Quản trị hệ thống"
        title="Cài đặt"
        subtitle="Quản lý thông tin công ty, tài khoản và phân quyền người dùng."
      />

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
              <div className="panel">
                <div className="panel-head"><h3>Hồ sơ công ty</h3></div>
                <div className="logo-upload-row">
                  <div className="logo-preview">
                    <svg width="30" height="30" viewBox="0 0 38 38" fill="none"><path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#4FC3B4" strokeWidth="2.4" strokeLinecap="round"/><circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/></svg>
                  </div>
                  <div className="logo-upload-text"><strong>Logo công ty</strong><span>PNG hoặc SVG, tối thiểu 256x256px</span></div>
                  <button className="btn-primary" style={{ marginLeft: 'auto' }}>Tải logo mới</button>
                </div>
                <div className="form-grid">
                  <div className="form-field"><label>Tên công ty</label><input type="text" defaultValue="Công ty CP Giáo dục VietBridge" /></div>
                  <div className="form-field"><label>Mã số thuế</label><input type="text" defaultValue="0109XXXXXX" /></div>
                  <div className="form-field full"><label>Địa chỉ trụ sở</label><input type="text" defaultValue="Tầng 8, Tòa ABC, Q. Cầu Giấy, Hà Nội" /></div>
                  <div className="form-field"><label>Hotline</label><input type="text" defaultValue="1900 6868" /></div>
                  <div className="form-field"><label>Email liên hệ</label><input type="text" defaultValue="lienhe@vietbridge.edu.vn" /></div>
                  <div className="form-field"><label>Website</label><input type="text" defaultValue="vietbridge.edu.vn" /></div>
                  <div className="form-field"><label>Múi giờ</label><select><option>(GMT+7) Hà Nội</option></select></div>
                </div>
                <div className="form-actions">
                  <button className="btn-ghost">Hủy</button>
                  <button className="btn-primary">Lưu thay đổi</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section active">
              <div className="panel">
                <div className="panel-head"><h3>Thông tin tài khoản</h3></div>
                <div className="logo-upload-row">
                  <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '20px', borderRadius: '14px' }}>MH</div>
                  <div className="logo-upload-text"><strong>Minh Hằng</strong><span>Quản trị viên · minh.hang@vietbridge.edu.vn</span></div>
                  <button className="btn-primary" style={{ marginLeft: 'auto' }}>Đổi ảnh đại diện</button>
                </div>
                <div className="form-grid">
                  <div className="form-field"><label>Họ và tên</label><input type="text" defaultValue="Minh Hằng" /></div>
                  <div className="form-field"><label>Email</label><input type="text" defaultValue="minh.hang@vietbridge.edu.vn" /></div>
                  <div className="form-field"><label>Số điện thoại</label><input type="text" defaultValue="0987 654 321" /></div>
                  <div className="form-field"><label>Vai trò</label><input type="text" defaultValue="Quản trị viên" disabled /></div>
                  <div className="form-field"><label>Mật khẩu mới</label><input type="password" placeholder="••••••••" /></div>
                  <div className="form-field"><label>Xác nhận mật khẩu</label><input type="password" placeholder="••••••••" /></div>
                </div>
                <div className="form-actions">
                  <button className="btn-ghost">Hủy</button>
                  <button className="btn-primary">Cập nhật tài khoản</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="settings-section active">
              <div className="panel">
                <div className="panel-head"><h3>Người dùng & phân quyền</h3><span className="link">+ Mời thành viên</span></div>
                <div className="role-row"><div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>MH</div><div><div className="cell-name">Minh Hằng</div><div className="cell-sub">minh.hang@vietbridge.edu.vn</div></div><span className="role-badge" style={{ background: 'var(--navy)', color: '#fff' }}>Quản trị viên</span></div>
                <div className="role-row"><div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>TK</div><div><div className="cell-name">Trần Minh Khoa</div><div className="cell-sub">khoa.tran@vietbridge.edu.vn</div></div><span className="role-badge" style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}>Trưởng nhóm tư vấn</span></div>
                <div className="role-row"><div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>LH</div><div><div className="cell-name">Lê Thị Hồng</div><div className="cell-sub">hong.le@vietbridge.edu.vn</div></div><span className="role-badge" style={{ background: '#E7EEFC', color: '#3B6FD1' }}>Tư vấn viên</span></div>
                <div className="role-row"><div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>KN</div><div><div className="cell-name">Ngô Thị Kim Ngân</div><div className="cell-sub">ngan.ngo@vietbridge.edu.vn</div></div><span className="role-badge" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>Kế toán</span></div>
              </div>
            </div>
          )}

          {activeTab === 'notif' && (
            <div className="settings-section active">
              <div className="panel">
                <div className="panel-head"><h3>Tuỳ chọn thông báo</h3></div>
                <div className="toggle-row">
                  <div className="toggle-row-text"><strong>Học viên mới đăng ký</strong><span>Nhận email khi có học viên mới tiếp nhận</span></div>
                  <div className={`toggle-switch ${toggles.n1 ? 'on' : ''}`} onClick={() => toggleSwitch('n1')}></div>
                </div>
                <div className="toggle-row">
                  <div className="toggle-row-text"><strong>Hồ sơ visa cập nhật</strong><span>Thông báo khi trạng thái visa thay đổi</span></div>
                  <div className={`toggle-switch ${toggles.n2 ? 'on' : ''}`} onClick={() => toggleSwitch('n2')}></div>
                </div>
                <div className="toggle-row">
                  <div className="toggle-row-text"><strong>Lịch tư vấn</strong><span>Nhắc nhở trước buổi tư vấn 30 phút</span></div>
                  <div className={`toggle-switch ${toggles.n3 ? 'on' : ''}`} onClick={() => toggleSwitch('n3')}></div>
                </div>
                <div className="toggle-row">
                  <div className="toggle-row-text"><strong>Thanh toán học phí</strong><span>Thông báo khi có giao dịch mới hoặc quá hạn</span></div>
                  <div className={`toggle-switch ${toggles.n4 ? 'on' : ''}`} onClick={() => toggleSwitch('n4')}></div>
                </div>
                <div className="toggle-row">
                  <div className="toggle-row-text"><strong>Bản tin nội bộ hàng tuần</strong><span>Tổng hợp hoạt động của trung tâm mỗi thứ Hai</span></div>
                  <div className={`toggle-switch ${toggles.n5 ? 'on' : ''}`} onClick={() => toggleSwitch('n5')}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
