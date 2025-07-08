import React, { useState } from 'react';

import type { LoginCredentials, RegisterCredentials } from '../types/auth';

interface LoginScreenProps {
  onLogin: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  onRegister: (
    credentials: RegisterCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

type AuthMode = 'login' | 'register';

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onRegister,
  isLoading,
  error,
  onClearError,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    if (!credentials.email || !credentials.password) {
      return;
    }

    if (mode === 'login') {
      await onLogin({
        email: credentials.email,
        password: credentials.password,
      });
    } else {
      await onRegister({
        email: credentials.email,
        password: credentials.password,
        name: credentials.name || undefined,
      });
    }
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setCredentials({ email: '', password: '', name: '' });
    onClearError();
  };

  return (
    <div className='login-container'>
      <div className='login-header'>
        <div className='login-logo'>
          <span>clock</span>
          <h1>YTClipper</h1>
        </div>
        <p className='login-subtitle'>
          {mode === 'login'
            ? 'Sign in to start collecting timestamps'
            : 'Create your YTClipper account'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='login-form'>
        {error && <div className='error-message'>{error}</div>}

        {mode === 'register' && (
          <div className='form-group'>
            <label htmlFor='name'>Name (optional)</label>
            <div className='input-wrapper'>
              <span>user</span>
              <input
                id='name'
                type='text'
                placeholder='Your name'
                value={credentials.name}
                onChange={e =>
                  setCredentials(prev => ({ ...prev, name: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className='form-group'>
          <label htmlFor='email'>Email</label>
          <div className='input-wrapper'>
            <span>mail</span>
            <input
              id='email'
              type='email'
              placeholder='your@email.com'
              value={credentials.email}
              onChange={e =>
                setCredentials(prev => ({ ...prev, email: e.target.value }))
              }
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className='form-group'>
          <label htmlFor='password'>Password</label>
          <div className='input-wrapper'>
            <span>lock</span>
            <input
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='Enter your password'
              value={credentials.password}
              onChange={e =>
                setCredentials(prev => ({ ...prev, password: e.target.value }))
              }
              required
              disabled={isLoading}
            />
            <button
              type='button'
              className='password-toggle'
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <span>eye-off</span> : <span>eye</span>}
            </button>
          </div>
        </div>

        <button
          type='submit'
          className='btn-primary login-submit'
          disabled={isLoading || !credentials.email || !credentials.password}
        >
          {isLoading ? (
            <div className='loading-spinner' />
          ) : mode === 'login' ? (
            'Sign In'
          ) : (
            'Create Account'
          )}
        </button>

        <div className='mode-switch'>
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type='button'
                className='link-button'
                onClick={() => handleModeSwitch('register')}
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type='button'
                className='link-button'
                onClick={() => handleModeSwitch('login')}
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>

      <div className='login-footer'>
        <p>Connect to collect and sync your YouTube timestamps</p>
      </div>
    </div>
  );
};
