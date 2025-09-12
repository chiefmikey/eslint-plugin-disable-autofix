import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import type { ESLint } from 'eslint';
import type { Rule, AST, SourceCode } from 'eslint';
import appRoot from 'app-root-path';
import ruleComposer from 'eslint-rule-composer';
import _ from 'lodash';

// Import utility classes
import { PersistentCache } from './utils/cache';
import { RuleStatistics } from './utils/stats';
import { validateRuleConfig } from './utils/testing';

// Remove duplicate function - now imported from utils

/**
 * Interface for an ESLint plugin with rules and an ID
 */
interface EslintPlugin {
  rules: Record<string, Rule.RuleModule>;
  id: string;
}

interface Problem {
  message: string;
  messageId: string | undefined;
  data: object | undefined;
  loc: AST.SourceLocation;
  fix: undefined;
}

interface Metadata {
  sourceCode: SourceCode;
  settings?: object;
  filename: string;
}

type DisabledRules = Record<string, Rule.RuleModule>;

type Predicate<T> = (problem: Problem, metadata: Metadata) => T;

type MapReports = (
  rule: Rule.RuleModule,
  iteratee: Predicate<Problem>,
) => Rule.RuleModule;

interface DisableAutofixPlugin {
  meta: {
    name: string;
    version: string;
    compatibleESLintVersions: string;
    compatibleNodeVersions?: string;
    options?: PluginOptions;
  };
  configs: {
    recommended: {
      plugins: string[];
    };
  };
  rules: DisabledRules;
  processors: Record<string, unknown>;
  flatConfig: ESLint.Plugin;
}

interface RuleCache {
  rule: Rule.RuleModule;
  timestamp: number;
}

interface PluginOptions {
  enableTelemetry?: boolean;
  cacheTimeout?: number;
  includeRules?: string[];
  excludeRules?: string[];
  debug?: boolean;
  persistCache?: boolean;
  trackStats?: boolean;
  validateConfigs?: boolean;
  // New advanced options
  strictMode?: boolean;
  autoDetectPlugins?: boolean;
  customRulePrefix?: string;
  performanceMode?: 'fast' | 'balanced' | 'thorough';
  errorRecovery?: boolean;
  ruleWhitelist?: string[];
  ruleBlacklist?: string[];
}

// Add options handling
const defaultOptions: PluginOptions = {
  enableTelemetry: false,
  cacheTimeout: 3600000,
  debug: false,
  persistCache: false,
  trackStats: false,
  validateConfigs: true,
  // New default options
  strictMode: false,
  autoDetectPlugins: true,
  customRulePrefix: 'disable-autofix',
  performanceMode: 'balanced',
  errorRecovery: true,
  ruleWhitelist: [],
  ruleBlacklist: [],
};

let pluginOptions = { ...defaultOptions };

const configure = (options: Partial<PluginOptions>) => {
  pluginOptions = { ...defaultOptions, ...options };
  if (pluginOptions.debug) {
    process.env.DEBUG = '1';
  }
};

// Enhanced rule filtering with new options
const shouldIncludeRule = (ruleId: string): boolean => {
  // Check blacklist first (highest priority)
  if (pluginOptions.ruleBlacklist?.includes(ruleId)) return false;

  // Check whitelist if provided
  if (
    pluginOptions.ruleWhitelist?.length &&
    !pluginOptions.ruleWhitelist.includes(ruleId)
  ) {
    return false;
  }

  // Legacy exclude rules
  if (pluginOptions.excludeRules?.includes(ruleId)) return false;

  // Legacy include rules
  if (
    pluginOptions.includeRules?.length &&
    !pluginOptions.includeRules.includes(ruleId)
  ) {
    return false;
  }

  return true;
};

// Add telemetry
const telemetry = {
  rulesProcessed: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: [] as string[],
  report() {
    if (!pluginOptions.enableTelemetry) return;
    logger.debug(`
      Rules Processed: ${this.rulesProcessed}
      Cache Hits: ${this.cacheHits}
      Cache Misses: ${this.cacheMisses}
      Errors: ${this.errors.length}
    `);
  },
};

const disabledRules: DisabledRules = {};
const dirname = appRoot.toString();
const nodeModules = 'node_modules/';
const importedPlugins = [];

const map = (ruleComposer as { mapReports: MapReports }).mapReports;

// delete metadata fixable property
const disableMeta = (rule: Rule.RuleModule): Rule.RuleModule => {
  if (rule.meta?.fixable) {
    delete rule.meta.fixable;
  }
  return rule;
};

// delete map reports fix method
const disableFix = (rule: Rule.RuleModule): Rule.RuleModule => {
  const disableReports = map(rule, (problem) => {
    delete problem.fix;
    return problem;
  });
  return disableMeta(disableReports);
};

// handle name conversion
const convertPluginId = (pluginId: string): string => {
  return pluginId.includes('@')
    ? // `@angular-eslint/eslint-plugin` -> `@angular-eslint`
      // `@angular-eslint/eslint-plugin-template` -> `@angular-eslint/template`
      pluginId.replace(/eslint-plugin(-|)/u, '').replace(/\/$/, '')
    : // `eslint-plugin-react` -> `react`
      pluginId.replace(/^eslint-plugin-/u, '');
};

const ruleCache = new Map<string, RuleCache>();

const logger = {
  warn: (message: string, error?: unknown) => {
    console.warn(`[eslint-plugin-disable-autofix] ${message}`, error || '');
  },
  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(`[eslint-plugin-disable-autofix] ${message}`);
    }
  },
};

const measurePerformance = <T>(fn: () => T, label: string): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  logger.debug(`${label}: ${Math.round(end - start)}ms`);
  return result;
};

const checkCompatibility = (): void => {
  // Check ESLint version
  try {
    const eslintPkg = require('eslint/package.json');
    const [major] = eslintPkg.version.split('.');
    const version = parseInt(major, 10);

    if (version < 7) {
      throw new Error(
        `ESLint version ${version} is not supported. Required >=7.0.0`,
      );
    }

    // Check Node.js version
    const nodeVersion = process.versions.node;
    const [nodeMajor] = nodeVersion.split('.');
    if (parseInt(nodeMajor, 10) < 14) {
      throw new Error(
        `Node.js version ${nodeVersion} is not supported. Required >=14.17.0`,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.warn(error.message);
    } else {
      logger.warn('Could not determine ESLint or Node.js version');
    }
  }
};

const getESLintVersion = (): { major: number; full: string } => {
  try {
    const eslintPkg = require('eslint/package.json');
    const [major] = eslintPkg.version.split('.');
    return {
      major: parseInt(major, 10),
      full: eslintPkg.version,
    };
  } catch {
    return { major: 0, full: '0.0.0' };
  }
};

const createConfig = () => {
  const version = getESLintVersion();
  const isLegacy = version.major < 8;
  const rulePrefix = pluginOptions.customRulePrefix || 'disable-autofix';

  // Legacy config (ESLint < 8)
  const legacyConfig = {
    plugins: [rulePrefix],
    rules: Object.keys(disabledRules).reduce(
      (acc, rule) => ({
        ...acc,
        [`${rulePrefix}/${rule}`]: ['error'],
      }),
      {},
    ),
  };

  // Flat config (ESLint >= 8)
  const flatConfig = {
    plugins: {
      [rulePrefix]: {
        rules: disabledRules,
      },
    },
    rules: Object.keys(disabledRules).reduce(
      (acc, rule) => ({
        ...acc,
        [`${rulePrefix}/${rule}`]: ['error'],
      }),
      {},
    ),
  };

  return isLegacy ? legacyConfig : flatConfig;
};

// Removed unused function

const findWorkspaceRoot = (): string => {
  let currentDir = dirname;
  while (currentDir !== path.parse(currentDir).root) {
    // Check for common monorepo indicators
    if (
      fs.existsSync(path.join(currentDir, 'nx.json')) ||
      fs.existsSync(path.join(currentDir, 'lerna.json')) ||
      fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml')) ||
      fs.existsSync(path.join(currentDir, 'yarn.lock')) ||
      fs.existsSync(path.join(currentDir, 'package.json'))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  return dirname;
};

const getMonorepoModulePath = (modulePath: string): string => {
  const workspaceRoot = findWorkspaceRoot();
  const possiblePaths = [
    path.join(dirname, 'node_modules', modulePath),
    path.join(workspaceRoot, 'node_modules', modulePath),
    // For yarn/pnpm workspaces
    path.join(dirname, '..', '..', 'node_modules', modulePath),
    // For nested workspaces
    path.join(workspaceRoot, '..', 'node_modules', modulePath),
  ];

  for (const tryPath of possiblePaths) {
    if (fs.existsSync(tryPath)) {
      return tryPath;
    }
  }
  return modulePath;
};

const cache = new PersistentCache();
const stats = new RuleStatistics();

const loadRule = (rulePath: string): Rule.RuleModule | null => {
  return measurePerformance(
    () => {
      try {
        // Performance mode optimizations
        if (pluginOptions.performanceMode === 'fast') {
          // Skip persistent cache in fast mode
          const resolvedPath = getMonorepoModulePath(rulePath);
          const now = Date.now();
          const cached = ruleCache.get(resolvedPath);

          if (cached && now - cached.timestamp < pluginOptions.cacheTimeout!) {
            telemetry.cacheHits++;
            return cached.rule;
          }

          telemetry.cacheMisses++;
          const rule = require(resolvedPath) as Rule.RuleModule;
          ruleCache.set(resolvedPath, { rule, timestamp: now });
          return rule;
        }

        // Standard mode with persistent cache
        if (pluginOptions.persistCache) {
          const cached = cache.get(rulePath);
          if (cached) {
            telemetry.cacheHits++;
            return cached;
          }
        }

        const resolvedPath = getMonorepoModulePath(rulePath);
        const now = Date.now();
        const cached = ruleCache.get(resolvedPath);

        if (cached && now - cached.timestamp < pluginOptions.cacheTimeout!) {
          telemetry.cacheHits++;
          return cached.rule;
        }

        telemetry.cacheMisses++;
        const rule = require(resolvedPath) as Rule.RuleModule;
        ruleCache.set(resolvedPath, { rule, timestamp: now });

        if (rule && pluginOptions.persistCache) {
          cache.set(rulePath, rule);
        }

        return rule;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        telemetry.errors.push(errorMessage);

        if (pluginOptions.errorRecovery) {
          logger.warn(
            `Failed to load rule from ${rulePath}, continuing with error recovery:`,
            error,
          );
          // Return a mock rule that does nothing instead of null
          return {
            meta: {
              type: 'suggestion' as const,
              docs: {
                description: `Error loading rule: ${path.basename(rulePath)}`,
              },
            },
            create: () => ({}),
          };
        } else {
          logger.warn(`Failed to load rule from ${rulePath}:`, error);
          return null;
        }
      }
    },
    `Load rule: ${path.basename(rulePath)}`,
  );
};

// Removed unused function - validation is now handled inline

const safeReadDir = (dirPath: string): string[] => {
  try {
    return fs.readdirSync(dirPath);
  } catch (error) {
    logger.warn(`Failed to read directory ${dirPath}:`, error);
    return [];
  }
};

// // import eslint rules
const eslintRules = safeReadDir(
  path.join(dirname, nodeModules, 'eslint/lib/rules'),
).filter((rule) => rule.endsWith('.js') && !rule.includes('index'));

for (const rule of eslintRules) {
  const rulePath = path.posix.join(
    dirname,
    nodeModules,
    'eslint/lib/rules',
    rule,
  );
  const importedRule = loadRule(rulePath);
  if (importedRule) {
    const ruleName = rule.replace('.js', '');
    if (shouldIncludeRule(ruleName)) {
      disabledRules[ruleName] = disableFix(_.cloneDeep(importedRule));
    }
  }
}

// Enhanced plugin detection with auto-detection option
const eslintPlugins = pluginOptions.autoDetectPlugins
  ? safeReadDir(path.join(dirname, nodeModules)).filter(
      (plugin) =>
        (plugin.startsWith('eslint-plugin') || plugin.startsWith('@')) &&
        !plugin.startsWith('@types') &&
        plugin !== 'eslint-plugin-disable-autofix' &&
        plugin !== '@eslint',
    )
  : [];

const getPluginPath = (plugin: string): string => {
  return getMonorepoModulePath(plugin);
};

// Enhanced plugin importing with better error handling
for (const plugin of eslintPlugins) {
  try {
    if (plugin.includes('@')) {
      const pluginDirectories = safeReadDir(
        path.join(dirname, nodeModules, plugin),
      ).filter((read) => read.startsWith('eslint-plugin'));
      for (const pluginDirectory of pluginDirectories) {
        try {
          const scopedPlugin = path.posix.join(plugin, pluginDirectory);
          const importedPlugin = require(scopedPlugin) as EslintPlugin;
          importedPlugin.id = scopedPlugin.replace(
            path.join(dirname, nodeModules),
            '',
          );
          importedPlugins.push(importedPlugin);
        } catch (error) {
          if (pluginOptions.errorRecovery) {
            logger.warn(
              `Failed to load scoped plugin ${plugin}/${pluginDirectory}, skipping:`,
              error,
            );
          } else {
            throw error;
          }
        }
      }
    } else {
      try {
        const pluginPath = getPluginPath(plugin);
        const imported = require(pluginPath) as EslintPlugin;
        imported.id = plugin;
        importedPlugins.push(imported);
      } catch (error) {
        if (pluginOptions.errorRecovery) {
          logger.warn(`Failed to load plugin ${plugin}, skipping:`, error);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    if (pluginOptions.errorRecovery) {
      logger.warn(`Failed to process plugin ${plugin}, skipping:`, error);
    } else {
      throw error;
    }
  }
}

// Enhanced plugin rule handling with better validation and error recovery
const processPluginRules = (plugin: EslintPlugin): void => {
  const pluginRules = plugin.rules || {};
  const pluginId = plugin.id || '';
  const pluginName = convertPluginId(pluginId);

  for (const [ruleId, rule] of Object.entries(pluginRules)) {
    try {
      if (rule && typeof rule === 'object') {
        const fullRuleId = `${pluginName}/${ruleId}`;

        // Enhanced rule filtering
        if (shouldIncludeRule(fullRuleId)) {
          // Validate rule before processing
          if (pluginOptions.strictMode && rule.meta?.schema) {
            const validation = validateRuleConfig(rule, rule.meta.schema);
            if (!validation.valid) {
              logger.warn(
                `Rule ${fullRuleId} has invalid schema, skipping: ${validation.errors.join(', ')}`,
              );
              continue;
            }
          }

          // Clone and disable fix
          const disabledRule = disableFix(_.cloneDeep(rule));
          disabledRules[fullRuleId] = disabledRule;

          // Track statistics
          if (pluginOptions.trackStats) {
            stats.trackRule(fullRuleId);
          }

          // Track cache hits for performance monitoring
          if (pluginOptions.performanceMode === 'thorough') {
            stats.trackCacheHit(fullRuleId);
          }
        }
      }
    } catch (error) {
      if (pluginOptions.errorRecovery) {
        logger.warn(
          `Failed to process rule ${pluginName}/${ruleId}, skipping:`,
          error,
        );
      } else {
        throw error;
      }
    }
  }
};

// disable plugin rules
for (const plugin of importedPlugins) {
  processPluginRules(plugin);
}

// Removed unused variable - flat config is created dynamically

// Initialize plugin with compatibility check
checkCompatibility();

const plugin: DisableAutofixPlugin = {
  meta: {
    name: 'eslint-plugin-disable-autofix',
    version: '5.0.1',
    compatibleESLintVersions: '>=6.0.0',
    compatibleNodeVersions: '>=14.17.0',
    options: defaultOptions,
  },
  configs: {
    recommended: createConfig(),
    legacy: {
      plugins: ['disable-autofix'],
      rules: {},
    },
    flat: {
      plugins: {
        'disable-autofix': {
          rules: disabledRules,
        },
      },
      rules: {},
    },
  } as any,
  rules: disabledRules,
  processors: {},
  flatConfig: createConfig(),
};

// Enhanced migration helpers with new options
const migrationHelpers = {
  convertLegacyConfig(_config: any) {
    // Convert old config format to new
    return createConfig();
  },
  generateConfigFromRules(rules: string[]) {
    // Generate config from rule list with custom prefix
    const rulePrefix = pluginOptions.customRulePrefix || 'disable-autofix';
    return rules.reduce(
      (acc, rule) => ({
        ...acc,
        [`${rulePrefix}/${rule}`]: ['error'],
      }),
      {},
    );
  },
  // New helper: Generate config for specific ESLint version
  generateConfigForVersion(eslintVersion: number, rules: string[]) {
    const rulePrefix = pluginOptions.customRulePrefix || 'disable-autofix';
    const isLegacy = eslintVersion < 8;

    if (isLegacy) {
      return {
        plugins: [rulePrefix],
        rules: rules.reduce(
          (acc, rule) => ({
            ...acc,
            [`${rulePrefix}/${rule}`]: ['error'],
          }),
          {},
        ),
      };
    } else {
      return {
        plugins: {
          [rulePrefix]: {
            rules: disabledRules,
          },
        },
        rules: rules.reduce(
          (acc, rule) => ({
            ...acc,
            [`${rulePrefix}/${rule}`]: ['error'],
          }),
          {},
        ),
      };
    }
  },
  // New helper: Validate configuration
  validateConfig(config: any) {
    const errors: string[] = [];

    if (!config.plugins) {
      errors.push('Missing plugins configuration');
    }

    if (!config.rules) {
      errors.push('Missing rules configuration');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Report telemetry at exit if enabled
if (pluginOptions.enableTelemetry) {
  process.on('exit', () => {
    telemetry.report();
  });
}

// Add cleanup on process exit
process.on('exit', () => {
  if (pluginOptions.persistCache) {
    cache.save();
  }
  if (pluginOptions.trackStats) {
    logger.debug(
      `Rule Statistics: ${JSON.stringify(stats.getStats(), null, 2)}`,
    );
  }
});

export {
  logger,
  measurePerformance,
  disableFix,
  configure,
  migrationHelpers,
  stats,
  validateRuleConfig,
};
export type { DisableAutofixPlugin, EslintPlugin, Problem, Metadata };
export default plugin;
