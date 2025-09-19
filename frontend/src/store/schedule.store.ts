import { create } from 'zustand';
import {
  WeeklySchedule,
  ShiftWithEmployees,
  CreateScheduleDto,
  ShiftType,
  EmployeeLevel,
  User
} from 'shiftbalance-shared';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { startOfWeek } from 'date-fns';

interface AvailabilityStats {
  totalEmployees: number;
  submitted: number;
  submissionRate: number;
  totalSlots: number;
}

interface WeekAvailability {
  [key: string]: { // userId
    [key: string]: boolean; // "dayOfWeek-shiftType" -> isAvailable
  };
}

interface ScheduleState {
  currentSchedule: WeeklySchedule | null;
  userShifts: ShiftWithEmployees[];
  allSchedules: WeeklySchedule[];
  isLoading: boolean;
  error: string | null;

  // Admin schedule management
  availabilityStats: AvailabilityStats | null;
  weekAvailability: WeekAvailability;
  draftSchedule: any; // Will hold the schedule being built
  activeEmployees: User[];

  // Actions
  fetchCurrentSchedule: () => Promise<void>;
  fetchMyShifts: () => Promise<void>;
  fetchMyShiftsForDisplay: () => Promise<void>;
  fetchAllSchedules: (limit?: number, offset?: number) => Promise<void>;
  createSchedule: (data: CreateScheduleDto) => Promise<boolean>;
  publishSchedule: (scheduleId: string) => Promise<boolean>;

  // Admin actions
  fetchAvailabilityStats: (weekDate: Date) => Promise<void>;
  fetchWeekAvailability: (weekDate: Date) => Promise<void>;
  fetchActiveEmployees: () => Promise<void>;
  getAvailableEmployees: (dayOfWeek: number, shiftType: ShiftType) => User[];
  saveScheduleAssignments: (weekDate: Date, assignments: any) => Promise<boolean>;
  fetchWeekSchedule: (weekDate: Date) => Promise<any>;

  // Helper functions
  getShiftQualityInfo: (score: number) => { level: string; color: string; emoji: string };
  getDayName: (date: string | Date) => string;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentSchedule: null,
  userShifts: [],
  allSchedules: [],
  isLoading: false,
  error: null,

  // Admin state
  availabilityStats: null,
  weekAvailability: {},
  draftSchedule: null,
  activeEmployees: [],

  fetchCurrentSchedule: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/schedule/current');
      set({ currentSchedule: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת הסידור';
      set({ error: message, isLoading: false });

      // Don't show toast if schedule doesn't exist yet
      if (!message.includes('לא נמצא') && !message.includes('לא פורסם')) {
        toast.error(message);
      }
    }
  },

  fetchMyShifts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/schedule/my-shifts');
      set({ userShifts: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת המשמרות';
      set({ error: message, isLoading: false });
    }
  },

  fetchMyShiftsForDisplay: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/schedule/my-shifts-display');
      set({ userShifts: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת המשמרות';
      set({ error: message, isLoading: false });
    }
  },

  fetchAllSchedules: async (limit = 10, offset = 0) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/schedule/all', {
        params: { limit, offset }
      });
      set({ allSchedules: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת הסידורים';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  createSchedule: async (data: CreateScheduleDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/schedule', data);
      toast.success('סידור נוצר בהצלחה');

      // Refresh the schedules list
      await get().fetchAllSchedules();

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה ביצירת הסידור';
      set({ error: message, isLoading: false });
      toast.error(message);
      return false;
    }
  },

  publishSchedule: async (scheduleId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/schedule/${scheduleId}/publish`);
      toast.success('הסידור פורסם בהצלחה');

      // Refresh the current schedule if it's the one we just published
      if (get().currentSchedule?.id === scheduleId) {
        await get().fetchCurrentSchedule();
      }

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בפרסום הסידור';
      set({ error: message, isLoading: false });
      toast.error(message);
      return false;
    }
  },

  getShiftQualityInfo: (score: number) => {
    if (score >= 80) return { level: 'מצוין', color: 'bg-green-100 text-green-800', emoji: '🟢' };
    if (score >= 60) return { level: 'טוב', color: 'bg-yellow-100 text-yellow-800', emoji: '🟡' };
    if (score >= 40) return { level: 'בינוני', color: 'bg-orange-100 text-orange-800', emoji: '🟠' };
    return { level: 'קריטי', color: 'bg-red-100 text-red-800', emoji: '🔴' };
  },

  // Admin functions
  fetchAvailabilityStats: async (weekDate: Date) => {
    set({ isLoading: true, error: null });
    try {
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
      const response = await api.get('/availability/stats', {
        params: { weekDate: weekStart.toISOString() }
      });
      set({ availabilityStats: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת סטטיסטיקות זמינות';
      set({ error: message, isLoading: false });
    }
  },

  fetchWeekAvailability: async (weekDate: Date) => {
    set({ isLoading: true, error: null });
    try {
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
      const response = await api.get('/availability/all', {
        params: { weekDate: weekStart.toISOString() }
      });

      // Transform the data into our format
      const weekAvailability: WeekAvailability = {};
      response.data.data.forEach((item: any) => {
        if (!weekAvailability[item.userId]) {
          weekAvailability[item.userId] = {};
        }
        weekAvailability[item.userId][`${item.dayOfWeek}-${item.shiftType}`] = true;
      });

      set({ weekAvailability, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת זמינות עובדים';
      set({ error: message, isLoading: false });
    }
  },

  fetchActiveEmployees: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/users', {
        params: { isActive: true, role: 'EMPLOYEE' }
      });
      set({ activeEmployees: response.data.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת רשימת עובדים';
      set({ error: message, isLoading: false });
    }
  },

  getAvailableEmployees: (dayOfWeek: number, shiftType: ShiftType) => {
    const { activeEmployees, weekAvailability } = get();
    const key = `${dayOfWeek}-${shiftType}`;

    return activeEmployees.filter(employee =>
      weekAvailability[employee.id]?.[key] === true
    );
  },

  saveScheduleAssignments: async (weekDate: Date, assignments: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put('/schedule/assignments', {
        weekStartDate: startOfWeek(weekDate, { weekStartsOn: 0 }).toISOString(),
        assignments
      });

      toast.success('הסידור נשמר בהצלחה');
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בשמירת הסידור';
      set({ error: message, isLoading: false });
      toast.error(message);
      return false;
    }
  },

  fetchWeekSchedule: async (weekDate: Date) => {
    set({ isLoading: true, error: null });
    try {
      const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
      // Use a direct API call to get schedule by week
      const response = await api.get('/schedule/week', {
        params: { weekDate: weekStart.toISOString() }
      });

      set({ currentSchedule: response.data.data, isLoading: false });
      return response.data.data;
    } catch (error: any) {
      // If no schedule exists, that's okay - we'll create one when saving
      if (error.response?.status === 404) {
        set({ currentSchedule: null, isLoading: false });
        return null;
      }

      const message = error.response?.data?.message || 'שגיאה בטעינת הסידור';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  getDayName: (date: string | Date) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const d = new Date(date);
    return days[d.getDay()];
  },
}));