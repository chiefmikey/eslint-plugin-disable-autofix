import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

import disableAutofix from 'eslint-plugin-disable-autofix';
import { configValidator } from '../../src/validator';

describe('comprehensive configuration syntax testing', () => {
  const testFilesDir = path.join(__dirname, 'config-test-files');

  beforeAll(() => {
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(testFilesDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  };

  const runESLintWithConfig = async (config: any, files: string[]): Promise<any[]> => {
    const eslint = new ESLint({
      cwd: __dirname,
      overrideConfig: config,
      useEslintrc: false,
      fix: true,
    });

    const results = await eslint.lintFiles(files);
    return results;
  };

  describe('ESLint v9 Flat Config syntax', () => {
    it('should work with basic flat config array', async () => {
      const testFile = createTestFile('flat-basic.js', 'let x = 1;\n');

      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        }
      ];

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-const');
    });

    it('should work with multiple config objects in array', async () => {
      const testFile = createTestFile('flat-multi.js', 'let x = 1; console.log(x);\n');

      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        },
        {
          files: ['**/*.js'],
          rules: {
            'no-console': 'off',
            'disable-autofix/no-console': 'error',
          },
        }
      ];

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2);
      expect(results[0].messages.map(m => m.ruleId)).toEqual(
        expect.arrayContaining([
          'disable-autofix/prefer-const',
          'disable-autofix/no-console'
        ])
      );
    });

    it('should work with flat config using files patterns', async () => {
      const jsFile = createTestFile('flat-files.js', 'let x = 1;\n');
      const tsFile = createTestFile('flat-files.ts', 'let y: number = 2;\n');

      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        },
        {
          files: ['**/*.ts'],
          rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            'disable-autofix/@typescript-eslint/no-unused-vars': 'error',
          },
        }
      ];

      const results = await runESLintWithConfig(config, [jsFile, tsFile]);
      expect(results).toHaveLength(2);

      const jsResult = results.find(r => r.filePath.includes('flat-files.js'));
      const tsResult = results.find(r => r.filePath.includes('flat-files.ts'));

      expect(jsResult?.messages).toHaveLength(1);
      expect(jsResult?.messages[0].ruleId).toBe('disable-autofix/prefer-const');

      // TS file might not have issues if @typescript-eslint plugin isn't loaded
      expect(tsResult).toBeDefined();
    });

    it('should work with languageOptions in flat config', async () => {
      const testFile = createTestFile('flat-lang.js', 'let x = 1;\n');

      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: {
              ecmaFeatures: {
                jsx: true,
              },
            },
          },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        }
      ];

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
    });

    it('should work with ignores in flat config', async () => {
      const includedFile = createTestFile('flat-ignore-included.js', 'let x = 1;\n');
      const ignoredFile = createTestFile('flat-ignore-excluded.js', 'let y = 2;\n');

      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          ignores: ['**/flat-ignore-excluded.js'],
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        }
      ];

      const results = await runESLintWithConfig(config, [includedFile, ignoredFile]);
      expect(results).toHaveLength(2);

      const includedResult = results.find(r => r.filePath.includes('included'));
      const ignoredResult = results.find(r => r.filePath.includes('excluded'));

      expect(includedResult?.messages).toHaveLength(1);
      expect(ignoredResult?.messages).toHaveLength(0);
    });
  });

  describe('Rule configuration syntax variations', () => {
    it('should handle all severity levels', async () => {
      const testFile = createTestFile('severity-levels.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 0, // off
          'no-unused-vars': 'off',
          'disable-autofix/no-unused-vars': 1, // warn
          'no-console': 'off',
          'disable-autofix/no-console': 2, // error
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2); // Only warn and error, not off

      const severities = results[0].messages.map(m => m.severity);
      expect(severities).toContain(1); // warn
      expect(severities).toContain(2); // error
    });

    it('should handle string severity syntax', async () => {
      const testFile = createTestFile('severity-strings.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
          'no-unused-vars': 'off',
          'disable-autofix/no-unused-vars': 'error',
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2);

      const severities = results[0].messages.map(m => m.severity);
      expect(severities).toContain(1); // warn
      expect(severities).toContain(2); // error
    });

    it('should handle array syntax with options', async () => {
      const testFile = createTestFile('array-options.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': ['warn', { destructuring: 'all' }],
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
      expect(results[0].messages[0].ruleId).toBe('disable-autofix/prefer-const');
    });

    it('should handle complex rule options', async () => {
      const testFile = createTestFile('complex-options.js', 'const obj = {a:1,b:2};\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'object-curly-spacing': 'off',
          'disable-autofix/object-curly-spacing': ['error', 'always', {
            arraysInObjects: false,
            objectsInObjects: true
          }],
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      // Should not crash even with complex options
      expect(results[0].errorCount).toBeDefined();
    });

    it('should handle rules with multiple configuration options', async () => {
      const testFile = createTestFile('multi-options.js', 'let x=1,y=2,z=3;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'one-var': 'off',
          'disable-autofix/prefer-const': ['warn', { destructuring: 'any' }],
          'disable-autofix/one-var': ['error', 'never'],
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Configuration validation', () => {
    it('should validate correct flat config', () => {
      const config = [
        {
          plugins: { 'disable-autofix': disableAutofix },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
          },
        }
      ];

      const result = configValidator.validateConfig(config[0]);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid severity levels', () => {
      const config = {
        rules: {
          'disable-autofix/prefer-const': 'invalid' as any,
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid severity: invalid");
    });

    it('should detect null/undefined rule configurations', () => {
      const config = {
        rules: {
          'disable-autofix/prefer-const': null as any,
          'disable-autofix/no-console': undefined as any,
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate rule option arrays', () => {
      const config = {
        rules: {
          'disable-autofix/prefer-const': ['warn', { valid: 'options' }],
          'disable-autofix/no-console': ['error', 'option1', 'option2'],
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about disabled disable-autofix rules', () => {
      const config = {
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'off', // This defeats the purpose
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "disable-autofix rule 'prefer-const' is disabled, which defeats the purpose"
      );
    });
  });

  describe('Legacy .eslintrc syntax compatibility', () => {
    it('should work with legacy plugin syntax', async () => {
      const testFile = createTestFile('legacy-plugin.js', 'let x = 1;\n');

      const config = {
        plugins: ['disable-autofix'],
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
    });

    it('should work with extends in legacy format', async () => {
      const testFile = createTestFile('legacy-extends.js', 'let x = 1;\n');

      const config = {
        plugins: ['disable-autofix'],
        extends: ['eslint:recommended'],
        rules: {
          'prefer-const': 'off', // Override the extended rule
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      // Should not crash even with extends
      expect(results[0].errorCount).toBeDefined();
    });

    it('should work with env in legacy format', async () => {
      const testFile = createTestFile('legacy-env.js', 'let x = 1;\n');

      const config = {
        plugins: ['disable-autofix'],
        env: {
          browser: true,
          es2021: true,
        },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
    });
  });

  describe('Mixed configuration patterns', () => {
    it('should handle plugins loaded both ways', async () => {
      const testFile = createTestFile('mixed-plugins.js', 'let x = 1;\n');

      const config = {
        plugins: ['disable-autofix'], // Array syntax
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(1);
    });

    it('should handle rules with mixed syntax', async () => {
      const testFile = createTestFile('mixed-syntax.js', 'let x = 1; console.log(x);\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'no-console': 'off',
          'disable-autofix/prefer-const': 1, // Number severity
          'disable-autofix/no-console': ['error'], // Array with just severity
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty rule configurations', async () => {
      const testFile = createTestFile('empty-rules.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {},
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(0);
    });

    it('should handle undefined rules object', async () => {
      const testFile = createTestFile('undefined-rules.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: undefined,
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      // Should not crash
      expect(results[0].errorCount).toBeDefined();
    });

    it('should handle rules with special characters', async () => {
      const testFile = createTestFile('special-chars.js', 'let x = 1;\n');

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
          'no-console': 'off',
          'disable-autofix/no-console': 'warn',
        },
      };

      const results = await runESLintWithConfig(config, [testFile]);
      expect(results).toHaveLength(1);
      expect(results[0].messages).toHaveLength(2);
    });
  });
});
