import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const localIsProfileCompleted = localStorage.getItem("isProfileCompleted");
    const sessionIsProfileCompleted = sessionStorage.getItem("isProfileCompleted");
    const localUserId = localStorage.getItem("userId");
    const sessionUserId = sessionStorage.getItem("userId");
    const isProfileCompleted = sessionIsProfileCompleted || localIsProfileCompleted;
    const userId = sessionUserId || localUserId;
    

  if (!isProfileCompleted) {
    return <Navigate to={`/userdetail/${userId}`} replace />;
  }

  return children;
};

export default ProtectedRoute;