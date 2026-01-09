// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Dark Mode Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('file://' + process.cwd() + '/ical-creator.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should show theme toggle button in header', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');
    await expect(themeToggle).toBeVisible();
    await expect(themeToggle).toHaveAttribute('aria-label', 'Toggle dark mode');
  });

  test('should start in light mode by default (no saved preference)', async ({ page }) => {
    // Check that dark theme is not applied
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');

    // Moon icon should be visible in light mode
    const moonIcon = page.locator('#themeToggle .moon-icon');
    await expect(moonIcon).toBeVisible();
  });

  test('should toggle to dark mode when clicked', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');

    // Click to toggle to dark mode
    await themeToggle.click();

    // Check theme attribute
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Sun icon should be visible in dark mode
    const sunIcon = page.locator('#themeToggle .sun-icon');
    await expect(sunIcon).toBeVisible();
  });

  test('should toggle back to light mode when clicked again', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');

    // Click twice to go dark then light
    await themeToggle.click();
    await themeToggle.click();

    // Check theme attribute
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');

    // Toggle to dark mode
    await themeToggle.click();

    // Check localStorage
    const savedTheme = await page.evaluate(() => localStorage.getItem('icalCreator_theme'));
    expect(savedTheme).toBe('dark');

    // Reload page and check theme is still dark
    await page.reload();
    const themeAfterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(themeAfterReload).toBe('dark');
  });

  test('should apply dark mode styles to page background', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');

    // Toggle to dark mode
    await themeToggle.click();

    // Wait for transition
    await page.waitForTimeout(400);

    // Verify dark theme is applied
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Get dark mode background color - should be dark
    const darkBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });

    // Dark background should not be light gray (rgb(245, 245, 245))
    expect(darkBg).not.toBe('rgb(245, 245, 245)');
  });

  test('should apply dark mode styles to cards', async ({ page }) => {
    const themeToggle = page.locator('#themeToggle');

    // Toggle to dark mode
    await themeToggle.click();

    // Wait for transition
    await page.waitForTimeout(400);

    // Verify dark theme is applied
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    // Get dark mode card background color
    const card = page.locator('.card').first();
    const darkCardBg = await card.evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });

    // Dark card background should not be white (rgb(255, 255, 255))
    expect(darkCardBg).not.toBe('rgb(255, 255, 255)');
  });
});
