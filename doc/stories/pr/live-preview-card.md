# Live Event Card Preview

## Description
Show a styled card preview of the event as it would appear in a calendar app, updating in real-time as the user fills the form.

## User Value
- **Visual feedback**: See how the event will look before downloading
- **Error prevention**: Catch mistakes before saving
- **Professional**: Modern, app-like experience

## Implementation Details
- Add event card component next to or below the form
- Display: title, date/time, location, description preview
- Update in real-time as form fields change
- Show recurrence badge if event is recurring
- Show reminder indicator if enabled
- Responsive design for mobile/desktop

## Planning Decisions

### Start Timestamp
2026-01-09 01:51:00

### Implementation Plan
1. Add event card component in the preview section
2. Style card to look like a calendar app event card
3. Show event title, date/time, location, description
4. Add badges for recurrence and reminder
5. Update card in real-time as form changes
6. Write Playwright tests for card updates

### Assumptions
- Card will be shown in the existing preview section
- Will display a truncated description (first ~100 chars)
- Will use existing form change handlers to trigger updates
- Card styling will match overall app theme

### End Timestamp
2026-01-09 02:10:00

### Duration
~19 minutes (planning and implementation)

## Screenshots

### Desktop View
![Event card preview on desktop](screenshots/live-preview-card-desktop.png)

### Mobile View
![Event card preview on mobile](screenshots/live-preview-card-mobile.png)
