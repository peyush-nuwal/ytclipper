import { store } from '@/store';
import { refreshToken } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';

// Buffer time before token expiry (in milliseconds)
// This ensures we refresh the token before it actually expires
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes

/**
 * Sets up automatic token refresh
 * Call this function when the application starts or when a user logs in
 */
export function setupTokenRefresh() {
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    const state = store.getState();
    const { token, tokenExpiry, isAuthenticated } = state.auth;

    // If there's no access token but user is authenticated, try to refresh immediately
    if (isAuthenticated && !token) {
      console.log('No access token but authenticated, refreshing immediately');
      performTokenRefresh();
      return;
    }

    if (!isAuthenticated || !token || !tokenExpiry) {
      console.log('Token refresh not scheduled: ', {
        isAuthenticated,
        token,
        tokenExpiry,
      });
      return;
    }

    // Calculate time until token needs to be refreshed
    const now = Date.now();
    const expiresAt = tokenExpiry;
    const refreshAt = expiresAt - TOKEN_REFRESH_BUFFER;
    const timeUntilRefresh = refreshAt - now;

    // If token is already expired or about to expire, refresh immediately
    if (timeUntilRefresh <= 0) {
      console.log('Token expired or about to expire, refreshing immediately');
      performTokenRefresh();
      return;
    }

    // Schedule the refresh
    console.log(`Token refresh scheduled in ${timeUntilRefresh}ms`);
    refreshTimer = setTimeout(performTokenRefresh, timeUntilRefresh);
  }

  // Function to perform the token refresh
  async function performTokenRefresh() {
    try {
      console.log('Refreshing token...');
      await store.dispatch(refreshToken()).unwrap();
      console.log('Token refreshed successfully');

      // Schedule the next refresh
      scheduleRefresh();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      store.dispatch(
        addNotification({
          type: 'error',
          title: 'Session Error',
          message: 'Your session has expired. Please log in again.',
        }),
      );
    }
  }

  // Set up a store subscription to watch for auth state changes
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    const { isAuthenticated, tokenExpiry } = state.auth;

    if (isAuthenticated && tokenExpiry) {
      scheduleRefresh();
    } else if (!isAuthenticated && refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  });

  // Initial schedule if already authenticated
  scheduleRefresh();

  return () => {
    unsubscribe();
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
  };
}

/**
 * Check if the current token is about to expire and needs refresh
 * @returns {boolean} True if token should be refreshed
 */
export function shouldRefreshToken(): boolean {
  const state = store.getState();
  const { token, tokenExpiry, isAuthenticated } = state.auth;

  // Case 1: User is authenticated but no token is present - needs refresh
  if (isAuthenticated && !token) {
    return true;
  }

  // Case 2: No token expiry time available
  if (!tokenExpiry) {
    return false;
  }

  // Case 3: Check if token is about to expire
  const now = Date.now();
  const timeUntilExpiry = tokenExpiry - now;

  return timeUntilExpiry < TOKEN_REFRESH_BUFFER;
}

/**
 * Manually trigger a token refresh
 * This will work even if there's no access token but a refresh token is present
 * @returns {Promise<void>}
 */
export async function manualTokenRefresh(): Promise<void> {
  try {
    await store.dispatch(refreshToken()).unwrap();
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    store.dispatch(
      addNotification({
        type: 'error',
        title: 'Session Error',
        message: 'Failed to refresh your session. Please log in again.',
      }),
    );
  }
}
