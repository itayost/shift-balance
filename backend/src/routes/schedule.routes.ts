import { Router } from 'express';
import { scheduleController } from '../controllers/schedule.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current week's schedule
router.get('/current', scheduleController.getCurrentSchedule.bind(scheduleController));

// Get user's shifts for current week
router.get('/my-shifts', scheduleController.getMyShifts.bind(scheduleController));

// Get user's shifts for display purposes (all shifts regardless of swappability)
router.get('/my-shifts-display', scheduleController.getMyShiftsForDisplay.bind(scheduleController));

// Get all schedules (Admin only)
router.get('/all', scheduleController.getAllSchedules.bind(scheduleController));

// Get schedule by week (Admin only)
router.get('/week', scheduleController.getScheduleByWeek.bind(scheduleController));

// Get specific schedule by ID
router.get('/:id', scheduleController.getScheduleById.bind(scheduleController));

// Create a new weekly schedule (Admin only)
router.post('/', scheduleController.createSchedule.bind(scheduleController));

// Update schedule assignments (Admin only)
router.put('/assignments', scheduleController.updateScheduleAssignments.bind(scheduleController));

// Publish a schedule (Admin only)
router.post('/:id/publish', scheduleController.publishSchedule.bind(scheduleController));

export default router;