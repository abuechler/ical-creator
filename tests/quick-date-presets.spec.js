// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

// Helper to get date in YYYY-MM-DD format (local timezone)
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayFormatted() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return formatLocalDate(today);
}

function getTomorrowFormatted() {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDate(tomorrow);
}

function getNextWeekFormatted() {
  const nextWeek = new Date();
  nextWeek.setHours(0, 0, 0, 0);
  nextWeek.setDate(nextWeek.getDate() + 7);
  return formatLocalDate(nextWeek);
}

function getNextMonthFormatted() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDate = today.getDate();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  // Handle month overflow
  if (nextMonth.getDate() !== todayDate) {
    nextMonth.setDate(0);
  }
  return formatLocalDate(nextMonth);
}

test.describe('Quick Date Presets - Button Display', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display date preset buttons', async ({ page }) => {
    await expect(page.locator('.date-presets')).toBeVisible();
  });

  test('should display Today preset button', async ({ page }) => {
    const todayBtn = page.locator('.preset-btn[data-preset="today"]');
    await expect(todayBtn).toBeVisible();
    await expect(todayBtn).toHaveText('Today');
  });

  test('should display Tomorrow preset button', async ({ page }) => {
    const tomorrowBtn = page.locator('.preset-btn[data-preset="tomorrow"]');
    await expect(tomorrowBtn).toBeVisible();
    await expect(tomorrowBtn).toHaveText('Tomorrow');
  });

  test('should display Next Week preset button', async ({ page }) => {
    const nextWeekBtn = page.locator('.preset-btn[data-preset="nextWeek"]');
    await expect(nextWeekBtn).toBeVisible();
    await expect(nextWeekBtn).toHaveText('Next Week');
  });

  test('should display Next Month preset button', async ({ page }) => {
    const nextMonthBtn = page.locator('.preset-btn[data-preset="nextMonth"]');
    await expect(nextMonthBtn).toBeVisible();
    await expect(nextMonthBtn).toHaveText('Next Month');
  });
});

test.describe('Quick Date Presets - Functionality', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('clicking Today should set start date to today', async ({ page }) => {
    await page.locator('.preset-btn[data-preset="today"]').click();

    const expectedDate = getTodayFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });

  test('clicking Tomorrow should set start date to tomorrow', async ({ page }) => {
    await page.locator('.preset-btn[data-preset="tomorrow"]').click();

    const expectedDate = getTomorrowFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });

  test('clicking Next Week should set start date to 7 days from now', async ({ page }) => {
    await page.locator('.preset-btn[data-preset="nextWeek"]').click();

    const expectedDate = getNextWeekFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });

  test('clicking Next Month should set start date to same day next month', async ({ page }) => {
    await page.locator('.preset-btn[data-preset="nextMonth"]').click();

    const expectedDate = getNextMonthFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });
});

test.describe('Quick Date Presets - Active State', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('clicking a preset should add active class to that button', async ({ page }) => {
    const todayBtn = page.locator('.preset-btn[data-preset="today"]');

    await todayBtn.click();

    await expect(todayBtn).toHaveClass(/active/);
  });

  test('clicking a preset should remove active class from other buttons', async ({ page }) => {
    const todayBtn = page.locator('.preset-btn[data-preset="today"]');
    const tomorrowBtn = page.locator('.preset-btn[data-preset="tomorrow"]');

    // Click Today first
    await todayBtn.click();
    await expect(todayBtn).toHaveClass(/active/);

    // Click Tomorrow
    await tomorrowBtn.click();
    await expect(tomorrowBtn).toHaveClass(/active/);
    await expect(todayBtn).not.toHaveClass(/active/);
  });

  test('manually changing date should clear active state', async ({ page }) => {
    const todayBtn = page.locator('.preset-btn[data-preset="today"]');

    // Click Today
    await todayBtn.click();
    await expect(todayBtn).toHaveClass(/active/);

    // Manually change date
    await page.locator('#startDate').fill('2026-12-25');

    // Active state should be cleared
    await expect(todayBtn).not.toHaveClass(/active/);
  });
});

test.describe('Quick Date Presets - Calendar Update', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('clicking a preset should show the preview section', async ({ page }) => {
    // Initially fill in title to make the form more complete
    await page.locator('#title').fill('Test Event');

    // Click Today preset
    await page.locator('.preset-btn[data-preset="today"]').click();

    // Preview section should be visible
    await expect(page.locator('#previewSection')).toBeVisible();
  });

  test('clicking a preset should update the calendar to show the selected date', async ({ page }) => {
    await page.locator('#title').fill('Test Event');

    // Click Today preset
    await page.locator('.preset-btn[data-preset="today"]').click();

    // Look for the calendar cell with today's date that has the event-day class
    const calendarCell = page.locator('.calendar-day.event-day');
    await expect(calendarCell.first()).toBeVisible();
  });
});

test.describe('Quick Date Presets - Mobile View', () => {

  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 11

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('preset buttons should be visible on mobile', async ({ page }) => {
    await expect(page.locator('.date-presets')).toBeVisible();
    await expect(page.locator('.preset-btn[data-preset="today"]')).toBeVisible();
  });

  test('preset buttons should wrap properly on mobile', async ({ page }) => {
    const container = page.locator('.date-presets');
    const containerBox = await container.boundingBox();

    // Container should not overflow the viewport
    expect(containerBox.width).toBeLessThanOrEqual(375);
  });

  test('clicking preset on mobile should set date', async ({ page }) => {
    await page.locator('.preset-btn[data-preset="tomorrow"]').click();

    const expectedDate = getTomorrowFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });
});

test.describe('Quick Date Presets - Desktop View', () => {

  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('preset buttons should be visible on desktop', async ({ page }) => {
    await expect(page.locator('.date-presets')).toBeVisible();
  });

  test('all preset buttons should be on one line on desktop', async ({ page }) => {
    const buttons = page.locator('.preset-btn');

    // Get first and last button positions
    const firstBox = await buttons.first().boundingBox();
    const lastBox = await buttons.last().boundingBox();

    // All buttons should be on the same row (similar Y position)
    expect(Math.abs(firstBox.y - lastBox.y)).toBeLessThan(5);
  });

  test('clicking preset on desktop should set date', async ({ page }) => {
    await page.locator('.preset-btn[data-preset="nextWeek"]').click();

    const expectedDate = getNextWeekFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });
});

test.describe('Quick Date Presets - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('preset buttons should be type button', async ({ page }) => {
    const buttons = page.locator('.preset-btn');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('type', 'button');
    }
  });

  test('preset buttons should be keyboard accessible', async ({ page }) => {
    // Tab to first preset button
    await page.locator('.preset-btn[data-preset="today"]').focus();
    await expect(page.locator('.preset-btn[data-preset="today"]')).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Date should be set
    const expectedDate = getTodayFormatted();
    await expect(page.locator('#startDate')).toHaveValue(expectedDate);
  });
});
