import {
  AuthLayout,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
} from '@/pages/auth/index';
import { Navigate, Route, Routes } from 'react-router';

export const AuthRoutes = () => {
  return (
    <Routes>
      <Route path='/auth' element={<AuthLayout />}>
        <Route index element={<Navigate to='login' replace />} />
        <Route path='login' element={<LoginPage />} />
        <Route path='logout' element={<Navigate to='login' replace />} />
        <Route path='register' element={<RegisterPage />} />
        <Route path='forgot-password' element={<ForgotPasswordPage />} />
      </Route>
    </Routes>
  );
};
