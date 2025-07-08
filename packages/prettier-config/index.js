export default {
  // Basic formatting
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',

  // Indentation and spacing
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,

  // JSX formatting
  jsxSingleQuote: true,
  jsxBracketSameLine: false,

  // Other formatting options
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  insertPragma: false,
  proseWrap: 'preserve',
  requirePragma: false,

  // File-specific overrides
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 120,
        proseWrap: 'always',
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false,
        tabWidth: 2,
      },
    },
  ],
};
