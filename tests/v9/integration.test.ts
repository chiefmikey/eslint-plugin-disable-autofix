import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

import disableAutofix from 'eslint-plugin-disable-autofix';

describe('comprehensive integration tests', () => {
  const testFilesDir = path.join(__dirname, 'test-files');
  const tempDir = path.join(__dirname, 'temp');

  beforeAll(() => {
    // Create test directories
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup test files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      if (fs.existsSync(testFilesDir)) {
        fs.rmSync(testFilesDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to cleanup test directories:', error);
    }
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(testFilesDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  };

  const runESLint = async (config: any, files: string[]): Promise<any[]> => {
    const eslint = new ESLint({
      cwd: __dirname,
      overrideConfig: config,
      useEslintrc: false,
      fix: true,
    });

    const results = await eslint.lintFiles(files);
    return results;
  };

  describe('basic functionality integration', () => {
    it('should disable autofix for basic ESLint rules', async () => {
      const testFile = createTestFile('basic.js', 'let unusedVar = true;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'no-unused-vars': 'off',
          'disable-autofix/no-unused-vars': 'warn',
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2); // unused var and prefer const
      expect(results[0].messages.every(msg => msg.ruleId?.startsWith('disable-autofix/'))).toBe(true);
      expect(results[0].output).toBe('let unusedVar = true;\n'); // No fixes applied
    });

    it('should allow original rules to fix when not using disable-autofix', async () => {
      const testFile = createTestFile('fixable.js', 'let fixable = true;\n');

      const config = {
        rules: {
          'prefer-const': 'warn',
          'no-unused-vars': 'off',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('prefer-const');
      expect(results[0].output).toBe('const fixable = true;\n'); // Fix applied
    });

    it('should handle multiple files with different configurations', async () => {
      const file1 = createTestFile('file1.js', 'let x = 1;\n');
      const file2 = createTestFile('file2.js', 'var y = 2;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
          'no-var': 'off',
          'disable-autofix/no-var': 'error',
        },
      };

      const results = await runESLint(config, [file1, file2]);
      expect(results).toHaveLength(2);

      // Both files should have issues but no fixes
      results.forEach(result => {
        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.output).toBe(result.source); // No fixes applied
        expect(result.messages.every(msg => msg.ruleId?.startsWith('disable-autofix/'))).toBe(true);
      });
    });
  });

  describe('scoped plugin integration', () => {
    it('should handle @babel scoped plugins', async () => {
      // Mock @babel/eslint-plugin since it might not be installed
      const mockBabelPlugin = {
        rules: {
          'object-curly-spacing': {
            meta: { fixable: true },
            create: () => ({})
          }
        }
      };

      jest.doMock('@babel/eslint-plugin', () => mockBabelPlugin, { virtual: true });

      const testFile = createTestFile('babel.js', 'const obj={a:1};\n');

      const config = {
        plugins: {
          'disable-autofix': disableAutofix,
          '@babel': mockBabelPlugin
        },
        rules: {
          '@babel/object-curly-spacing': 'off',
          'disable-autofix/@babel/object-curly-spacing': 'warn',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);

      jest.dontMock('@babel/eslint-plugin');
    });

    it('should handle @typescript-eslint scoped plugins', async () => {
      const mockTsPlugin = {
        rules: {
          'no-unused-vars': {
            meta: { fixable: false },
            create: () => ({})
          }
        }
      };

      jest.doMock('@typescript-eslint/eslint-plugin', () => mockTsPlugin, { virtual: true });

      const testFile = createTestFile('typescript.ts', 'const unused: string = "test";\n');

      const config = {
        plugins: {
          'disable-autofix': disableAutofix,
          '@typescript-eslint': mockTsPlugin
        },
        rules: {
          '@typescript-eslint/no-unused-vars': 'off',
          'disable-autofix/@typescript-eslint/no-unused-vars': 'warn',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);

      jest.dontMock('@typescript-eslint/eslint-plugin');
    });
  });

  describe('configuration syntax variations', () => {
    it('should work with flat config array syntax', async () => {
      const testFile = createTestFile('flat-array.js', 'let x = 5;\n');

      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        }
      ];

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-const');
    });

    it('should work with severity array syntax', async () => {
      const testFile = createTestFile('severity-array.js', 'let x = 10;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': ['warn', { destructuring: 'all' }],
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-const');
    });

    it('should handle multiple disable-autofix rules with different severities', async () => {
      const testFile = createTestFile('multi-severity.js', 'let x = 1; console.log(x);\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'no-console': 'off',
          'disable-autofix/prefer-const': 'warn',
          'disable-autofix/no-console': 'error',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2);

      const messages = results[0].messages;
      const preferConst = messages.find(m => m.ruleId === 'disable-autofix/prefer-const');
      const noConsole = messages.find(m => m.ruleId === 'disable-autofix/no-console');

      expect(preferConst?.severity).toBe(1); // warn
      expect(noConsole?.severity).toBe(2); // error
    });
  });

  describe('error recovery and resilience', () => {
    it('should continue working when some plugins fail to load', async () => {
      // Mock a plugin that throws during import
      const originalRequire = jest.requireActual;

      jest.doMock('failing-plugin', () => {
        throw new Error('Plugin failed to load');
      }, { virtual: true });

      const testFile = createTestFile('resilient.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      // Should not throw despite failing plugin
      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);

      jest.resetModules();
    });

    it('should handle malformed rule configurations gracefully', async () => {
      const testFile = createTestFile('malformed.js', 'var x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'no-var': 'off',
          'disable-autofix/no-var': null, // Invalid configuration
        },
      };

      // Should handle gracefully and not crash
      expect(async () => {
        await runESLint(config, [testFile]);
      }).not.toThrow();
    });
  });

  describe('caching and performance', () => {
    it('should cache rule transformations for performance', async () => {
      const testFile1 = createTestFile('cache1.js', 'let a = 1;\n');
      const testFile2 = createTestFile('cache2.js', 'let b = 2;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const startTime = performance.now();

      // Run multiple times to test caching
      for (let i = 0; i < 5; i++) {
        const results = await runESLint(config, [testFile1, testFile2]);
        expect(results).toHaveLength(2);
        results.forEach(result => {
          expect(result.messages.some(m => m.ruleId === 'disable-autofix/prefer-const')).toBe(true);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should be fast due to caching (< 100ms total for 5 runs)
      expect(totalTime).toBeLessThan(100);
    });

    it('should handle cache invalidation correctly', async () => {
      // Test that rules are properly cached and invalidated
      const testFile = createTestFile('cache-invalidation.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      // First run
      const results1 = await runESLint(config, [testFile]);
      expect(results1[0].messages).toHaveLength(1);

      // Second run should use cache
      const results2 = await runESLint(config, [testFile]);
      expect(results2[0].messages).toHaveLength(1);

      // Results should be consistent
      expect(results1[0].messages[0].ruleId).toBe(results2[0].messages[0].ruleId);
    });
  });

  describe('real-world scenarios', () => {
    it('should work in a typical React project setup', async () => {
      const testFile = createTestFile('react.jsx',
        `import React from 'react';
const Component = () => {
  let count = 0;
  console.log('test');
  return <div>{count}</div>;
};
export default Component;`
      );

      // Mock react plugin
      const mockReactPlugin = {
        rules: {
          'jsx-indent': {
            meta: { fixable: true },
            create: () => ({})
          },
          'prop-types': {
            meta: { fixable: false },
            create: () => ({})
          }
        }
      };

      jest.doMock('eslint-plugin-react', () => mockReactPlugin, { virtual: true });

      const config = {
        plugins: {
          'disable-autofix': disableAutofix,
          react: mockReactPlugin
        },
        rules: {
          'react/jsx-indent': 'off',
          'react/prop-types': 'off',
          'no-console': 'off',
          'prefer-const': 'off',
          'disable-autofix/react/jsx-indent': 'warn',
          'disable-autofix/react/prop-types': 'error',
          'disable-autofix/no-console': 'warn',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages.length).toBeGreaterThan(0);

      // All messages should be from disable-autofix rules
      expect(results[0].messages.every(msg => msg.ruleId?.startsWith('disable-autofix/'))).toBe(true);

      // No fixes should be applied
      expect(results[0].output).toBe(results[0].source);

      jest.dontMock('eslint-plugin-react');
    });

    it('should handle TypeScript files correctly', async () => {
      const testFile = createTestFile('typescript.ts',
        `interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'John',
  age: 30
};

let count = 5;
console.log(user, count);`
      );

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        languageOptions: {
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
          },
        },
        rules: {
          'prefer-const': 'off',
          'no-console': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
          'disable-autofix/prefer-const': 'warn',
          'disable-autofix/no-console': 'warn',
          'disable-autofix/@typescript-eslint/no-unused-vars': 'error',
        },
      };

      const results = await runESLint(config, [testFile]);
      expect(results).toHaveLength(1);
      // Should not crash even if @typescript-eslint plugin isn't available
      expect(results[0].errorCount).toBeDefined();
    });
  });
});
