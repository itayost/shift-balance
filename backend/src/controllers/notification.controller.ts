import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { unreadOnly } = req.query;

      const notifications = await notificationService.getUserNotifications(
        userId,
        unreadOnly === 'true'
      );

      res.json({
        success: true,
        data: notifications
      });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת ההתראות'
      });
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error: any) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת מספר ההתראות'
      });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        success: true,
        data: notification,
        message: 'התראה סומנה כנקראה'
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בסימון ההתראה'
      });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'כל ההתראות סומנו כנקראו'
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בסימון ההתראות'
      });
    }
  }

  async deleteNotification(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      await notificationService.deleteNotification(id, userId);

      res.json({
        success: true,
        message: 'התראה נמחקה בהצלחה'
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה במחיקת ההתראה'
      });
    }
  }
}

export const notificationController = new NotificationController();