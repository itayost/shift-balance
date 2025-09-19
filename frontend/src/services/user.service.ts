import { User, CreateUserInput, UpdateUserInput, BulkCreateUsersInput, UserSearchInput } from 'shiftbalance-shared';
import { api } from './api';

export class UserService {
  async getUsers(params?: UserSearchInput) {
    const response = await api.get<{
      success: boolean;
      data: User[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/users', { params });
    return response.data;
  }

  async getUserById(id: string) {
    const response = await api.get<{ success: boolean; data: User }>(`/users/${id}`);
    return response.data.data;
  }

  async createUser(data: CreateUserInput) {
    const response = await api.post<{ success: boolean; data: User }>('/users', data);
    return response.data.data;
  }

  async updateUser(id: string, data: UpdateUserInput) {
    const response = await api.put<{ success: boolean; data: User }>(`/users/${id}`, data);
    return response.data.data;
  }

  async deleteUser(id: string) {
    await api.delete(`/users/${id}`);
  }

  async bulkCreateUsers(data: BulkCreateUsersInput) {
    const response = await api.post<{
      success: boolean;
      data: { created: number; failed: number; errors: string[] };
    }>('/users/bulk', data);
    return response.data.data;
  }

  async generateUserToken(id: string) {
    const response = await api.post<{ success: boolean; data: { token: string } }>(
      `/users/${id}/generate-token`
    );
    return response.data.data.token;
  }

  async toggleUserStatus(id: string) {
    const response = await api.patch<{ success: boolean; data: User }>(
      `/users/${id}/toggle-status`
    );
    return response.data.data;
  }

  async searchUsers(query: string) {
    const response = await api.get<{ success: boolean; data: User[] }>('/users/search', {
      params: { q: query },
    });
    return response.data.data;
  }
}

export const userService = new UserService();