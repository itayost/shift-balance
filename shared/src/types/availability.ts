import { ShiftType } from './shift';

export interface Availability {
  id: string;
  userId: string;
  week: Date;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  shiftType: ShiftType;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyAvailabilitySlot {
  dayOfWeek: number;
  shiftType: ShiftType;
  isAvailable: boolean;
}

export interface SubmitAvailabilityDto {
  weekDate: string | Date;
  availability: WeeklyAvailabilitySlot[];
}

export interface AvailabilityWithUser extends Availability {
  user: {
    id: string;
    fullName: string;
    level: string;
    position: string;
  };
}

export interface AvailabilityStatus {
  submitted: boolean;
  slotsCount: number;
  deadline: Date;
  isPastDeadline: boolean;
}

export interface AvailabilityStats {
  totalEmployees: number;
  submittedCount: number;
  submissionRate: number;
  averageSlots: number;
}