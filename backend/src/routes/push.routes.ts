import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { pushService } from '../services/push.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Get VAPID public key
router.get('/vapid-key', authenticate, async (req, res) => {
  try {
    const publicKey = pushService.getPublicKey();

    if (!publicKey) {
      return res.status(503).json({
        message: 'Push notifications not configured'
      });
    }

    res.json({ publicKey });
  } catch (error) {
    logger.error('Failed to get VAPID key:', error);
    res.status(500).json({ message: 'שגיאה בקבלת מפתח Push' });
  }
});

// Subscribe to push notifications
const subscribeSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string()
  })
});

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const subscription = subscribeSchema.parse(req.body);
    const userId = req.user!.userId;

    await pushService.subscribeToPush(userId, subscription as any);

    res.json({ message: 'Subscribed to push notifications' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Invalid subscription data',
        errors: error.errors
      });
    }

    logger.error('Failed to subscribe to push:', error);
    res.status(500).json({ message: 'שגיאה בהרשמה להתראות Push' });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const userId = req.user!.userId;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    await pushService.unsubscribeFromPush(userId, endpoint);

    res.json({ message: 'Unsubscribed from push notifications' });
  } catch (error) {
    logger.error('Failed to unsubscribe from push:', error);
    res.status(500).json({ message: 'שגיאה בביטול הרשמה להתראות Push' });
  }
});

// Test push notification (admin only)
router.post('/test', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Check if user is admin
    const { role } = req.user!;
    if (role !== 'ADMIN') {
      return res.status(403).json({ message: 'אין הרשאה' });
    }

    await pushService.sendPushNotification(
      userId,
      'בדיקת התראות Push',
      'זוהי התראת בדיקה מ-ShiftBalance',
      { test: true }
    );

    res.json({ message: 'Test notification sent' });
  } catch (error) {
    logger.error('Failed to send test push:', error);
    res.status(500).json({ message: 'שגיאה בשליחת התראת בדיקה' });
  }
});

export default router;