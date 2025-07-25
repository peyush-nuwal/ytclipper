import { api } from './api';

import type { AuthMeResponse, User } from '@/types';

type UniversalResponse<T> = {
  success: boolean;
  data: T;
  timestamp: Date;
  status: number;
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface AddPasswordRequest {
  password: string;
}

export type GoogleLoginResponse = UniversalResponse<{
  auth_url: string;
}>;

export const injectedAuthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<UniversalResponse<User>, LoginRequest>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),

    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),

    getCurrentUser: builder.query<UniversalResponse<AuthMeResponse>, void>({
      query: () => '/auth/me',
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    forgotPassword: builder.mutation<void, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    resetPassword: builder.mutation<void, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),

    addPassword: builder.mutation<void, AddPasswordRequest>({
      query: (body) => ({
        url: '/auth/add-password',
        method: 'POST',
        body,
      }),
    }),

    checkLoginStatus: builder.query<boolean, void>({
      query: () => '/auth/status',
    }),

    refreshToken: builder.mutation<User, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    getGoogleLoginUrl: builder.query<GoogleLoginResponse, void>({
      query: () => ({
        url: '/auth/google/login',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Origin: window.location.origin,
        },
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useAddPasswordMutation,
  useGetGoogleLoginUrlQuery,
  useLazyGetGoogleLoginUrlQuery,
  useCheckLoginStatusQuery,
  useRefreshTokenMutation,
} = injectedAuthApi;
