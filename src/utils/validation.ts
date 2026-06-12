/**
 * Zod validation schemas for all user inputs and data boundaries.
 */

import { z } from 'zod';

export const carbonCategorySchema = z.enum(['transport', 'energy', 'food', 'shopping']);
export type CarbonCategoryInput = z.infer<typeof carbonCategorySchema>;

export const emissionItemSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  co2: z.number().min(0, 'CO2 must be non-negative').finite(),
  unit: z.string().min(1),
  source: z.string().min(1, 'Source is required'),
});

export const calculatorEntrySchema = z.object({
  category: carbonCategorySchema,
  description: z.string().min(1, 'Description is required'),
  co2: z.number().min(0, 'CO2 must be non-negative').finite(),
});

export const carbonEntryInsertSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  category: carbonCategorySchema,
  description: z.string().min(1),
  co2_kg: z.number().min(0).finite(),
});

export const coachMessageInsertSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1, 'Message cannot be empty'),
});

export const authEmailSchema = z.string().email('Invalid email address');
export const authPasswordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const displayNameSchema = z.string().min(1, 'Display name is required').max(100);

export const signupSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
  displayName: displayNameSchema,
});

export const loginSchema = z.object({
  email: authEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const simulatorFactorSchema = z.number().min(0).max(1).finite();

export const validateCalculatorEntry = (data: unknown) =>
  calculatorEntrySchema.safeParse(data);

export const validateCarbonEntryInsert = (data: unknown) =>
  carbonEntryInsertSchema.safeParse(data);

export const validateCoachMessageInsert = (data: unknown) =>
  coachMessageInsertSchema.safeParse(data);

export const validateSignup = (data: unknown) =>
  signupSchema.safeParse(data);

export const validateLogin = (data: unknown) =>
  loginSchema.safeParse(data);

export const validateSimulatorFactor = (data: unknown) =>
  simulatorFactorSchema.safeParse(data);
