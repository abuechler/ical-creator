# Emoji Picker

## Description
Add an emoji picker button next to the event title field, allowing users to easily add emojis to their event titles. This makes events more visually distinctive and expressive.

## User Value
- **Visual Distinction**: Emojis help events stand out in calendars
- **Quick Access**: No need to memorize emoji keyboard shortcuts
- **Expressive**: Users can add personality to their events
- **Cross-Platform**: Works consistently across devices

## Implementation Details
- Add an emoji button next to the title input field
- Show a popup/dropdown with common emojis when clicked
- Clicking an emoji inserts it at the cursor position in the title field
- Include categories: Calendar/Events, Activities, Objects, Symbols
- Make it accessible and keyboard-friendly

## Planning Decisions

### Start Timestamp
2026-01-09 03:52:00

### Implementation Plan
1. Add emoji button next to title field in HTML
2. Create emoji picker popup component with CSS
3. Implement JavaScript for emoji selection and insertion
4. Organize emojis into logical categories
5. Write Playwright tests

### Assumptions
- Use a simple dropdown/popup approach (no external library)
- Include commonly used emojis for events (calendar, activities, celebrations)
- Insert emoji at cursor position or append to title
- Close picker when clicking outside or selecting an emoji
- Mobile-friendly design

### End Timestamp
2026-01-09 04:08:00

### Duration
16 minutes

## Screenshots

### Desktop (1440x900)
![Emoji Picker Desktop](screenshots/emoji-picker-desktop.png)

### Mobile (375x812)
![Emoji Picker Mobile](screenshots/emoji-picker-mobile.png)
