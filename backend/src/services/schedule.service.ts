import { PrismaClient, WeeklySchedule, Shift, ShiftType, EmployeePosition, EmployeeLevel } from '@prisma/client';
import { startOfWeek, endOfWeek, addDays, addHours, format } from 'date-fns';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

interface ShiftWithEmployees extends Shift {
  employees: {
    id: string;
    fullName: string;
    phone: string;
    level: EmployeeLevel;
    position: EmployeePosition;
  }[];
  shiftManager: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
}

interface ScheduleWithShifts extends WeeklySchedule {
  shifts: ShiftWithEmployees[];
}

export class ScheduleService {
  /**
   * Get the current week's schedule
   */
  async getCurrentSchedule(): Promise<ScheduleWithShifts | null> {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 }); // Saturday

    const schedule = await prisma.weeklySchedule.findFirst({
      where: {
        weekStartDate: {
          lte: weekEnd,
        },
        weekEndDate: {
          gte: weekStart,
        },
      },
      include: {
        shifts: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                level: true,
                position: true,
              },
            },
            shiftManager: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    return schedule;
  }

  /**
   * Get a specific week's schedule by ID
   */
  async getScheduleById(id: string): Promise<ScheduleWithShifts | null> {
    const schedule = await prisma.weeklySchedule.findUnique({
      where: { id },
      include: {
        shifts: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                level: true,
                position: true,
              },
            },
            shiftManager: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    return schedule;
  }

  /**
   * Get user's swappable shifts from all published schedules
   * Returns shifts that meet the 4-hour minimum notice requirement
   */
  async getUserShifts(userId: string): Promise<ShiftWithEmployees[]> {
    const now = new Date();
    const minimumNoticeTime = addHours(now, 4);

    const shifts = await prisma.shift.findMany({
      where: {
        // Only from published schedules
        schedule: {
          isPublished: true,
        },
        // Shifts that meet the 4-hour minimum notice requirement
        date: {
          gte: minimumNoticeTime,
        },
        OR: [
          {
            employees: {
              some: {
                id: userId,
              },
            },
          },
          {
            shiftManagerId: userId,
          },
        ],
      },
      include: {
        employees: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            level: true,
            position: true,
          },
        },
        shiftManager: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return shifts;
  }

  /**
   * Get all user's shifts for display purposes (current week)
   * Used for schedule view - shows ALL shifts regardless of swappability
   */
  async getUserShiftsForDisplay(userId: string): Promise<ShiftWithEmployees[]> {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const shifts = await prisma.shift.findMany({
      where: {
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        OR: [
          {
            employees: {
              some: {
                id: userId,
              },
            },
          },
          {
            shiftManagerId: userId,
          },
        ],
      },
      include: {
        employees: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            level: true,
            position: true,
          },
        },
        shiftManager: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return shifts;
  }

  /**
   * Create a new weekly schedule
   */
  async createSchedule(weekStartDate: Date): Promise<WeeklySchedule> {
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 0 });

    // Check if schedule already exists for this week
    const existingSchedule = await prisma.weeklySchedule.findFirst({
      where: {
        weekStartDate: {
          lte: weekEnd,
        },
        weekEndDate: {
          gte: weekStartDate,
        },
      },
    });

    if (existingSchedule) {
      throw new Error('סידור כבר קיים לשבוע זה');
    }

    const schedule = await prisma.weeklySchedule.create({
      data: {
        weekStartDate,
        weekEndDate: weekEnd,
        requiredStaff: {
          lunch: 8,
          dinner: 12,
        },
      },
    });

    // Create empty shifts for each day
    const shifts = [];
    for (let i = 0; i < 7; i++) {
      const shiftDate = addDays(weekStartDate, i);

      // Create lunch shift
      shifts.push(
        prisma.shift.create({
          data: {
            scheduleId: schedule.id,
            date: shiftDate,
            type: ShiftType.LUNCH,
            startTime: '11:00',
            endTime: '16:00',
            minimumStaff: 6,
            isBalanced: false,
            qualityScore: 0,
          },
        })
      );

      // Create dinner shift
      shifts.push(
        prisma.shift.create({
          data: {
            scheduleId: schedule.id,
            date: shiftDate,
            type: ShiftType.DINNER,
            startTime: '18:00',
            endTime: '23:00',
            minimumStaff: 10,
            isBalanced: false,
            qualityScore: 0,
          },
        })
      );
    }

    await Promise.all(shifts);

    return schedule;
  }

  /**
   * Publish a schedule (make it visible to all employees)
   */
  async publishSchedule(scheduleId: string, publishedBy: string): Promise<WeeklySchedule> {
    const schedule = await prisma.weeklySchedule.update({
      where: { id: scheduleId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedBy,
      },
    });

    // Send notifications to all employees
    try {
      await notificationService.notifySchedulePublished(scheduleId);
    } catch (error) {
      console.error('Error sending schedule published notification:', error);
    }

    return schedule;
  }

  /**
   * Calculate shift quality score
   */
  calculateShiftQuality(shift: ShiftWithEmployees): number {
    let score = 100;

    const employees = shift.employees;
    const totalEmployees = employees.length;

    if (totalEmployees === 0) return 0;

    // Count by level
    const levels = {
      expert: employees.filter(e => e.level === EmployeeLevel.EXPERT).length,
      intermediate: employees.filter(e => e.level === EmployeeLevel.INTERMEDIATE).length,
      runner: employees.filter(e => e.level === EmployeeLevel.RUNNER).length,
      trainee: employees.filter(e => e.level === EmployeeLevel.TRAINEE).length,
    };

    // Count by position
    const positions = {
      bartender: employees.filter(e => e.position === EmployeePosition.BARTENDER).length,
      server: employees.filter(e => e.position === EmployeePosition.SERVER).length,
    };

    // Check minimum requirements
    if (!shift.shiftManagerId) {
      score -= 20; // No shift manager
    }

    if (positions.bartender === 0) {
      score -= 15; // No bartender
    }

    // Check expertise requirements
    if (levels.expert < 1 && levels.intermediate < 2) {
      score -= 30; // Not enough experienced staff
    }

    // Check trainee percentage
    const traineePercentage = (levels.trainee / totalEmployees) * 100;
    if (traineePercentage > 30) {
      score -= 10; // Too many trainees
    }

    // Check runner percentage
    const runnerPercentage = (levels.runner / totalEmployees) * 100;
    if (runnerPercentage > 40) {
      score -= 10; // Too many runners
    }

    // Check minimum staff
    if (totalEmployees < shift.minimumStaff) {
      score -= 25; // Understaffed
    }

    // Calculate average level bonus
    const levelScores = {
      [EmployeeLevel.EXPERT]: 4,
      [EmployeeLevel.INTERMEDIATE]: 3,
      [EmployeeLevel.RUNNER]: 2,
      [EmployeeLevel.TRAINEE]: 1,
    };

    const avgLevelScore = employees.reduce((sum, emp) => sum + levelScores[emp.level], 0) / totalEmployees;
    score *= (avgLevelScore / 4); // Normalize to percentage

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Update shift assignments
   */
  async updateShiftAssignments(
    shiftId: string,
    employeeIds: string[],
    shiftManagerId?: string
  ): Promise<ShiftWithEmployees> {
    // Clear existing assignments
    await prisma.shift.update({
      where: { id: shiftId },
      data: {
        employees: {
          set: [],
        },
        shiftManagerId: null,
      },
    });

    // Add new assignments
    const shift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        employees: {
          connect: employeeIds.map(id => ({ id })),
        },
        shiftManagerId,
      },
      include: {
        employees: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            level: true,
            position: true,
          },
        },
        shiftManager: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    // Update shift quality score
    const qualityScore = this.calculateShiftQuality(shift);
    await prisma.shift.update({
      where: { id: shiftId },
      data: { qualityScore },
    });

    return shift;
  }

  /**
   * Update schedule with all shift assignments
   */
  async updateScheduleAssignments(
    weekStartDate: Date,
    assignments: {
      [key: string]: { // "dayOfWeek-shiftType"
        employeeIds: string[];
        shiftManagerId?: string;
      };
    }
  ): Promise<ScheduleWithShifts> {
    // Find or create schedule for this week
    let schedule = await this.getScheduleByWeek(weekStartDate);

    if (!schedule) {
      schedule = await this.createSchedule(weekStartDate);
      schedule = await this.getScheduleByWeek(weekStartDate);
    }

    if (!schedule) {
      throw new Error('Failed to create or find schedule');
    }

    // Update each shift
    for (const [key, assignment] of Object.entries(assignments)) {
      const [dayOfWeek, shiftType] = key.split('-');
      const shiftDate = addDays(weekStartDate, parseInt(dayOfWeek));

      const shift = schedule.shifts.find(s =>
        s.date.toDateString() === shiftDate.toDateString() &&
        s.type === shiftType
      );

      if (shift && assignment.employeeIds.length > 0) {
        await this.updateShiftAssignments(
          shift.id,
          assignment.employeeIds,
          assignment.shiftManagerId
        );
      }
    }

    // Return updated schedule
    return await this.getScheduleByWeek(weekStartDate) as ScheduleWithShifts;
  }

  /**
   * Get schedule by week start date
   */
  async getScheduleByWeek(weekStartDate: Date): Promise<ScheduleWithShifts | null> {
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 0 });

    const schedule = await prisma.weeklySchedule.findFirst({
      where: {
        weekStartDate: {
          lte: weekEnd,
        },
        weekEndDate: {
          gte: weekStartDate,
        },
      },
      include: {
        shifts: {
          include: {
            employees: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                level: true,
                position: true,
              },
            },
            shiftManager: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    return schedule;
  }

  /**
   * Get all schedules (for admin)
   */
  async getAllSchedules(limit: number = 10, offset: number = 0): Promise<WeeklySchedule[]> {
    const schedules = await prisma.weeklySchedule.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        weekStartDate: 'desc',
      },
      include: {
        shifts: {
          select: {
            id: true,
            date: true,
            type: true,
          },
        },
      },
    });

    return schedules;
  }
}

export const scheduleService = new ScheduleService();