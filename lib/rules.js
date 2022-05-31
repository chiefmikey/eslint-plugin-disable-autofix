"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.all = exports.allRules = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const eslint_1 = __importDefault(require("eslint"));
const utils_1 = __importDefault(require("./utils"));
const linter = new eslint_1.default.Linter();
exports.allRules = {};
const builtIns = {};
const importedBuiltIns = [];
const __dirname = node_path_1.default.resolve();
const getBuiltIn = node_fs_1.default
    .readdirSync(node_path_1.default.join(__dirname, '../../eslint/lib/rules'))
    .filter((builtIn) => builtIn.includes('.js'));
for (const builtIn of getBuiltIn) {
    importedBuiltIns.push(Promise.resolve().then(() => __importStar(require(node_path_1.default.join(__dirname, '../../eslint/lib/rules/', builtIn)))));
}
const getAllRules = async () => {
    for (const rule of await Promise.all(importedBuiltIns)) {
        builtIns[rule.id] = rule;
    }
};
getAllRules();
for (const current of Object.keys(builtIns)) {
    const rule = linter.getRules().get(current);
    if (rule) {
        exports.allRules[current] = (0, utils_1.default)(rule);
    }
}
const getPlugins = node_fs_1.default
    .readdirSync(node_path_1.default.join(__dirname, '../../'))
    .filter((plugin) => (plugin.startsWith('eslint-plugin') ||
    (plugin.startsWith('@') && /eslint/u.test(plugin))) &&
    plugin !== 'eslint-plugin-disable-autofix' &&
    plugin !== '@eslint');
const importedPlugins = [];
for (const plugin of getPlugins) {
    let copyIt = plugin;
    if (plugin.includes('@')) {
        const pluginDirectory = node_fs_1.default
            .readdirSync(node_path_1.default.join(__dirname, '../../', plugin))
            .find((read) => /plugin/u.test(read));
        if (pluginDirectory) {
            copyIt = node_path_1.default.join(__dirname, '../../', plugin, pluginDirectory);
        }
    }
    importedPlugins.push(Promise.resolve().then(() => __importStar(require(copyIt))));
}
const getAllPlugins = async () => {
    for (const plugin of await Promise.all(importedPlugins)) {
        console.log(plugin);
        const pluginName = plugin.id.includes('@')
            ? plugin.id.split('/')[0]
            : plugin.id.replace(/^eslint-plugin-/u, '');
        for (const rule of Object.keys(plugin.rules || {})) {
            if (rule) {
                exports.allRules[`${pluginName}/${rule}`] =
                    (0, utils_1.default)(plugin.rules[rule]);
            }
        }
    }
};
getAllPlugins();
const PLUGIN_NAME = 'disable-autofix';
exports.all = {
    plugins: [PLUGIN_NAME],
    allRules: {},
};
for (const rule of Object.keys(exports.allRules)) {
    Object.assign(exports.all.allRules, { [`${PLUGIN_NAME}/${rule}`]: 'error' });
}
