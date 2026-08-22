import React, { useState } from 'react';
import StaffHomePage from './StaffHomePage';
import StaffStudentsPage from './StaffStudentsPage';
import StaffApptPage from './StaffApptPage';
import StaffTasksPage from './StaffTasksPage';
import StaffChatPage from './StaffChatPage';
import StaffPerformancePage from './StaffPerformancePage';
import InternalChatPage from '../pages/InternalChatPage';

export default function StaffShell({ profile, onLogout }) {
  const [currentPage, setCurrentPage] = useState('home');

  return (
    <div className="app active">
      <aside className="sidebar">
        <div className="brand">
          <svg width="34" height="34" viewBox="0 0 38 38" fill="none">
            <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#2A9D8F" strokeWidth="2.4" strokeLinecap="round"/>
            <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
          </svg>
          <div>
            <div className="brand-name">VietBridge</div>
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
          <button className={`nav-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={() => setCurrentPage('chat')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            Tin nhắn học viên<span className="count">3</span>
          </button>
          <button className={`nav-item ${currentPage === 'internalchat' ? 'active' : ''}`} onClick={() => setCurrentPage('internalchat')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 1-0 3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Chat nội bộ<span className="count">6</span>
          </button>
          <button className={`nav-item ${currentPage === 'performance' ? 'active' : ''}`} onClick={() => setCurrentPage('performance')}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
            Hiệu suất
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip" onClick={onLogout} style={{ cursor: 'pointer' }} title="Đăng xuất">
            <div className="avatar">{profile?.avatar || 'TK'}</div>
            <div>
              <div className="user-chip-name">{profile?.name || 'Trần Minh Khoa'}</div>
              <div className="user-chip-role">{profile?.role || 'Trưởng nhóm tư vấn'}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main">
        {currentPage === 'home' && <StaffHomePage setCurrentPage={setCurrentPage} />}
        {currentPage === 'students' && <StaffStudentsPage />}
        {currentPage === 'appt' && <StaffApptPage />}
        {currentPage === 'tasks' && <StaffTasksPage />}
        {currentPage === 'chat' && <StaffChatPage />}
        {currentPage === 'internalchat' && <InternalChatPage />}
        {currentPage === 'performance' && <StaffPerformancePage />}
      </main>
    </div>
  );
}
