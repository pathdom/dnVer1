import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <svg className="brand-mark" width="38" height="38" viewBox="0 0 38 38" fill="none">
          <path d="M4 26C4 26 10 14 19 14C28 14 34 26 34 26" stroke="#4FC3B4" strokeWidth="2.4" strokeLinecap="round"/>
          <circle cx="19" cy="14" r="3.2" fill="#DE9F3B"/>
          <path d="M4 30H34" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.4 5"/>
        </svg>
        <div className="brand-text">
          <div className="brand-name">VietBridge</div>
          <div className="brand-sub">EDUCATION GROUP</div>
        </div>
      </div>
      <div className="route-divider"></div>

      <div className="nav-label">Điều hành</div>
      <nav className="nav">
        <button
          className={`nav-item ${currentPage === 'overview' ? 'active' : ''}`}
          onClick={() => setCurrentPage('overview')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
          </svg>
          Tổng quan
        </button>

        <button
          className={`nav-item ${currentPage === 'students' || currentPage === 'student-detail' ? 'active' : ''}`}
          onClick={() => setCurrentPage('students')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/>
          </svg>
          Quản lý học viên<span className="count">156</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'employees' ? 'active' : ''}`}
          onClick={() => setCurrentPage('employees')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Quản lý nhân viên<span className="count">22</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'schools' ? 'active' : ''}`}
          onClick={() => setCurrentPage('schools')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M2 10v6"/>
          </svg>
          Trường đối tác<span className="count">31</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'consult' ? 'active' : ''}`}
          onClick={() => setCurrentPage('consult')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          Lịch tư vấn<span className="count">5</span>
        </button>

        <button
          className={`nav-item ${currentPage === 'internalchat' ? 'active' : ''}`}
          onClick={() => setCurrentPage('internalchat')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          Chat nội bộ<span className="count">6</span>
        </button>
      </nav>

      <div className="nav-label">Khác</div>
      <nav className="nav">
        <button
          className={`nav-item ${currentPage === 'revenue' ? 'active' : ''}`}
          onClick={() => setCurrentPage('revenue')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10M18 20V4M6 20v-4"/>
          </svg>
          Báo cáo doanh thu
        </button>

        <button
          className={`nav-item ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Cài đặt
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">MH</div>
          <div className="user-chip-text">
            <div className="user-chip-name">Minh Hằng</div>
            <div className="user-chip-role">Quản trị viên</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
