import { describe, expect, it } from '@jest/globals';
import plugin, { disableFix } from '../src/index';

describe('ESLint Plugin - Simple Tests', () => {
  describe('Plugin Exports', () => {
    it('should export a plugin object', () => {
      expect(plugin).toBeDefined();
      expect(plugin.rules).toBeDefined();
      expect(typeof plugin.rules).toBe('object');
    });

    it('should export disableFix function', () => {
      expect(typeof disableFix).toBe('function');
    });
  });

  describe('disableFix Function', () => {
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
      expect(typeof result.create).toBe('function');
      expect(result.meta).toBeDefined();
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

  describe('Plugin Rules', () => {
    it('should have rules', () => {
      const ruleNames = Object.keys(plugin.rules);
      expect(ruleNames.length).toBeGreaterThan(0);
    });

    it('should have valid rule structure', () => {
      const ruleNames = Object.keys(plugin.rules);

      ruleNames.forEach((ruleName) => {
        const rule = plugin.rules[ruleName];
        expect(rule).toBeDefined();
        expect(typeof rule).toBe('object');
        expect(rule.create).toBeDefined();
        expect(typeof rule.create).toBe('function');
      });
    });
  });
});
