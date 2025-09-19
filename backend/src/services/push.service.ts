import * as webpush from 'web-push';
import { prisma } from '../utils/db';
import { logger } from '../utils/logger';

class PushService {
  constructor() {
    this.initialize();
  }

  private initialize() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email = process.env.VAPID_EMAIL;

    if (publicKey && privateKey && email) {
      webpush.setVapidDetails(
        `mailto:${email}`,
        publicKey,
        privateKey
      );
      logger.info('Push notification service initialized');
    } else {
      logger.warn('Push notifications not configured - missing VAPID keys');
    }
  }

  async subscribeToPush(userId: string, subscription: webpush.PushSubscription) {
    try {
      await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint
          }
        },
        update: {
          keys: subscription.keys as any,
          expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
          updatedAt: new Date()
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys as any,
          expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null
        }
      });

      logger.info(`Push subscription saved for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to save push subscription:', error);
      throw error;
    }
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    try {
      await prisma.pushSubscription.delete({
        where: {
          userId_endpoint: {
            userId,
            endpoint
          }
        }
      });

      logger.info(`Push subscription removed for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to remove push subscription:', error);
      throw error;
    }
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      if (subscriptions.length === 0) {
        logger.info(`No push subscriptions found for user ${userId}`);
        return;
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        timestamp: Date.now(),
        data
      });

      const sendPromises = subscriptions.map(async (sub) => {
        try {
          const pushSubscription: webpush.PushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys as webpush.PushSubscription['keys']
          };

          if (sub.expirationTime) {
            (pushSubscription as any).expirationTime = sub.expirationTime.getTime();
          }

          await webpush.sendNotification(pushSubscription, payload);
          logger.info(`Push notification sent to user ${userId}`);
        } catch (error: any) {
          if (error.statusCode === 410) {
            // Subscription expired - remove it
            await this.unsubscribeFromPush(userId, sub.endpoint);
            logger.info(`Removed expired subscription for user ${userId}`);
          } else {
            logger.error(`Failed to send push notification to user ${userId}:`, error);
          }
        }
      });

      await Promise.all(sendPromises);
    } catch (error) {
      logger.error('Failed to send push notifications:', error);
    }
  }

  async sendBulkPushNotifications(
    userIds: string[],
    title: string,
    body: string,
    data?: any
  ) {
    const sendPromises = userIds.map(userId =>
      this.sendPushNotification(userId, title, body, data)
    );

    await Promise.all(sendPromises);
  }

  async cleanupExpiredSubscriptions() {
    try {
      const expired = await prisma.pushSubscription.deleteMany({
        where: {
          expirationTime: {
            lt: new Date()
          }
        }
      });

      if (expired.count > 0) {
        logger.info(`Cleaned up ${expired.count} expired push subscriptions`);
      }
    } catch (error) {
      logger.error('Failed to cleanup expired subscriptions:', error);
    }
  }

  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
  }
}

export const pushService = new PushService();