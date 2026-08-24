import React, { useState } from 'react';
import StudentLoginPage from './student/StudentLoginPage';
import StudentShell from './student/StudentShell';

function readStoredStudent() {
  try {
    return JSON.parse(localStorage.getItem('aladdin_student') || 'null');
  } catch {
    return null;
  }
}

export default function App() {
  const [studentUser, setStudentUser] = useState(readStoredStudent);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('aladdin_token'));

  const handleLoginSuccess = ({ token, student }) => {
    localStorage.setItem('aladdin_token', token);
    localStorage.setItem('aladdin_student', JSON.stringify(student));
    setStudentUser(student);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('aladdin_token');
    localStorage.removeItem('aladdin_student');
    setStudentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <StudentLoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <StudentShell
          profile={studentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
