import { Outlet } from 'react-router';

export const AuthLayout = () => {
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-100 overflow-hidden'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl' />
      </div>
      <div className='relative z-10 w-full max-w-md mx-4'>
        <Outlet />
      </div>
    </div>
  );
};
