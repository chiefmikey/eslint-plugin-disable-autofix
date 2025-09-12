import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/simple.test.ts', '**/index.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  moduleNameMapper: {
    '^eslint-plugin-unicorn$':
      '<rootDir>/tests/__mocks__/eslint-plugin-unicorn.js',
    '^@babel/eslint-plugin$': '<rootDir>/tests/__mocks__/babel-plugin.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(eslint-plugin-unicorn|@babel/eslint-plugin)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};

export default jestConfig;
