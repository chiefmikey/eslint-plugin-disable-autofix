import { describe, expect, it, beforeEach } from '@jest/globals';
import plugin from '../src/index';

describe('Plugin Tests - Core Plugin Functionality', () => {
  describe('Plugin Structure', () => {
    it('should export a valid ESLint plugin', () => {
      expect(plugin).toBeDefined();
      expect(typeof plugin).toBe('object');
      expect(plugin.rules).toBeDefined();
      expect(typeof plugin.rules).toBe('object');
    });

    it('should have rules property', () => {
      expect(plugin.rules).toBeDefined();
      expect(Object.keys(plugin.rules).length).toBeGreaterThan(0);
    });

    it('should have valid rule structure', () => {
      const ruleNames = Object.keys(plugin.rules);
      expect(ruleNames.length).toBeGreaterThan(0);

      ruleNames.forEach((ruleName) => {
        const rule = plugin.rules[ruleName];
        expect(rule).toBeDefined();
        expect(typeof rule).toBe('object');
        expect(rule.meta).toBeDefined();
        expect(rule.create).toBeDefined();
        expect(typeof rule.create).toBe('function');
      });
    });
  });

  describe('Rule Meta Properties', () => {
    it('should have correct meta structure for rules', () => {
      const ruleNames = Object.keys(plugin.rules);

      ruleNames.forEach((ruleName) => {
        const rule = plugin.rules[ruleName];
        expect(rule.meta).toBeDefined();
        if (rule.meta) {
          expect(rule.meta.type).toBeDefined();
          expect(rule.meta.docs).toBeDefined();
          if (rule.meta.docs) {
            expect(rule.meta.docs.description).toBeDefined();
            expect(typeof rule.meta.docs.description).toBe('string');
          }
        }
      });
    });

    it('should not have fixable property in rule meta', () => {
      const ruleNames = Object.keys(plugin.rules);

      ruleNames.forEach((ruleName) => {
        const rule = plugin.rules[ruleName];
        if (rule.meta) {
          expect(rule.meta.fixable).toBeUndefined();
        }
      });
    });
  });

  describe('Rule Creation', () => {
    it('should create valid rule functions', () => {
      const ruleNames = Object.keys(plugin.rules);

      ruleNames.forEach((ruleName) => {
        const rule = plugin.rules[ruleName];
        const ruleFunction = rule.create({} as any);

        expect(ruleFunction).toBeDefined();
        expect(typeof ruleFunction).toBe('object');
      });
    });

    it('should handle different AST node types', () => {
      const ruleNames = Object.keys(plugin.rules);

      ruleNames.forEach((ruleName) => {
        const rule = plugin.rules[ruleName];
        const ruleFunction = rule.create({} as any);

        // Test with different node types
        const testNodes = [
          { type: 'Program' },
          { type: 'VariableDeclaration' },
          { type: 'ExpressionStatement' },
        ];

        testNodes.forEach((node) => {
          expect(() => {
            if (
              ruleFunction &&
              typeof ruleFunction === 'object' &&
              ruleFunction[node.type]
            ) {
              (ruleFunction as any)[node.type](node as any);
            }
          }).not.toThrow();
        });
      });
    });
  });

  describe('Plugin Configuration', () => {
    it('should have plugin meta', () => {
      expect(plugin.meta).toBeDefined();
      expect(plugin.meta.name).toBeDefined();
      expect(typeof plugin.meta.name).toBe('string');
    });
  });
});
