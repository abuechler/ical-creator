// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper to get the file URL for the HTML page
const getPageUrl = () => {
  return 'file://' + path.resolve(__dirname, '../ical-creator.html');
};

// Helper to scroll and interact with elements
async function scrollAndClick(page, selector) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.click();
}

async function scrollAndFill(page, selector, value) {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await element.fill(value);
}

async function scrollAndCheck(page, selector) {
  const element = page.locator(selector);
  const isToggle = await element.locator('xpath=..').evaluate(el => el.classList.contains('toggle-switch'));

  if (isToggle) {
    const slider = element.locator('xpath=following-sibling::span[@class="toggle-slider"]');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
  } else {
    await element.scrollIntoViewIfNeeded();
    await element.check({ force: true });
  }
}

test.describe('QR Code - Button UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display QR Code button', async ({ page }) => {
    const qrBtn = page.locator('#generateQRBtn');
    await expect(qrBtn).toBeVisible();
    await expect(qrBtn).toHaveText(/QR Code/);
  });

  test('should have QR icon in button', async ({ page }) => {
    const qrBtn = page.locator('#generateQRBtn');
    const svg = qrBtn.locator('svg');
    await expect(svg).toBeVisible();
  });
});

test.describe('QR Code - Modal UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should validate form before opening modal', async ({ page }) => {
    // Clear required title field
    await scrollAndFill(page, '#title', '');

    // Click QR button
    await scrollAndClick(page, '#generateQRBtn');

    // Modal should not be visible, error should show
    await expect(page.locator('#qrModal')).not.toBeVisible();
    await expect(page.locator('#title-error')).toBeVisible();
  });

  test('should open modal when form is valid', async ({ page }) => {
    // Fill in required fields
    await scrollAndFill(page, '#title', 'Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    // Click QR button
    await scrollAndClick(page, '#generateQRBtn');

    // Modal should be visible
    await expect(page.locator('#qrModal')).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    // Open modal
    await scrollAndClick(page, '#generateQRBtn');
    await expect(page.locator('#qrModal')).toBeVisible();

    // Close modal
    await scrollAndClick(page, '#qrModalClose');
    await expect(page.locator('#qrModal')).not.toBeVisible();
  });

  test('should close modal when clicking overlay', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    // Open modal
    await scrollAndClick(page, '#generateQRBtn');
    await expect(page.locator('#qrModal')).toBeVisible();

    // Click overlay (not the modal itself)
    await page.locator('#qrModal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#qrModal')).not.toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    // Open modal
    await scrollAndClick(page, '#generateQRBtn');
    await expect(page.locator('#qrModal')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#qrModal')).not.toBeVisible();
  });

  test('should update aria-hidden when modal opens/closes', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    const modal = page.locator('#qrModal');

    // Initially hidden
    await expect(modal).toHaveAttribute('aria-hidden', 'true');

    // Open
    await scrollAndClick(page, '#generateQRBtn');
    await expect(modal).toHaveAttribute('aria-hidden', 'false');

    // Close
    await page.keyboard.press('Escape');
    await expect(modal).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('QR Code - Generation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('should generate QR code with canvas or image', async ({ page }) => {
    await scrollAndFill(page, '#title', 'QR Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    // Open modal
    await scrollAndClick(page, '#generateQRBtn');

    // Wait for QR code to be generated
    await page.waitForTimeout(500);

    // Check if canvas or img is present in container
    const container = page.locator('#qrCodeContainer');
    const hasCanvas = await container.locator('canvas').count() > 0;
    const hasImg = await container.locator('img').count() > 0;

    expect(hasCanvas || hasImg).toBe(true);
  });

  test('should show Download QR Code button', async ({ page }) => {
    await scrollAndFill(page, '#title', 'QR Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    await scrollAndClick(page, '#generateQRBtn');

    const downloadBtn = page.locator('#downloadQRBtn');
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toHaveText(/Download QR Code/);
  });

  test('should show modal description', async ({ page }) => {
    await scrollAndFill(page, '#title', 'QR Test Event');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    await scrollAndClick(page, '#generateQRBtn');

    const description = page.locator('.qr-modal-description');
    await expect(description).toBeVisible();
    await expect(description).toContainText('Scan this QR code');
  });
});

test.describe('QR Code - URL Parameters', () => {

  test('should load event from URL parameters', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'URL Test Event',
      startDate: '2026-05-20',
      startTime: '14:30',
      location: 'Test Location',
      description: 'Test Description'
    });

    await page.goto(getPageUrl() + '?' + params.toString());
    await page.waitForLoadState('domcontentloaded');

    // Check that form fields are populated
    await expect(page.locator('#title')).toHaveValue('URL Test Event');
    await expect(page.locator('#startDate')).toHaveValue('2026-05-20');
    await expect(page.locator('#startTime')).toHaveValue('14:30');
    await expect(page.locator('#location')).toHaveValue('Test Location');
    await expect(page.locator('#description')).toHaveValue('Test Description');
  });

  test('should load all-day event from URL parameters', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'All Day URL Event',
      startDate: '2026-05-20',
      allDay: 'true'
    });

    await page.goto(getPageUrl() + '?' + params.toString());
    await page.waitForLoadState('domcontentloaded');

    // Check all-day checkbox
    await expect(page.locator('#allDay')).toBeChecked();
  });

  test('should load recurring event from URL parameters', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'Weekly URL Event',
      startDate: '2026-05-20',
      startTime: '10:00',
      recurring: 'true',
      frequency: 'WEEKLY',
      days: 'MO,WE,FR'
    });

    await page.goto(getPageUrl() + '?' + params.toString());
    await page.waitForLoadState('domcontentloaded');

    // Check recurrence is enabled
    await expect(page.locator('#isRecurring')).toBeChecked();
    await expect(page.locator('#frequency')).toHaveValue('WEEKLY');
  });

  test('should load reminder from URL parameters', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'Reminder URL Event',
      startDate: '2026-05-20',
      startTime: '10:00',
      reminder: 'true',
      reminderTime: '30'
    });

    await page.goto(getPageUrl() + '?' + params.toString());
    await page.waitForLoadState('domcontentloaded');

    // Check reminder is enabled
    await expect(page.locator('#hasReminder')).toBeChecked();
    await expect(page.locator('#reminderTime')).toHaveValue('30');
  });

  test('should clear URL parameters after loading', async ({ page }) => {
    const params = new URLSearchParams({
      title: 'Clean URL Event',
      startDate: '2026-05-20'
    });

    await page.goto(getPageUrl() + '?' + params.toString());
    await page.waitForLoadState('domcontentloaded');

    // Wait for URL to be cleaned
    await page.waitForTimeout(500);

    // URL should not have parameters
    const url = page.url();
    expect(url).not.toContain('title=');
    expect(url).not.toContain('startDate=');
  });
});

test.describe('QR Code - Mobile View', () => {

  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 11

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('QR Code button should be visible on mobile', async ({ page }) => {
    const qrBtn = page.locator('#generateQRBtn');
    await expect(qrBtn).toBeVisible();
  });

  test('Modal should open on mobile', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Mobile Test');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    await scrollAndClick(page, '#generateQRBtn');
    await expect(page.locator('#qrModal')).toBeVisible();
  });

  test('QR code should be visible in modal on mobile', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Mobile Test');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    await scrollAndClick(page, '#generateQRBtn');
    await page.waitForTimeout(500);

    const container = page.locator('#qrCodeContainer');
    const hasCanvas = await container.locator('canvas').count() > 0;
    const hasImg = await container.locator('img').count() > 0;

    expect(hasCanvas || hasImg).toBe(true);
  });
});

test.describe('QR Code - Desktop View', () => {

  test.use({ viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto(getPageUrl());
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test('QR Code button should be visible on desktop', async ({ page }) => {
    const qrBtn = page.locator('#generateQRBtn');
    await expect(qrBtn).toBeVisible();
  });

  test('Modal should be properly centered on desktop', async ({ page }) => {
    await scrollAndFill(page, '#title', 'Desktop Test');
    await scrollAndFill(page, '#startDate', '2026-03-15');
    await scrollAndFill(page, '#startTime', '10:00');

    await scrollAndClick(page, '#generateQRBtn');

    const modal = page.locator('#qrModal .modal');
    const modalBox = await modal.boundingBox();

    // Modal should be roughly centered
    const viewportWidth = 1440;
    const expectedCenter = viewportWidth / 2;
    const modalCenter = modalBox.x + modalBox.width / 2;

    expect(Math.abs(modalCenter - expectedCenter)).toBeLessThan(50);
  });
});
