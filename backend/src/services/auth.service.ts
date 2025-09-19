import { PrismaClient, User } from '@prisma/client';
import { LoginInput, RegisterInput } from 'shiftbalance-shared';
import { AuthResponse } from 'shiftbalance-shared';
import { AppError } from '../middleware/error';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  generateRegistrationToken,
  verifyRefreshToken
} from '../utils/jwt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * Register a new user with registration token
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Find the user by registration token
    const user = await prisma.user.findUnique({
      where: {
        registrationToken: data.token,
        tokenUsed: false,
      },
    });

    if (!user) {
      throw new AppError('טוקן הרשמה לא תקין או כבר נוצל', 400);
    }

    // Hash the password
    const hashedPassword = await hashPassword(data.password);

    // Update user with password and mark token as used
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        tokenUsed: true,
        registrationToken: null,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(updatedUser);
    const refreshToken = generateRefreshToken(updatedUser);

    // Store refresh token
    await this.storeRefreshToken(updatedUser.id, refreshToken);

    logger.info(`User registered successfully: ${updatedUser.phone}`);

    return {
      user: this.sanitizeUser(updatedUser),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user with phone and password
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user) {
      throw new AppError('מספר טלפון או סיסמה לא נכונים', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('החשבון אינו פעיל. פנה למנהל', 403);
    }

    // Check if user has set a password
    if (!user.password) {
      throw new AppError('עליך להשלים את תהליך ההרשמה', 400);
    }

    // Verify password
    const isPasswordValid = await comparePassword(data.password, user.password);
    if (!isPasswordValid) {
      throw new AppError('מספר טלפון או סיסמה לא נכונים', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    logger.info(`User logged in: ${user.phone}`);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    // Delete the specific refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Refresh token לא תקין או פג תוקף', 401);
    }

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new AppError('Refresh token לא נמצא', 401);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new AppError('Refresh token פג תוקף', 401);
    }

    // Generate new access token
    const accessToken = generateAccessToken(storedToken.user);
    const newRefreshToken = generateRefreshToken(storedToken.user);

    // Replace old refresh token with new one
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: this.sanitizeUser(storedToken.user),
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Get current user
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('משתמש לא נמצא', 404);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    // Delete old tokens (keep only last 3)
    const existingTokens = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingTokens.length >= 3) {
      const tokensToDelete = existingTokens.slice(2);
      await prisma.refreshToken.deleteMany({
        where: {
          id: { in: tokensToDelete.map(t => t.id) },
        },
      });
    }

    // Store new token
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): any {
    const { password, registrationToken, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();