import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Availability,
  AvailabilityStatus,
  WeeklyAvailabilitySlot,
  ShiftType
} from 'shiftbalance-shared';
import { availabilityService } from '../services/availability.service';
import { startOfWeek, addDays, format } from 'date-fns';
import { he } from 'date-fns/locale';

interface AvailabilityState {
  // State
  currentWeek: Date;
  availability: Availability[];
  weeklySlots: Map<string, boolean>; // key: "dayOfWeek-shiftType"
  status: AvailabilityStatus | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSaved: Date | null;

  // Actions
  setCurrentWeek: (date: Date) => void;
  loadAvailability: (weekDate?: Date) => Promise<void>;
  toggleSlot: (dayOfWeek: number, shiftType: ShiftType) => void;
  submitAvailability: () => Promise<boolean>;
  loadStatus: () => Promise<void>;
  clearError: () => void;
  initializeWeeklySlots: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentWeek: startOfWeek(new Date(), { weekStartsOn: 0 }),
      availability: [],
      weeklySlots: new Map(),
      status: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSaved: null,

      // Set current week
      setCurrentWeek: (date: Date) => {
        const weekStart = startOfWeek(date, { weekStartsOn: 0 });
        set({ currentWeek: weekStart });
        get().loadAvailability(weekStart);
      },

      // Initialize weekly slots map
      initializeWeeklySlots: () => {
        const slots = new Map<string, boolean>();
        // Initialize all slots as false
        for (let day = 0; day < 7; day++) {
          slots.set(`${day}-LUNCH`, false);
          slots.set(`${day}-DINNER`, false);
        }
        set({ weeklySlots: slots });
      },

      // Load availability for the week
      loadAvailability: async (weekDate?: Date) => {
        const week = weekDate || get().currentWeek;
        set({ isLoading: true, error: null });

        try {
          const [availabilityData, statusData] = await Promise.all([
            availabilityService.getMyAvailability(week),
            availabilityService.getSubmissionStatus(week)
          ]);

          // Create slots map from loaded data
          const slots = new Map<string, boolean>();
          // Initialize all as false
          for (let day = 0; day < 7; day++) {
            slots.set(`${day}-LUNCH`, false);
            slots.set(`${day}-DINNER`, false);
          }
          // Set true for available slots
          availabilityData.forEach(a => {
            slots.set(`${a.dayOfWeek}-${a.shiftType}`, true);
          });

          set({
            availability: availabilityData,
            weeklySlots: slots,
            status: statusData,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'שגיאה בטעינת זמינות',
            isLoading: false
          });
        }
      },

      // Toggle a slot
      toggleSlot: (dayOfWeek: number, shiftType: ShiftType) => {
        const { weeklySlots, status } = get();

        // Check if past deadline
        if (status?.isPastDeadline) {
          set({ error: 'עבר המועד האחרון להגשת זמינות' });
          return;
        }

        const key = `${dayOfWeek}-${shiftType}`;
        const newSlots = new Map(weeklySlots);
        newSlots.set(key, !newSlots.get(key));
        set({ weeklySlots: newSlots });
      },

      // Submit availability
      submitAvailability: async () => {
        const { currentWeek, weeklySlots, status } = get();

        // Check if past deadline
        if (status?.isPastDeadline) {
          set({ error: 'עבר המועד האחרון להגשת זמינות' });
          return;
        }

        set({ isSaving: true, error: null });

        try {
          // Convert map to array of slots
          const availabilitySlots: WeeklyAvailabilitySlot[] = [];
          weeklySlots.forEach((isAvailable, key) => {
            const [dayOfWeek, shiftType] = key.split('-');
            availabilitySlots.push({
              dayOfWeek: parseInt(dayOfWeek),
              shiftType: shiftType as ShiftType,
              isAvailable
            });
          });

          await availabilityService.submitAvailability({
            weekDate: currentWeek,
            availability: availabilitySlots
          });

          set({
            isSaving: false,
            lastSaved: new Date(),
            error: null
          });

          // Reload to get updated status
          get().loadAvailability();

          return true; // Return true on success
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'שגיאה בשמירת זמינות',
            isSaving: false
          });
          return false; // Return false on error
        }
      },

      // Load submission status
      loadStatus: async () => {
        const { currentWeek } = get();
        try {
          const status = await availabilityService.getSubmissionStatus(currentWeek);
          set({ status });
        } catch (error: any) {
          console.error('Failed to load status:', error);
        }
      },

      // Clear error
      clearError: () => set({ error: null })
    }),
    {
      name: 'availability-store'
    }
  )
);