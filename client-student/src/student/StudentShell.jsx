import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiFetch';
import StudentHomePage from './StudentHomePage';
import StudentProfilePage from './StudentProfilePage';
import StudentPaymentPage from './StudentPaymentPage';
import StudentGradesPage from './StudentGradesPage';
import ProfileMenu from '../components/ProfileMenu';

export default function StudentShell({ profile, onLogout }) {
  const [currentTab, setCurrentTab] = useState('home');
  const [studentProfile, setStudentProfile] = useState(profile);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    apiFetch('/api/student/profile')
      .then(res => res.json())
      .then(d => setStudentProfile(d))
      .catch(err => console.error(err));
  }, []);

  const handleAvatarChange = (avatarUrl) => {
    setStudentProfile(prev => ({ ...prev, avatarUrl }));
  };

  return (
    <div className="portal-shell active">
      <header className="portal-header">
        <div className="brand" onClick={() => setCurrentTab('home')} style={{ cursor: 'pointer' }}>
          <img src="/logo.jpg" alt="Aladdin Group" width="68" height="68" style={{ borderRadius: '14px', objectFit: 'cover' }} />
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
          <div className="header-avatar-chip" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }} title="Hồ sơ & đăng xuất">
            <div className="avatar" style={{ overflow: 'hidden' }}>
              {studentProfile?.avatarUrl ? (
                <img src={studentProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (studentProfile?.avatar || 'HV')}
            </div>
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

      {showProfile && (
        <ProfileMenu profile={studentProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} onAvatarChange={handleAvatarChange} />
      )}
    </div>
  );
}
