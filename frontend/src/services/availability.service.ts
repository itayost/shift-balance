import { api } from './api';
import {
  SubmitAvailabilityDto,
  Availability,
  AvailabilityStatus,
  AvailabilityStats,
  AvailabilityWithUser
} from 'shiftbalance-shared';

class AvailabilityService {
  async submitAvailability(data: SubmitAvailabilityDto) {
    const response = await api.post('/availability/submit', data);
    return response.data;
  }

  async getMyAvailability(weekDate: Date | string) {
    const dateStr = weekDate instanceof Date ? weekDate.toISOString() : weekDate;
    const response = await api.get<{ success: boolean; data: Availability[] }>('/availability/my', {
      params: { weekDate: dateStr }
    });
    return response.data.data;
  }

  async getAllAvailability(weekDate: Date | string) {
    const dateStr = weekDate instanceof Date ? weekDate.toISOString() : weekDate;
    const response = await api.get<{ success: boolean; data: AvailabilityWithUser[] }>('/availability/all', {
      params: { weekDate: dateStr }
    });
    return response.data.data;
  }

  async updateAvailability(availabilityId: string, isAvailable: boolean) {
    const response = await api.patch(`/availability/${availabilityId}`, {
      isAvailable
    });
    return response.data;
  }

  async getSubmissionStatus(weekDate: Date | string) {
    const dateStr = weekDate instanceof Date ? weekDate.toISOString() : weekDate;
    const response = await api.get<{ success: boolean; data: AvailabilityStatus }>('/availability/status', {
      params: { weekDate: dateStr }
    });
    return response.data.data;
  }

  async getAvailabilityStats(weekDate: Date | string) {
    const dateStr = weekDate instanceof Date ? weekDate.toISOString() : weekDate;
    const response = await api.get<{ success: boolean; data: AvailabilityStats }>('/availability/stats', {
      params: { weekDate: dateStr }
    });
    return response.data.data;
  }
}

export const availabilityService = new AvailabilityService();