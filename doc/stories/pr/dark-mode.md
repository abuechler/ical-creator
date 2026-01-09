# Dark Mode Theme

## Description
Add a dark mode toggle to switch between light and dark color schemes. Dark mode reduces eye strain in low-light environments and is a popular feature.

## User Value
- **Comfort**: Easier on eyes in dark environments
- **Battery**: OLED screens use less power in dark mode
- - **Preference**: User choice for appearance
- **Modern**: Expected feature in modern web apps

## Implementation Details
- Add theme toggle button in header (sun/moon icon)
- Toggle switches between light and dark themes
- Dark theme colors:
  - Background: Dark gray (#1a1a1a)
  - Cards: Slightly lighter (#2d2d2d)
  - Text: Light gray/white
  - Primary button: Maintain teal but adjust brightness
- Persist theme preference in localStorage
- Respect system preference on first visit (prefers-color-scheme)

## Technical Considerations
- Use CSS variables for theme colors
- Add data-theme attribute to body element
- Smooth transition between themes
- Ensure sufficient contrast (WCAG AA)
- Test all UI elements in both themes
- Update calendar colors for dark mode

## Planning Decisions

### Start Timestamp
2026-01-09 00:45:00

### Implementation Plan
1. Add CSS variables for all colors in :root (light theme default)
2. Add [data-theme="dark"] selector with dark color overrides
3. Add theme toggle button in header with sun/moon SVG icons
4. Add JavaScript to toggle data-theme attribute on body
5. Persist preference in localStorage key 'theme'
6. On load, check localStorage, then system preference (prefers-color-scheme)
7. Add smooth transition for color changes
8. Write Playwright tests for theme toggle functionality
9. Take screenshots in both themes, both viewports

### Assumptions
- Will use inline SVG for sun/moon icons (no external dependencies)
- Dark mode colors: bg #1a1a2e, cards #16213e, text #e8e8e8, accent #0ea5e9
- Toggle button placed in header next to privacy info button

### Screenshots
- Light mode desktop: ![Light Desktop](../screenshots/dark-mode/dark-mode-light-desktop.png)
- Dark mode desktop: ![Dark Desktop](../screenshots/dark-mode/dark-mode-dark-desktop.png)
- Light mode mobile: ![Light Mobile](../screenshots/dark-mode/dark-mode-light-mobile.png)
- Dark mode mobile: ![Dark Mobile](../screenshots/dark-mode/dark-mode-dark-mobile.png)

### End Timestamp
2026-01-09 01:15:00

### Duration
30 minutes
