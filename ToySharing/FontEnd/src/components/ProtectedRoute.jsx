import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
};

const getUserRole = () => {
  return sessionStorage.getItem('role') || localStorage.getItem('role');
};

const ProtectedRoute = ({ allowedRole }) => {
  const token = getAuthToken();
  const role = getUserRole();

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRole is not specified, this is a logged-in user route
  if (!allowedRole) {
    // Allow access if user is logged in (has token)
    return <Outlet />;
  }

  // Check if the user's role matches the allowed role
  if (role === allowedRole) {
    return <Outlet />;
  }

  // Redirect based on role
  if (role === 'Admin') {
    return <Navigate to="/adminpage" replace />;
  } else if (role === 'User') {
    return <Navigate to="/searchtoy" replace />;
  } else {
    // Fallback for invalid role
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;