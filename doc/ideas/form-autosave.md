# Form Auto-Save Recovery

## Description
Automatically save form state periodically and offer to recover if user accidentally closes/refreshes the page.

## User Value
- **Safety**: Don't lose work on accidental close
- **Recovery**: Resume where you left off
- **Confidence**: Users don't fear losing data

## Implementation Details
- Auto-save form to localStorage every 30 seconds
- On page load, check for unsaved form data
- Show "Recover unsaved event?" prompt
- Clear autosave after successful download
- Show subtle "Draft saved" indicator
