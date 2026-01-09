# Confirmation Dialogs

## Description
Add confirmation dialogs before destructive actions like "Clear All" saved events or "Delete" to prevent accidental data loss.

## User Value
- **Safety**: Prevent accidental deletions
- **Confidence**: Users feel secure making changes
- **Recovery**: Chance to cancel mistakes

## Implementation Details
- Add confirm dialog for "Clear All" button
- Add confirm dialog for individual "Delete" buttons
- Dialog shows what will be deleted
- Use native confirm() or custom modal
- "New Event" doesn't need confirmation (just clears form)
