import { prisma } from '../utils/db';
import { Notification } from '@prisma/client';
import { getSocketServer } from '../websocket/socket.server';
import { pushService } from './push.service';

export enum NotificationType {
  SHIFT_PUBLISHED = 'SHIFT_PUBLISHED',
  SWAP_REQUEST_CREATED = 'SWAP_REQUEST_CREATED',
  SWAP_REQUEST_ACCEPTED = 'SWAP_REQUEST_ACCEPTED',
  SWAP_REQUEST_CANCELLED = 'SWAP_REQUEST_CANCELLED',
  SHIFT_REMINDER = 'SHIFT_REMINDER',
  GENERAL = 'GENERAL'
}

interface NotificationData {
  shiftId?: string;
  swapRequestId?: string;
  scheduleId?: string;
  [key: string]: any;
}

export class NotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {}
      }
    });

    // Send real-time notification via WebSocket
    try {
      const socketServer = getSocketServer();
      socketServer.sendNotification(userId, notification);
    } catch (error) {
      // Socket server might not be initialized in tests
      console.error('Failed to send real-time notification:', error);
    }

    // Send push notification
    try {
      await pushService.sendPushNotification(userId, title, message, data);
    } catch (error) {
      // Push notifications might fail but shouldn't break the flow
      console.error('Failed to send push notification:', error);
    }

    return notification;
  }

  async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData
  ): Promise<void> {
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      data: data || {}
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  }

  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    return prisma.notification.update({
      where: {
        id: notificationId,
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId
      }
    });
  }

  async deleteOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });
  }

  // Swap-specific notification methods
  async notifySwapRequestCreated(
    requesterId: string,
    shiftDate: Date,
    shiftType: string,
    swapRequestId: string
  ): Promise<void> {
    // Get all eligible users who could accept this swap
    const eligibleUsers = await prisma.user.findMany({
      where: {
        id: { not: requesterId },
        isActive: true
      },
      select: { id: true }
    });

    const userIds = eligibleUsers.map(u => u.id);

    await this.createBulkNotifications(
      userIds,
      NotificationType.SWAP_REQUEST_CREATED,
      'בקשת החלפה חדשה',
      `בקשת החלפה למשמרת ${shiftType} בתאריך ${shiftDate.toLocaleDateString('he-IL')}`,
      { swapRequestId }
    );
  }

  async notifySwapRequestAccepted(
    requesterId: string,
    accepterName: string,
    shiftDate: Date,
    shiftType: string,
    swapRequestId: string
  ): Promise<void> {
    await this.createNotification(
      requesterId,
      NotificationType.SWAP_REQUEST_ACCEPTED,
      'בקשת החלפה אושרה',
      `${accepterName} קיבל את בקשת ההחלפה שלך למשמרת ${shiftType} בתאריך ${shiftDate.toLocaleDateString('he-IL')}`,
      { swapRequestId }
    );
  }

  async notifySwapRequestCancelled(
    affectedUserId: string,
    requesterName: string,
    shiftDate: Date,
    shiftType: string,
    swapRequestId: string
  ): Promise<void> {
    await this.createNotification(
      affectedUserId,
      NotificationType.SWAP_REQUEST_CANCELLED,
      'בקשת החלפה בוטלה',
      `${requesterName} ביטל את בקשת ההחלפה למשמרת ${shiftType} בתאריך ${shiftDate.toLocaleDateString('he-IL')}`,
      { swapRequestId }
    );
  }

  async notifyShiftReminder(
    userId: string,
    shiftDate: Date,
    shiftType: string,
    shiftId: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      NotificationType.SHIFT_REMINDER,
      'תזכורת משמרת',
      `יש לך משמרת ${shiftType} מחר בתאריך ${shiftDate.toLocaleDateString('he-IL')}`,
      { shiftId }
    );
  }

  async notifySchedulePublished(scheduleId: string): Promise<void> {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    const userIds = users.map(u => u.id);

    await this.createBulkNotifications(
      userIds,
      NotificationType.SHIFT_PUBLISHED,
      'סידור עבודה חדש פורסם',
      'סידור העבודה החדש פורסם. בדוק את המשמרות שלך',
      { scheduleId }
    );
  }
}

export const notificationService = new NotificationService();