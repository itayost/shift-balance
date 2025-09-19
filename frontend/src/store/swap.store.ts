import { create } from 'zustand';
import { SwapRequest, SwapRequestStatus, CreateSwapRequestDto } from 'shiftbalance-shared';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface SwapRequestWithDetails extends SwapRequest {
  shift: {
    id: string;
    date: Date;
    type: string;
    startTime: string;
    endTime: string;
    employees: {
      id: string;
      fullName: string;
      level: string;
      position: string;
    }[];
  };
  requestedBy: {
    id: string;
    fullName: string;
    level: string;
    position: string;
  };
  acceptedBy?: {
    id: string;
    fullName: string;
    level: string;
    position: string;
  } | null;
}

interface SwapState {
  myRequests: SwapRequestWithDetails[];
  availableRequests: SwapRequestWithDetails[];
  allRequests: SwapRequestWithDetails[]; // For admin
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyRequests: () => Promise<void>;
  fetchAvailableRequests: () => Promise<void>;
  fetchAllRequests: () => Promise<void>; // Admin only
  createSwapRequest: (data: CreateSwapRequestDto) => Promise<boolean>;
  acceptSwapRequest: (swapRequestId: string) => Promise<boolean>;
  cancelSwapRequest: (swapRequestId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useSwapStore = create<SwapState>((set, get) => ({
  myRequests: [],
  availableRequests: [],
  allRequests: [],
  isLoading: false,
  error: null,

  fetchMyRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/swaps/my-requests');
      set({
        myRequests: response.data.data.map((req: any) => ({
          ...req,
          shift: {
            ...req.shift,
            date: new Date(req.shift.date)
          },
          createdAt: new Date(req.createdAt),
          resolvedAt: req.resolvedAt ? new Date(req.resolvedAt) : null
        })),
        isLoading: false
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת בקשות ההחלפה שלך';
      set({ error: message, isLoading: false });
    }
  },

  fetchAvailableRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/swaps/available');
      set({
        availableRequests: response.data.data.map((req: any) => ({
          ...req,
          shift: {
            ...req.shift,
            date: new Date(req.shift.date)
          },
          createdAt: new Date(req.createdAt),
          resolvedAt: req.resolvedAt ? new Date(req.resolvedAt) : null
        })),
        isLoading: false
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת בקשות החלפה זמינות';
      set({ error: message, isLoading: false });
    }
  },

  fetchAllRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/swaps/all');
      set({
        allRequests: response.data.data.map((req: any) => ({
          ...req,
          shift: {
            ...req.shift,
            date: new Date(req.shift.date)
          },
          createdAt: new Date(req.createdAt),
          resolvedAt: req.resolvedAt ? new Date(req.resolvedAt) : null
        })),
        isLoading: false
      });
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בטעינת כל בקשות ההחלפה';
      set({ error: message, isLoading: false });
    }
  },

  createSwapRequest: async (data: CreateSwapRequestDto) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/swaps', data);
      toast.success('בקשת החלפה נוצרה בהצלחה');

      // Refresh both lists
      await Promise.all([
        get().fetchMyRequests(),
        get().fetchAvailableRequests()
      ]);

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה ביצירת בקשת החלפה';
      set({ error: message, isLoading: false });
      toast.error(message);
      return false;
    }
  },

  acceptSwapRequest: async (swapRequestId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/swaps/${swapRequestId}/accept`);
      toast.success('בקשת החלפה אושרה בהצלחה');

      // Refresh both lists
      await Promise.all([
        get().fetchMyRequests(),
        get().fetchAvailableRequests()
      ]);

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה באישור בקשת החלפה';
      set({ error: message, isLoading: false });
      toast.error(message);
      return false;
    }
  },

  cancelSwapRequest: async (swapRequestId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/swaps/${swapRequestId}/cancel`);
      toast.success('בקשת החלפה בוטלה בהצלחה');

      // Refresh both lists
      await Promise.all([
        get().fetchMyRequests(),
        get().fetchAvailableRequests()
      ]);

      set({ isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || 'שגיאה בביטול בקשת החלפה';
      set({ error: message, isLoading: false });
      toast.error(message);
      return false;
    }
  },

  clearError: () => set({ error: null })
}));