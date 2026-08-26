import React, { useState } from 'react';
import StaffLoginPage from './staff/StaffLoginPage';
import StaffShell from './staff/StaffShell';

function readStoredStaff() {
  try {
    return JSON.parse(localStorage.getItem('aladdin_staff') || 'null');
  } catch {
    return null;
  }
}

export default function App() {
  const [staffUser, setStaffUser] = useState(readStoredStaff);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('aladdin_token'));

  const handleLoginSuccess = ({ token, staff }) => {
    localStorage.setItem('aladdin_token', token);
    localStorage.setItem('aladdin_staff', JSON.stringify(staff));
    setStaffUser(staff);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('aladdin_token');
    localStorage.removeItem('aladdin_staff');
    setStaffUser(null);
    setIsLoggedIn(false);
  };

  const handleAvatarChange = (avatarUrl) => {
    setStaffUser(prev => {
      const next = { ...prev, avatarUrl };
      localStorage.setItem('aladdin_staff', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      {!isLoggedIn ? (
        <StaffLoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <StaffShell profile={staffUser} onLogout={handleLogout} onAvatarChange={handleAvatarChange} />
      )}
    </div>
  );
}
