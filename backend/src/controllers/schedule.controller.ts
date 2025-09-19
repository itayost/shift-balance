import { Request, Response } from 'express';
import { scheduleService } from '../services/schedule.service';
import { UserRole } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

export class ScheduleController {
  /**
   * Get current week's schedule
   * GET /api/schedule/current
   */
  async getCurrentSchedule(req: AuthRequest, res: Response) {
    try {
      const schedule = await scheduleService.getCurrentSchedule();

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'לא נמצא סידור לשבוע הנוכחי',
        });
      }

      // If user is not admin, only show published schedules
      if (req.user?.role !== UserRole.ADMIN && !schedule.isPublished) {
        return res.status(404).json({
          success: false,
          message: 'הסידור עדיין לא פורסם',
        });
      }

      // Calculate quality scores for each shift
      const schedulWithScores = {
        ...schedule,
        shifts: schedule.shifts.map(shift => ({
          ...shift,
          qualityScore: scheduleService.calculateShiftQuality(shift),
        })),
      };

      res.json({
        success: true,
        data: schedulWithScores,
      });
    } catch (error) {
      console.error('Error fetching current schedule:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת הסידור',
      });
    }
  }

  /**
   * Get specific schedule by ID
   * GET /api/schedule/:id
   */
  async getScheduleById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await scheduleService.getScheduleById(id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'סידור לא נמצא',
        });
      }

      // If user is not admin, only show published schedules
      if (req.user?.role !== UserRole.ADMIN && !schedule.isPublished) {
        return res.status(404).json({
          success: false,
          message: 'הסידור עדיין לא פורסם',
        });
      }

      // Calculate quality scores for each shift
      const schedulWithScores = {
        ...schedule,
        shifts: schedule.shifts.map(shift => ({
          ...shift,
          qualityScore: scheduleService.calculateShiftQuality(shift),
        })),
      };

      res.json({
        success: true,
        data: schedulWithScores,
      });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת הסידור',
      });
    }
  }

  /**
   * Get user's shifts for current week
   * GET /api/schedule/my-shifts
   */
  async getMyShifts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const shifts = await scheduleService.getUserShifts(userId);

      res.json({
        success: true,
        data: shifts,
      });
    } catch (error) {
      console.error('Error fetching user shifts:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת המשמרות שלך',
      });
    }
  }

  /**
   * Get user's shifts for display in schedule view
   * GET /api/schedule/my-shifts-display
   */
  async getMyShiftsForDisplay(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const shifts = await scheduleService.getUserShiftsForDisplay(userId);

      res.json({
        success: true,
        data: shifts,
      });
    } catch (error) {
      console.error('Error fetching user shifts for display:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת המשמרות שלך',
      });
    }
  }

  /**
   * Create a new weekly schedule (Admin only)
   * POST /api/schedule
   */
  async createSchedule(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { weekStartDate } = req.body;

      if (!weekStartDate) {
        return res.status(400).json({
          success: false,
          message: 'תאריך התחלת שבוע חובה',
        });
      }

      const schedule = await scheduleService.createSchedule(new Date(weekStartDate));

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'סידור נוצר בהצלחה',
      });
    } catch (error: any) {
      console.error('Error creating schedule:', error);

      if (error.message === 'סידור כבר קיים לשבוע זה') {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'שגיאה ביצירת הסידור',
      });
    }
  }

  /**
   * Publish a schedule (Admin only)
   * POST /api/schedule/:id/publish
   */
  async publishSchedule(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { id } = req.params;
      const publishedBy = req.user.userId;

      const schedule = await scheduleService.publishSchedule(id, publishedBy);

      res.json({
        success: true,
        data: schedule,
        message: 'הסידור פורסם בהצלחה',
      });
    } catch (error) {
      console.error('Error publishing schedule:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בפרסום הסידור',
      });
    }
  }

  /**
   * Get schedule by week (Admin only)
   * GET /api/schedule/week?weekDate=...
   */
  async getScheduleByWeek(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { weekDate } = req.query;

      if (!weekDate) {
        return res.status(400).json({
          success: false,
          message: 'תאריך השבוע הוא שדה חובה',
        });
      }

      const schedule = await scheduleService.getScheduleByWeek(new Date(weekDate as string));

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'לא נמצא סידור לשבוע זה',
        });
      }

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      console.error('Error fetching schedule by week:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת הסידור',
      });
    }
  }

  /**
   * Update schedule assignments (Admin only)
   * PUT /api/schedule/assignments
   */
  async updateScheduleAssignments(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { weekStartDate, assignments } = req.body;

      if (!weekStartDate || !assignments) {
        return res.status(400).json({
          success: false,
          message: 'תאריך השבוע ושיבוצים הם שדות חובה',
        });
      }

      const schedule = await scheduleService.updateScheduleAssignments(
        new Date(weekStartDate),
        assignments
      );

      res.json({
        success: true,
        data: schedule,
        message: 'הסידור נשמר בהצלחה',
      });
    } catch (error) {
      console.error('Error updating schedule assignments:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בשמירת הסידור',
      });
    }
  }

  /**
   * Get all schedules (Admin only)
   * GET /api/schedule/all
   */
  async getAllSchedules(req: AuthRequest, res: Response) {
    try {
      // Check if user is admin
      if (req.user?.role !== UserRole.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'אין הרשאה לבצע פעולה זו',
        });
      }

      const { limit = 10, offset = 0 } = req.query;
      const schedules = await scheduleService.getAllSchedules(
        Number(limit),
        Number(offset)
      );

      res.json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({
        success: false,
        message: 'שגיאה בטעינת הסידורים',
      });
    }
  }
}

export const scheduleController = new ScheduleController();