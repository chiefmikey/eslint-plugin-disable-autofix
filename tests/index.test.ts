import { describe, expect, it } from '@jest/globals';
import plugin, { disableFix } from '../src/index';

describe('eslint-plugin-disable-autofix', () => {
  it('should export a plugin object', () => {
    expect(plugin).toBeDefined();
    expect(plugin.rules).toBeDefined();
  });

  it('should export disableFix function', () => {
    expect(typeof disableFix).toBe('function');
  });

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
});
