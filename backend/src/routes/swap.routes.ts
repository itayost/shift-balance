import { Router } from 'express';
import { swapController } from '../controllers/swap.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create a new swap request
router.post('/', swapController.createSwapRequest.bind(swapController));

// Get available swap requests to accept
router.get('/available', swapController.getAvailableSwapRequests.bind(swapController));

// Get user's own swap requests
router.get('/my-requests', swapController.getMySwapRequests.bind(swapController));

// Get all swap requests (Admin only)
router.get('/all', swapController.getAllSwapRequests.bind(swapController));

// Get specific swap request by ID
router.get('/:id', swapController.getSwapRequestById.bind(swapController));

// Accept a swap request
router.post('/:id/accept', swapController.acceptSwapRequest.bind(swapController));

// Cancel a swap request (only by requester)
router.post('/:id/cancel', swapController.cancelSwapRequest.bind(swapController));

// Admin approval routes
router.get('/pending-approvals', swapController.getPendingApprovals.bind(swapController));
router.post('/:id/approve', swapController.approveSwapRequest.bind(swapController));
router.post('/:id/reject-approval', swapController.rejectSwapApproval.bind(swapController));

export default router;