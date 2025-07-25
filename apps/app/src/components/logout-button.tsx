import { useLogoutMutation } from '@/services/auth';
import { syncLogout } from '@/services/extension-sync';
import { useAppDispatch } from '@/store/hooks';
import { logout as logoutHandler } from '@/store/slices/authSlice';
import { Button } from '@ytclipper/ui';
import { useNavigate } from 'react-router';

const LogoutButton = () => {
  const dispatch = useAppDispatch();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();
  // const handleLogout = async () => {
  //   try {
  //     const result = await syncLogout();
  //     if (result.success) {
  //       console.log('✅ Extension notified of logout');
  //     } else {
  //       console.warn('❌ Extension logout sync failed:', result.error);
  //     }
  //   } catch (error) {
  //     console.warn('❌ Failed to sync logout with extension:', error);
  //   }
  // };

  const handleLogout = async () => {
    try {
      await logout();
      await syncLogout();
    } catch (error) {
      console.error('❌ Logout failed:', error);
    } finally {
      dispatch(logoutHandler());
      navigate('/auth/logout');
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant='outline'
      className='border-red-500 text-red-500 hover:bg-red-50'
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </Button>
  );
};

export default LogoutButton;
