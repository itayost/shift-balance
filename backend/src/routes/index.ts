import { Router } from 'express';
import healthRoutes from './health';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import availabilityRoutes from './availability.routes';
import scheduleRoutes from './schedule.routes';
import swapRoutes from './swap.routes';
import notificationRoutes from './notification.routes';
import pushRoutes from './push.routes';
import testRoutes from './test.routes';

const router = Router();

// Health check
router.use('/health', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/availability', availabilityRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/swaps', swapRoutes);
router.use('/notifications', notificationRoutes);
router.use('/push', pushRoutes);
router.use('/test', testRoutes);
// router.use('/shifts', shiftRoutes);

// Welcome route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ShiftBalance API v1.0',
    documentation: '/api-docs', // TODO: Add Swagger documentation
    health: '/api/health',
  });
});

export default router;