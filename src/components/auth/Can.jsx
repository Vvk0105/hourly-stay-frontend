import React from 'react';
import { useSelector } from 'react-redux';
import { can } from '../../utils/accessControl';

/**
 * A wrapper component for conditional rendering based on user permissions.
 * 
 * @param {string} perform - The feature key to check (from PERMISSIONS in accessControl.js).
 * @param {React.ReactNode} children - The content to render if permitted.
 * @param {React.ReactNode} fallback - Optional content to render if NOT permitted.
 */
const Can = ({ perform, children, fallback = null }) => {
  const { user } = useSelector((state) => state.auth);

  if (can(user, perform)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default Can;
