import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts', // Covered by integration tests
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  testTimeout: 30000, // 30 seconds for slow integration tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testSequencer: '<rootDir>/tests/sequencer.js',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml',
      suiteName: 'eslint-plugin-disable-autofix',
    }]
  ],
  // Test environment variables for CI
  testEnvironmentOptions: {
    url: 'http://jestjs.io',
  },
  // Handle ESM/CommonJS interop
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    }
  },
  // Performance optimizations
  maxWorkers: '50%', // Use 50% of available cores
  cache: true,
  // Error handling
  bail: false, // Don't stop on first failure - run all tests
  detectOpenHandles: true,
  forceExit: true,
  // Test categorization
  testNamePattern: process.env.TEST_PATTERN || '.*',
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/coverage/',
  ],
  // Slow test detection
  slowTestThreshold: 5000, // 5 seconds
  // Memory leak detection
  detectLeaks: false, // Enable in CI for memory leak detection
  // Coverage collection
  collectCoverage: true,
  coverageProvider: 'v8',
  // Test results
  testResultsProcessor: '<rootDir>/tests/results-processor.js',
};

export default jestConfig;
