import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

/**
 * ESLint 9 flat config.
 *
 * The `no-restricted-*` rules below are not style preferences — they encode the
 * architectural constraints in context/system-rules.md so that violating one
 * fails CI instead of silently shipping. Read that document before relaxing any
 * of them.
 */
export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'node-v20.11.1-win-x64/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': { typescript: true, node: true },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // --- TypeScript -----------------------------------------------------
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // ExcelRow values are legitimately `any` — a cell can hold anything.
      // Warn rather than error so the existing code is not blocked, but keep
      // the pressure on for new code.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // --- Architectural constraints (context/system-rules.md) -----------
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'This app is client-only and makes no network requests. Spreadsheet data must not leave the browser. See context/system-rules.md §1.',
        },
        {
          name: 'XMLHttpRequest',
          message:
            'This app is client-only and makes no network requests. See context/system-rules.md §1.',
        },
        {
          name: 'localStorage',
          message:
            'Nothing is persisted by design — a reload clears all state. See context/system-rules.md §1.',
        },
        {
          name: 'sessionStorage',
          message:
            'Nothing is persisted by design — a reload clears all state. See context/system-rules.md §1.',
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'xlsx',
              message:
                'Import readExcelFile / downloadExcelFile from src/lib/excel instead, so the raw:false and defval:"" contract stays in one place. See context/system-rules.md §4.',
            },
          ],
          patterns: [
            {
              group: ['../../features/*'],
              message:
                'Features must not reach into each other. Lift the shared piece into src/lib, src/components or src/types.',
            },
          ],
        },
      ],

      // --- General --------------------------------------------------------
      // Warning, not error: the existing panels use alert() throughout.
      // Ratchet to 'error' once they have an inline error surface.
      'no-alert': 'warn',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // The excel wrapper is the one place allowed to import xlsx directly.
  // Two paths listed: the current location, and where the restructure moves it.
  {
    files: ['utils/excelUtils.ts', 'src/lib/excel/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // The logger is the one place allowed to call console freely.
  {
    files: ['src/lib/logger.ts'],
    rules: { 'no-console': 'off' },
  },

  // Tests get a looser leash.
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-globals': 'off',
    },
  },

  // Node-context config files.
  {
    files: ['*.config.{ts,js,mjs}', 'scripts/**/*.{ts,js,mjs}'],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },

  // ---------------------------------------------------------------------------
  // Legacy allowance.
  //
  // The panels below predate the linter. Rather than rewrite working code to
  // introduce tooling - or worse, disable the rules outright - these are
  // demoted to warnings HERE ONLY. Anything new, under src/, still errors.
  //
  // Ratchet each back to 'error' as the corresponding cleanup lands:
  //   - consistent-type-imports / no-unused-vars: mechanical, `npm run lint:fix`
  //   - jsx-a11y: real accessibility debt, needs labels wiring up
  //   - set-state-in-effect: the self-healing selection effect in every panel
  // ---------------------------------------------------------------------------
  {
    files: ['App.tsx', 'components/**/*.tsx', 'utils/**/*.ts', 'types.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-case-declarations': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
    },
  },

  prettier,
);
