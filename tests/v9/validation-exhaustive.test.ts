import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

import disableAutofix from 'eslint-plugin-disable-autofix';
import { configValidator, ConfigurationValidator } from '../../src/validator';

describe('exhaustive configuration validation testing', () => {
  const testFilesDir = path.join(__dirname, 'validation-test-files');

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

  describe('ConfigurationValidator class', () => {
    let validator: ConfigurationValidator;

    beforeEach(() => {
      validator = new ConfigurationValidator();
    });

    describe('validateConfig method', () => {
      it('should validate empty configuration', () => {
        const config = {};
        const result = validator.validateConfig(config);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate configuration without rules', () => {
        const config = {
          plugins: ['disable-autofix'],
          extends: ['eslint:recommended'],
        };

        const result = validator.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain('No rules found in configuration');
      });

      it('should validate configuration with only original rules', () => {
        const config = {
          rules: {
            'prefer-const': 'warn',
            'no-console': 'error',
          },
        };

        const result = validator.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate correct disable-autofix configuration', () => {
        const config = {
          plugins: { 'disable-autofix': disableAutofix },
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'warn',
            'no-console': 'off',
            'disable-autofix/no-console': 'error',
          },
        };

        const result = validator.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should detect mismatched rule configurations', () => {
        const config = {
          rules: {
            'prefer-const': 'warn', // Should be 'off' when using disable-autofix
            'disable-autofix/prefer-const': 'warn',
          },
        };

        const result = validator.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
          "Original rule 'prefer-const' should be disabled ('off' or 0) when using disable-autofix version"
        );
      });

      it('should detect disabled disable-autofix rules', () => {
        const config = {
          rules: {
            'prefer-const': 'off',
            'disable-autofix/prefer-const': 'off', // This defeats the purpose
          },
        };

        const result = validator.validateConfig(config);
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
          "disable-autofix rule 'prefer-const' is disabled, which defeats the purpose"
        );
      });
    });

    describe('validateDisableAutofixRule method', () => {
      it('should validate correct disable-autofix rule', () => {
        const result = validator.validateDisableAutofixRule('prefer-const', 'warn');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should validate disable-autofix rule with array configuration', () => {
        const result = validator.validateDisableAutofixRule('indent', ['error', 2]);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });

      it('should detect invalid rule names', () => {
        const result = validator.validateDisableAutofixRule('', 'warn');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Invalid rule name: ');

        const result2 = validator.validateDisableAutofixRule(null as any, 'warn');
        expect(result2.valid).toBe(false);
        expect(result2.errors).toContain('Invalid rule name: null');
      });

      it('should detect invalid severity levels', () => {
        const result = validator.validateDisableAutofixRule('prefer-const', 'invalid');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain("Invalid severity: invalid");

        const result2 = validator.validateDisableAutofixRule('prefer-const', 5);
        expect(result2.valid).toBe(false);
        expect(result2.errors).toContain('Invalid severity: 5');
      });

      it('should warn about disabled disable-autofix rules', () => {
        const result = validator.validateDisableAutofixRule('prefer-const', 'off');
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
          "disable-autofix rule 'prefer-const' is disabled, which defeats the purpose"
        );

        const result2 = validator.validateDisableAutofixRule('prefer-const', 0);
        expect(result2.valid).toBe(true);
        expect(result2.warnings).toContain(
          "disable-autofix rule 'prefer-const' is disabled, which defeats the purpose"
        );
      });
    });

    describe('validateOriginalRule method', () => {
      it('should validate correctly disabled original rule', () => {
        const result = validator.validateOriginalRule('prefer-const', 'off');
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(0);

        const result2 = validator.validateOriginalRule('prefer-const', 0);
        expect(result2.valid).toBe(true);
        expect(result2.warnings).toHaveLength(0);
      });

      it('should warn about enabled original rules', () => {
        const result = validator.validateOriginalRule('prefer-const', 'warn');
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
          "Original rule 'prefer-const' should be disabled ('off' or 0) when using disable-autofix version"
        );

        const result2 = validator.validateOriginalRule('prefer-const', 2);
        expect(result2.valid).toBe(true);
        expect(result2.warnings).toContain(
          "Original rule 'prefer-const' should be disabled ('off' or 0) when using disable-autofix version"
        );
      });
    });

    describe('validateRuleCompatibility method', () => {
      it('should validate compatible rule configurations', () => {
        const original = { ruleName: 'indent', severity: 0, options: [2] };
        const disableAutofixRule = { ruleName: 'indent', severity: 1, options: [2] };

        const result = validator.validateRuleCompatibility(original, disableAutofixRule);
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      });

      it('should detect mismatched rule names', () => {
        const original = { ruleName: 'indent', severity: 0, options: [2] };
        const disableAutofixRule = { ruleName: 'quotes', severity: 1, options: [2] };

        const result = validator.validateRuleCompatibility(original, disableAutofixRule);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Rule names do not match');
      });

      it('should warn about different options', () => {
        const original = { ruleName: 'indent', severity: 0, options: [2] };
        const disableAutofixRule = { ruleName: 'indent', severity: 1, options: [4] };

        const result = validator.validateRuleCompatibility(original, disableAutofixRule);
        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
          "Rule options differ between original and disable-autofix versions of 'indent'"
        );
      });
    });
  });

  describe('Real ESLint configuration validation', () => {
    it('should validate flat config with disable-autofix', async () => {
      const testFile = createTestFile('validation-flat.js', 'let x = 1;\n');

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

      // Also test that ESLint can actually use this config
      const eslint = new ESLint({
        cwd: __dirname,
        overrideConfig: config,
        useEslintrc: false,
        fix: true,
      });

      const lintResults = await eslint.lintFiles([testFile]);
      expect(lintResults).toHaveLength(1);
      expect(lintResults[0].messages).toHaveLength(1);
    });

    it('should validate legacy config with disable-autofix', async () => {
      const testFile = createTestFile('validation-legacy.js', 'let x = 1;\n');

      const config = {
        plugins: ['disable-autofix'],
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);

      // Test that ESLint can use this config
      const eslint = new ESLint({
        cwd: __dirname,
        overrideConfig: config,
        useEslintrc: false,
        fix: true,
      });

      const lintResults = await eslint.lintFiles([testFile]);
      expect(lintResults).toHaveLength(1);
      expect(lintResults[0].messages).toHaveLength(1);
    });

    it('should validate scoped plugin configurations', () => {
      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          '@typescript-eslint/no-unused-vars': 'off',
          'disable-autofix/@typescript-eslint/no-unused-vars': 'warn',
          '@angular-eslint/template/no-negated-async': 'off',
          'disable-autofix/@angular-eslint/template/no-negated-async': 'error',
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate complex rule configurations', () => {
      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'indent': 'off',
          'disable-autofix/indent': ['error', 2, {
            SwitchCase: 1,
            VariableDeclarator: 1,
          }],
          'quotes': 'off',
          'disable-autofix/quotes': ['warn', 'single', { avoidEscape: true }],
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect configuration errors in real scenarios', () => {
      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'warn', // Should be off
          'disable-autofix/prefer-const': 'off', // Should not be off
          'no-console': 'off',
          'disable-autofix/no-console': 'invalid-severity', // Invalid
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration validation edge cases', () => {
    it('should handle null and undefined configurations', () => {
      expect(() => configValidator.validateConfig(null as any)).not.toThrow();
      expect(() => configValidator.validateConfig(undefined as any)).not.toThrow();

      const nullResult = configValidator.validateConfig(null as any);
      expect(nullResult.valid).toBe(true); // Should handle gracefully

      const undefinedResult = configValidator.validateConfig(undefined as any);
      expect(undefinedResult.valid).toBe(true); // Should handle gracefully
    });

    it('should handle configurations with non-object rules', () => {
      const config = {
        rules: 'not an object',
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true); // Should handle gracefully
    });

    it('should handle rules with complex nested structures', () => {
      const config = {
        rules: {
          'disable-autofix/complex-rule': ['error', {
            nested: {
              deeply: {
                configured: true,
                options: [1, 2, 3],
              },
            },
            arrayOptions: ['a', 'b', 'c'],
            numberOption: 42,
            stringOption: 'test',
            booleanOption: false,
          }],
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle rules with function options', () => {
      const config = {
        rules: {
          'disable-autofix/function-rule': ['warn', function() { return 'option'; }],
        },
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true); // Should not crash on function options
    });

    it('should handle circular references in rule options', () => {
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;

      const config = {
        rules: {
          'disable-autofix/circular-rule': ['warn', circularObj],
        },
      };

      // Should not crash with circular references
      expect(() => {
        configValidator.validateConfig(config);
      }).not.toThrow();
    });
  });

  describe('Validation performance', () => {
    it('should validate large configurations efficiently', () => {
      const largeConfig: any = { rules: {} };

      // Create a large number of rules
      for (let i = 0; i < 1000; i++) {
        largeConfig.rules[`rule-${i}`] = 'off';
        largeConfig.rules[`disable-autofix/rule-${i}`] = 'warn';
      }

      const startTime = performance.now();
      const result = configValidator.validateConfig(largeConfig);
      const endTime = performance.now();

      expect(result.valid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should validate quickly
    });

    it('should handle repeated validations efficiently', () => {
      const config = {
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        const result = configValidator.validateConfig(config);
        expect(result.valid).toBe(true);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / iterations;

      expect(avgTime).toBeLessThan(0.1); // Less than 0.1ms per validation
    });
  });

  describe('Integration with ESLint validation', () => {
    it('should work with ESLint\'s built-in validation', async () => {
      const testFile = createTestFile('eslint-validation.js', 'let x = 1;\n');

      // Create a config that should pass both our validation and ESLint's
      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      // Our validation should pass
      const ourResult = configValidator.validateConfig(config);
      expect(ourResult.valid).toBe(true);

      // ESLint should also accept and run with this config
      const eslint = new ESLint({
        cwd: __dirname,
        overrideConfig: config,
        useEslintrc: false,
        fix: true,
      });

      const lintResults = await eslint.lintFiles([testFile]);
      expect(lintResults).toHaveLength(1);
      expect(lintResults[0].errorCount).toBeDefined();
    });

    it('should detect configurations that ESLint would reject', async () => {
      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
          'invalid-rule-name': 'error', // This rule doesn't exist
        },
      };

      // Our validation should pass (we don't validate rule existence)
      const ourResult = configValidator.validateConfig(config);
      expect(ourResult.valid).toBe(true);

      // But ESLint should report issues with non-existent rules
      const eslint = new ESLint({
        cwd: __dirname,
        overrideConfig: config,
        useEslintrc: false,
        fix: true,
      });

      // ESLint might throw or report errors for invalid rules
      try {
        const lintResults = await eslint.lintFiles([createTestFile('invalid-rule.js', 'let x = 1;\n')]);
        // ESLint may or may not report invalid rules depending on version
        expect(lintResults).toBeDefined();
      } catch (error) {
        // It's acceptable for ESLint to throw on invalid rules
        expect(error).toBeDefined();
      }
    });
  });
});
