import { injectedAuthApi } from '@/services/auth';
import type { User } from '@/types';
import { createSlice } from '@reduxjs/toolkit';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  error: null,
  isInitialized: false,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    loginFailure: (state) => {
      state.isLoading = false;
      state.user = null;
      state.isAuthenticated = false;
    },
    setUser: (state, action) => {
      const user = action.payload;
      state.user = user;
      state.isAuthenticated = !!user;
      state.isInitialized = true;
      state.error = null;

      if (user) {
        // TODO: handle user-specific logic
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.error = null;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isInitialized = true;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(injectedAuthApi.endpoints.login.matchPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(
        injectedAuthApi.endpoints.login.matchFulfilled,
        (state, action) => {
          state.isLoading = false;
          state.user = action.payload.data;
          state.isAuthenticated = true;
        },
      )
      .addMatcher(
        injectedAuthApi.endpoints.login.matchRejected,
        (state, action) => {
          state.isLoading = false;
          state.user = null;
          state.isAuthenticated = false;
          state.error = action.error.message || 'Login failed';
        },
      )
      .addMatcher(injectedAuthApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setUser, logout, setAuthError, setInitialized } =
  authSlice.actions;
export default authSlice.reducer;
