"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const eslint_rule_composer_1 = __importDefault(require("eslint-rule-composer"));
const map = eslint_rule_composer_1.default.mapReports;
const getNonFixableRule = (rule) => {
    return map(rule, (problem) => {
        problem.fix = undefined;
        return problem;
    });
};
exports.default = getNonFixableRule;
