import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { loginSchema, registerSchema, refreshTokenSchema } from 'shiftbalance-shared';
import { AppError } from '../middleware/error';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register with invitation token
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        data: result,
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
   * POST /api/auth/login
   * Login with phone and password
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validatedData);

      res.json({
        success: true,
        data: result,
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
   * POST /api/auth/logout
   * Logout current user
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('לא מאומת', 401);
      }

      const refreshToken = req.body.refreshToken;
      if (!refreshToken) {
        throw new AppError('Refresh token חסר', 400);
      }

      await authService.logout(req.user.userId, refreshToken);

      res.json({
        success: true,
        message: 'התנתקת בהצלחה',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current user
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('לא מאומת', 401);
      }

      const user = await authService.getCurrentUser(req.user.userId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate request body
      const validatedData = refreshTokenSchema.parse(req.body);

      // Refresh tokens
      const result = await authService.refreshAccessToken(validatedData.refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError('נתונים לא תקינים', 400));
      } else {
        next(error);
      }
    }
  }
}

export const authController = new AuthController();