import React, { useState } from 'react';
import StaffLoginPage from './staff/StaffLoginPage';
import StaffShell from './staff/StaffShell';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffUser, setStaffUser] = useState(null);

  const handleLoginSuccess = (user) => {
    setStaffUser(user);
    setIsLoggedIn(true);
  };

  return (
    <div>
      {!isLoggedIn ? (
        <StaffLoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <StaffShell profile={staffUser} onLogout={() => setIsLoggedIn(false)} />
      )}
    </div>
  );
}
