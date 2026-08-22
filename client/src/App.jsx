import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import EmployeesPage from './pages/EmployeesPage';
import SchoolsPage from './pages/SchoolsPage';
import ConsultPage from './pages/ConsultPage';
import RevenuePage from './pages/RevenuePage';
import SettingsPage from './pages/SettingsPage';
import InternalChatPage from './pages/InternalChatPage';

import StudentLoginPage from './student/StudentLoginPage';
import StudentShell from './student/StudentShell';

export default function App() {
  const [role, setRole] = useState('admin'); // 'admin' | 'student-login' | 'student-portal'
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState('HV-2451');
  const [studentUser, setStudentUser] = useState(null);

  const handleStudentLoginSuccess = (user) => {
    setStudentUser(user);
    setRole('student-portal');
  };

  return (
    <div>
      {/* Quick Role Switcher Floating Header */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9999,
        background: '#182644',
        color: '#fff',
        padding: '8px 14px',
        borderRadius: '30px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12.5px',
        fontWeight: '600'
      }}>
        <span style={{ opacity: 0.8 }}>⚡ Đang xem:</span>
        <button
          onClick={() => setRole('admin')}
          style={{
            background: role === 'admin' ? '#2A9D8F' : 'rgba(255,255,255,0.15)',
            color: '#fff', border: 'none', padding: '5px 11px', borderRadius: '16px', cursor: 'pointer', fontWeight: '600'
          }}
        >
          🛡️ Admin
        </button>
        <button
          onClick={() => setRole(studentUser ? 'student-portal' : 'student-login')}
          style={{
            background: role.startsWith('student') ? '#2A9D8F' : 'rgba(255,255,255,0.15)',
            color: '#fff', border: 'none', padding: '5px 11px', borderRadius: '16px', cursor: 'pointer', fontWeight: '600'
          }}
        >
          🎓 Học viên
        </button>
      </div>

      {role === 'admin' && (
        <div className="app">
          <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
          <main className="main">
            {currentPage === 'overview' && (
              <OverviewPage setCurrentPage={setCurrentPage} setSelectedStudentId={setSelectedStudentId} />
            )}
            {currentPage === 'students' && (
              <StudentsPage setCurrentPage={setCurrentPage} setSelectedStudentId={setSelectedStudentId} />
            )}
            {currentPage === 'student-detail' && (
              <StudentDetailPage studentId={selectedStudentId} setCurrentPage={setCurrentPage} />
            )}
            {currentPage === 'employees' && <EmployeesPage />}
            {currentPage === 'schools' && <SchoolsPage />}
            {currentPage === 'consult' && <ConsultPage />}
            {currentPage === 'revenue' && <RevenuePage />}
            {currentPage === 'settings' && <SettingsPage />}
            {currentPage === 'internalchat' && <InternalChatPage />}
          </main>
        </div>
      )}

      {role === 'student-login' && (
        <StudentLoginPage onLoginSuccess={handleStudentLoginSuccess} />
      )}

      {role === 'student-portal' && (
        <StudentShell
          profile={studentUser}
          onLogout={() => setRole('student-login')}
          onSwitchToAdmin={() => setRole('admin')}
        />
      )}
    </div>
  );
}
