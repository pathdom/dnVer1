import React, { useState } from 'react';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="login-brand-row" style={{ gap: '22px' }}>
          <img src="/logo.jpg" alt="Aladdin Group" width="144" height="144" style={{ borderRadius: '26px', objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div className="login-brand-name" style={{ fontSize: '36px' }}>ALADDIN</div>
            <div className="login-brand-sub" style={{ fontSize: '16px' }}>ADMIN WORKSPACE</div>
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
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-faint)', display: 'flex' }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-6 0-10-8-10-8a18.5 18.5 0 0 1 4.22-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
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
