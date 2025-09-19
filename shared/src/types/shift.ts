export enum ShiftType {
  LUNCH = 'LUNCH',   // 11:00-17:00
  DINNER = 'DINNER', // 17:00-23:00
}

export interface Shift {
  id: string;
  date: Date;
  type: ShiftType;
  scheduleId: string;
  employees: string[]; // User IDs
  shiftManagerId?: string | null;
  qualityScore: number;
  isBalanced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftDto {
  date: Date;
  type: ShiftType;
  scheduleId: string;
}

export interface UpdateShiftDto {
  employees?: string[];
  shiftManagerId?: string | null;
}

export interface ShiftRequirements {
  minStaff: {
    lunch: number;
    dinner: number;
  };
  requiredExpert: {
    expert: number;
    intermediate: number;
  };
  maxPercentage: {
    trainee: number;
    runner: number;
  };
  requiredRoles: {
    shift_manager: number;
    bartender: number;
    server: number;
  };
}

export interface ShiftQualityMetrics {
  score: number;
  level: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
  issues: string[];
}