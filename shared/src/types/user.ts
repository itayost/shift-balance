export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export enum EmployeeLevel {
  TRAINEE = 'TRAINEE',
  RUNNER = 'RUNNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
}

export enum EmployeePosition {
  SERVER = 'SERVER',
  BARTENDER = 'BARTENDER',
  SHIFT_MANAGER = 'SHIFT_MANAGER',
}

export interface User {
  id: string;
  phone: string;
  fullName: string;
  role: UserRole;
  level: EmployeeLevel;
  position: EmployeePosition;
  isActive: boolean;
  pushToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  phone: string;
  fullName: string;
  role?: UserRole;
  level?: EmployeeLevel;
  position?: EmployeePosition;
}

export interface UpdateUserDto {
  fullName?: string;
  role?: UserRole;
  level?: EmployeeLevel;
  position?: EmployeePosition;
  isActive?: boolean;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface RegisterDto {
  token: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}