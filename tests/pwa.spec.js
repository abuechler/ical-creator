// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('PWA Feature', () => {
  test('should have manifest link in head', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/ical-creator.html');

    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.json');
  });

  test('should have valid manifest.json file', async ({ page: _page }) => {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Check required PWA manifest properties
    expect(manifest.name).toBe('iCal Creator');
    expect(manifest.short_name).toBe('iCal');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBeDefined();
    expect(manifest.theme_color).toBe('#0d9488');
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should have service worker file', async () => {
    const swPath = path.join(process.cwd(), 'sw.js');
    const exists = fs.existsSync(swPath);
    expect(exists).toBe(true);
  });

  test('should have PWA meta tags', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/ical-creator.html');

    // Check theme-color meta tag
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#0d9488');

    // Check apple-mobile-web-app-capable
    const appleMeta = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleMeta).toHaveAttribute('content', 'yes');

    // Check apple-mobile-web-app-title
    const appleTitle = page.locator('meta[name="apple-mobile-web-app-title"]');
    await expect(appleTitle).toHaveAttribute('content', 'iCal Creator');
  });

  test('should have apple-touch-icon link', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/ical-creator.html');

    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveAttribute('href', 'icons/icon-192.png');
  });

  test('should have install button in header (initially hidden)', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/ical-creator.html');

    const installBtn = page.locator('#installBtn');
    await expect(installBtn).toBeAttached();
    // Button should be hidden by default (no beforeinstallprompt event)
    await expect(installBtn).not.toBeVisible();
  });

  test('should have PWA icons directory with valid files', async () => {
    const icon192Path = path.join(process.cwd(), 'icons', 'icon-192.png');
    const icon512Path = path.join(process.cwd(), 'icons', 'icon-512.png');

    expect(fs.existsSync(icon192Path)).toBe(true);
    expect(fs.existsSync(icon512Path)).toBe(true);

    // Check that icons have some content (not empty)
    const icon192Size = fs.statSync(icon192Path).size;
    const icon512Size = fs.statSync(icon512Path).size;

    expect(icon192Size).toBeGreaterThan(100);
    expect(icon512Size).toBeGreaterThan(100);
  });

  test('should have description meta tag', async ({ page }) => {
    await page.goto('file://' + process.cwd() + '/ical-creator.html');

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /calendar events/);
  });

  test('service worker should have caching logic', async () => {
    const swPath = path.join(process.cwd(), 'sw.js');
    const swContent = fs.readFileSync(swPath, 'utf8');

    // Check for essential service worker patterns
    expect(swContent).toContain('install');
    expect(swContent).toContain('activate');
    expect(swContent).toContain('fetch');
    expect(swContent).toContain('caches');
    expect(swContent).toContain('CACHE_NAME');
  });

  test('manifest should reference icons that exist', async () => {
    const manifestPath = path.join(process.cwd(), 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    for (const icon of manifest.icons) {
      const iconPath = path.join(process.cwd(), icon.src);
      expect(fs.existsSync(iconPath)).toBe(true);
    }
  });
});
