import React, { useEffect, useState } from 'react';
import StudentHomePage from './StudentHomePage';
import StudentProfilePage from './StudentProfilePage';
import StudentDocsPage from './StudentDocsPage';
import StudentApptPage from './StudentApptPage';
import StudentPaymentPage from './StudentPaymentPage';
import StudentChatPage from './StudentChatPage';

export default function StudentShell({ profile, onLogout, onSwitchToAdmin }) {
  const [currentTab, setCurrentTab] = useState('home');
  const [studentProfile, setStudentProfile] = useState(profile);

  useEffect(() => {
    fetch('/api/student/profile')
      .then(res => res.json())
      .then(d => setStudentProfile(d))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="portal-shell active">
      <header className="portal-header">
        <div className="brand" onClick={() => setCurrentTab('home')} style={{ cursor: 'pointer' }}>
          <svg width="30" height="30" viewBox="0 0 38 38" fill="none">
            <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#2A9D8F" strokeWidth="2.6" strokeLinecap="round"/>
            <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
          </svg>
          <div>
            <div className="brand-name" style={{ color: 'var(--navy)', fontSize: '16px' }}>VietBridge</div>
          </div>
        </div>

        <nav className="portal-nav">
          <button className={`portal-nav-link ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>Trang chủ</button>
          <button className={`portal-nav-link ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setCurrentTab('profile')}>Hồ sơ du học</button>
          <button className={`portal-nav-link ${currentTab === 'docs' ? 'active' : ''}`} onClick={() => setCurrentTab('docs')}>Tài liệu</button>
          <button className={`portal-nav-link ${currentTab === 'appt' ? 'active' : ''}`} onClick={() => setCurrentTab('appt')}>Lịch tư vấn</button>
          <button className={`portal-nav-link ${currentTab === 'payment' ? 'active' : ''}`} onClick={() => setCurrentTab('payment')}>Học phí</button>
          <button className={`portal-nav-link ${currentTab === 'chat' ? 'active' : ''}`} onClick={() => setCurrentTab('chat')}>Tin nhắn</button>
        </nav>

        <div className="header-right">
          <button
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '16px' }}
            onClick={onSwitchToAdmin}
            title="Chuyển sang trang Admin Dashboard"
          >
            🔑 Cổng Admin
          </button>
          <div className="icon-btn" title="Thông báo">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span className="dot"></span>
          </div>
          <div className="header-avatar-chip" onClick={onLogout} title="Bấm để Đăng xuất">
            <div className="avatar">{studentProfile?.avatar || 'LA'}</div>
            <span className="name">{studentProfile?.name?.split(' ').pop() || 'Lan Anh'}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </header>

      <main className="portal-main">
        {currentTab === 'home' && <StudentHomePage setCurrentTab={setCurrentTab} profile={studentProfile} />}
        {currentTab === 'profile' && <StudentProfilePage profile={studentProfile} />}
        {currentTab === 'docs' && <StudentDocsPage />}
        {currentTab === 'appt' && <StudentApptPage />}
        {currentTab === 'payment' && <StudentPaymentPage />}
        {currentTab === 'chat' && <StudentChatPage />}
      </main>
    </div>
  );
}
