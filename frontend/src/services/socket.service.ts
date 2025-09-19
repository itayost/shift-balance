import { io, Socket } from 'socket.io-client';
import { showToast } from '../utils/toast';
import { pushService } from './push.service';

export type SocketEventListener = (data: any) => void;

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<SocketEventListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  connect(token: string) {
    if (this.socket?.connected || this.isConnecting) {
      console.log('🔌 Socket already connected or connecting');
      return;
    }

    this.isConnecting = true;
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

    console.log('🔌 Attempting to connect to WebSocket at:', serverUrl);
    console.log('🔌 Token present:', !!token);

    this.socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', async () => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('🔌 WebSocket connected');
      this.emit('connected', true);

      // Initialize push notifications
      await pushService.initialize();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.emit('connected', false);

      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      this.reconnectAttempts++;
      console.error('🔌 WebSocket connection error:', error.message);
      console.error('🔌 Error type:', error.type);
      console.error('🔌 Full error:', error);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        showToast.error('חיבור לשרת נכשל. אנא רענן את הדף');
      }
    });

    // Heartbeat
    this.socket.on('pong', () => {
      console.log('🏓 Pong received');
    });

    // User status events
    this.socket.on('user:status', (data) => {
      this.emit('user:status', data);
    });

    // Notification events
    this.socket.on('notification:new', (notification) => {
      this.emit('notification:new', notification);

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [200, 100, 200],
        });
      }
    });

    // Swap events
    this.socket.on('swap:request', (data) => {
      this.emit('swap:request', data);
      showToast.success('בקשת החלפה חדשה זמינה');
    });

    this.socket.on('swap:accepted', (data) => {
      this.emit('swap:accepted', data);
      showToast.success('בקשת ההחלפה שלך התקבלה!');
    });

    this.socket.on('swap:cancelled', (data) => {
      this.emit('swap:cancelled', data);
      showToast.info('בקשת החלפה בוטלה');
    });

    // Schedule events
    this.socket.on('schedule:published', (data) => {
      this.emit('schedule:published', data);
      showToast.success('סידור עבודה חדש פורסם');
    });

    this.socket.on('schedule:updated', (data) => {
      this.emit('schedule:updated', data);
    });

    // Shift events
    this.socket.on('shift:updated', (data) => {
      this.emit('shift:updated', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  // Event listener management
  on(event: string, listener: SocketEventListener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return cleanup function
    return () => {
      this.off(event, listener);
    };
  }

  off(event: string, listener: SocketEventListener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  // Send events to server
  sendMessage(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }

  // Heartbeat
  startHeartbeat() {
    setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000); // Every 30 seconds
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Request browser notification permission
  async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToast.success('התראות דפדפן הופעלו');
      }
    }
  }
}

export const socketService = new SocketService();