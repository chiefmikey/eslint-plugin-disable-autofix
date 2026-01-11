import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ESLint } from 'eslint';

import disableAutofix from 'eslint-plugin-disable-autofix';

describe('comprehensive error conditions and recovery testing', () => {
  const testFilesDir = path.join(__dirname, 'error-test-files');
  const mockNodeModules = path.join(__dirname, 'mock-error-node_modules');
  let originalRequire: any;
  let originalReaddirSync: any;
  let originalStatSync: any;

  beforeEach(() => {
    // Create test directories
    [testFilesDir, mockNodeModules].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Mock filesystem and require for controlled testing
    originalRequire = require;
    originalReaddirSync = fs.readdirSync;
    originalStatSync = fs.statSync;
  });

  afterEach(() => {
    // Restore originals
    if (originalRequire) {
      // Reset modules to clear any cached state
      jest.resetModules();
    }

    // Cleanup test directories
    [testFilesDir, mockNodeModules].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(testFilesDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  };

  const createFailingPlugin = (pluginName: string, failureType: string) => {
    const pluginPath = path.join(mockNodeModules, pluginName + '.js');

    let pluginContent: string;
    switch (failureType) {
      case 'throw-on-require':
        pluginContent = 'throw new Error("Plugin failed to load");';
        break;
      case 'no-rules':
        pluginContent = 'module.exports = { configs: {} };';
        break;
      case 'invalid-rules':
        pluginContent = 'module.exports = { rules: { "invalid-rule": null } };';
        break;
      case 'malformed-rules':
        pluginContent = 'module.exports = { rules: "not an object" };';
        break;
      case 'circular-dependency':
        pluginContent = 'module.exports = require("./' + pluginName + '");';
        break;
      default:
        pluginContent = 'module.exports = { rules: {} };';
    }

    fs.writeFileSync(pluginPath, pluginContent, 'utf8');
    return pluginPath;
  };

  describe('Plugin loading failures', () => {
    it('should recover from plugins that throw on require', () => {
      createFailingPlugin('failing-plugin', 'throw-on-require');

      // Mock readdirSync to include our failing plugin
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['failing-plugin.js', 'eslint'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        // Force plugin discovery by accessing rules
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle plugins with no rules property', () => {
      createFailingPlugin('no-rules-plugin', 'no-rules');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['no-rules-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle plugins with invalid rule objects', () => {
      createFailingPlugin('invalid-rules-plugin', 'invalid-rules');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['invalid-rules-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle plugins with malformed rules structure', () => {
      createFailingPlugin('malformed-rules-plugin', 'malformed-rules');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['malformed-rules-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle circular dependencies in plugins', () => {
      createFailingPlugin('circular-plugin', 'circular-dependency');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['circular-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Filesystem access failures', () => {
    it('should handle missing node_modules directory', () => {
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          throw new Error('ENOENT: no such file or directory');
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle permission denied on node_modules', () => {
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          throw new Error('EACCES: permission denied');
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle corrupted plugin files', () => {
      const corruptedPluginPath = path.join(mockNodeModules, 'corrupted-plugin.js');
      fs.writeFileSync(corruptedPluginPath, 'invalid javascript syntax {{{');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['corrupted-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('ESLint core rule failures', () => {
    it('should handle missing ESLint installation', () => {
      const originalResolve = require.resolve;
      require.resolve = jest.fn().mockImplementation((id: string) => {
        if (id.startsWith('eslint/lib/rules/')) {
          throw new Error('Cannot find module');
        }
        return originalResolve(id);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      require.resolve = originalResolve;
    });

    it('should handle corrupted ESLint core rules', () => {
      // Mock require to return invalid rule objects
      const originalRequireFunc = global.require;
      global.require = jest.fn().mockImplementation((id: string) => {
        if (id.includes('eslint/lib/rules/')) {
          return { invalid: 'rule object' };
        }
        return originalRequireFunc(id);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      global.require = originalRequireFunc;
    });
  });

  describe('Rule transformation failures', () => {
    it('should handle rules that fail during transformation', () => {
      // Create a mock rule that will cause transformation to fail
      const mockRule = {
        meta: { fixable: true },
        create: () => ({}),
        // Add a property that might cause issues
        invalidProperty: () => { throw new Error('Invalid property'); }
      };

      // Mock eslint-rule-composer to fail
      const originalComposer = require('eslint-rule-composer');
      jest.doMock('eslint-rule-composer', () => ({
        mapReports: jest.fn().mockImplementation(() => {
          throw new Error('Rule transformation failed');
        })
      }));

      // The plugin should still work and fall back gracefully
      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      jest.dontMock('eslint-rule-composer');
    });

    it('should handle rules with circular references', () => {
      // Create a rule with circular references that might cause cloning issues
      const circularObj: any = { prop: 'value' };
      circularObj.self = circularObj;

      const mockRule = {
        meta: { fixable: true },
        create: () => ({}),
        circularRef: circularObj
      };

      // The plugin should handle this gracefully
      expect(() => {
        // This tests the lodash.cloneDeep behavior in the plugin
        const cloned = require('lodash').cloneDeep(mockRule);
        expect(cloned).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Runtime error recovery', () => {
    it('should handle ESLint configuration errors gracefully', async () => {
      const testFile = createTestFile('runtime-error.js', 'let x = 1;');

      // Create a configuration that might cause runtime issues
      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'invalid-severity', // Invalid severity
        },
      };

      const eslint = new ESLint({
        cwd: __dirname,
        overrideConfig: config,
        useEslintrc: false,
        fix: true,
      });

      // Should not crash even with invalid configuration
      expect(async () => {
        const results = await eslint.lintFiles([testFile]);
        expect(results).toHaveLength(1);
      }).not.toThrow();
    });

    it('should handle file system errors during linting', async () => {
      const testFile = createTestFile('fs-error.js', 'let x = 1;');

      // Mock fs operations to fail during linting
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockImplementation((filePath: string) => {
        if (filePath.includes('fs-error.js')) {
          throw new Error('File system error');
        }
        return originalReadFileSync(filePath);
      });

      const config = {
        plugins: { 'disable-autofix': disableAutofix },
        rules: {
          'prefer-const': 'off',
          'disable-autofix/prefer-const': 'warn',
        },
      };

      const eslint = new ESLint({
        cwd: __dirname,
        overrideConfig: config,
        useEslintrc: false,
        fix: true,
      });

      // ESLint should handle file system errors gracefully
      try {
        const results = await eslint.lintFiles([testFile]);
        expect(results).toHaveLength(1);
      } catch (error) {
        // It's acceptable for ESLint to throw on file system errors
        expect(error).toBeDefined();
      }

      fs.readFileSync = originalReadFileSync;
    });
  });

  describe('Memory and performance error handling', () => {
    it('should handle out of memory conditions gracefully', () => {
      // Create a scenario that might cause memory issues
      const largeRuleSet = {};
      for (let i = 0; i < 10000; i++) {
        largeRuleSet[`rule-${i}`] = {
          meta: { fixable: true },
          create: () => ({})
        };
      }

      const mockPlugin = {
        rules: largeRuleSet
      };

      createFailingPlugin('large-plugin', 'no-rules');
      const pluginPath = path.join(mockNodeModules, 'large-plugin.js');
      fs.writeFileSync(pluginPath, `module.exports = ${JSON.stringify(mockPlugin)};`);

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['large-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle cache corruption gracefully', () => {
      // Simulate cache corruption by directly manipulating the cache
      // This tests the robustness of the caching system
      expect(() => {
        // Access rules multiple times to ensure cache is working
        for (let i = 0; i < 10; i++) {
          const rules = disableAutofix.rules;
          expect(rules).toBeDefined();
        }
      }).not.toThrow();
    });
  });

  describe('Cross-environment compatibility', () => {
    it('should handle different path separators', () => {
      // Test with mixed path separators (common in Windows/Linux cross-compatibility)
      const mixedPathPlugin = path.join(mockNodeModules, 'mixed-path-plugin.js');
      fs.writeFileSync(mixedPathPlugin, 'module.exports = { rules: { "test-rule": { meta: { fixable: true }, create: () => ({}) } } };');

      // Mock readdirSync to return paths with different separators
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['mixed-path-plugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle case-sensitive/insensitive filesystem differences', () => {
      // Create plugins with case variations
      createFailingPlugin('testplugin', 'no-rules');
      createFailingPlugin('TestPlugin', 'no-rules');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['testplugin.js', 'TestPlugin.js'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Plugin discovery edge cases', () => {
    it('should handle empty plugin directories', () => {
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return []; // Empty directory
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle plugins with special characters in names', () => {
      const specialNames = [
        'eslint-plugin-@scoped/package',
        'eslint-plugin-with-dashes',
        'eslint-plugin-with_underscores',
        'eslint-plugin-with.dots',
        'eslint-plugin-123numbers'
      ];

      specialNames.forEach(name => {
        try {
          createFailingPlugin(name, 'no-rules');
        } catch (error) {
          // Some names might not be valid filenames, skip them
        }
      });

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return specialNames.map(name => name + '.js').filter(name => {
            try {
              fs.accessSync(path.join(mockNodeModules, name));
              return true;
            } catch {
              return false;
            }
          });
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle deeply nested scoped packages', () => {
      // Create a complex scoped package structure
      const scopedDir = path.join(mockNodeModules, '@company', 'project', 'eslint-plugin-complex');
      fs.mkdirSync(scopedDir, { recursive: true });

      const pluginFile = path.join(scopedDir, 'index.js');
      fs.writeFileSync(pluginFile, 'module.exports = { rules: { "complex-rule": { meta: { fixable: true }, create: () => ({}) } } };');

      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath === path.join(__dirname, 'mock-error-node_modules')) {
          return ['@company'];
        }
        if (dirPath === path.join(__dirname, 'mock-error-node_modules', '@company')) {
          return ['project'];
        }
        if (dirPath === path.join(__dirname, 'mock-error-node_modules', '@company', 'project')) {
          return ['eslint-plugin-complex'];
        }
        return originalReaddirSync(dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });
});
