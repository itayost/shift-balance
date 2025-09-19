import { useEffect, useState } from 'react';
import { socketService } from '../services/socket.service';
import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import { useSwapStore } from '../store/swap.store';
import { useScheduleStore } from '../store/schedule.store';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuthStore();
  const { fetchUnreadCount, notifications } = useNotificationStore();
  const { fetchMyRequests, fetchAvailableRequests } = useSwapStore();
  const { fetchCurrentSchedule } = useScheduleStore();

  useEffect(() => {
    if (!accessToken) return;

    // Connect to WebSocket server
    socketService.connect(accessToken);
    socketService.startHeartbeat();
    socketService.requestNotificationPermission();

    // Connection status
    const unsubConnect = socketService.on('connected', (connected) => {
      setIsConnected(connected);
    });

    // Notification events
    const unsubNotification = socketService.on('notification:new', (notification) => {
      // Add notification to store
      useNotificationStore.setState((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));

      // Show notification badge animation
      const badge = document.querySelector('.notification-badge');
      if (badge) {
        badge.classList.add('animate-bounce');
        setTimeout(() => badge.classList.remove('animate-bounce'), 1000);
      }
    });

    // Swap events
    const unsubSwapRequest = socketService.on('swap:request', () => {
      fetchAvailableRequests();
    });

    const unsubSwapAccepted = socketService.on('swap:accepted', () => {
      fetchMyRequests();
      fetchAvailableRequests();
    });

    const unsubSwapCancelled = socketService.on('swap:cancelled', () => {
      fetchMyRequests();
      fetchAvailableRequests();
    });

    // Schedule events
    const unsubSchedulePublished = socketService.on('schedule:published', () => {
      fetchCurrentSchedule();
    });

    const unsubScheduleUpdated = socketService.on('schedule:updated', () => {
      fetchCurrentSchedule();
    });

    // Cleanup
    return () => {
      unsubConnect();
      unsubNotification();
      unsubSwapRequest();
      unsubSwapAccepted();
      unsubSwapCancelled();
      unsubSchedulePublished();
      unsubScheduleUpdated();
      socketService.disconnect();
    };
  }, [accessToken]);

  return { isConnected };
};

// Hook for specific event listening
export const useSocketEvent = (event: string, handler: (data: any) => void) => {
  useEffect(() => {
    const unsubscribe = socketService.on(event, handler);
    return unsubscribe;
  }, [event, handler]);
};

// Hook for user online status
export const useOnlineStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = socketService.on('user:status', ({ userId, isOnline }) => {
      setOnlineUsers((prev) => {
        const updated = new Set(prev);
        if (isOnline) {
          updated.add(userId);
        } else {
          updated.delete(userId);
        }
        return updated;
      });
    });

    return unsubscribe;
  }, []);

  return { onlineUsers, isUserOnline: (userId: string) => onlineUsers.has(userId) };
};