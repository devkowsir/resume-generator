import pluginJs from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { ecmaVersion: 'latest' },
  },
  pluginJs.configs.recommended,
  eslintPluginPrettierRecommended,
];
