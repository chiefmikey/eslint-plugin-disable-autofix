import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import { PersistentCache } from '../src/utils/cache';
import { logger } from '../src/utils/logger';
import { RuleStatistics } from '../src/utils/stats';
import {
  validateRuleConfig,
  createMockRule,
  createMockPlugin,
  getESLintVersionInfo,
} from '../src/utils/testing';

describe('Utils Tests', () => {
  describe('PersistentCache', () => {
    let cache: PersistentCache;

    beforeEach(() => {
      cache = new PersistentCache();
    });

    it('should create cache instance', () => {
      expect(cache).toBeDefined();
      expect(cache instanceof PersistentCache).toBe(true);
    });

    it('should set and get values', () => {
      const key = 'test-key';
      const value = {
        meta: { fixable: 'code' as const },
        create: () => ({}),
      };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const retrieved = cache.get('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should clear cache', () => {
      const rule1 = { meta: { fixable: 'code' as const }, create: () => ({}) };
      const rule2 = {
        meta: { fixable: 'whitespace' as const },
        create: () => ({}),
      };

      cache.set('key1', rule1);
      cache.set('key2', rule2);

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('Logger', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log warnings', () => {
      logger.warn('Test warning');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[eslint-plugin-disable-autofix] Test warning',
        '',
      );
    });

    it('should log warnings with errors', () => {
      const error = new Error('Test error');
      logger.warn('Test warning', error);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[eslint-plugin-disable-autofix] Test warning',
        error,
      );
    });

    it('should log debug messages when DEBUG is set', () => {
      const originalDebug = process.env.DEBUG;
      process.env.DEBUG = '1';

      const consoleSpyDebug = jest.spyOn(console, 'log').mockImplementation();

      logger.debug('Test debug');
      expect(consoleSpyDebug).toHaveBeenCalledWith(
        '[eslint-plugin-disable-autofix] Test debug',
      );

      consoleSpyDebug.mockRestore();
      process.env.DEBUG = originalDebug;
    });
  });

  describe('RuleStatistics', () => {
    let stats: RuleStatistics;

    beforeEach(() => {
      stats = new RuleStatistics();
    });

    it('should create stats instance', () => {
      expect(stats).toBeDefined();
      expect(stats instanceof RuleStatistics).toBe(true);
    });

    it('should track rule processing', () => {
      stats.trackRule('test-rule', 100);

      const statsData = stats.getStats();
      expect(statsData.totalRules).toBe(1);
    });

    it('should get rule stats', () => {
      stats.trackRule('test-rule', 100);

      const statsData = stats.getStats();
      expect(statsData).toBeDefined();
      expect(statsData.totalRules).toBe(1);
    });

    it('should reset stats', () => {
      stats.trackRule('test-rule', 100);
      stats.reset();

      const statsData = stats.getStats();
      expect(statsData.totalRules).toBe(0);
    });
  });

  describe('Testing Utils', () => {
    it('should validate rule config', () => {
      const validConfig = { test: 'value' };
      const rule = { meta: { fixable: 'code' as const }, create: () => ({}) };
      expect(() => validateRuleConfig(validConfig, rule)).not.toThrow();
    });

    it('should create mock rule', () => {
      const mockRule = createMockRule({ meta: { fixable: 'code' } });

      expect(mockRule).toBeDefined();
      expect(mockRule.meta?.fixable).toBe('code');
      expect(typeof mockRule.create).toBe('function');
    });

    it('should create mock plugin', () => {
      const mockPlugin = createMockPlugin(['rule1', 'rule2']);

      expect(mockPlugin).toBeDefined();
      expect(mockPlugin.rules).toBeDefined();
      expect(Object.keys(mockPlugin.rules)).toHaveLength(2);
    });

    it('should get ESLint version info', () => {
      const versionInfo = getESLintVersionInfo();
      expect(versionInfo).toBeDefined();
      expect(typeof versionInfo.full).toBe('string');
    });
  });
});
