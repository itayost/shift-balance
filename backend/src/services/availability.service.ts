import { PrismaClient, ShiftType } from '@prisma/client';
import { startOfWeek, endOfWeek, addDays, setHours, setMinutes } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz';

const prisma = new PrismaClient();
const TIMEZONE = 'Asia/Jerusalem';
const DEADLINE_DAY = 4; // Thursday
const DEADLINE_HOUR = 16; // 4 PM

export class AvailabilityService {
  async submitAvailability(
    userId: string,
    weekDate: Date,
    availability: { dayOfWeek: number; shiftType: ShiftType; isAvailable: boolean }[]
  ) {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('משתמש לא נמצא');
    }

    // Check if past deadline
    const now = new Date();
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
    const deadline = addDays(weekStart, DEADLINE_DAY);
    const deadlineTime = setMinutes(setHours(deadline, DEADLINE_HOUR), 0);

    if (now > deadlineTime) {
      throw new Error('המועד האחרון להגשת זמינות עבר');
    }

    // Delete existing availability for this week
    await prisma.availability.deleteMany({
      where: {
        userId,
        dayOfWeek: {
          in: availability.map(a => a.dayOfWeek)
        },
        week: weekStart
      }
    });

    // Create new availability entries
    const availabilityData = availability
      .filter(a => a.isAvailable)
      .map(a => ({
        userId,
        week: weekStart,
        dayOfWeek: a.dayOfWeek,
        shiftType: a.shiftType
      }));

    if (availabilityData.length > 0) {
      await prisma.availability.createMany({
        data: availabilityData
      });
    }

    return { success: true, submittedCount: availabilityData.length };
  }

  async getAvailabilityByWeek(userId: string, weekDate: Date) {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });

    const availability = await prisma.availability.findMany({
      where: {
        userId,
        week: weekStart
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { shiftType: 'asc' }
      ]
    });

    return availability;
  }

  async getAllAvailabilityForWeek(weekDate: Date) {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });

    const availability = await prisma.availability.findMany({
      where: {
        week: weekStart
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            level: true,
            position: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { shiftType: 'asc' }
      ]
    });

    return availability;
  }

  async updateAvailability(
    userId: string,
    availabilityId: string,
    isAvailable: boolean
  ) {
    // Verify ownership
    const existing = await prisma.availability.findFirst({
      where: {
        id: availabilityId,
        userId
      }
    });

    if (!existing) {
      throw new Error('לא נמצאה זמינות להעדכן');
    }

    // Check deadline
    const now = new Date();
    const deadline = addDays(existing.week, DEADLINE_DAY);
    const deadlineTime = setMinutes(setHours(deadline, DEADLINE_HOUR), 0);

    if (now > deadlineTime) {
      throw new Error('המועד האחרון לעדכון זמינות עבר');
    }

    if (!isAvailable) {
      await prisma.availability.delete({
        where: { id: availabilityId }
      });
      return { success: true, deleted: true };
    }

    return { success: true };
  }

  async getSubmissionStatus(userId: string, weekDate: Date) {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
    const deadline = addDays(weekStart, DEADLINE_DAY);
    const deadlineTime = setMinutes(setHours(deadline, DEADLINE_HOUR), 0);

    const count = await prisma.availability.count({
      where: {
        userId,
        week: weekStart
      }
    });

    return {
      submitted: count > 0,
      slotsCount: count,
      deadline: deadlineTime,
      isPastDeadline: new Date() > deadlineTime
    };
  }

  async getAvailabilityStats(weekDate: Date) {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });

    const stats = await prisma.availability.groupBy({
      by: ['userId'],
      where: {
        week: weekStart
      },
      _count: {
        id: true
      }
    });

    const totalEmployees = await prisma.user.count({
      where: {
        role: 'EMPLOYEE',
        isActive: true
      }
    });

    return {
      totalEmployees,
      submittedCount: stats.length,
      submissionRate: (stats.length / totalEmployees) * 100,
      averageSlots: stats.reduce((sum, s) => sum + s._count.id, 0) / stats.length
    };
  }
}