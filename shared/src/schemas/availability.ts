import { z } from 'zod';

export const shiftTypeSchema = z.enum(['LUNCH', 'DINNER']);

export const weeklyAvailabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  shiftType: shiftTypeSchema,
  isAvailable: z.boolean()
});

export const submitWeeklyAvailabilitySchema = z.object({
  weekDate: z.string().or(z.date()).transform((val) => {
    return val instanceof Date ? val : new Date(val);
  }),
  availability: z.array(weeklyAvailabilitySlotSchema).min(1)
});

export type WeeklyAvailabilitySlotInput = z.infer<typeof weeklyAvailabilitySlotSchema>;
export type SubmitWeeklyAvailabilityInput = z.infer<typeof submitWeeklyAvailabilitySchema>;