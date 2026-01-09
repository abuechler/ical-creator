# Progressive Web App (PWA)

## Description
Make the app installable as a PWA with offline support, so users can create events without internet.

## User Value
- **Offline**: Works without internet
- **Installable**: Add to home screen like native app
- **Fast**: Cached resources load instantly

## Implementation Details
- Add manifest.json with app metadata
- Add service worker for caching
- Cache HTML, CSS, JS, and icons
- App works fully offline (localStorage is local)
- Add install prompt for supported browsers

## Planning Decisions

### Start Timestamp
2026-01-09 01:26:00

### Implementation Plan
1. Create manifest.json with app metadata (name, icons, theme color, etc.)
2. Create sw.js service worker to cache static assets
3. Update ical-creator.html to reference manifest and register service worker
4. Add install button that appears when PWA install is available
5. Cache HTML, CSS, JS files for offline use
6. Write Playwright tests for PWA functionality
7. Take screenshots of install prompt and offline indicator

### Assumptions
- Will use Workbox-like caching strategy (cache-first for assets)
- Service worker will cache: index.html, styles.css, script.js, lock.svg
- Install button will be shown in header when beforeinstallprompt fires
- PWA icons will be simple colored squares (no custom icon design)
- Theme color will be teal (#0d9488) to match app accent
- Created simple teal PNG icons (192x192 and 512x512)

### Screenshots
- Desktop: ![PWA Desktop](../screenshots/pwa/pwa-desktop.png)
- Mobile: ![PWA Mobile](../screenshots/pwa/pwa-mobile.png)

### End Timestamp
2026-01-09 01:35:00

### Duration
9 minutes
