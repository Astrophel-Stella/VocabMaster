module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
  plugins: ['react-hooks', 'react-refresh'],
  ignorePatterns: [
    'dist',
    'node_modules',
    'src-tauri',
    '*.config.ts',
    '*.config.js',
    '*.cjs',
  ],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    // 依赖数组的取舍交给开发者判断，不阻断 CI
    'react-hooks/exhaustive-deps': 'off',
    // 交给 TS 的 noUnusedLocals/Parameters 统一处理，避免重复报告
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
}
