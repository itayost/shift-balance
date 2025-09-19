import { LoginInput, RegisterInput, AuthResponse, User } from 'shiftbalance-shared';
import { api } from './api';

export class AuthService {
  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  }

  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/register', data);
    return response.data.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data;
  }
}

export const authService = new AuthService();