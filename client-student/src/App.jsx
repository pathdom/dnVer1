import React, { useState } from 'react';
import StudentLoginPage from './student/StudentLoginPage';
import StudentShell from './student/StudentShell';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [studentUser, setStudentUser] = useState(null);

  const handleLoginSuccess = (user) => {
    setStudentUser(user);
    setIsLoggedIn(true);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <StudentLoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <StudentShell
          profile={studentUser}
          onLogout={() => setIsLoggedIn(false)}
          onSwitchToAdmin={() => window.location.href = 'http://localhost:5173'}
        />
      )}
    </div>
  );
}
