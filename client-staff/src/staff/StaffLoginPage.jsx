import React, { useState } from 'react';

export default function StaffLoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('khoa.tran@vietbridge.edu.vn');
  const [password, setPassword] = useState('123456');

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          onLoginSuccess(data.staff);
        }
      })
      .catch(() => onLoginSuccess());
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="brand">
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
            <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#2A9D8F" strokeWidth="2.4" strokeLinecap="round"/>
            <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
            <path d="M4 30H34" stroke="rgba(24,38,68,0.12)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.4 5"/>
          </svg>
          <div>
            <div className="brand-name">VietBridge</div>
            <div className="brand-sub">STAFF WORKSPACE</div>
          </div>
        </div>

        <div className="login-brand-mid">
          <h1>Không gian làm việc dành cho nhân viên VietBridge.</h1>
          <p>Quản lý học viên phụ trách, lịch tư vấn, công việc hằng ngày và trao đổi trực tiếp — gọn trong một nơi.</p>
          <div className="brand-badge-row">
            <div className="brand-badge"><b>32</b>Học viên</div>
            <div className="brand-badge"><b>92%</b>Tỷ lệ visa</div>
            <div className="brand-badge"><b>4.9★</b>Đánh giá</div>
          </div>
        </div>

        <div className="login-role-note">
          Dành riêng cho nhân viên VietBridge Education · Đăng nhập bằng tài khoản nội bộ
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-card">
          <h2>Đăng nhập nhân viên</h2>
          <p className="sub">Nhập tài khoản nội bộ để vào không gian làm việc của bạn.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email nội bộ</label>
              <input
                className="form-input"
                type="text"
                placeholder="ten@vietbridge.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="form-row-between">
              <label className="remember">
                <input type="checkbox" defaultChecked style={{ accentColor: '#2A9D8F' }} />Ghi nhớ đăng nhập
              </label>
              <span className="forgot-link">Quên mật khẩu?</span>
            </div>
            <button className="btn-block" type="submit">
              Đăng nhập
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
          <p className="login-footer-note">Gặp sự cố đăng nhập? <a href="#it">Liên hệ phòng IT</a></p>
        </div>
      </div>
    </div>
  );
}
