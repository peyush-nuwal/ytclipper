import { useAppSelector } from '@/store/hooks';
import { Navigate, useLocation } from 'react-router';

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export const AuthRouteGuard: React.FC<AuthRouteGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-gray-600'>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const from = location.state?.from.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};
