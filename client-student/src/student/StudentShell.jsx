import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import StudentHomePage from './StudentHomePage';
import StudentProfilePage from './StudentProfilePage';
import StudentPaymentPage from './StudentPaymentPage';
import StudentGradesPage from './StudentGradesPage';

export default function StudentShell({ profile, onLogout }) {
  const [currentTab, setCurrentTab] = useState('home');
  const [studentProfile, setStudentProfile] = useState(profile);

  useEffect(() => {
    apiFetch('/api/student/profile')
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
            <div className="brand-name" style={{ color: 'var(--navy)', fontSize: '16px' }}>ALADDIN</div>
          </div>
        </div>

        <nav className="portal-nav">
          <button className={`portal-nav-link ${currentTab === 'home' ? 'active' : ''}`} onClick={() => setCurrentTab('home')}>Trang chủ</button>
          <button className={`portal-nav-link ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setCurrentTab('profile')}>Hồ sơ du học</button>
          <button className={`portal-nav-link ${currentTab === 'payment' ? 'active' : ''}`} onClick={() => setCurrentTab('payment')}>Học phí</button>
          <button className={`portal-nav-link ${currentTab === 'grades' ? 'active' : ''}`} onClick={() => setCurrentTab('grades')}>Bảng điểm</button>
        </nav>

        <div className="header-right">
          <div className="header-avatar-chip" onClick={onLogout} title="Bấm để Đăng xuất">
            <div className="avatar">{studentProfile?.avatar || 'HV'}</div>
            <span className="name">{studentProfile?.name?.split(' ').pop() || ''}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </header>

      <main className="portal-main">
        {currentTab === 'home' && <StudentHomePage setCurrentTab={setCurrentTab} profile={studentProfile} />}
        {currentTab === 'profile' && <StudentProfilePage profile={studentProfile} />}
        {currentTab === 'payment' && <StudentPaymentPage profile={studentProfile} />}
        {currentTab === 'grades' && <StudentGradesPage />}
      </main>
    </div>
  );
}
