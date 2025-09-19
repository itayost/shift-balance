import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user's notifications
router.get('/', notificationController.getNotifications.bind(notificationController));

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// Mark notification as read
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read
router.put('/mark-all-read', notificationController.markAllAsRead.bind(notificationController));

// Delete a notification
router.delete('/:id', notificationController.deleteNotification.bind(notificationController));

export default router;