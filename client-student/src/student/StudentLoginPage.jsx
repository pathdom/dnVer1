import React, { useState } from 'react';

export default function StudentLoginPage({ onLoginSuccess }) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    fetch('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password })
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
        <div className="brand">
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none">
            <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#4FC3B4" strokeWidth="2.4" strokeLinecap="round"/>
            <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
            <path d="M4 30H34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.4 5"/>
          </svg>
          <div>
            <div className="brand-name">ALADDIN</div>
            <div className="brand-sub">EDUCATION GROUP</div>
          </div>
        </div>

        <div className="login-brand-mid">
          <h1>Theo dõi hành trình du học của bạn, mọi lúc mọi nơi.</h1>
          <p>Xem tiến độ hồ sơ, tài liệu, lịch tư vấn và trao đổi trực tiếp với tư vấn viên phụ trách — tất cả trong một nơi.</p>
          <svg className="route-graphic" width="320" height="70" viewBox="0 0 320 70" fill="none">
            <path d="M6 55C60 10 130 10 160 40C190 70 250 70 314 20" stroke="rgba(255,255,255,0.22)" strokeWidth="1.6" strokeDasharray="1 7" strokeLinecap="round"/>
            <circle cx="6" cy="55" r="4" fill="#4FC3B4"/>
            <circle cx="314" cy="20" r="4" fill="#DE9F3B"/>
          </svg>
        </div>

        <div className="quote-box">
          <p>"Nhờ cổng thông tin học viên, mình luôn biết chính xác hồ sơ đang ở bước nào mà không cần gọi điện hỏi liên tục."</p>
          <div className="who">— Nguyễn Thị Lan Anh, học viên chương trình Cử nhân QTKD</div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-form-card">
          <h2>Đăng nhập học viên</h2>
          <p className="sub">Nhập thông tin tài khoản để xem hồ sơ du học của bạn.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mã học viên hoặc Email</label>
              <input
                className="form-input"
                type="text"
                placeholder="HV-2451 hoặc email@vidu.com"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
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
            <div className="form-row-between">
              <label className="remember"><input type="checkbox" defaultChecked style={{ accentColor: '#2A9D8F' }} />Ghi nhớ đăng nhập</label>
              <span className="forgot-link">Quên mật khẩu?</span>
            </div>
            <button className="btn-block" type="submit" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          </form>

          <p className="login-footer-note">Chưa có tài khoản? <a href="#contact">Liên hệ tư vấn viên của bạn</a></p>
        </div>
      </div>
    </div>
  );
}
