// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

// Helper to scroll element into view and interact with checkboxes
// For toggle-style checkboxes with hidden inputs, click on the adjacent slider
async function scrollAndCheck(page, selector) {
  const element = page.locator(selector);

  // Check if this is a toggle-style checkbox (parent has toggle-switch class)
  const isToggle = await element.locator('xpath=..').evaluate(el => el.classList.contains('toggle-switch'));

  if (isToggle) {
    // Click on the toggle slider sibling
    const slider = element.locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
  } else {
    await element.scrollIntoViewIfNeeded();
    await element.check({ force: true });
  }
}

// Test viewports
const mobileViewport = { width: 375, height: 812 }; // iPhone 11
const desktopViewport = { width: 1440, height: 900 }; // Laptop

test.describe('Live Event Card Preview', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto(getPageUrl());
  });

  test.describe('Mobile viewport', () => {
    test.use({ viewport: mobileViewport });

    test('event card preview is visible when there is a start date', async ({ page }) => {
      // Card should be visible since demo events load by default
      const eventCard = page.locator('.event-card');
      await expect(eventCard).toBeVisible();
    });

    test('event card shows default title', async ({ page }) => {
      // Clear form first
      await page.click('#newEventBtn');
      const eventCardTitle = page.locator('#eventCardTitle');
      await expect(eventCardTitle).toHaveText('Event Title');
    });
  });

  test.describe('Desktop viewport', () => {
    test.use({ viewport: desktopViewport });

    test('event card preview is visible', async ({ page }) => {
      const eventCard = page.locator('.event-card');
      await expect(eventCard).toBeVisible();
    });

    test('event card has color bar', async ({ page }) => {
      const colorBar = page.locator('.event-card-color-bar');
      await expect(colorBar).toBeVisible();
    });
  });

  test.describe('Real-time updates', () => {
    test.use({ viewport: desktopViewport });

    test('title updates as user types', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#title', 'My Test Event');

      const eventCardTitle = page.locator('#eventCardTitle');
      await expect(eventCardTitle).toHaveText('My Test Event');
    });

    test('date and time update when changed', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await page.fill('#startTime', '14:30');

      const dateTimeText = page.locator('#eventCardDateTime span');
      // Should contain the formatted date
      await expect(dateTimeText).toContainText('Mar');
      await expect(dateTimeText).toContainText('15');
      await expect(dateTimeText).toContainText('2:30 PM');
    });

    test('shows all day indicator when all-day is checked', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await scrollAndCheck(page, '#allDay');

      const dateTimeText = page.locator('#eventCardDateTime span');
      await expect(dateTimeText).toContainText('All day');
    });

    test('location appears when filled', async ({ page }) => {
      await page.click('#newEventBtn');
      const locationRow = page.locator('#eventCardLocation');

      // Initially hidden
      await expect(locationRow).toBeHidden();

      // Fill location
      await page.fill('#location', 'Conference Room A');

      // Now visible
      await expect(locationRow).toBeVisible();
      await expect(locationRow.locator('span')).toHaveText('Conference Room A');
    });

    test('description appears when filled', async ({ page }) => {
      await page.click('#newEventBtn');
      const descriptionRow = page.locator('#eventCardDescription');

      // Initially hidden
      await expect(descriptionRow).toBeHidden();

      // Fill description
      await page.fill('#description', 'This is a test description for the event.');

      // Now visible
      await expect(descriptionRow).toBeVisible();
      await expect(descriptionRow.locator('span')).toContainText('This is a test description');
    });

    test('description is truncated when too long', async ({ page }) => {
      await page.click('#newEventBtn');
      const longDescription = 'This is a very long description that should be truncated because it exceeds the maximum character limit that we have set for the event card preview display area.';
      await page.fill('#description', longDescription);

      // Trigger change event explicitly
      await page.locator('#description').dispatchEvent('change');

      // Wait for debounced update
      await page.waitForTimeout(200);

      const descriptionText = page.locator('#eventCardDescription span');
      await expect(descriptionText).not.toBeEmpty();
      const text = await descriptionText.textContent();

      // Text should be truncated (with ellipsis) so should be shorter than original
      // The truncation happens at 100 characters + "..."
      expect(text?.length).toBeLessThanOrEqual(103); // 100 chars + "..."
    });
  });

  test.describe('Badges', () => {
    test.use({ viewport: desktopViewport });

    test('recurring badge appears when recurring is enabled', async ({ page }) => {
      await page.click('#newEventBtn');
      const recurringBadge = page.locator('#eventCardBadgeRecurring');

      // Initially hidden
      await expect(recurringBadge).toBeHidden();

      // Enable recurring
      await scrollAndCheck(page, '#isRecurring');

      // Now visible
      await expect(recurringBadge).toBeVisible();
    });

    test('recurring badge shows correct frequency', async ({ page }) => {
      await page.click('#newEventBtn');
      await scrollAndCheck(page, '#isRecurring');

      // Default is Daily (first option)
      const recurrenceText = page.locator('#eventCardRecurrenceText');
      await expect(recurrenceText).toHaveText('Daily');

      // Change to Weekly
      await page.selectOption('#frequency', 'WEEKLY');
      await expect(recurrenceText).toHaveText('Weekly');

      // Change to Monthly
      await page.selectOption('#frequency', 'MONTHLY');
      await expect(recurrenceText).toHaveText('Monthly');
    });

    test('reminder badge appears when reminder is enabled', async ({ page }) => {
      await page.click('#newEventBtn');
      const reminderBadge = page.locator('#eventCardBadgeReminder');

      // Initially hidden
      await expect(reminderBadge).toBeHidden();

      // Enable reminder
      await scrollAndCheck(page, '#hasReminder');

      // Now visible
      await expect(reminderBadge).toBeVisible();
    });

    test('both badges can be shown together', async ({ page }) => {
      await page.click('#newEventBtn');

      // Enable both
      await scrollAndCheck(page, '#isRecurring');
      await scrollAndCheck(page, '#hasReminder');

      // Both visible
      const recurringBadge = page.locator('#eventCardBadgeRecurring');
      const reminderBadge = page.locator('#eventCardBadgeReminder');

      await expect(recurringBadge).toBeVisible();
      await expect(reminderBadge).toBeVisible();
    });
  });

  test.describe('Time formatting', () => {
    test.use({ viewport: desktopViewport });

    test('formats AM time correctly', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await page.fill('#startTime', '09:30');

      const dateTimeText = page.locator('#eventCardDateTime span');
      await expect(dateTimeText).toContainText('9:30 AM');
    });

    test('formats PM time correctly', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await page.fill('#startTime', '15:00');

      const dateTimeText = page.locator('#eventCardDateTime span');
      await expect(dateTimeText).toContainText('3:00 PM');
    });

    test('formats noon correctly', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await page.fill('#startTime', '12:00');

      const dateTimeText = page.locator('#eventCardDateTime span');
      await expect(dateTimeText).toContainText('12:00 PM');
    });

    test('formats midnight correctly', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await page.fill('#startTime', '00:00');

      const dateTimeText = page.locator('#eventCardDateTime span');
      await expect(dateTimeText).toContainText('12:00 AM');
    });

    test('shows time range when end time is set', async ({ page }) => {
      await page.click('#newEventBtn');
      await page.fill('#startDate', '2026-03-15');
      await page.fill('#startTime', '14:00');
      await page.fill('#endTime', '15:30');

      const dateTimeText = page.locator('#eventCardDateTime span');
      await expect(dateTimeText).toContainText('2:00 PM - 3:30 PM');
    });
  });
});
