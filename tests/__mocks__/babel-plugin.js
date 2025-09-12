module.exports = {
  rules: {
    'object-curly-spacing': {
      meta: { fixable: 'whitespace' },
      create: () => ({}),
    },
    'prefer-const': {
      meta: { fixable: 'code' },
      create: () => ({}),
    },
  },
};
