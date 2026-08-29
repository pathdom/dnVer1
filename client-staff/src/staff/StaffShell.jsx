import React, { useEffect, useState } from 'react';
import StaffHomePage from './StaffHomePage';
import StaffStudentsPage from './StaffStudentsPage';
import StaffApptPage from './StaffApptPage';
import StaffTasksPage from './StaffTasksPage';
import StaffCompetencyPage from './StaffCompetencyPage';
import StaffProcessFlowPage from './StaffProcessFlowPage';
import ChatWidget from '../chat-widget/ChatWidget';
import ProfileMenu from '../components/ProfileMenu';
import { apiFetch } from '../lib/apiFetch';

export default function StaffShell({ profile, onLogout, onAvatarChange }) {
  const [currentPage, setCurrentPage] = useState('home');
  const [chatUnread, setChatUnread] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [staffProfile, setStaffProfile] = useState(profile);
  const [companyLogo, setCompanyLogo] = useState(null);

  useEffect(() => {
    apiFetch('/api/staff/profile')
      .then(res => res.json())
      .then(d => { if (!d.error) setStaffProfile(prev => ({ ...prev, ...d })); })
      .catch(() => {});
  }, []);

  const fetchLogo = () => {
    apiFetch('/api/settings/logo')
      .then(res => res.json())
      .then(d => setCompanyLogo(d.logoUrl || null))
      .catch(() => {});
  };

  useEffect(() => {
    fetchLogo();
    window.addEventListener('logoUpdated', fetchLogo);
    return () => window.removeEventListener('logoUpdated', fetchLogo);
  }, []);

  useEffect(() => {
    let stop = false;
    function poll() {
      apiFetch('/api/chat/conversations')
        .then(res => res.json())
        .then(d => {
          if (stop) return;
          const total = (d.conversations || []).reduce((a, c) => a + (c.unread || 0), 0);
          setChatUnread(total);
        })
        .catch(() => {});
    }
    poll();
    const t = setInterval(poll, 15000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  return (
    <div className="app active">
      <aside className="sidebar">
        <div className="brand">
          {companyLogo ? (
            <img src={companyLogo} alt="Company Logo" className="brand-mark" style={{ width: '68px', height: '68px', borderRadius: '14px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <svg width="68" height="68" viewBox="0 0 38 38" fill="none">
              <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#2A9D8F" strokeWidth="2.4" strokeLinecap="round"/>
              <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
            </svg>
          )}
          <div>
            <div className="brand-name">ALADDIN</div>
            <div className="brand-sub">STAFF WORKSPACE</div>
          </div>
        </div>
        <div className="route-divider"></div>

        <div className="nav-label">Làm việc</div>
        <nav className="nav">
          <button className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
            Trang chủ
          </button>
          <button className={`nav-item ${currentPage === 'students' ? 'active' : ''}`} onClick={() => setCurrentPage('students')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
            Học viên của tôi<span className="count">32</span>
          </button>
          <button className={`nav-item ${currentPage === 'appt' ? 'active' : ''}`} onClick={() => setCurrentPage('appt')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Lịch tư vấn<span className="count">5</span>
          </button>
          <button className={`nav-item ${currentPage === 'tasks' ? 'active' : ''}`} onClick={() => setCurrentPage('tasks')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Công việc<span className="count">7</span>
          </button>
          <button className={`nav-item ${currentPage === 'competency' ? 'active' : ''}`} onClick={() => setCurrentPage('competency')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Bài test
          </button>
          <button className={`nav-item ${currentPage === 'internalchat' ? 'active' : ''}`} onClick={() => setCurrentPage('internalchat')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Chat nội bộ{chatUnread > 0 && <span className="count">{chatUnread}</span>}
          </button>
          <button className={`nav-item ${currentPage === 'process-flow' ? 'active' : ''}`} onClick={() => setCurrentPage('process-flow')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="4" width="6" height="6" rx="1.5"/><rect x="9" y="14" width="6" height="6" rx="1.5"/><path d="M6 10v2a2 2 0 0 0 2 2h1M18 10v2a2 2 0 0 1-2 2h-1"/></svg>
            Quy trình xử lý
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip" onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }} title="Hồ sơ & đăng xuất">
            <div className="avatar" style={{ overflow: 'hidden' }}>
              {staffProfile?.avatarUrl ? (
                <img src={staffProfile.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (staffProfile?.avatar || 'TK')}
            </div>
            <div>
              <div className="user-chip-name">{staffProfile?.name || 'Trần Minh Khoa'}</div>
              <div className="user-chip-role">{staffProfile?.department || staffProfile?.role || 'Trưởng nhóm tư vấn'}</div>
            </div>
          </div>
        </div>

        {showProfile && (
          <ProfileMenu profile={staffProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} onAvatarChange={onAvatarChange} />
        )}
      </aside>

      <main className="main">
        {currentPage === 'home' && <StaffHomePage setCurrentPage={setCurrentPage} profile={staffProfile} />}
        {currentPage === 'students' && <StaffStudentsPage />}
        {currentPage === 'appt' && <StaffApptPage />}
        {currentPage === 'tasks' && <StaffTasksPage />}
        {currentPage === 'competency' && <StaffCompetencyPage />}
        {currentPage === 'internalchat' && <ChatWidget profile={staffProfile} />}
        {currentPage === 'process-flow' && <StaffProcessFlowPage />}
      </main>
    </div>
  );
}
