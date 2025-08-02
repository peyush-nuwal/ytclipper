import { useAppSelector } from '@/store/hooks';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router';

interface ProtectedRouteGuardProps {
  children: React.ReactNode;
}

export const ProtectedRouteGuard: React.FC<ProtectedRouteGuardProps> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100'>
        <div className='bg-white rounded-2xl shadow-xl px-8 py-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4'>
          <div className='relative'>
            <div className='w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center'>
              <Loader2 className='w-8 h-8 text-white animate-spin' />
            </div>
            <div className='absolute inset-0 w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-ping opacity-20' />
          </div>
          <div className='text-center'>
            <h3 className='text-xl font-semibold text-gray-800 mb-2'>
              Checking Authentication
            </h3>
            <p className='text-gray-600 text-sm'>
              Please wait while we verify your login status...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to='/auth/login' state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
