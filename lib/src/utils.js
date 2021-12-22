import ruleComposer from 'eslint-rule-composer';
const map = ruleComposer.mapReports;
const getNonFixableRule = (rule) => {
    return map(rule, (problem) => {
        problem.fix = undefined;
        return problem;
    });
};
export default getNonFixableRule;
