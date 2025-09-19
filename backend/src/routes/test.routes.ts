import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getSocketServer } from '../websocket/socket.server';

const router = Router();

// Test WebSocket notification
router.post('/test-notification', authenticate, async (req, res) => {
  try {
    const socketServer = getSocketServer();
    const userId = req.user!.userId;

    // Send a test notification via WebSocket
    socketServer.sendNotification(userId, {
      id: 'test-' + Date.now(),
      title: 'Test Notification',
      message: 'This is a test WebSocket notification!',
      type: 'GENERAL',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Test notification sent via WebSocket',
      isUserOnline: socketServer.isUserOnline(userId)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Test online users
router.get('/online-users', authenticate, async (req, res) => {
  try {
    const socketServer = getSocketServer();
    const onlineUsers = socketServer.getOnlineUsers();

    res.json({
      onlineUsers,
      count: onlineUsers.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get online users' });
  }
});

export default router;