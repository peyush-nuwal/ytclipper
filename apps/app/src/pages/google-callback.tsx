import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  useLazyGetCurrentUserQuery,
  useRefreshTokenMutation,
} from '../services/auth';
import { useAppDispatch } from '../store/hooks';
import { setUser } from '../store/slices/authSlice';

export const GoogleCallback: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [refreshToken] = useRefreshTokenMutation();

  const [getCurrentUser] = useLazyGetCurrentUserQuery();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const authStatus = urlParams.get('auth');
      const error = urlParams.get('error');

      if (error) {
        console.error('Google OAuth error:', error);
        navigate('/login?error=google_auth_failed');
        return;
      }

      if (authStatus === 'success') {
        try {
          const userResult = await getCurrentUser().unwrap();

          console.log('User data fetched successfully:', userResult);
          if (userResult.success && userResult?.data) {
            dispatch(setUser(userResult.data));
            navigate('/dashboard');
            return;
          }

          // If that fails, try refresh token
          const refreshResult = await refreshToken().unwrap();
          if (refreshResult) {
            dispatch(setUser(refreshResult));
            navigate('/dashboard');
          } else {
            throw new Error(
              'Failed to get user data after Google authentication',
            );
          }
        } catch (error) {
          console.error('Google authentication error:', error);
          navigate('/login?error=google_auth_failed');
        }
      } else {
        console.error('Unknown auth status:', authStatus);
        navigate('/login?error=google_auth_failed');
      }
    };

    handleGoogleCallback();
  }, [location, navigate, dispatch, getCurrentUser, refreshToken]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto' />
        <p className='mt-4 text-gray-600'>Completing Google sign-in...</p>
      </div>
    </div>
  );
};
