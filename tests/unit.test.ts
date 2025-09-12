import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { disableFix, migrationHelpers } from '../src/index';

describe('Unit Tests - Core Functions', () => {
  describe('disableFix', () => {
    it('should remove fixable property from rule meta', () => {
      const rule = {
        meta: { fixable: 'code' as const },
        create: () => ({}),
      };

      const result = disableFix(rule);
      expect(result.meta?.fixable).toBeUndefined();
    });

    it('should preserve other meta properties', () => {
      const rule = {
        meta: {
          fixable: 'code' as const,
          docs: { description: 'Test rule' },
          type: 'suggestion' as const,
        },
        create: () => ({}),
      };

      const result = disableFix(rule);
      expect(result.meta?.docs).toEqual({ description: 'Test rule' });
      expect(result.meta?.type).toBe('suggestion');
      expect(result.meta?.fixable).toBeUndefined();
    });

    it('should handle rules without meta', () => {
      const rule = {
        create: () => ({}),
      };

      const result = disableFix(rule);
      expect(result.create).toEqual(rule.create);
      expect(result.meta).toBeDefined();
    });

    it('should handle rules with meta but no fixable property', () => {
      const rule = {
        meta: {
          docs: { description: 'Test rule' },
          type: 'suggestion' as const,
        },
        create: () => ({}),
      };

      const result = disableFix(rule);
      expect(result.create).toEqual(rule.create);
      expect(result.meta?.docs).toEqual(rule.meta.docs);
      expect(result.meta?.type).toEqual(rule.meta.type);
      expect(result.meta?.fixable).toBeUndefined();
    });

    it('should handle different fixable types', () => {
      const rule1 = {
        meta: { fixable: 'whitespace' as const },
        create: () => ({}),
      };

      const rule2 = {
        meta: { fixable: 'code' as const },
        create: () => ({}),
      };

      const result1 = disableFix(rule1);
      const result2 = disableFix(rule2);

      expect(result1.meta?.fixable).toBeUndefined();
      expect(result2.meta?.fixable).toBeUndefined();
    });
  });

  describe('migrationHelpers', () => {
    it('should provide migration helpers', () => {
      expect(migrationHelpers).toBeDefined();
      expect(typeof migrationHelpers.convertLegacyConfig).toBe('function');
      expect(typeof migrationHelpers.generateConfigFromRules).toBe('function');
    });
  });
});
