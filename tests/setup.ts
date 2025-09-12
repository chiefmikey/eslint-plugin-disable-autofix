// Test setup file
import { jest } from '@jest/globals';

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock process.env for consistent testing
process.env.NODE_ENV = 'test';
