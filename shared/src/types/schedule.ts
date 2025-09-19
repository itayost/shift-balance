import { ShiftType, Shift } from './shift';
import { EmployeeLevel, EmployeePosition } from './user';

export interface ShiftEmployee {
  id: string;
  fullName: string;
  phone: string;
  level: EmployeeLevel;
  position: EmployeePosition;
}

export interface ShiftWithEmployees extends Shift {
  employees: ShiftEmployee[];
  shiftManager: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  startTime: string;
  endTime: string;
  minimumStaff: number;
}

export interface WeeklySchedule {
  id: string;
  weekStartDate: Date | string;
  weekEndDate: Date | string;
  isPublished: boolean;
  publishedAt?: Date | string | null;
  publishedBy?: string | null;
  requiredStaff: {
    lunch: number;
    dinner: number;
  };
  shifts?: ShiftWithEmployees[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateScheduleDto {
  weekStartDate: Date | string;
  weekEndDate?: Date | string;
  requiredStaff?: {
    lunch: number;
    dinner: number;
  };
}

export interface PublishScheduleDto {
  scheduleId: string;
  publishedBy?: string;
}