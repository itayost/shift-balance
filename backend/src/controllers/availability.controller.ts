import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availability.service';
import { AuthRequest } from '../types/auth.types';

const availabilityService = new AvailabilityService();

export class AvailabilityController {
  async submitAvailability(req: AuthRequest, res: Response) {
    try {
      const { weekDate, availability } = req.body;
      const userId = req.user!.userId;

      const result = await availabilityService.submitAvailability(
        userId,
        new Date(weekDate),
        availability
      );

      res.json({
        success: true,
        message: `נשמרו ${result.submittedCount} משמרות זמינות`,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בשמירת זמינות'
      });
    }
  }

  async getMyAvailability(req: AuthRequest, res: Response) {
    try {
      const { weekDate } = req.query;
      const userId = req.user!.userId;

      if (!weekDate) {
        return res.status(400).json({
          success: false,
          message: 'תאריך שבוע חובה'
        });
      }

      const availability = await availabilityService.getAvailabilityByWeek(
        userId,
        new Date(weekDate as string)
      );

      res.json({
        success: true,
        data: availability
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בטעינת זמינות'
      });
    }
  }

  async getAllAvailability(req: AuthRequest, res: Response) {
    try {
      const { weekDate } = req.query;

      if (!weekDate) {
        return res.status(400).json({
          success: false,
          message: 'תאריך שבוע חובה'
        });
      }

      // Only admin or shift manager can view all availability
      if (req.user!.role === 'EMPLOYEE') {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לצפות בזמינות של כל העובדים'
        });
      }

      const availability = await availabilityService.getAllAvailabilityForWeek(
        new Date(weekDate as string)
      );

      res.json({
        success: true,
        data: availability
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בטעינת זמינות'
      });
    }
  }

  async updateAvailability(req: AuthRequest, res: Response) {
    try {
      const { availabilityId } = req.params;
      const { isAvailable } = req.body;
      const userId = req.user!.id;

      const result = await availabilityService.updateAvailability(
        userId,
        availabilityId,
        isAvailable
      );

      res.json({
        success: true,
        message: result.deleted ? 'הזמינות הוסרה' : 'הזמינות עודכנה',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בעדכון זמינות'
      });
    }
  }

  async getSubmissionStatus(req: AuthRequest, res: Response) {
    try {
      const { weekDate } = req.query;
      const userId = req.user!.id;

      if (!weekDate) {
        return res.status(400).json({
          success: false,
          message: 'תאריך שבוע חובה'
        });
      }

      const status = await availabilityService.getSubmissionStatus(
        userId,
        new Date(weekDate as string)
      );

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בטעינת סטטוס'
      });
    }
  }

  async getAvailabilityStats(req: AuthRequest, res: Response) {
    try {
      const { weekDate } = req.query;

      if (!weekDate) {
        return res.status(400).json({
          success: false,
          message: 'תאריך שבוע חובה'
        });
      }

      // Only admin can view stats
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לצפות בסטטיסטיקות'
        });
      }

      const stats = await availabilityService.getAvailabilityStats(
        new Date(weekDate as string)
      );

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'שגיאה בטעינת סטטיסטיקות'
      });
    }
  }
}