module.exports = {
  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:prettier/recommended',
    'plugin:@next/next/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest',
  },
  rules: {
    // 交给 typescript 判断
    'no-undef': 'off',
    'no-unused-vars': 'off',

    // types
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',

    'import/no-unresolved': 'off',
    'import/extensions': 'off',

    'no-console': 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',

    'prettier/prettier': 'error',
  },
};
