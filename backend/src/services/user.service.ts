import { PrismaClient, User, Prisma } from '@prisma/client';
import { CreateUserInput, UpdateUserInput, BulkCreateUsersInput, UserSearchInput } from 'shiftbalance-shared';
import { AppError } from '../middleware/error';
import { generateRegistrationToken } from '../utils/jwt';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getUsers(params: UserSearchInput) {
    const {
      query,
      role,
      level,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'fullName',
      sortOrder = 'asc',
    } = params;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // Apply filters
    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ];
    }

    if (role) where.role = role;
    if (level) where.level = level;
    if (isActive !== undefined) where.isActive = isActive;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          phone: true,
          fullName: true,
          role: true,
          level: true,
          position: true,
          isActive: true,
          tokenUsed: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<User> {
    const user = await prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new AppError('משתמש לא נמצא', 404);
    }

    return user;
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserInput): Promise<User> {
    // Check if phone number already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new AppError('מספר טלפון כבר קיים במערכת', 400);
    }

    // Generate registration token
    const registrationToken = generateRegistrationToken();

    // Create user
    const user = await prisma.user.create({
      data: {
        ...data,
        registrationToken,
        tokenUsed: false,
      },
    });

    logger.info(`User created: ${user.phone}`);

    return user;
  }

  /**
   * Update user details
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    // Check if user exists
    const existingUser = await this.getUserById(id);

    // Prevent updating admin user's role
    if (existingUser.role === 'ADMIN' && data.role && data.role !== 'ADMIN') {
      throw new AppError('לא ניתן לשנות תפקיד של מנהל מערכת', 403);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    logger.info(`User updated: ${user.phone}`);

    return user;
  }

  /**
   * Soft delete a user
   */
  async deleteUser(id: string): Promise<void> {
    // Check if user exists
    const user = await this.getUserById(id);

    // Prevent deleting admin users
    if (user.role === 'ADMIN') {
      throw new AppError('לא ניתן למחוק מנהל מערכת', 403);
    }

    // Soft delete
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    logger.info(`User soft deleted: ${user.phone}`);
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(data: BulkCreateUsersInput): Promise<{ created: number; failed: number; errors: string[] }> {
    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const userData of data.users) {
      try {
        await this.createUser(userData);
        results.created++;
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
        results.errors.push(`${userData.phone}: ${errorMessage}`);
      }
    }

    logger.info(`Bulk user creation: ${results.created} created, ${results.failed} failed`);

    return results;
  }

  /**
   * Generate new registration token for a user
   */
  async generateUserToken(id: string): Promise<string> {
    const user = await this.getUserById(id);

    // Check if user already has a password
    if (user.password) {
      throw new AppError('למשתמש כבר יש סיסמה', 400);
    }

    // Generate new token
    const registrationToken = generateRegistrationToken();

    // Update user with new token
    await prisma.user.update({
      where: { id },
      data: {
        registrationToken,
        tokenUsed: false,
      },
    });

    logger.info(`New registration token generated for user: ${user.phone}`);

    return registrationToken;
  }

  /**
   * Get users without submitted availability for current week
   */
  async getUsersWithoutAvailability(scheduleId: string): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        availabilities: {
          none: {
            scheduleId,
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return users;
  }

  /**
   * Search users by name or phone
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      take: limit,
      orderBy: {
        fullName: 'asc',
      },
    });

    return users;
  }

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string): Promise<User> {
    const user = await this.getUserById(id);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
    });

    logger.info(`User status toggled: ${user.phone} -> ${updatedUser.isActive ? 'active' : 'inactive'}`);

    return updatedUser;
  }
}

export const userService = new UserService();