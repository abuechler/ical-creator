// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

// Test viewports
const mobileViewport = { width: 375, height: 812 }; // iPhone 11
const desktopViewport = { width: 1440, height: 900 }; // Laptop

test.describe('Natural Language Input', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto(getPageUrl());
  });

  test.describe('Mobile viewport', () => {
    test.use({ viewport: mobileViewport });

    test('Quick Add input is visible', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await expect(quickAddInput).toBeVisible();
      await expect(quickAddInput).toHaveAttribute('placeholder', 'Try: "Team meeting tomorrow at 2pm for 1 hour"');
    });

    test('Quick Add button is visible', async ({ page }) => {
      const quickAddBtn = page.locator('#quickAddBtn');
      await expect(quickAddBtn).toBeVisible();
    });

    test('Quick Add hint text is visible', async ({ page }) => {
      const hint = page.locator('.quick-add-hint');
      await expect(hint).toBeVisible();
      await expect(hint).toContainText('Press Enter or click to auto-fill the form');
    });
  });

  test.describe('Desktop viewport', () => {
    test.use({ viewport: desktopViewport });

    test('Quick Add input is visible', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await expect(quickAddInput).toBeVisible();
    });
  });

  test.describe('Parsing functionality', () => {
    test.use({ viewport: desktopViewport });

    test('parses simple event with time', async ({ page }) => {
      // Test parseNaturalLanguage directly
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Team meeting at 2pm');
      });

      expect(result.title).toBe('Team meeting');
      expect(result.time).toEqual({ hours: 14, minutes: 0 });
    });

    test('parses event with duration', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Standup for 30 minutes');
      });

      expect(result.title).toBe('Standup');
      expect(result.duration).toBe(30);
    });

    test('parses event with hours duration', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Workshop for 2 hours');
      });

      expect(result.title).toBe('Workshop');
      expect(result.duration).toBe(120);
    });

    test('parses noon time', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Lunch at noon');
      });

      expect(result.title).toBe('Lunch');
      expect(result.time).toEqual({ hours: 12, minutes: 0 });
    });

    test('parses midnight time', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('New Year countdown at midnight');
      });

      expect(result.title).toBe('New Year countdown');
      expect(result.time).toEqual({ hours: 0, minutes: 0 });
    });

    test('parses time with minutes', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Meeting at 2:30pm');
      });

      expect(result.title).toBe('Meeting');
      expect(result.time).toEqual({ hours: 14, minutes: 30 });
    });

    test('parses AM time', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Breakfast at 8am');
      });

      expect(result.title).toBe('Breakfast');
      expect(result.time).toEqual({ hours: 8, minutes: 0 });
    });

    test('parses today date', async ({ page }) => {
      const result = await page.evaluate(() => {
        const parsed = window.parseNaturalLanguage('Appointment today');
        // Return date parts to compare
        return {
          title: parsed.title,
          hasDate: parsed.date !== null,
          isToday: parsed.date ?
            new Date(parsed.date).toDateString() === new Date().toDateString() : false
        };
      });

      expect(result.title).toBe('Appointment');
      expect(result.hasDate).toBe(true);
      expect(result.isToday).toBe(true);
    });

    test('parses tomorrow date', async ({ page }) => {
      const result = await page.evaluate(() => {
        const parsed = window.parseNaturalLanguage('Dentist tomorrow');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          title: parsed.title,
          hasDate: parsed.date !== null,
          isTomorrow: parsed.date ?
            new Date(parsed.date).toDateString() === tomorrow.toDateString() : false
        };
      });

      expect(result.title).toBe('Dentist');
      expect(result.hasDate).toBe(true);
      expect(result.isTomorrow).toBe(true);
    });

    test('parses weekly recurrence', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Team sync weekly');
      });

      expect(result.title).toBe('Team sync');
      expect(result.recurrence).toBe('WEEKLY');
    });

    test('parses daily recurrence', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Daily standup');
      });

      expect(result.title).toBe('standup');
      expect(result.recurrence).toBe('DAILY');
    });

    test('parses monthly recurrence', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Status report monthly');
      });

      expect(result.title).toBe('Status report');
      expect(result.recurrence).toBe('MONTHLY');
    });

    test('parses "every monday" pattern', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Team meeting every monday');
      });

      expect(result.title).toBe('Team meeting');
      expect(result.recurrence).toBe('WEEKLY');
    });

    test('parses "every day" pattern', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Meditation every day');
      });

      expect(result.title).toBe('Meditation');
      expect(result.recurrence).toBe('DAILY');
    });

    test('parses complex event with multiple parts', async ({ page }) => {
      const result = await page.evaluate(() => {
        return window.parseNaturalLanguage('Team meeting tomorrow at 2pm for 1 hour');
      });

      expect(result.title).toBe('Team meeting');
      expect(result.time).toEqual({ hours: 14, minutes: 0 });
      expect(result.duration).toBe(60);
      expect(result.date).not.toBeNull();
    });

    test('parses day of week', async ({ page }) => {
      const result = await page.evaluate(() => {
        const parsed = window.parseNaturalLanguage('Lunch on friday');
        return {
          title: parsed.title,
          hasDate: parsed.date !== null,
          dayOfWeek: parsed.date ? new Date(parsed.date).getDay() : null
        };
      });

      expect(result.title).toBe('Lunch');
      expect(result.hasDate).toBe(true);
      expect(result.dayOfWeek).toBe(5); // Friday
    });

    test('parses "next monday" pattern', async ({ page }) => {
      const result = await page.evaluate(() => {
        const parsed = window.parseNaturalLanguage('Meeting next monday');
        const today = new Date();
        return {
          title: parsed.title,
          hasDate: parsed.date !== null,
          dayOfWeek: parsed.date ? new Date(parsed.date).getDay() : null,
          isInFuture: parsed.date ? new Date(parsed.date) > today : false
        };
      });

      expect(result.title).toBe('Meeting');
      expect(result.hasDate).toBe(true);
      expect(result.dayOfWeek).toBe(1); // Monday
      expect(result.isInFuture).toBe(true);
    });

    test('parses month and day', async ({ page }) => {
      const result = await page.evaluate(() => {
        const parsed = window.parseNaturalLanguage('Birthday party jan 15');
        return {
          title: parsed.title,
          hasDate: parsed.date !== null,
          month: parsed.date ? new Date(parsed.date).getMonth() : null,
          day: parsed.date ? new Date(parsed.date).getDate() : null
        };
      });

      expect(result.title).toBe('Birthday party');
      expect(result.hasDate).toBe(true);
      expect(result.month).toBe(0); // January
      expect(result.day).toBe(15);
    });
  });

  test.describe('Form filling', () => {
    test.use({ viewport: desktopViewport });

    test('fills form when pressing Enter', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await quickAddInput.fill('Team meeting tomorrow at 3pm');
      await quickAddInput.press('Enter');

      // Check that title was filled
      const titleInput = page.locator('#title');
      await expect(titleInput).toHaveValue('Team meeting');

      // Check that start time was filled
      const startTime = page.locator('#startTime');
      await expect(startTime).toHaveValue('15:00');

      // Quick add input should be cleared
      await expect(quickAddInput).toHaveValue('');
    });

    test('fills form when clicking button', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      const quickAddBtn = page.locator('#quickAddBtn');

      await quickAddInput.fill('Lunch at noon');
      await quickAddBtn.click();

      // Check that title was filled
      const titleInput = page.locator('#title');
      await expect(titleInput).toHaveValue('Lunch');

      // Check that start time was filled (noon = 12:00)
      const startTime = page.locator('#startTime');
      await expect(startTime).toHaveValue('12:00');
    });

    test('fills date when parsing tomorrow', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await quickAddInput.fill('Meeting tomorrow');
      await quickAddInput.press('Enter');

      // Calculate expected date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDate = tomorrow.toISOString().split('T')[0];

      // Check that date was filled
      const startDate = page.locator('#startDate');
      await expect(startDate).toHaveValue(expectedDate);
    });

    test('enables recurrence when parsing weekly', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await quickAddInput.fill('Team sync weekly at 10am');
      await quickAddInput.press('Enter');

      // Check that recurrence is enabled
      const isRecurring = page.locator('#isRecurring');
      await expect(isRecurring).toBeChecked();

      // Check that frequency is set to WEEKLY
      const frequency = page.locator('#frequency');
      await expect(frequency).toHaveValue('WEEKLY');
    });

    test('sets end time based on duration', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await quickAddInput.fill('Workshop at 2pm for 2 hours');
      await quickAddInput.press('Enter');

      // Check that start time is 14:00
      const startTime = page.locator('#startTime');
      await expect(startTime).toHaveValue('14:00');

      // Check that end time is 16:00 (2pm + 2 hours)
      const endTime = page.locator('#endTime');
      await expect(endTime).toHaveValue('16:00');
    });

    test('does nothing when input is empty', async ({ page }) => {
      // Set a value in the title first
      const titleInput = page.locator('#title');
      await titleInput.fill('Original Title');

      // Press Enter on empty quick add
      const quickAddInput = page.locator('#quickAddInput');
      await quickAddInput.focus();
      await quickAddInput.press('Enter');

      // Title should remain unchanged
      await expect(titleInput).toHaveValue('Original Title');
    });

    test('preview updates after quick add', async ({ page }) => {
      const quickAddInput = page.locator('#quickAddInput');
      await quickAddInput.fill('Conference tomorrow at 9am');
      await quickAddInput.press('Enter');

      // Preview section should be visible
      const previewSection = page.locator('#previewSection');
      await expect(previewSection).toBeVisible();
    });
  });
});
