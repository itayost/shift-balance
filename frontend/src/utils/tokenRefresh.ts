import { useAuthStore } from '../store/auth.store';

let refreshTimer: NodeJS.Timeout | null = null;

export const startTokenRefreshTimer = () => {
  // Clear any existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  const { accessToken, refreshToken, setTokens } = useAuthStore.getState();

  if (!accessToken || !refreshToken) {
    return;
  }

  // Decode the token to get expiry time
  try {
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) {
      return;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expiryTime - currentTime;

    // Refresh token 1 minute before expiry
    const refreshTime = timeUntilExpiry - 60000;

    if (refreshTime > 0) {
      refreshTimer = setTimeout(async () => {
        try {
          const authStore = useAuthStore.getState();
          const response = await fetch('http://localhost:5001/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: authStore.refreshToken,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setTokens(data.data.accessToken, data.data.refreshToken);
            // Restart the timer with new token
            startTokenRefreshTimer();
          } else {
            // If refresh fails, clear auth and redirect to login
            authStore.clearAuth();
            window.location.href = '/login';
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          const authStore = useAuthStore.getState();
          authStore.clearAuth();
          window.location.href = '/login';
        }
      }, refreshTime);
    }
  } catch (error) {
    console.error('Error parsing token:', error);
  }
};

export const stopTokenRefreshTimer = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};