import { Button } from '@ytclipper/ui';
import { Link, Outlet } from 'react-router';

export const AppLayout = () => {
  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 py-3 flex justify-between items-center'>
          <Link to='/dashboard' className='text-xl font-bold text-blue-600'>
            YTClipper
          </Link>
          <nav className='flex gap-4'>
            <Link to='/videos' className='text-gray-700 hover:text-blue-600'>
              My Videos
            </Link>
            <Link to='/profile' className='text-gray-700 hover:text-blue-600'>
              Profile
            </Link>
            <Button variant='outline'>Logout</Button>
          </nav>
        </div>
      </header>

      <main className='flex-1 p-4'>
        <Outlet />
      </main>
    </div>
  );
};
