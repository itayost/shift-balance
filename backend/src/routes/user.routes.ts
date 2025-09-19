import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from 'shiftbalance-shared';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (with filters and pagination)
router.get('/', userController.getUsers);

// Search users quickly
router.get('/search', userController.searchUsers);

// Get users without availability for a schedule
router.get('/without-availability/:scheduleId',
  authorize(UserRole.ADMIN, UserRole.SHIFT_MANAGER),
  userController.getUsersWithoutAvailability
);

// Get single user by ID
router.get('/:id', userController.getUserById);

// Create new user (admin only)
router.post('/',
  authorize(UserRole.ADMIN),
  userController.createUser
);

// Bulk create users (admin only)
router.post('/bulk',
  authorize(UserRole.ADMIN),
  userController.bulkCreateUsers
);

// Generate registration token for user (admin only)
router.post('/:id/generate-token',
  authorize(UserRole.ADMIN),
  userController.generateUserToken
);

// Update user (admin or user updating themselves)
router.put('/:id', userController.updateUser);

// Toggle user status (admin only)
router.patch('/:id/toggle-status',
  authorize(UserRole.ADMIN),
  userController.toggleUserStatus
);

// Delete user (admin only)
router.delete('/:id',
  authorize(UserRole.ADMIN),
  userController.deleteUser
);

export default router;