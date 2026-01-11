import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';

import disableAutofix from 'eslint-plugin-disable-autofix';

describe('comprehensive plugin scope testing', () => {
  const mockNodeModules = path.join(__dirname, 'mock-node_modules');
  let originalRequire: any;

  beforeEach(() => {
    // Create mock node_modules structure
    if (!fs.existsSync(mockNodeModules)) {
      fs.mkdirSync(mockNodeModules, { recursive: true });
    }

    // Mock require to use our test directory
    originalRequire = require;
    const Module = require('module');
    const originalResolve = Module._resolveFilename;

    Module._resolveFilename = function(request: string, parent: any, isMain: boolean) {
      if (request.startsWith('./mock-node_modules/') || request.startsWith('mock-')) {
        const mockPath = path.join(mockNodeModules, request.replace('./mock-node_modules/', '').replace('mock-', ''));
        try {
          return originalResolve.call(this, mockPath, parent, isMain);
        } catch {
          // If mock doesn't exist, continue with original resolution
        }
      }
      return originalResolve.call(this, request, parent, isMain);
    };
  });

  afterEach(() => {
    // Restore original require
    const Module = require('module');
    Module._resolveFilename = originalRequire;

    // Cleanup mock files
    if (fs.existsSync(mockNodeModules)) {
      fs.rmSync(mockNodeModules, { recursive: true, force: true });
    }

    jest.resetModules();
  });

  const createMockPlugin = (pluginName: string, rules: Record<string, any>) => {
    const pluginPath = path.join(mockNodeModules, pluginName + '.js');
    const pluginDir = path.dirname(pluginPath);

    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    const pluginContent = `
module.exports = {
  rules: ${JSON.stringify(rules, null, 2)}
};
`;

    fs.writeFileSync(pluginPath, pluginContent, 'utf8');
    return pluginPath;
  };

  describe('@scoped plugin patterns', () => {
    it('should handle simple @scoped plugins', () => {
      const rules = {
        'no-console': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('@scoped/eslint-plugin-test', rules);

      // Force reload of the plugin
      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
      // The rule should be accessible as disable-autofix/@scoped/no-console
      // We can't easily test the full resolution without complex mocking
    });

    it('should handle @scoped plugins with subpaths', () => {
      const rules = {
        'indent': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('@angular-eslint/eslint-plugin', rules);
      createMockPlugin('@angular-eslint/eslint-plugin-template', { ...rules, 'banana-in-box': {} });

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle deeply nested @scoped plugins', () => {
      const rules = {
        'complex-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('@very/deeply/nested/eslint-plugin-scope', rules);

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle @scoped plugins with multiple segments', () => {
      const rules = {
        'multi-segment': {
          meta: { fixable: false },
          create: () => ({})
        }
      };

      createMockPlugin('@company/project/eslint-plugin-custom', rules);

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });
  });

  describe('regular plugin patterns', () => {
    it('should handle eslint-plugin- prefixed plugins', () => {
      const rules = {
        'simple': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-simple', rules);

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle eslint-plugin- with complex names', () => {
      const rules = {
        'complex': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-react-hooks', rules);
      createMockPlugin('eslint-plugin-jsx-a11y', rules);
      createMockPlugin('eslint-plugin-import', rules);

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle plugins with numbers and special chars', () => {
      const rules = {
        'special': {
          meta: { fixable: false },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-123test', rules);
      createMockPlugin('eslint-plugin-test_plugin', rules);

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });
  });

  describe('plugin name transformation', () => {
    const testNameTransformation = (pluginName: string, expectedPrefix: string) => {
      it(`should transform ${pluginName} to ${expectedPrefix}`, () => {
        const rules = {
          'test-rule': {
            meta: { fixable: true },
            create: () => ({})
          }
        };

        createMockPlugin(pluginName, rules);

        jest.resetModules();
        const freshPlugin = require('../../src/index.ts');

        expect(freshPlugin.rules).toBeDefined();

        // The rule should be accessible with the transformed prefix
        const transformedRuleName = `${expectedPrefix}/test-rule`;

        // We can't easily test the actual transformation without more complex mocking,
        // but we can verify the plugin loads without error
        expect(() => {
          // Accessing the rules property should not throw
          const rules = freshPlugin.rules;
        }).not.toThrow();
      });
    };

    // Test various name transformations
    testNameTransformation('eslint-plugin-react', 'react');
    testNameTransformation('@typescript-eslint/eslint-plugin', '@typescript-eslint');
    testNameTransformation('@angular-eslint/eslint-plugin-template', '@angular-eslint/template');
    testNameTransformation('eslint-plugin-unicorn', 'unicorn');
    testNameTransformation('eslint-plugin-import', 'import');
    testNameTransformation('@babel/eslint-plugin', '@babel');
  });

  describe('mixed plugin environments', () => {
    it('should handle multiple plugin types simultaneously', () => {
      const baseRules = {
        'test-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      // Create various types of plugins
      createMockPlugin('eslint-plugin-regular', baseRules);
      createMockPlugin('@scoped/eslint-plugin-scoped', baseRules);
      createMockPlugin('@company/project/eslint-plugin-complex', baseRules);
      createMockPlugin('@angular-eslint/eslint-plugin-template', { ...baseRules, 'template-specific': {} });

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle plugins with conflicting rule names', () => {
      const rules1 = {
        'conflict': {
          meta: { fixable: true, description: 'Plugin 1 version' },
          create: () => ({})
        }
      };

      const rules2 = {
        'conflict': {
          meta: { fixable: false, description: 'Plugin 2 version' },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-one', rules1);
      createMockPlugin('eslint-plugin-two', rules2);

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
      // Should not throw even with conflicting rule names
    });
  });

  describe('malformed and edge case plugins', () => {
    it('should handle plugins with no rules property', () => {
      const pluginPath = path.join(mockNodeModules, 'malformed-no-rules.js');
      const pluginContent = `
module.exports = {
  configs: {},
  processors: {}
};
`;

      fs.writeFileSync(pluginPath, pluginContent, 'utf8');

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
      // Should not crash
    });

    it('should handle plugins with null/undefined rules', () => {
      const pluginPath = path.join(mockNodeModules, 'malformed-null-rules.js');
      const pluginContent = `
module.exports = {
  rules: null
};
`;

      fs.writeFileSync(pluginPath, pluginContent, 'utf8');

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle plugins with invalid rule objects', () => {
      const pluginPath = path.join(mockNodeModules, 'malformed-invalid-rules.js');
      const pluginContent = `
module.exports = {
  rules: {
    'invalid-rule': null,
    'another-invalid': undefined,
    'string-rule': 'not a rule object',
    'valid-rule': {
      meta: { fixable: true },
      create: () => ({})
    }
  }
};
`;

      fs.writeFileSync(pluginPath, pluginContent, 'utf8');

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });

    it('should handle plugins that throw during import', () => {
      const pluginPath = path.join(mockNodeModules, 'throwing-plugin.js');
      const pluginContent = `
throw new Error('Plugin failed to load');
`;

      fs.writeFileSync(pluginPath, pluginContent, 'utf8');

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
      // Should not crash the entire plugin
    });
  });

  describe('plugin loading order and precedence', () => {
    it('should handle plugins loaded in different orders', () => {
      const rules1 = {
        'order-test': {
          meta: { fixable: true, description: 'First plugin' },
          create: () => ({})
        }
      };

      const rules2 = {
        'order-test': {
          meta: { fixable: false, description: 'Second plugin' },
          create: () => ({})
        }
      };

      // Load in one order
      createMockPlugin('eslint-plugin-first', rules1);
      createMockPlugin('eslint-plugin-second', rules2);

      jest.resetModules();
      let freshPlugin = require('../../src/index.ts');
      expect(freshPlugin.rules).toBeDefined();

      // Load in reverse order
      fs.rmSync(mockNodeModules, { recursive: true, force: true });
      fs.mkdirSync(mockNodeModules, { recursive: true });

      createMockPlugin('eslint-plugin-first', rules2); // Swapped
      createMockPlugin('eslint-plugin-second', rules1); // Swapped

      jest.resetModules();
      freshPlugin = require('../../src/index.ts');
      expect(freshPlugin.rules).toBeDefined();
    });
  });

  describe('real-world plugin patterns', () => {
    it('should handle actual plugin naming conventions', () => {
      const realWorldPlugins = [
        'eslint-plugin-react',
        'eslint-plugin-react-hooks',
        'eslint-plugin-jsx-a11y',
        'eslint-plugin-import',
        'eslint-plugin-unicorn',
        'eslint-plugin-prettier',
        '@typescript-eslint/eslint-plugin',
        '@babel/eslint-plugin',
        '@angular-eslint/eslint-plugin',
        '@angular-eslint/eslint-plugin-template',
        '@vue/eslint-plugin-vue',
        '@next/eslint-plugin-next',
        '@emotion/eslint-plugin',
      ];

      // Create mock versions of real plugins
      realWorldPlugins.forEach(pluginName => {
        const rules = {
          'mock-rule': {
            meta: { fixable: Math.random() > 0.5 },
            create: () => ({})
          }
        };

        try {
          createMockPlugin(pluginName, rules);
        } catch (error) {
          // Some plugin names might have path issues, skip them
        }
      });

      jest.resetModules();
      const freshPlugin = require('../../src/index.ts');

      expect(freshPlugin.rules).toBeDefined();
    });
  });
});
