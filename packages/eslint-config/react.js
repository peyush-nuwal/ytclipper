import baseConfig from './index.js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  ...baseConfig,
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React rules
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/jsx-uses-vars': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-pascal-case': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-is-mounted': 'error',
      'react/no-typos': 'error',
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React Refresh rules
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // React best practices
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        { props: 'never', children: 'never' },
      ],
      'react/jsx-fragments': ['error', 'syntax'],
      'react/jsx-no-useless-fragment': 'error',
      'react/no-array-index-key': 'warn',
    },
  },
];
