# Calendar App Deep Links

## Description
Add buttons to directly add the event to popular calendar apps (Google Calendar, Outlook, Apple Calendar) without downloading the ICS file.

## User Value
- **Convenience**: One-click calendar addition
- **Cross-platform**: Works with major calendar providers
- **No file handling**: Skip the download/import process

## Implementation Details
- Add "Add to Calendar" dropdown/buttons after Download button
- Support Google Calendar URL scheme
- Support Outlook.com web URL scheme
- Support Yahoo Calendar URL scheme
- Use webcal: protocol for Apple Calendar
- All links open in new tab

## Planning Decisions

### Start Timestamp
2026-01-09 02:12:00

### Implementation Plan
1. Add "Add to Calendar" dropdown button after Download
2. Create functions to generate calendar-specific URLs
3. Google Calendar: Use calendar.google.com/calendar/render URL
4. Outlook: Use outlook.live.com/calendar/action/compose URL
5. Yahoo: Use calendar.yahoo.com URL scheme
6. Add icons for each calendar provider
7. Write tests for URL generation

### Assumptions
- Will use URL schemes that work without authentication
- Links open in new tab/window
- Event data is URL-encoded for all services
- Focus on web-based calendar services for broader compatibility
- Apple Calendar webcal: protocol not included (requires serving ICS file over HTTP)

### End Timestamp
2026-01-09 02:22:00

### Duration
10 minutes

## Screenshots

### Desktop View (1440x900)
![Calendar Deep Links Desktop](screenshots/calendar-deep-links-desktop.png)

### Mobile View (375x812)
![Calendar Deep Links Mobile](screenshots/calendar-deep-links-mobile.png)
