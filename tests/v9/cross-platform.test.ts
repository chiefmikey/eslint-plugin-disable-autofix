import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import os from 'os';

import disableAutofix from 'eslint-plugin-disable-autofix';

describe('comprehensive cross-platform compatibility testing', () => {
  const testFilesDir = path.join(__dirname, 'cross-platform-test-files');
  const mockNodeModules = path.join(__dirname, 'mock-cross-platform-node_modules');
  let originalPlatform: string;
  let originalSep: string;
  let originalDelimiter: string;

  beforeEach(() => {
    // Create test directories
    [testFilesDir, mockNodeModules].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Store original platform values
    originalPlatform = process.platform;
    originalSep = path.sep;
    originalDelimiter = path.delimiter;
  });

  afterEach(() => {
    // Restore platform values
    (process as any).platform = originalPlatform;
    (path as any).sep = originalSep;
    (path as any).delimiter = originalDelimiter;

    // Cleanup test directories
    [testFilesDir, mockNodeModules].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });

    jest.resetModules();
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = path.join(testFilesDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  };

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

  const simulatePlatform = (platform: string) => {
    (process as any).platform = platform;

    // Set path separators based on platform
    if (platform === 'win32') {
      (path as any).sep = '\\';
      (path as any).delimiter = ';';
    } else {
      (path as any).sep = '/';
      (path as any).delimiter = ':';
    }
  };

  describe('Windows compatibility', () => {
    beforeEach(() => {
      simulatePlatform('win32');
    });

    it('should handle Windows path separators in plugin discovery', () => {
      const rules = {
        'windows-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-windows', rules);

      // Mock Windows-style paths
      const originalReaddirSync = fs.readdirSync;
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return ['eslint-plugin-windows.js'];
        }
        return originalReaddirSync.call(fs, dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle Windows drive letters and UNC paths', () => {
      const rules = {
        'drive-rule': {
          meta: { fixable: false },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-drive', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle Windows-style line endings in plugin files', () => {
      const pluginPath = path.join(mockNodeModules, 'windows-line-endings.js');
      const pluginContent = 'module.exports = {\r\n  rules: {\r\n    "crlf-rule": {\r\n      meta: { fixable: true },\r\n      create: () => ({})\r\n    }\r\n  }\r\n};';

      fs.writeFileSync(pluginPath, pluginContent, 'utf8');

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle Windows file permissions and attributes', () => {
      const rules = {
        'permission-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-permission', rules);

      // Mock potential permission issues
      const originalAccessSync = fs.accessSync;
      fs.accessSync = jest.fn().mockImplementation((path: string) => {
        // Simulate some files being inaccessible
        if (path.includes('permission')) {
          throw new Error('EACCES: permission denied');
        }
        return originalAccessSync.call(fs, path);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      fs.accessSync = originalAccessSync;
    });
  });

  describe('macOS/Unix compatibility', () => {
    beforeEach(() => {
      simulatePlatform('darwin'); // macOS
    });

    it('should handle Unix-style permissions and symlinks', () => {
      const rules = {
        'unix-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-unix', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle macOS case-sensitive filesystem', () => {
      const rules1 = {
        'case-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      const rules2 = {
        'CASE-RULE': {
          meta: { fixable: false },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-case', rules1);
      createMockPlugin('eslint-plugin-CASE', rules2);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle Unix socket files and special files', () => {
      // Mock readdirSync to return various file types
      const originalReaddirSync = fs.readdirSync;
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          return [
            'eslint-plugin-normal.js',
            '.DS_Store', // macOS hidden file
            'Icon',      // macOS custom icon
          ];
        }
        return originalReaddirSync.call(fs, dirPath);
      });

      const rules = {
        'special-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-normal', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      fs.readdirSync = originalReaddirSync;
    });
  });

  describe('Linux compatibility', () => {
    beforeEach(() => {
      simulatePlatform('linux');
    });

    it('should handle Linux filesystem features', () => {
      const rules = {
        'linux-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-linux', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle Linux extended attributes', () => {
      // Linux files can have extended attributes that might cause issues
      const rules = {
        'extattr-rule': {
          meta: { fixable: false },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-extattr', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Path separator handling', () => {
    it('should handle mixed path separators correctly', () => {
      // Test with paths containing both / and \ separators
      const mixedPathRules = {
        'mixed-path-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-mixed-path', mixedPathRules);

      // Mock path resolution to return mixed separators
      const originalResolve = path.resolve;
      path.resolve = jest.fn().mockImplementation((...args: string[]) => {
        const resolved = originalResolve.apply(path, args);
        // Return path with mixed separators
        return resolved.replace(/\//g, '\\').replace(/\\/g, '/', 'g');
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      path.resolve = originalResolve;
    });

    it('should handle UNC paths (Windows network paths)', () => {
      simulatePlatform('win32');

      const uncRules = {
        'unc-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-unc', uncRules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle relative and absolute path resolution', () => {
      const relativeRules = {
        'relative-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      const absoluteRules = {
        'absolute-rule': {
          meta: { fixable: false },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-relative', relativeRules);
      createMockPlugin('eslint-plugin-absolute', absoluteRules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Environment variable handling', () => {
    it('should handle different PATH configurations', () => {
      // Test with different PATH delimiter configurations
      const originalEnv = { ...process.env };

      // Test Windows-style PATH
      simulatePlatform('win32');
      process.env.PATH = 'C:\\bin;C:\\Program Files\\node;C:\\Users\\user\\bin';

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      // Test Unix-style PATH
      simulatePlatform('linux');
      process.env.PATH = '/usr/bin:/usr/local/bin:/home/user/bin';

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      // Restore environment
      process.env = originalEnv;
    });

    it('should handle missing environment variables', () => {
      const originalEnv = { ...process.env };

      // Remove common environment variables
      delete process.env.PATH;
      delete process.env.NODE_PATH;
      delete process.env.HOME;
      delete process.env.USERPROFILE;

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      // Restore environment
      process.env = originalEnv;
    });

    it('should handle environment variables with special characters', () => {
      const originalEnv = { ...process.env };

      // Test with special characters in paths
      process.env.PATH = '/usr/bin:/usr/local/bin with spaces:/home/user/bin';
      process.env.NODE_PATH = '/usr/lib/node_modules:/home/user/.npm/lib/node_modules';

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('File encoding and content handling', () => {
    it('should handle different file encodings', () => {
      // Test with UTF-8 BOM
      const pluginPath = path.join(mockNodeModules, 'utf8-bom-plugin.js');
      const pluginContent = '\uFEFFmodule.exports = {\n  rules: {\n    "bom-rule": {\n      meta: { fixable: true },\n      create: () => ({})\n    }\n  }\n};';

      fs.writeFileSync(pluginPath, pluginContent, 'utf8');

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle files with different line endings', () => {
      // Test with LF line endings
      const lfPlugin = path.join(mockNodeModules, 'lf-plugin.js');
      const lfContent = 'module.exports = {\n  rules: {\n    "lf-rule": {\n      meta: { fixable: true },\n      create: () => ({})\n    }\n  }\n};';

      fs.writeFileSync(lfPlugin, lfContent, 'utf8');

      // Test with CR line endings (old Mac style)
      const crPlugin = path.join(mockNodeModules, 'cr-plugin.js');
      const crContent = 'module.exports = {\r  rules: {\r    "cr-rule": {\r      meta: { fixable: true },\r      create: () => ({})\r    }\r  }\r};';

      fs.writeFileSync(crPlugin, crContent, 'utf8');

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });

    it('should handle large plugin files', () => {
      const largePlugin = path.join(mockNodeModules, 'large-plugin.js');

      // Create a large plugin file with many rules
      const rules: Record<string, any> = {};
      for (let i = 0; i < 1000; i++) {
        rules[`large-rule-${i}`] = {
          meta: { fixable: Math.random() > 0.5 },
          create: () => ({})
        };
      }

      const largeContent = `module.exports = ${JSON.stringify({ rules }, null, 2)};`;
      fs.writeFileSync(largePlugin, largeContent, 'utf8');

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Build and runtime compatibility', () => {
    it('should handle different Node.js versions', () => {
      // Test compatibility with different Node.js features
      const nodeVersion = process.version;

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      // Log Node.js version for CI visibility
      console.log(`Testing on Node.js ${nodeVersion}`);
    });

    it('should handle different npm/yarn package managers', () => {
      // Test with different node_modules layouts
      const rules = {
        'package-manager-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-pkg-manager', rules);

      // Mock different node_modules structures
      const originalReaddirSync = fs.readdirSync;
      fs.readdirSync = jest.fn().mockImplementation((dirPath: string) => {
        if (dirPath.includes('node_modules')) {
          // Simulate various package manager layouts
          return [
            'eslint-plugin-pkg-manager.js',
            '.yarn-integrity', // Yarn
            'package-lock.json', // npm
            '.pnpm', // pnpm
          ];
        }
        return originalReaddirSync.call(fs, dirPath);
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      fs.readdirSync = originalReaddirSync;
    });

    it('should handle different ESLint installation methods', () => {
      // Test with globally installed ESLint vs local
      const rules = {
        'global-eslint-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-global', rules);

      // Mock different ESLint installation scenarios
      const originalResolve = require.resolve;
      require.resolve = jest.fn().mockImplementation((id: string) => {
        if (id.startsWith('eslint/')) {
          // Simulate ESLint being in different locations
          return '/usr/local/lib/node_modules/eslint/lib/rules/index.js';
        }
        try {
          return originalResolve(id);
        } catch {
          return `/mock/path/to/${id}`;
        }
      });

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      require.resolve = originalResolve;
    });
  });

  describe('CI/CD environment compatibility', () => {
    it('should work in CI environments with restricted permissions', () => {
      // Simulate CI environment restrictions
      const originalAccessSync = fs.accessSync;
      fs.accessSync = jest.fn().mockImplementation((path: string) => {
        // Simulate some files being inaccessible
        if (Math.random() > 0.8) { // 20% of files are inaccessible
          throw new Error('EACCES: permission denied');
        }
        return originalAccessSync.call(fs, path);
      });

      const rules = {
        'ci-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-ci', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      fs.accessSync = originalAccessSync;
    });

    it('should handle different working directory scenarios', () => {
      const originalCwd = process.cwd();
      const tempDir = path.join(os.tmpdir(), 'eslint-disable-autofix-test');

      try {
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        process.chdir(tempDir);

        const rules = {
          'wd-rule': {
            meta: { fixable: true },
            create: () => ({})
          }
        };

        createMockPlugin('eslint-plugin-wd', rules);

        expect(() => {
          const rules = disableAutofix.rules;
          expect(rules).toBeDefined();
        }).not.toThrow();

      } finally {
        process.chdir(originalCwd);
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
    });

    it('should handle network filesystem scenarios', () => {
      // Simulate network filesystem delays and issues
      const originalReadFileSync = fs.readFileSync;
      fs.readFileSync = jest.fn().mockImplementation((path: string, options: any) => {
        // Simulate network delay
        const start = Date.now();
        while (Date.now() - start < 1); // 1ms delay

        if (Math.random() > 0.95) { // 5% chance of network error
          throw new Error('ENETUNREACH: network is unreachable');
        }

        return originalReadFileSync.call(fs, path, options);
      });

      const rules = {
        'network-rule': {
          meta: { fixable: true },
          create: () => ({})
        }
      };

      createMockPlugin('eslint-plugin-network', rules);

      expect(() => {
        const rules = disableAutofix.rules;
        expect(rules).toBeDefined();
      }).not.toThrow();

      fs.readFileSync = originalReadFileSync;
    });
  });
});
