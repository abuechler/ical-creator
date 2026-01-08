const playwright = require('eslint-plugin-playwright');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'test-output/**',
      'test-results/**',
      'playwright-report/**',
      'validator/**'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        location: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        confirm: 'readonly',
        alert: 'readonly',
        ICAL: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'never'],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error'
    }
  },
  {
    files: ['tests/**/*.spec.js'],
    ...playwright.configs['flat/recommended'],
    languageOptions: {
      ...playwright.configs['flat/recommended'].languageOptions,
      globals: {
        ...playwright.configs['flat/recommended'].languageOptions?.globals,
        state: 'writable'
      }
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': 'warn',
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-wait-for-selector': 'warn',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-conditional-expect': 'warn',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-force-option': 'warn',
      'playwright/prefer-web-first-assertions': 'warn'
    }
  },
  {
    files: ['playwright.config.js'],
    languageOptions: {
      globals: {
        defineConfig: 'readonly',
        devices: 'readonly'
      }
    }
  }
];
