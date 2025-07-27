import { Button } from '@ytclipper/ui';
import { Link } from 'react-router';

export const ErrorPage = () => {
  return (
    <div className='flex flex-col items-center justify-center h-[80vh] text-center'>
      <h1 className='text-4xl font-bold text-red-600 mb-4'>
        Something went wrong!
      </h1>
      <p className='text-lg text-gray-700 mb-6'>
        We encountered an unexpected error. Please try again later.
      </p>
      <Link to='/dashboard'>
        <Button variant='destructive'>Go to Dashboard</Button>
      </Link>
    </div>
  );
};
