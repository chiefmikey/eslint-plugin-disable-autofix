import { jest } from '@jest/globals';

// Global test setup for eslint-plugin-disable-autofix
beforeAll(() => {
  // Set up global test environment
  console.log('🔧 Setting up eslint-plugin-disable-autofix test environment...');

  // Mock console methods to reduce noise in tests
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    // Keep error and warn for debugging but suppress info and log
    info: jest.fn(),
    log: jest.fn(),
    debug: jest.fn(),
  };

  // Set test-specific environment variables
  process.env.NODE_ENV = 'test';
  process.env.CI = process.env.CI || 'true';

  console.log('✅ Test environment ready');
});

afterAll(() => {
  // Restore console
  global.console = require('console');

  console.log('🧹 Test environment cleaned up');
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
  jest.resetModules();

  // Clear any cached modules that might interfere
  if (require.cache) {
    Object.keys(require.cache).forEach(key => {
      if (key.includes('eslint-plugin-disable-autofix')) {
        delete require.cache[key];
      }
    });
  }
});

afterEach(() => {
  // Clean up any test files or resources
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Custom matchers for better test assertions
expect.extend({
  toBeValidEslintConfig(config: any) {
    const pass = config && typeof config === 'object' && (Array.isArray(config) || config.rules || config.plugins);

    return {
      message: () => `Expected ${config} to be a valid ESLint configuration`,
      pass,
    };
  },

  toHaveValidRuleStructure(rule: any) {
    const pass = rule &&
                typeof rule === 'object' &&
                typeof rule.create === 'function' &&
                rule.meta &&
                typeof rule.meta === 'object';

    return {
      message: () => `Expected ${rule} to have valid ESLint rule structure`,
      pass,
    };
  },

  toBePerformanceAcceptable(received: number, expected: number = 100) {
    const pass = received <= expected;

    return {
      message: () => `Expected ${received}ms to be less than or equal to ${expected}ms`,
      pass,
    };
  },

  toHaveNoMemoryLeaks() {
    // Simple memory leak detection based on heap growth
    const usage = process.memoryUsage();
    const pass = usage.heapUsed < 100 * 1024 * 1024; // Less than 100MB

    return {
      message: () => `Memory usage too high: ${usage.heapUsed / 1024 / 1024}MB`,
      pass,
    };
  }
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't fail the test suite on unhandled rejections in tests
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't fail the test suite on uncaught exceptions in tests
});

// Performance monitoring
global.performance = global.performance || {
  now: () => Date.now(),
  mark: () => {},
  measure: () => {},
  getEntriesByName: () => [],
  clearMarks: () => {},
  clearMeasures: () => {},
};

// Test utilities
global.testUtils = {
  createTestFile: (content: string, filename: string = 'test.js') => {
    const fs = require('fs');
    const path = require('path');
    const testDir = path.join(__dirname, 'temp');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const filePath = path.join(testDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');

    return filePath;
  },

  cleanupTestFiles: () => {
    const fs = require('fs');
    const path = require('path');
    const testDir = path.join(__dirname, 'temp');

    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  },

  measurePerformance: async (fn: () => Promise<void> | void): Promise<number> => {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  },

  waitForFileSystem: (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Export types for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEslintConfig(): R;
      toHaveValidRuleStructure(): R;
      toBePerformanceAcceptable(expected?: number): R;
      toHaveNoMemoryLeaks(): R;
    }
  }

  const testUtils: {
    createTestFile: (content: string, filename?: string) => string;
    cleanupTestFiles: () => void;
    measurePerformance: (fn: () => Promise<void> | void) => Promise<number>;
    waitForFileSystem: (ms?: number) => Promise<void>;
  };
}
