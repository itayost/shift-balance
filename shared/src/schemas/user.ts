import { z } from 'zod';
import { UserRole, EmployeeLevel, EmployeePosition } from '../types/user';
import { VALIDATION } from '../constants';

export const createUserSchema = z.object({
  phone: z.string()
    .regex(VALIDATION.PHONE_REGEX, 'מספר טלפון לא תקין (05XXXXXXXX)'),
  fullName: z.string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(50, 'שם מלא ארוך מדי (מקסימום 50 תווים)')
    .regex(VALIDATION.NAME_REGEX, 'שם מלא יכול להכיל רק אותיות ורווחים'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.EMPLOYEE),
  level: z.nativeEnum(EmployeeLevel).optional().default(EmployeeLevel.TRAINEE),
  position: z.nativeEnum(EmployeePosition).optional().default(EmployeePosition.SERVER),
});

export const updateUserSchema = z.object({
  fullName: z.string()
    .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
    .max(50, 'שם מלא ארוך מדי (מקסימום 50 תווים)')
    .regex(VALIDATION.NAME_REGEX, 'שם מלא יכול להכיל רק אותיות ורווחים')
    .optional(),
  role: z.nativeEnum(UserRole).optional(),
  level: z.nativeEnum(EmployeeLevel).optional(),
  position: z.nativeEnum(EmployeePosition).optional(),
  isActive: z.boolean().optional(),
});

export const bulkCreateUsersSchema = z.object({
  users: z.array(createUserSchema).min(1, 'חייב להעלות לפחות משתמש אחד').max(100, 'ניתן להעלות עד 100 משתמשים בכל פעם'),
});

export const userSearchSchema = z.object({
  query: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  level: z.nativeEnum(EmployeeLevel).optional(),
  isActive: z.boolean().optional(),
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(20).optional(),
  sortBy: z.enum(['fullName', 'phone', 'role', 'level', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc').optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type BulkCreateUsersInput = z.infer<typeof bulkCreateUsersSchema>;
export type UserSearchInput = z.infer<typeof userSearchSchema>;