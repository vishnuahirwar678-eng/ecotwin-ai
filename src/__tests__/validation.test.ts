import { describe, it, expect } from 'vitest';
import {
  validateCalculatorEntry,
  validateCarbonEntryInsert,
  validateCoachMessageInsert,
  validateSignup,
  validateLogin,
  validateSimulatorFactor,
} from '../utils/validation';

describe('validation schemas', () => {
  describe('validateCalculatorEntry', () => {
    it('accepts valid entry', () => {
      const result = validateCalculatorEntry({ category: 'transport', description: 'Car trip', co2: 2.5 });
      expect(result.success).toBe(true);
    });

    it('rejects negative co2', () => {
      const result = validateCalculatorEntry({ category: 'transport', description: 'Test', co2: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
      const result = validateCalculatorEntry({ category: 'invalid', description: 'Test', co2: 1 });
      expect(result.success).toBe(false);
    });

    it('rejects empty description', () => {
      const result = validateCalculatorEntry({ category: 'food', description: '', co2: 1 });
      expect(result.success).toBe(false);
    });
  });

  describe('validateCarbonEntryInsert', () => {
    it('accepts valid insert', () => {
      const result = validateCarbonEntryInsert({ user_id: '550e8400-e29b-41d4-a716-446655440000', category: 'energy', description: 'Heating', co2_kg: 5.0 });
      expect(result.success).toBe(true);
    });

    it('rejects invalid user_id', () => {
      const result = validateCarbonEntryInsert({ user_id: 'not-a-uuid', category: 'energy', description: 'Heating', co2_kg: 5.0 });
      expect(result.success).toBe(false);
    });
  });

  describe('validateCoachMessageInsert', () => {
    it('accepts valid message', () => {
      const result = validateCoachMessageInsert({ user_id: '550e8400-e29b-41d4-a716-446655440000', role: 'user', content: 'How to reduce emissions?' });
      expect(result.success).toBe(true);
    });

    it('rejects empty content', () => {
      const result = validateCoachMessageInsert({ user_id: '550e8400-e29b-41d4-a716-446655440000', role: 'user', content: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateSignup', () => {
    it('accepts valid signup', () => {
      const result = validateSignup({ email: 'test@example.com', password: 'secret123', displayName: 'Test User' });
      expect(result.success).toBe(true);
    });

    it('rejects short password', () => {
      const result = validateSignup({ email: 'test@example.com', password: 'abc', displayName: 'Test' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email', () => {
      const result = validateSignup({ email: 'not-email', password: 'secret123', displayName: 'Test' });
      expect(result.success).toBe(false);
    });

    it('rejects empty display name', () => {
      const result = validateSignup({ email: 'test@example.com', password: 'secret123', displayName: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateLogin', () => {
    it('accepts valid login', () => {
      const result = validateLogin({ email: 'test@example.com', password: 'secret123' });
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const result = validateLogin({ email: 'test@example.com', password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateSimulatorFactor', () => {
    it('accepts valid factor', () => {
      expect(validateSimulatorFactor(0.5).success).toBe(true);
      expect(validateSimulatorFactor(0).success).toBe(true);
      expect(validateSimulatorFactor(1).success).toBe(true);
    });

    it('rejects factor > 1', () => {
      expect(validateSimulatorFactor(1.5).success).toBe(false);
    });

    it('rejects negative factor', () => {
      expect(validateSimulatorFactor(-0.1).success).toBe(false);
    });
  });
});
