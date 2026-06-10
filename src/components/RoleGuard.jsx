import React from 'react';

export const RoleGuard = ({ role, children }) => {
  // Only render children if the user has the 'admin' role
  if (role !== 'admin') return null;
  return <>{children}</>;
};