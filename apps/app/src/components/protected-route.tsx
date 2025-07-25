import React from 'react';
import { Navigate, useLocation } from 'react-router';

import Loading from './loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // const { isAuthenticated, isLoading, isInitialized } = useAuth();
  // const location = useLocation();
  //
  // if (!isInitialized || isLoading) {
  //   return <Loading />;
  // }
  //
  // if (!isAuthenticated) {
  //   return <Navigate to='/auth' state={{ from: location }} replace />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
