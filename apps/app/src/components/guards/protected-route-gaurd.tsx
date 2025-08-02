import { useAppSelector } from '@/store/hooks';
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
      <div className='min-h-screen flex items-center justify-center bg-[#f9f6f2]'>
        <div className='bg-white rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-4'>
          <span className='relative flex h-10 w-10'>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-200 opacity-75' />
            <span className='relative inline-flex rounded-full h-10 w-10 bg-blue-600 opacity-80' />
          </span>
          <p className='text-gray-700 font-medium text-base'>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to='/auth/login' state={{ from: location }} replace />;
  }
  return <>{children}</>;
};
