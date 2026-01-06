// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'file://' + __dirname + '/ical-creator.html',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Mobile Firefox',
      use: {
        browserName: 'firefox',
        viewport: { width: 375, height: 812 },
        // Note: Firefox doesn't support isMobile, so we just use viewport
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],

  webServer: undefined,
});
