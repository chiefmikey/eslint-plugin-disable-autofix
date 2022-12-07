"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configs = exports.rules = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const eslint_1 = __importDefault(require("eslint"));
const app_root_path_1 = __importDefault(require("app-root-path"));
const utils_1 = __importDefault(require("./utils"));
const linter = new eslint_1.default.Linter();
exports.rules = {};
const builtIns = {};
const importedPlugins = [];
const dirname = app_root_path_1.default.toString();
const nodeModules = 'node_modules/';
const getBuiltIn = node_fs_1.default
    .readdirSync(node_path_1.default.join(dirname, nodeModules, 'eslint/lib/rules'))
    .filter((builtIn) => builtIn.includes('.js'));
for (const builtIn of getBuiltIn) {
    const builtInRule = require(node_path_1.default.join(dirname, nodeModules, 'eslint/lib/rules/', builtIn));
    builtIns[builtIn] = builtInRule;
}
for (const current of Object.keys(builtIns)) {
    const rule = linter.getRules().get(current);
    if (rule) {
        exports.rules[current] = (0, utils_1.default)(rule);
    }
}
const getPlugins = node_fs_1.default
    .readdirSync(node_path_1.default.join(dirname, nodeModules))
    .filter((plugin) => (plugin.startsWith('eslint-plugin') ||
    (plugin.startsWith('@') && /eslint/u.test(plugin))) &&
    plugin !== 'eslint-plugin-disable-autofix' &&
    plugin !== '@eslint');
for (const plugin of getPlugins) {
    let copyIt = plugin;
    if (plugin.includes('@')) {
        const pluginDirectory = node_fs_1.default
            .readdirSync(node_path_1.default.join(dirname, nodeModules, plugin))
            .find((read) => /plugin/u.test(read));
        if (pluginDirectory) {
            copyIt = node_path_1.default.join(dirname, nodeModules, plugin, pluginDirectory);
        }
    }
    const imported = require(copyIt);
    imported.id = plugin;
    importedPlugins.push(imported);
}
for (const plugin of importedPlugins) {
    const pluginRules = plugin.rules;
    const pluginId = plugin.id;
    if (pluginId) {
        const pluginName = pluginId.includes('@')
            ? pluginId.split('/')[0]
            : pluginId.replace(/^eslint-plugin-/u, '');
        for (const rule of Object.keys(pluginRules || {})) {
            if (rule) {
                exports.rules[`${pluginName}/${rule}`] =
                    (0, utils_1.default)(pluginRules[rule]);
            }
        }
    }
}
const PLUGIN_NAME = 'disable-autofix';
exports.configs = {
    all: {
        plugins: [PLUGIN_NAME],
        rules: {},
    },
};
for (const rule of Object.keys(exports.rules)) {
    Object.assign(exports.configs.all.rules, { [`${PLUGIN_NAME}/${rule}`]: 'error' });
}
