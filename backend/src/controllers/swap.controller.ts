import { Request, Response } from 'express';
import { swapService } from '../services/swap.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

export class SwapController {
  /**
   * Create a new swap request
   * POST /api/swaps
   */
  async createSwapRequest(req: AuthRequest, res: Response) {
    try {
      const { shiftId, reason } = req.body;
      const userId = req.user!.userId;

      if (!shiftId) {
        return res.status(400).json({
          success: false,
          message: 'מזהה משמרת חובה',
        });
      }

      const swapRequest = await swapService.createSwapRequest(userId, shiftId, reason);

      res.status(201).json({
        success: true,
        data: swapRequest,
        message: 'בקשת החלפה נוצרה בהצלחה',
      });
    } catch (error: any) {
      console.error('Error creating swap request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה ביצירת בקשת החלפה',
      });
    }
  }

  /**
   * Get available swap requests for user to accept
   * GET /api/swaps/available
   */
  async getAvailableSwapRequests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const requests = await swapService.getAvailableSwapRequests(userId);

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      console.error('Error fetching available swap requests:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת בקשות החלפה זמינות',
      });
    }
  }

  /**
   * Get user's own swap requests
   * GET /api/swaps/my-requests
   */
  async getMySwapRequests(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const requests = await swapService.getUserSwapRequests(userId);

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      console.error('Error fetching user swap requests:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת בקשות ההחלפה שלך',
      });
    }
  }

  /**
   * Accept a swap request
   * POST /api/swaps/:id/accept
   */
  async acceptSwapRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const updatedRequest = await swapService.acceptSwapRequest(userId, id);

      res.json({
        success: true,
        data: updatedRequest,
        message: 'בקשת החלפה אושרה בהצלחה',
      });
    } catch (error: any) {
      console.error('Error accepting swap request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה באישור בקשת החלפה',
      });
    }
  }

  /**
   * Cancel a swap request (only by requester)
   * POST /api/swaps/:id/cancel
   */
  async cancelSwapRequest(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const updatedRequest = await swapService.cancelSwapRequest(userId, id);

      res.json({
        success: true,
        data: updatedRequest,
        message: 'בקשת החלפה בוטלה בהצלחה',
      });
    } catch (error: any) {
      console.error('Error cancelling swap request:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בביטול בקשת החלפה',
      });
    }
  }

  /**
   * Get all swap requests (Admin only)
   * GET /api/swaps/all
   */
  async getAllSwapRequests(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const requests = await swapService.getAllSwapRequests();

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      console.error('Error fetching all swap requests:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת כל בקשות ההחלפה',
      });
    }
  }

  /**
   * Get swap request by ID
   * GET /api/swaps/:id
   */
  async getSwapRequestById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const request = await swapService.getSwapRequestById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'בקשת החלפה לא נמצאה',
        });
      }

      // Check if user has permission to view this request
      const userId = req.user!.userId;
      const isAdmin = req.user?.role === UserRole.ADMIN;
      const isRequester = request.requestedById === userId;
      const isAccepter = request.acceptedById === userId;

      if (!isAdmin && !isRequester && !isAccepter) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לצפות בבקשת החלפה זו',
        });
      }

      res.json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      console.error('Error fetching swap request:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת בקשת החלפה',
      });
    }
  }

  /**
   * Get pending swap requests for admin approval
   * GET /api/swaps/pending-approvals
   */
  async getPendingApprovals(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const requests = await swapService.getPendingApprovals();

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בטעינת בקשות ההחלפה להכשרה',
      });
    }
  }

  /**
   * Approve a swap request (Admin only)
   * POST /api/swaps/:id/approve
   */
  async approveSwapRequest(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { id } = req.params;
      const { approvalNote } = req.body;
      const adminId = req.user.userId;

      const approvedRequest = await swapService.approveSwapRequest(adminId, id, approvalNote);

      res.json({
        success: true,
        data: approvedRequest,
        message: 'בקשת ההחלפה אושרה בהצלחה',
      });
    } catch (error: any) {
      console.error('Error approving swap request:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה באישור בקשת ההחלפה',
      });
    }
  }

  /**
   * Reject a swap request approval (Admin only)
   * POST /api/swaps/:id/reject-approval
   */
  async rejectSwapApproval(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { id } = req.params;
      const { approvalNote } = req.body;
      const adminId = req.user.userId;

      const rejectedRequest = await swapService.rejectSwapApproval(adminId, id, approvalNote);

      res.json({
        success: true,
        data: rejectedRequest,
        message: 'בקשת ההחלפה נדחתה',
      });
    } catch (error: any) {
      console.error('Error rejecting swap approval:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'שגיאה בדחיית בקשת ההחלפה',
      });
    }
  }
}

export const swapController = new SwapController();