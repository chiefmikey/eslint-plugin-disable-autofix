import fs from 'node:fs';
import path from 'node:path';

import type { Linter, Rule } from 'eslint';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PluginExport {
  rules?: Record<string, Rule.RuleModule>;
}

interface DisableMode {
  fix: boolean;
  suggest: boolean;
}

interface CreatePluginOptions {
  /** What to strip: 'all' (default), 'fix' (keep suggestions), 'suggest' (keep fix) */
  mode?: 'all' | 'fix' | 'suggest';
  /** Only wrap rules from these plugin prefixes. Builtins always included. */
  plugins?: string[];
}

interface PluginInstance {
  meta: { name: string; version: string };
  configs: Record<string, Linter.Config | Linter.Config[]>;
  rules: Record<string, Rule.RuleModule>;
  processors: Record<string, Linter.Processor>;
  configure: (rules: Record<string, Linter.RuleEntry>) => {
    plugins: Record<string, PluginInstance>;
    rules: Record<string, Linter.RuleEntry>;
  };
  createPlugin: (options?: CreatePluginOptions) => PluginInstance;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VERSION = '6.1.0';

const MODES: Record<string, DisableMode> = {
  all: { fix: true, suggest: true },
  fix: { fix: true, suggest: false },
  suggest: { fix: false, suggest: true },
};

const MODE_PREFIXES: Record<string, string> = {
  all: 'disable-autofix',
  fix: 'disable-fix',
  suggest: 'disable-suggest',
};

// ─── Core Functions ─────────────────────────────────────────────────────────

const disableFix = (rule: Rule.RuleModule, mode: DisableMode): Rule.RuleModule => {
  const result: Rule.RuleModule = {
    create(context) {
      const wrappedContext = Object.create(context, {
        report: {
          enumerable: true,
          value(descriptor: Record<string, unknown>) {
            const cleaned = { ...descriptor };
            if (mode.fix) delete cleaned.fix;
            if (mode.suggest) delete cleaned.suggest;
            context.report(
              cleaned as unknown as Parameters<Rule.RuleContext['report']>[0],
            );
          },
        },
      });
      return rule.create(wrappedContext);
    },
  };

  if (rule.meta) {
    const meta = { ...rule.meta } as Record<string, unknown>;
    if (mode.fix) delete meta.fixable;
    if (mode.suggest) delete meta.hasSuggestions;
    result.meta = meta as Rule.RuleMetaData;
  }

  return result;
};

/**
 * Convert a plugin package name to its ESLint config prefix.
 *
 * eslint-plugin-react                       → react
 * @angular-eslint/eslint-plugin             → @angular-eslint
 * @angular-eslint/eslint-plugin-template    → @angular-eslint/template
 */
const convertPluginId = (pluginId: string): string => {
  if (pluginId.startsWith('@')) {
    return pluginId.replace(/\/eslint-plugin(-|$)/u, '/').replace(/\/$/, '');
  }
  return pluginId.replace(/^eslint-plugin-/u, '');
};

/**
 * Safely require a module. Handles ESM default export unwrapping:
 * modules using `export default` are wrapped as { __esModule: true, default: ... }.
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

// ─── Discovery (runs once, cheap — no require() of plugins) ─────────────────

let discoveryDone = false;
const builtinRuleNames: string[] = [];
const prefixToPackage = new Map<string, string>();

const discover = (): void => {
  if (discoveryDone) return;
  discoveryDone = true;

  // Collect all node_modules directories in the resolution chain
  const nmDirs: string[] = [];
  try {
    const eslintEntry = require.resolve('eslint/package.json');
    nmDirs.push(path.resolve(path.dirname(eslintEntry), '..'));
  } catch {
    /* fallthrough */
  }
  const searchPaths =
    require.resolve.paths?.('eslint-plugin-disable-autofix') ?? [];
  for (const p of searchPaths) {
    try {
      if (!nmDirs.includes(p) && fs.statSync(p).isDirectory()) {
        nmDirs.push(p);
      }
    } catch {
      /* skip */
    }
  }
  if (nmDirs.length === 0) {
    nmDirs.push(path.join(process.cwd(), 'node_modules'));
  }

  // Scan builtin rule filenames (no require — just readdir)
  for (const nmDir of nmDirs) {
    try {
      const rulesDir = path.join(nmDir, 'eslint', 'lib', 'rules');
      for (const f of fs.readdirSync(rulesDir)) {
        if (f.endsWith('.js') && !f.includes('index')) {
          const name = f.replace('.js', '');
          if (!builtinRuleNames.includes(name)) builtinRuleNames.push(name);
        }
      }
      break;
    } catch {
      /* try next */
    }
  }

  // Scan for plugin directory entries (no require — just readdir)
  const seen = new Set<string>();
  for (const nmDir of nmDirs) {
    try {
      for (const entry of fs.readdirSync(nmDir)) {
        if (entry === 'eslint-plugin-disable-autofix') continue;
        if (entry.startsWith('@types') || entry.startsWith('@eslint')) continue;

        if (entry.startsWith('eslint-plugin-') && !seen.has(entry)) {
          seen.add(entry);
          prefixToPackage.set(convertPluginId(entry), entry);
        } else if (entry.startsWith('@')) {
          try {
            const scopeDir = path.join(nmDir, entry);
            for (const sub of fs.readdirSync(scopeDir)) {
              if (!sub.startsWith('eslint-plugin')) continue;
              const pkg = `${entry}/${sub}`;
              if (!seen.has(pkg)) {
                seen.add(pkg);
                prefixToPackage.set(convertPluginId(pkg), pkg);
              }
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch {
      /* skip */
    }
  }
};

// ─── Shared Caches ──────────────────────────────────────────────────────────

const pluginRulesCache = new Map<string, Record<string, Rule.RuleModule>>();

const loadPluginRules = (
  packageName: string,
): Record<string, Rule.RuleModule> => {
  if (pluginRulesCache.has(packageName))
    return pluginRulesCache.get(packageName)!;
  const mod = safeRequire(packageName);
  const rules = mod?.rules ?? {};
  pluginRulesCache.set(packageName, rules);
  return rules;
};

const loadBuiltinRule = (name: string): Rule.RuleModule | undefined => {
  try {
    const eslintDir = path.dirname(require.resolve('eslint/package.json'));
    return require(path.join(eslintDir, 'lib', 'rules', `${name}.js`)) as Rule.RuleModule;
  } catch {
    return undefined;
  }
};

const parseRuleName = (
  name: string,
): { prefix: string; ruleId: string } | undefined => {
  let bestPrefix = '';
  for (const prefix of prefixToPackage.keys()) {
    if (name.startsWith(prefix + '/') && prefix.length > bestPrefix.length) {
      bestPrefix = prefix;
    }
  }
  if (bestPrefix) {
    return { prefix: bestPrefix, ruleId: name.slice(bestPrefix.length + 1) };
  }
  return undefined;
};

// ─── Plugin Factory ─────────────────────────────────────────────────────────

const createPlugin = (options?: CreatePluginOptions): PluginInstance => {
  discover();

  const modeName = options?.mode ?? 'all';
  const mode = MODES[modeName] ?? MODES.all;
  const prefix = MODE_PREFIXES[modeName] ?? 'disable-autofix';
  const allowedPrefixes = options?.plugins ? new Set(options.plugins) : null;

  const ruleCache = new Map<string, Rule.RuleModule>();

  const isAllowed = (name: string): boolean => {
    if (!allowedPrefixes) return true;
    if (!name.includes('/')) return true;
    const parsed = parseRuleName(name);
    return parsed ? allowedPrefixes.has(parsed.prefix) : false;
  };

  const getRule = (name: string): Rule.RuleModule | undefined => {
    if (ruleCache.has(name)) return ruleCache.get(name);
    if (!isAllowed(name)) return undefined;

    let original: Rule.RuleModule | undefined;

    if (!name.includes('/')) {
      if (!builtinRuleNames.includes(name)) return undefined;
      original = loadBuiltinRule(name);
    } else {
      const parsed = parseRuleName(name);
      if (!parsed) return undefined;
      const packageName = prefixToPackage.get(parsed.prefix);
      if (!packageName) return undefined;
      const rules = loadPluginRules(packageName);
      original = rules[parsed.ruleId];
    }

    if (!original) return undefined;

    try {
      const wrapped = disableFix(original, mode);
      ruleCache.set(name, wrapped);
      return wrapped;
    } catch {
      return undefined;
    }
  };

  const getRuleNames = (): string[] => {
    const names = [...builtinRuleNames];
    const entries = allowedPrefixes
      ? [...prefixToPackage.entries()].filter(([p]) => allowedPrefixes.has(p))
      : [...prefixToPackage.entries()];
    for (const [pfx, packageName] of entries) {
      try {
        for (const ruleId of Object.keys(loadPluginRules(packageName))) {
          names.push(`${pfx}/${ruleId}`);
        }
      } catch {
        /* skip */
      }
    }
    return names;
  };

  const rules: Record<string, Rule.RuleModule> = new Proxy(
    Object.create(null) as Record<string, Rule.RuleModule>,
    {
      get(_, prop) {
        if (typeof prop !== 'string') return undefined;
        return getRule(prop);
      },
      has(_, prop) {
        if (typeof prop !== 'string') return false;
        return getRule(prop) !== undefined;
      },
      ownKeys() {
        return getRuleNames();
      },
      getOwnPropertyDescriptor(_, prop) {
        if (typeof prop !== 'string') return undefined;
        // For builtins, we know they exist from the directory scan
        if (builtinRuleNames.includes(prop)) {
          return { configurable: true, enumerable: true, writable: true };
        }
        // For plugin rules, verify via the loaded plugin
        const parsed = parseRuleName(prop);
        if (parsed && isAllowed(prop)) {
          const packageName = prefixToPackage.get(parsed.prefix);
          if (packageName) {
            const pluginRules = loadPluginRules(packageName);
            if (parsed.ruleId in pluginRules) {
              return { configurable: true, enumerable: true, writable: true };
            }
          }
        }
        return undefined;
      },
    },
  );

  const configure = (
    input: Record<string, Linter.RuleEntry>,
  ): {
    plugins: Record<string, PluginInstance>;
    rules: Record<string, Linter.RuleEntry>;
  } => {
    const resultRules: Record<string, Linter.RuleEntry> = {};
    for (const [name, config] of Object.entries(input)) {
      resultRules[name] = 'off';
      resultRules[`${prefix}/${name}`] = config;
    }
    return {
      plugins: { [prefix]: instance },
      rules: resultRules,
    };
  };

  const instance: PluginInstance = {
    meta: { name: 'eslint-plugin-disable-autofix', version: VERSION },
    configs: {} as Record<string, Linter.Config | Linter.Config[]>,
    rules,
    processors: {} as Record<string, Linter.Processor>,
    configure,
    createPlugin,
  };

  return instance;
};

// ─── Default Export ─────────────────────────────────────────────────────────

const plugin = createPlugin();

export = plugin;
