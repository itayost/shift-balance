import { create } from 'zustand';
import { api } from '../services/api';
import { showToast } from '../utils/toast';

export enum NotificationType {
  SHIFT_PUBLISHED = 'SHIFT_PUBLISHED',
  SWAP_REQUEST_CREATED = 'SWAP_REQUEST_CREATED',
  SWAP_REQUEST_ACCEPTED = 'SWAP_REQUEST_ACCEPTED',
  SWAP_REQUEST_CANCELLED = 'SWAP_REQUEST_CANCELLED',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  GENERAL = 'GENERAL'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (unreadOnly = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications', {
        params: { unreadOnly }
      });
      set({
        notifications: response.data.data,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'שגיאה בטעינת ההתראות',
        isLoading: false
      });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      set({ unreadCount: response.data.data.count });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (notificationId: string) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);

      set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));

      showToast.success('התראה סומנה כנקראה');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'שגיאה בסימון ההתראה');
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/mark-all-read');

      set((state) => ({
        notifications: state.notifications.map(n => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString()
        })),
        unreadCount: 0
      }));

      showToast.success('כל ההתראות סומנו כנקראו');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'שגיאה בסימון ההתראות');
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);

      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: notification && !notification.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        };
      });

      showToast.success('התראה נמחקה');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'שגיאה במחיקת ההתראה');
    }
  },

  clearError: () => set({ error: null })
}));