import fs from 'node:fs';
import path from 'node:path';

import type { Rule } from 'eslint';

interface PluginExport {
  rules?: Record<string, Rule.RuleModule>;
}

const disabledRules: Record<string, Rule.RuleModule> = {};

/**
 * Wrap a rule to strip fix, suggest, and fixable/hasSuggestions metadata.
 * Creates a new rule object — never mutates the original.
 */
const disableFix = (rule: Rule.RuleModule): Rule.RuleModule => {
  const result: Rule.RuleModule = {
    create(context) {
      const wrappedContext = Object.create(context, {
        report: {
          enumerable: true,
          value(descriptor: Record<string, unknown>) {
            const cleaned = { ...descriptor };
            delete cleaned.fix;
            delete cleaned.suggest;
            context.report(cleaned as unknown as Parameters<Rule.RuleContext['report']>[0]);
          },
        },
      });

      return rule.create(wrappedContext);
    },
  };

  if (rule.meta) {
    const { fixable, hasSuggestions, ...cleanMeta } = rule.meta as Record<
      string,
      unknown
    >;
    result.meta = cleanMeta as Rule.RuleMetaData;
  }

  return result;
};

/**
 * Convert a plugin package name to its ESLint config prefix.
 *
 * eslint-plugin-react           → react
 * @angular-eslint/eslint-plugin → @angular-eslint
 * @angular-eslint/eslint-plugin-template → @angular-eslint/template
 */
const convertPluginId = (pluginId: string): string => {
  if (pluginId.startsWith('@')) {
    return pluginId.replace(/\/eslint-plugin(-|$)/u, '/').replace(/\/$/, '');
  }
  return pluginId.replace(/^eslint-plugin-/u, '');
};

/**
 * Find the project's node_modules directory.
 * Uses require.resolve to locate eslint, then navigates up.
 * Falls back to process.cwd()/node_modules.
 */
const findNodeModules = (): string => {
  try {
    const eslintEntry = require.resolve('eslint/package.json');
    return path.resolve(path.dirname(eslintEntry), '..');
  } catch {
    return path.join(process.cwd(), 'node_modules');
  }
};

/**
 * Safely require a module, returning undefined on failure.
 * Handles ESM default exports: when Node.js loads an ESM module via require(),
 * modules using `export default` are wrapped as { __esModule: true, default: ... }.
 * This unwraps that pattern to get the actual plugin object.
 */
const safeRequire = (id: string): PluginExport | undefined => {
  try {
    const mod = require(id) as Record<string, unknown>;
    if (mod.__esModule && mod.default && typeof mod.default === 'object') {
      return mod.default as PluginExport;
    }
    return mod as unknown as PluginExport;
  } catch {
    return undefined;
  }
};

const nodeModulesDir = findNodeModules();

// --- Load builtin ESLint rules ---

try {
  const rulesDir = path.join(nodeModulesDir, 'eslint', 'lib', 'rules');
  const ruleFiles = fs
    .readdirSync(rulesDir)
    .filter((f) => f.endsWith('.js') && !f.includes('index'));

  for (const file of ruleFiles) {
    try {
      const imported = require(path.join(rulesDir, file)) as Rule.RuleModule;
      disabledRules[file.replace('.js', '')] = disableFix(imported);
    } catch {
      // Skip rules that fail to load
    }
  }
} catch {
  // ESLint rules directory unreadable — skip builtin rules
}

// --- Load third-party plugin rules ---

try {
  const entries = fs.readdirSync(nodeModulesDir);

  const pluginEntries = entries.filter(
    (e) =>
      (e.startsWith('eslint-plugin-') || e.startsWith('@')) &&
      !e.startsWith('@types') &&
      !e.startsWith('@eslint') &&
      e !== 'eslint-plugin-disable-autofix',
  );

  for (const entry of pluginEntries) {
    try {
      if (entry.startsWith('@')) {
        // Scoped packages — look for eslint-plugin-* subdirectories
        const scopeDir = path.join(nodeModulesDir, entry);
        const scopeEntries = fs
          .readdirSync(scopeDir)
          .filter((e) => e.startsWith('eslint-plugin'));

        for (const pluginDir of scopeEntries) {
          const packageName = `${entry}/${pluginDir}`;
          const plugin = safeRequire(packageName);
          if (!plugin?.rules) continue;

          const pluginName = convertPluginId(packageName);
          for (const [ruleId, rule] of Object.entries(plugin.rules)) {
            try {
              disabledRules[`${pluginName}/${ruleId}`] = disableFix(rule);
            } catch {
              // Skip individual rules that fail
            }
          }
        }
      } else {
        // Unscoped plugin
        const plugin = safeRequire(entry);
        if (!plugin?.rules) continue;

        const pluginName = convertPluginId(entry);
        for (const [ruleId, rule] of Object.entries(plugin.rules)) {
          try {
            disabledRules[`${pluginName}/${ruleId}`] = disableFix(rule);
          } catch {
            // Skip individual rules that fail
          }
        }
      }
    } catch {
      // Skip entries that fail to enumerate
    }
  }
} catch {
  // node_modules unreadable — skip third-party rules
}

// --- Export plugin ---

const plugin = {
  meta: {
    name: 'eslint-plugin-disable-autofix',
    version: '6.0.0',
  },
  configs: {},
  rules: disabledRules,
  processors: {},
};

export = plugin;
