import { Button } from '@ytclipper/ui';
import { Link } from 'react-router';

export const NotFoundPage = () => {
  return (
    <div className='flex flex-col items-center justify-center h-[80vh] text-center'>
      <h1 className='text-6xl font-bold text-gray-800 mb-4'>404</h1>
      <p className='text-xl text-gray-600 mb-6'>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to='/dashboard'>
        <Button variant='default'>Back to Dashboard</Button>
      </Link>
    </div>
  );
};
