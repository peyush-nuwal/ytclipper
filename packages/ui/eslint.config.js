import config from '@ytclipper/eslint-config/react.js';

export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // UI package specific overrides
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['buttonVariants'] },
      ],
    },
  },
];
