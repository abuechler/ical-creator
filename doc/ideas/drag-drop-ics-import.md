# Drag & Drop ICS Import

## Description
Allow users to drag and drop an existing .ics file onto the page to import and edit it.

## User Value
- **Edit existing**: Modify events from other calendars
- **Convenience**: Drag file instead of recreating
- **Migration**: Import events from other apps

## Implementation Details
- Add drop zone overlay when dragging file
- Parse .ics file using ical.js library (already included)
- Fill form with parsed event data
- Support single-event .ics files
- Show error for invalid/multi-event files
- Visual feedback during drag
