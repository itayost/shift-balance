import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginInput, RegisterInput } from 'shiftbalance-shared';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';
import { startTokenRefreshTimer, stopTokenRefreshTimer } from '../utils/tokenRefresh';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (data: LoginInput) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(data);
          const { user, accessToken, refreshToken } = response;

          // Store tokens in localStorage for interceptors
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Start token refresh timer
          startTokenRefreshTimer();

          toast.success('התחברת בהצלחה!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'שגיאה בהתחברות';
          toast.error(message);
          throw error;
        }
      },

      register: async (data: RegisterInput) => {
        set({ isLoading: true });
        try {
          const response = await authService.register(data);
          const { user, accessToken, refreshToken } = response;

          // Store tokens in localStorage for interceptors
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Start token refresh timer
          startTokenRefreshTimer();

          toast.success('נרשמת בהצלחה!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.message || 'שגיאה בהרשמה';
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        set({ isLoading: true });

        try {
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Stop token refresh timer
          stopTokenRefreshTimer();

          // Clear auth state regardless of API call success
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
          toast.success('התנתקת בהצלחה');
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // If fetching user fails, clear auth state
          get().clearAuth();
          set({ isLoading: false });
          throw error;
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken });
        // Restart token refresh timer with new token
        startTokenRefreshTimer();
      },

      clearAuth: () => {
        stopTokenRefreshTimer();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);