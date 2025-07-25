import config from '@/config';
import { type RootState } from '@/store';
import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { logout } from '../store/slices/authSlice';

const API_URL = config.apiUrl;

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_URL}/api/v1`,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.token;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, apiCall, extraOptions) => {
  const result = await baseQuery(args, apiCall, extraOptions);

  if (result.error && result.error.status === 401) {
    console.warn('🔄 Reauthenticating due to 401 error');
    try {
      apiCall.dispatch(logout());
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('❌ Reauthentication failed:', error);
      return result; // Return original error if reauth fails
    }
  }

  return result; // Return the original result if no error or after reauth
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
});
