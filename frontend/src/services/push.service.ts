import { api } from './api';
import { showToast } from '../utils/toast';

class PushService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();

      if (this.subscription) {
        // Sync subscription with server
        await this.syncSubscription(this.subscription);
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize push service:', error);
      return false;
    }
  }

  async subscribeToPush(): Promise<boolean> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      showToast.error('Service Worker לא זמין');
      return false;
    }

    try {
      // Get VAPID public key from server
      const { data } = await api.get('/push/vapid-key');
      const publicKey = data.publicKey;

      if (!publicKey) {
        showToast.error('Push notifications לא מוגדרות בשרת');
        return false;
      }

      // Convert base64 to Uint8Array
      const applicationServerKey = this.urlBase64ToUint8Array(publicKey);

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        showToast.error('אין הרשאה להתראות');
        return false;
      }

      // Subscribe to push notifications
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send subscription to server
      await this.syncSubscription(this.subscription);

      showToast.success('התראות Push הופעלו בהצלחה');
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      showToast.error('שגיאה בהפעלת התראות Push');
      return false;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    try {
      // Unsubscribe from push
      await this.subscription.unsubscribe();

      // Notify server
      await api.post('/push/unsubscribe', {
        endpoint: this.subscription.endpoint
      });

      this.subscription = null;
      showToast.success('התראות Push בוטלו');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
      showToast.error('שגיאה בביטול התראות Push');
      return false;
    }
  }

  async syncSubscription(subscription: PushSubscription) {
    try {
      await api.post('/push/subscribe', subscription.toJSON());
    } catch (error) {
      console.error('Failed to sync subscription with server:', error);
    }
  }

  isSubscribed(): boolean {
    return !!this.subscription;
  }

  async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async testNotification() {
    try {
      await api.post('/push/test');
      showToast.success('התראת בדיקה נשלחה');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      showToast.error('שגיאה בשליחת התראת בדיקה');
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

export const pushService = new PushService();