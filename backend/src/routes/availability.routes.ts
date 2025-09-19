import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const availabilityController = new AvailabilityController();

// All routes require authentication
router.use(authenticate);

// Submit or update availability for a week
router.post('/submit', availabilityController.submitAvailability);

// Get my availability for a specific week
router.get('/my', availabilityController.getMyAvailability);

// Get all employees' availability for a week (admin/shift manager only)
router.get('/all', availabilityController.getAllAvailability);

// Update specific availability slot
router.patch('/:availabilityId', availabilityController.updateAvailability);

// Get submission status for a week
router.get('/status', availabilityController.getSubmissionStatus);

// Get availability statistics (admin only)
router.get('/stats', availabilityController.getAvailabilityStats);

export default router;