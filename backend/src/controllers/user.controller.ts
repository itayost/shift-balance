import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { createUserSchema, updateUserSchema, bulkCreateUsersSchema, userSearchSchema } from 'shiftbalance-shared';
import { AppError } from '../middleware/error';

export class UserController {
  /**
   * GET /api/users
   * Get all users with filters and pagination
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate and parse query params
      const params = userSearchSchema.parse({
        query: req.query.query,
        role: req.query.role,
        level: req.query.level,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });

      const result = await userService.getUsers(params);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('פרמטרים לא תקינים', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * GET /api/users/:id
   * Get single user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Create new user (admin only)
   */
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = createUserSchema.parse(req.body);

      const user = await userService.createUser(validatedData);

      res.status(201).json({
        success: true,
        data: user,
        message: 'משתמש נוצר בהצלחה',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('נתונים לא תקינים', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * PUT /api/users/:id
   * Update user details
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Validate request body
      const validatedData = updateUserSchema.parse(req.body);

      const user = await userService.updateUser(id, validatedData);

      res.json({
        success: true,
        data: user,
        message: 'משתמש עודכן בהצלחה',
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('נתונים לא תקינים', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * DELETE /api/users/:id
   * Soft delete user
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (req.user?.userId === id) {
        throw new AppError('לא ניתן למחוק את עצמך', 400);
      }

      await userService.deleteUser(id);

      res.json({
        success: true,
        message: 'משתמש נמחק בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users/bulk
   * Bulk create users from CSV/JSON
   */
  async bulkCreateUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = bulkCreateUsersSchema.parse(req.body);

      const result = await userService.bulkCreateUsers(validatedData);

      res.status(201).json({
        success: true,
        data: result,
        message: `${result.created} משתמשים נוצרו בהצלחה`,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('נתונים לא תקינים', 400));
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/users/:id/generate-token
   * Generate new registration token for user
   */
  async generateUserToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const token = await userService.generateUserToken(id);

      res.json({
        success: true,
        data: { token },
        message: 'טוקן הרשמה נוצר בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/without-availability/:scheduleId
   * Get users who haven't submitted availability for a schedule
   */
  async getUsersWithoutAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { scheduleId } = req.params;

      const users = await userService.getUsersWithoutAvailability(scheduleId);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/search
   * Quick search users by name or phone
   */
  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!query || query.length < 2) {
        throw new AppError('חיפוש חייב להכיל לפחות 2 תווים', 400);
      }

      const users = await userService.searchUsers(query, limit);

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id/toggle-status
   * Toggle user active/inactive status
   */
  async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await userService.toggleUserStatus(id);

      res.json({
        success: true,
        data: user,
        message: user.isActive ? 'משתמש הופעל' : 'משתמש הושבת',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();