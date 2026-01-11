import { describe, expect, it } from '@jest/globals';

import disableAutofix from 'eslint-plugin-disable-autofix';

describe('performance benchmarks', () => {
  const PERFORMANCE_THRESHOLD = 100; // ms
  const ITERATIONS = 100;

  it('initializes within performance threshold', () => {
    const startTime = performance.now();

    // Force initialization by accessing rules
    const rules = disableAutofix.rules;
    expect(rules).toBeDefined();

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Plugin initialization took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
  });

  it('handles repeated rule access efficiently', () => {
    // Pre-warm cache
    const rule = disableAutofix.rules['prefer-const'];

    const startTime = performance.now();

    // Access the same rule many times
    for (let i = 0; i < ITERATIONS; i++) {
      const cachedRule = disableAutofix.rules['prefer-const'];
      expect(cachedRule).toBeDefined();
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    const avgTimePerAccess = duration / ITERATIONS;

    console.log(`Average rule access time: ${avgTimePerAccess.toFixed(4)}ms`);
    expect(avgTimePerAccess).toBeLessThan(0.1); // Should be very fast
  });

  it('scales well with multiple rule types', () => {
    const ruleNames = [
      'prefer-const',
      'no-unused-vars',
      'no-console',
      'react/jsx-indent',
      'unicorn/filename-case',
      '@typescript-eslint/no-unused-vars'
    ];

    const startTime = performance.now();

    for (const ruleName of ruleNames) {
      // Access each rule (some may not exist, but shouldn't throw)
      const rule = disableAutofix.rules[ruleName];
      // Just check it doesn't throw
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Multi-rule access took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD);
  });

  it('maintains performance under memory pressure', () => {
    // Simulate accessing many different rules to test cache eviction
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      const ruleName = `test-rule-${i}`;
      const rule = disableAutofix.rules[ruleName];
      // Rule will be undefined, but access should be fast
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Memory pressure test took ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD * 2); // Allow some margin
  });

  it('lazy loading works correctly', () => {
    const startTime = performance.now();

    // Just accessing the plugin object should be fast (no initialization)
    const plugin = disableAutofix;
    expect(plugin).toBeDefined();
    expect(plugin.meta).toBeDefined();

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Plugin object access took ${duration.toFixed(4)}ms`);
    expect(duration).toBeLessThan(1); // Should be nearly instant
  });

  it('caching prevents redundant computation', () => {
    // First access (may be slower due to initialization)
    const firstAccessStart = performance.now();
    const rule1 = disableAutofix.rules['prefer-const'];
    const firstAccessEnd = performance.now();

    // Second access (should be cached)
    const secondAccessStart = performance.now();
    const rule2 = disableAutofix.rules['prefer-const'];
    const secondAccessEnd = performance.now();

    const firstDuration = firstAccessEnd - firstAccessStart;
    const secondDuration = secondAccessEnd - secondAccessStart;

    console.log(`First access: ${firstDuration.toFixed(4)}ms, Second access: ${secondDuration.toFixed(4)}ms`);

    // Second access should be significantly faster
    expect(secondDuration).toBeLessThan(firstDuration * 0.5);
    expect(rule1).toBe(rule2); // Same cached instance
  });
});
