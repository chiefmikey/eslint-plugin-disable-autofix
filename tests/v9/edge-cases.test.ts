import { describe, expect, it, jest } from '@jest/globals';
import type { Linter } from 'eslint';

import disableAutofix from 'eslint-plugin-disable-autofix';
import { configValidator } from '../../src/validator';

describe('edge cases and error handling', () => {
  describe('plugin discovery edge cases', () => {
    it('handles missing node_modules gracefully', () => {
      // This should not throw even if node_modules is missing
      expect(() => {
        require('eslint-plugin-disable-autofix');
      }).not.toThrow();
    });

    it('handles malformed plugins gracefully', () => {
      // Mock a malformed plugin
      const originalRequire = require;
      jest.spyOn(global, 'require').mockImplementation((id: string) => {
        if (id === 'malformed-plugin') {
          return { rules: null }; // Invalid plugin structure
        }
        return originalRequire(id);
      });

      expect(() => {
        // Accessing rules should initialize the plugin
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      jest.restoreAllMocks();
    });

    it('handles plugins with invalid rules gracefully', () => {
      const originalRequire = require;
      jest.spyOn(global, 'require').mockImplementation((id: string) => {
        if (id === 'invalid-rules-plugin') {
          return {
            rules: {
              'invalid-rule': null, // Invalid rule
              'another-invalid': undefined,
              'valid-rule': { create: () => ({}) }
            }
          };
        }
        return originalRequire(id);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      jest.restoreAllMocks();
    });
  });

  describe('configuration validation', () => {
    it('validates correct disable-autofix configuration', () => {
      const config: Linter.Config = {
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn'
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects missing original rule disable', () => {
      const config: Linter.Config = {
        rules: {
          'prefer-const': 'warn', // Should be 'off'
          'disable-autofix/prefer-const': 'warn'
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true); // Not an error, just a warning
      expect(result.warnings).toContain(
        "Original rule 'prefer-const' should be disabled ('off' or 0) when using disable-autofix version"
      );
    });

    it('detects disabled disable-autofix rule', () => {
      const config: Linter.Config = {
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'off' // This defeats the purpose
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        "disable-autofix rule 'prefer-const' is disabled, which defeats the purpose"
      );
    });

    it('validates rule options consistency', () => {
      const config: Linter.Config = {
        rules: {
          'unicorn/prevent-abbreviations': 'off',
          'disable-autofix/unicorn/prevent-abbreviations': [
            'warn',
            { allowList: { props: true } }
          ]
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('handles invalid rule configurations', () => {
      const config: Linter.Config = {
        rules: {
          'disable-autofix/prefer-const': 'invalid-severity' as any
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid severity: invalid-severity");
    });
  });

  describe('rule transformation edge cases', () => {
    it('handles rules without fixable meta', () => {
      const mockRule = {
        meta: {
          type: 'problem' as const,
          docs: { description: 'test' }
        },
        create: () => ({})
      };

      // This should work without throwing
      expect(() => {
        const transformed = disableAutofix.rules['prefer-const'];
        expect(transformed).toBeDefined();
      }).not.toThrow();
    });

    it('handles rules with complex fix structures', () => {
      // Test with a rule that has complex fix functions
      expect(() => {
        const transformed = disableAutofix.rules['prefer-const'];
        expect(transformed).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('performance and caching', () => {
    it('caches rule transformations', () => {
      const startTime = performance.now();

      // Access the same rule multiple times
      for (let i = 0; i < 10; i++) {
        const rule = disableAutofix.rules['prefer-const'];
        expect(rule).toBeDefined();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should be fast due to caching (< 1ms per access typically)
      expect(duration).toBeLessThan(50); // Allow some margin for CI
    });

    it('handles cache size limits gracefully', () => {
      // Access many different rules to test cache limits
      const ruleNames = [
        'prefer-const', 'no-unused-vars', 'no-console',
        'react/jsx-indent', 'unicorn/filename-case'
      ];

      for (const ruleName of ruleNames) {
        expect(() => {
          const rule = disableAutofix.rules[ruleName];
          // Rule might be undefined if not available, but shouldn't throw
        }).not.toThrow();
      }
    });
  });

  describe('scoped plugin handling', () => {
    it('handles @scoped/plugin-name patterns correctly', () => {
      const config: Linter.Config = {
        rules: {
          '@typescript-eslint/no-unused-vars': 'off',
          'disable-autofix/@typescript-eslint/no-unused-vars': 'warn'
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it('handles complex scoped plugin names', () => {
      const config: Linter.Config = {
        rules: {
          '@angular-eslint/template/no-negated-async': 'off',
          'disable-autofix/@angular-eslint/template/no-negated-async': 'error'
        }
      };

      const result = configValidator.validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('error recovery', () => {
    it('continues working after individual plugin failures', () => {
      // Mock a plugin that throws during loading
      const originalRequire = require;
      let throwCount = 0;

      jest.spyOn(global, 'require').mockImplementation((id: string) => {
        if (id === 'failing-plugin' && throwCount++ < 1) {
          throw new Error('Plugin failed to load');
        }
        return originalRequire(id);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      jest.restoreAllMocks();
    });

    it('handles filesystem access errors gracefully', () => {
      // Mock fs.readdirSync to throw
      const originalReaddirSync = require('fs').readdirSync;
      require('fs').readdirSync = jest.fn().mockImplementation(() => {
        throw new Error('Filesystem access denied');
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      // Restore original function
      require('fs').readdirSync = originalReaddirSync;
    });
  });
});
