import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

import appRoot from 'app-root-path';
import type { Rule, AST, SourceCode } from 'eslint';
import ruleComposer from 'eslint-rule-composer';
import _ from 'lodash';

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

interface CacheEntry {
  rule: Rule.RuleModule;
  timestamp: number;
  hits: number;
}

type DisabledRules = Record<string, Rule.RuleModule>;
type Predicate<T> = (problem: Problem, metadata: Metadata) => T;
type MapReports = (
  rule: Rule.RuleModule,
  iteratee: Predicate<Problem>,
) => Rule.RuleModule;

// Performance and caching configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500; // Reduced for memory efficiency

// Global state
const disabledRules: DisabledRules = {};
const ruleCache = new Map<string, CacheEntry>();
const processedPlugins = new Set<string>();

const dirname = appRoot.toString();
const nodeModules = 'node_modules/';

const map = (ruleComposer as { mapReports: MapReports }).mapReports;

// Enhanced error handling and validation
const isValidRule = (rule: any): rule is Rule.RuleModule => {
  return rule && typeof rule === 'object' && (rule.create || rule.meta);
};

const safeRequire = (modulePath: string): any => {
  try {
    const resolvedPath = require.resolve(modulePath);
    return require(resolvedPath);
  } catch (error) {
    // Silently fail for missing modules - this is expected behavior
    return null;
  }
};

// Cache management with LRU eviction
const getCachedRule = (ruleKey: string): Rule.RuleModule | null => {
  const cached = ruleCache.get(ruleKey);
  if (!cached) return null;

  if (performance.now() - cached.timestamp > CACHE_TTL) {
    ruleCache.delete(ruleKey);
    return null;
  }

  cached.hits++;
  return cached.rule;
};

const setCachedRule = (ruleKey: string, rule: Rule.RuleModule): void => {
  if (ruleCache.size >= MAX_CACHE_SIZE) {
    // Remove least recently used entry
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestTime = Infinity;

    for (const [key, entry] of ruleCache.entries()) {
      if (entry.hits < minHits || (entry.hits === minHits && entry.timestamp < oldestTime)) {
        minHits = entry.hits;
        oldestTime = entry.timestamp;
        lruKey = key;
      }
    }

    if (lruKey) {
      ruleCache.delete(lruKey);
    }
  }

  ruleCache.set(ruleKey, {
    rule: _.cloneDeep(rule),
    timestamp: performance.now(),
    hits: 0,
  });
};

// Rule transformation functions with error handling
const disableMeta = (rule: Rule.RuleModule): Rule.RuleModule => {
  const clonedRule = _.cloneDeep(rule);
  if (clonedRule.meta?.fixable !== undefined) {
    delete clonedRule.meta.fixable;
  }
  return clonedRule;
};

const disableFix = (rule: Rule.RuleModule): Rule.RuleModule => {
  try {
    const disableReports = map(rule, (problem) => {
      delete problem.fix;
      return problem;
    });
    return disableMeta(disableReports);
  } catch (error) {
    // Fallback: just disable the meta if rule composition fails
    console.warn(`Failed to disable fixes for rule, falling back to meta-only disable: ${error}`);
    return disableMeta(rule);
  }
};

// Plugin name conversion
const convertPluginId = (pluginId: string): string => {
  if (!pluginId || typeof pluginId !== 'string') {
    return pluginId;
  }

  return pluginId.includes('@')
    ? pluginId.replace(/eslint-plugin(-|)/u, '').replace(/\/$/, '')
    : pluginId.replace(/^eslint-plugin-/u, '');
};

// Optimized ESLint core rules discovery
const discoverEslintCoreRules = (): void => {
  try {
    const eslintRulesPath = path.join(dirname, nodeModules, 'eslint/lib/rules');
    const ruleFiles = fs.readdirSync(eslintRulesPath)
      .filter((file) => file.endsWith('.js') && !file.includes('index'));

    for (const ruleFile of ruleFiles) {
      const rulePath = path.posix.join(eslintRulesPath, ruleFile);
      const importedRule = safeRequire(rulePath);

      if (!isValidRule(importedRule)) continue;

      const ruleName = ruleFile.replace('.js', '');
      const cacheKey = `core:${ruleName}`;

      let disabledRule = getCachedRule(cacheKey);
      if (!disabledRule) {
        disabledRule = disableFix(importedRule);
        setCachedRule(cacheKey, disabledRule);
      }

      disabledRules[ruleName] = disabledRule;
    }
  } catch (error) {
    // ESLint might not be installed or rules directory might not exist
    console.warn('Could not discover ESLint core rules:', error);
  }
};

// Optimized plugin discovery
const discoverPlugins = (): void => {
  try {
    const nodeModulesPath = path.join(dirname, nodeModules);
    const installedPackages = fs.readdirSync(nodeModulesPath)
      .filter((pkg) =>
        (pkg.startsWith('eslint-plugin') || pkg.startsWith('@')) &&
        !pkg.startsWith('@types') &&
        pkg !== 'eslint-plugin-disable-autofix' &&
        pkg !== '@eslint' &&
        !processedPlugins.has(pkg)
      );

    for (const pkg of installedPackages) {
      try {
        processedPlugins.add(pkg);
        const pkgPath = path.join(nodeModulesPath, pkg);

        if (pkg.includes('@')) {
          // Scoped package
          const scopedPackages = fs.readdirSync(pkgPath)
            .filter((subPkg) => subPkg.startsWith('eslint-plugin'));

          for (const subPkg of scopedPackages) {
            const fullPkgPath = path.join(pkg, subPkg);
            processPlugin(fullPkgPath);
          }
        } else {
          processPlugin(pkg);
        }
      } catch (error) {
        // Skip problematic packages
        continue;
      }
    }
  } catch (error) {
    // node_modules might not exist or be readable
    console.warn('Could not discover plugins:', error);
  }
};

const processPlugin = (pluginId: string): void => {
  const importedPlugin = safeRequire(pluginId) as EslintPlugin | null;

  if (!importedPlugin || typeof importedPlugin !== 'object' || !importedPlugin.rules) {
    return;
  }

  importedPlugin.id = pluginId;
  const pluginRules = importedPlugin.rules;
  const pluginName = convertPluginId(pluginId);

  for (const [ruleId, rule] of Object.entries(pluginRules)) {
    if (!isValidRule(rule)) continue;

    const fullRuleName = `${pluginName}/${ruleId}`;
    const cacheKey = `plugin:${pluginId}:${ruleId}`;

    let disabledRule = getCachedRule(cacheKey);
    if (!disabledRule) {
      disabledRule = disableFix(rule);
      setCachedRule(cacheKey, disabledRule);
    }

    disabledRules[fullRuleName] = disabledRule;
  }
};

// Initialize on first access (lazy loading)
let initialized = false;
const initializeOnce = (): void => {
  if (initialized) return;

  const startTime = performance.now();
  discoverEslintCoreRules();
  discoverPlugins();
  initialized = true;

  const endTime = performance.now();
  console.log(`eslint-plugin-disable-autofix initialized in ${(endTime - startTime).toFixed(2)}ms`);
};

// Create a proxy that initializes on first access
const createLazyRulesProxy = (): Record<string, Rule.RuleModule> => {
  return new Proxy(disabledRules, {
    get(target, prop: string) {
      if (!initialized) {
        initializeOnce();
      }
      return target[prop];
    },
    ownKeys(target) {
      if (!initialized) {
        initializeOnce();
      }
      return Object.keys(target);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (!initialized) {
        initializeOnce();
      }
      return Object.getOwnPropertyDescriptor(target, prop);
    }
  });
};

const plugin = {
  meta: {
    name: 'eslint-plugin-disable-autofix',
    version: '5.0.1',
  },
  configs: {},
  rules: createLazyRulesProxy(),
  processors: {},
};

export default plugin;
