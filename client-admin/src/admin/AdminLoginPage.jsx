import React, { useState } from 'react';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        setLoading(false);
        if (ok && data.success) {
          onLoginSuccess(data);
        } else {
          setError(data.error || 'Đăng nhập thất bại');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Không thể kết nối tới máy chủ. Vui lòng thử lại.');
      });
  };

  return (
    <div className="login-page">
      <div className="login-brand">
        <div className="login-brand-row">
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
            <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#4FC3B4" strokeWidth="2.4" strokeLinecap="round"/>
            <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
            <path d="M4 30H34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.4 5"/>
          </svg>
          <div>
            <div className="login-brand-name">ALADDIN</div>
            <div className="login-brand-sub">ADMIN WORKSPACE</div>
          </div>
        </div>

        <div className="login-brand-mid">
          <h1>Điều hành toàn bộ hệ thống ALADDIN Education.</h1>
          <p>Quản lý học viên, nhân viên, trường đối tác, doanh thu và tài khoản người dùng — tất cả trong một nơi.</p>
        </div>

        <div className="login-role-note">
          Dành riêng cho quản trị viên ALADDIN Education · Đăng nhập bằng tài khoản quản trị
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-card">
          <h2>Đăng nhập quản trị</h2>
          <p className="sub">Nhập tài khoản quản trị để vào bảng điều khiển.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Tên đăng nhập</label>
              <input
                className="form-input"
                type="text"
                placeholder="admin_tong"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
            {error && <p style={{ color: '#c0392b', fontSize: '13px', margin: '-6px 0 12px' }}>{error}</p>}
            <button className="btn-block" type="submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
