import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import StudentsPage from './pages/StudentsPage';
import StudentDetailPage from './pages/StudentDetailPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import SchoolsPage from './pages/SchoolsPage';
import ConsultPage from './pages/ConsultPage';
import RevenuePage from './pages/RevenuePage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import InternalChatPage from './pages/InternalChatPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [selectedStudentId, setSelectedStudentId] = useState('HV001');
  const [selectedEmpId, setSelectedEmpId] = useState('NV001');

  return (
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
        {currentPage === 'employees' && (
          <EmployeesPage setCurrentPage={setCurrentPage} setSelectedEmpId={setSelectedEmpId} />
        )}
        {currentPage === 'employee-detail' && (
          <EmployeeDetailPage empId={selectedEmpId} setCurrentPage={setCurrentPage} setSelectedStudentId={setSelectedStudentId} />
        )}
        {currentPage === 'schools' && <SchoolsPage />}
        {currentPage === 'consult' && <ConsultPage />}
        {currentPage === 'revenue' && <RevenuePage />}
        {currentPage === 'accounts' && <AccountsPage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'internalchat' && <InternalChatPage />}
      </main>
    </div>
  );
}
