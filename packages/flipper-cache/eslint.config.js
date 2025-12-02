const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')

module.exports = tseslint.config(
  // Base recommended configs
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  // Project-aware parsing options and rules
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Ignore patterns
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '*.config.js', 'jest.config.ts', '**/*.test.ts'],
  }
)
