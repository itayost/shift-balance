import { create } from 'zustand';
import { User, CreateUserInput, UpdateUserInput, UserSearchInput } from 'shiftbalance-shared';
import { userService } from '../services/user.service';
import toast from 'react-hot-toast';

interface UserState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  filters: UserSearchInput;

  // Actions
  fetchUsers: (params?: UserSearchInput) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (data: CreateUserInput) => Promise<User>;
  updateUser: (id: string, data: UpdateUserInput) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  generateUserToken: (id: string) => Promise<string>;
  setFilters: (filters: UserSearchInput) => void;
  clearCurrentUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUser: null,
  isLoading: false,
  pagination: null,
  filters: {},

  fetchUsers: async (params?: UserSearchInput) => {
    set({ isLoading: true });
    try {
      const response = await userService.getUsers(params || get().filters);
      set({
        users: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || 'שגיאה בטעינת משתמשים');
      throw error;
    }
  },

  fetchUserById: async (id: string) => {
    set({ isLoading: true });
    try {
      const user = await userService.getUserById(id);
      set({ currentUser: user, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || 'שגיאה בטעינת משתמש');
      throw error;
    }
  },

  createUser: async (data: CreateUserInput) => {
    set({ isLoading: true });
    try {
      const user = await userService.createUser(data);
      const { users } = get();
      set({
        users: [...users, user],
        isLoading: false,
      });
      toast.success('משתמש נוצר בהצלחה');
      return user;
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || 'שגיאה ביצירת משתמש');
      throw error;
    }
  },

  updateUser: async (id: string, data: UpdateUserInput) => {
    set({ isLoading: true });
    try {
      const updatedUser = await userService.updateUser(id, data);
      const { users } = get();
      set({
        users: users.map(u => u.id === id ? updatedUser : u),
        currentUser: get().currentUser?.id === id ? updatedUser : get().currentUser,
        isLoading: false,
      });
      toast.success('משתמש עודכן בהצלחה');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || 'שגיאה בעדכון משתמש');
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true });
    try {
      await userService.deleteUser(id);
      const { users } = get();
      set({
        users: users.filter(u => u.id !== id),
        isLoading: false,
      });
      toast.success('משתמש נמחק בהצלחה');
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.response?.data?.message || 'שגיאה במחיקת משתמש');
      throw error;
    }
  },

  toggleUserStatus: async (id: string) => {
    try {
      const updatedUser = await userService.toggleUserStatus(id);
      const { users } = get();
      set({
        users: users.map(u => u.id === id ? updatedUser : u),
      });
      toast.success(updatedUser.isActive ? 'משתמש הופעל' : 'משתמש הושבת');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'שגיאה בשינוי סטטוס');
      throw error;
    }
  },

  generateUserToken: async (id: string) => {
    try {
      const token = await userService.generateUserToken(id);
      toast.success('טוקן הרשמה נוצר בהצלחה');
      return token;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'שגיאה ביצירת טוקן');
      throw error;
    }
  },

  setFilters: (filters: UserSearchInput) => {
    set({ filters });
  },

  clearCurrentUser: () => {
    set({ currentUser: null });
  },
}));