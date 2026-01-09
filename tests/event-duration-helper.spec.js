// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

test.describe('Event Duration Helper - Button Display', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display duration preset buttons', async ({ page }) => {
    await expect(page.locator('.duration-presets')).toBeVisible();
  });

  test('should display 30 min duration button', async ({ page }) => {
    const btn = page.locator('.duration-btn[data-duration="30"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('30 min');
  });

  test('should display 1 hour duration button', async ({ page }) => {
    const btn = page.locator('.duration-btn[data-duration="60"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('1 hour');
  });

  test('should display 2 hours duration button', async ({ page }) => {
    const btn = page.locator('.duration-btn[data-duration="120"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('2 hours');
  });

  test('should display All day duration button', async ({ page }) => {
    const btn = page.locator('.duration-btn[data-duration="allday"]');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('All day');
  });
});

test.describe('Event Duration Helper - Duration Presets', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('clicking 30 min should set end time 30 minutes after start', async ({ page }) => {
    // Set start date and time
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    // Click 30 min button
    await page.locator('.duration-btn[data-duration="30"]').click();

    // Verify end time is 10:30
    await expect(page.locator('#endTime')).toHaveValue('10:30');
    // End date should be same as start date
    await expect(page.locator('#endDate')).toHaveValue('2026-01-15');
  });

  test('clicking 1 hour should set end time 1 hour after start', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('14:00');

    await page.locator('.duration-btn[data-duration="60"]').click();

    await expect(page.locator('#endTime')).toHaveValue('15:00');
    await expect(page.locator('#endDate')).toHaveValue('2026-01-15');
  });

  test('clicking 2 hours should set end time 2 hours after start', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('09:30');

    await page.locator('.duration-btn[data-duration="120"]').click();

    await expect(page.locator('#endTime')).toHaveValue('11:30');
    await expect(page.locator('#endDate')).toHaveValue('2026-01-15');
  });

  test('clicking All day should enable all-day checkbox', async ({ page }) => {
    await page.locator('.duration-btn[data-duration="allday"]').click();

    await expect(page.locator('#allDay')).toBeChecked();
  });

  test('duration preset should handle day overflow', async ({ page }) => {
    // Set start time to 23:00 and click 2 hours
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('23:00');

    await page.locator('.duration-btn[data-duration="120"]').click();

    // End time should be 01:00 next day
    await expect(page.locator('#endTime')).toHaveValue('01:00');
    await expect(page.locator('#endDate')).toHaveValue('2026-01-16');
  });

  test('duration preset should not work without start time', async ({ page }) => {
    // Set start date but no start time
    await page.locator('#startDate').fill('2026-01-15');

    const endTimeBefore = await page.locator('#endTime').inputValue();

    // Click 30 min button
    await page.locator('.duration-btn[data-duration="30"]').click();

    // End time should not change
    await expect(page.locator('#endTime')).toHaveValue(endTimeBefore);
  });
});

test.describe('Event Duration Helper - Active State', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('clicking a duration preset should add active class', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    const btn = page.locator('.duration-btn[data-duration="60"]');
    await btn.click();

    await expect(btn).toHaveClass(/active/);
  });

  test('clicking a different preset should move active class', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    const btn30 = page.locator('.duration-btn[data-duration="30"]');
    const btn60 = page.locator('.duration-btn[data-duration="60"]');

    await btn30.click();
    await expect(btn30).toHaveClass(/active/);

    await btn60.click();
    await expect(btn60).toHaveClass(/active/);
    await expect(btn30).not.toHaveClass(/active/);
  });

  test('manually changing end time should clear active state', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    const btn = page.locator('.duration-btn[data-duration="60"]');
    await btn.click();
    await expect(btn).toHaveClass(/active/);

    // Manually change end time
    await page.locator('#endTime').fill('12:00');

    await expect(btn).not.toHaveClass(/active/);
  });
});

test.describe('Event Duration Helper - Duration Display', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display duration in minutes for short events', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endTime').fill('10:45');

    await expect(page.locator('#durationDisplay')).toHaveText('45 min');
  });

  test('should display duration in hours for 1 hour', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endTime').fill('11:00');

    await expect(page.locator('#durationDisplay')).toHaveText('1 hour');
  });

  test('should display duration in hours (plural) for multiple hours', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endTime').fill('13:00');

    await expect(page.locator('#durationDisplay')).toHaveText('3 hours');
  });

  test('should display combined hours and minutes', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');
    await page.locator('#endTime').fill('11:30');

    await expect(page.locator('#durationDisplay')).toHaveText('1h 30m');
  });

  test('should show warning for invalid duration', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('14:00');
    await page.locator('#endTime').fill('10:00');

    await expect(page.locator('#durationDisplay')).toHaveText('Invalid duration');
    await expect(page.locator('#durationDisplay')).toHaveClass(/warning/);
  });

  test('should not display duration without end time', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    const display = page.locator('#durationDisplay');
    await expect(display).toBeEmpty();
  });

  test('should display "All day" for all-day events', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#allDay').check();

    await expect(page.locator('#durationDisplay')).toHaveText('All day');
  });

  test('should display multiple days for multi-day all-day events', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#endDate').fill('2026-01-17');
    await page.locator('#allDay').check();

    await expect(page.locator('#durationDisplay')).toHaveText('3 days');
  });
});

test.describe('Event Duration Helper - All-day Integration', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('duration presets should be hidden when all-day is checked', async ({ page }) => {
    await page.locator('#allDay').check();

    await expect(page.locator('#durationPresets')).toHaveClass(/hidden/);
  });

  test('duration presets should be visible when all-day is unchecked', async ({ page }) => {
    await page.locator('#allDay').check();
    await page.locator('#allDay').uncheck();

    await expect(page.locator('#durationPresets')).not.toHaveClass(/hidden/);
  });

  test('clicking All day preset should hide other duration presets', async ({ page }) => {
    await page.locator('.duration-btn[data-duration="allday"]').click();

    await expect(page.locator('#allDay')).toBeChecked();
    await expect(page.locator('#durationPresets')).toHaveClass(/hidden/);
  });
});

test.describe('Event Duration Helper - Mobile View', () => {

  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 11

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('duration presets should be visible on mobile', async ({ page }) => {
    await expect(page.locator('.duration-presets')).toBeVisible();
  });

  test('duration presets should wrap on mobile', async ({ page }) => {
    const container = page.locator('.duration-presets');
    const containerBox = await container.boundingBox();

    // Container should not overflow the viewport
    expect(containerBox.width).toBeLessThanOrEqual(375);
  });

  test('clicking preset on mobile should work', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    await page.locator('.duration-btn[data-duration="30"]').click();

    await expect(page.locator('#endTime')).toHaveValue('10:30');
  });
});

test.describe('Event Duration Helper - Desktop View', () => {

  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('duration presets should be visible on desktop', async ({ page }) => {
    await expect(page.locator('.duration-presets')).toBeVisible();
  });

  test('duration display should update on desktop', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('09:00');
    await page.locator('#endTime').fill('17:00');

    await expect(page.locator('#durationDisplay')).toHaveText('8 hours');
  });
});

test.describe('Event Duration Helper - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('duration buttons should be type button', async ({ page }) => {
    const buttons = page.locator('.duration-btn');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('type', 'button');
    }
  });

  test('duration buttons should be keyboard accessible', async ({ page }) => {
    await page.locator('#startDate').fill('2026-01-15');
    await page.locator('#startTime').fill('10:00');

    // Focus on the button and press Enter
    await page.locator('.duration-btn[data-duration="60"]').focus();
    await page.keyboard.press('Enter');

    // End time should be set
    await expect(page.locator('#endTime')).toHaveValue('11:00');
  });

  test('duration display should have aria-live for screen readers', async ({ page }) => {
    await expect(page.locator('#durationDisplay')).toHaveAttribute('aria-live', 'polite');
  });
});
