import { z } from 'zod';
import { VALIDATION } from '../constants';

export const loginSchema = z.object({
  phone: z.string()
    .regex(VALIDATION.PHONE_REGEX, 'מספר טלפון לא תקין (05XXXXXXXX)'),
  password: z.string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `סיסמה חייבת להכיל לפחות ${VALIDATION.PASSWORD.MIN_LENGTH} תווים`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `סיסמה ארוכה מדי (מקסימום ${VALIDATION.PASSWORD.MAX_LENGTH} תווים)`),
});

export const registerSchema = z.object({
  token: z.string()
    .min(1, 'טוקן הרשמה חובה'),
  password: z.string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `סיסמה חייבת להכיל לפחות ${VALIDATION.PASSWORD.MIN_LENGTH} תווים`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `סיסמה ארוכה מדי (מקסימום ${VALIDATION.PASSWORD.MAX_LENGTH} תווים)`)
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'סיסמה חייבת להכיל לפחות אות אחת ומספר אחד'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string()
    .min(1, 'Refresh token is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;