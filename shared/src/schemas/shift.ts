import { z } from 'zod';

export const availabilitySlotSchema = z.object({
  day: z.enum(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
  lunch: z.boolean(),
  dinner: z.boolean(),
});

export const createAvailabilitySchema = z.object({
  scheduleId: z.string().cuid(),
  slots: z.array(availabilitySlotSchema)
    .min(1, 'חייב לבחור לפחות משמרת אחת')
    .max(14, 'מקסימום 14 משמרות בשבוע'),
});

export const createSwapRequestSchema = z.object({
  shiftId: z.string().cuid(),
  reason: z.string()
    .max(200, 'הסיבה ארוכה מדי (מקסימום 200 תווים)')
    .optional(),
});

export const assignShiftSchema = z.object({
  shiftId: z.string().cuid(),
  employeeIds: z.array(z.string().cuid())
    .min(1, 'חייב לשבץ לפחות עובד אחד'),
  shiftManagerId: z.string().cuid().optional(),
});

export type AvailabilitySlotInput = z.infer<typeof availabilitySlotSchema>;
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type CreateSwapRequestInput = z.infer<typeof createSwapRequestSchema>;
export type AssignShiftInput = z.infer<typeof assignShiftSchema>;