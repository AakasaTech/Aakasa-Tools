/** Shared ESLint config for non-Next.js workspace packages (packages/ui, packages/tool-shell, etc). */
module.exports = {
  root: false,
  env: {
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
