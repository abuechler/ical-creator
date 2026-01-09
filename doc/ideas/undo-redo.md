# Undo/Redo Actions

## Description
Add undo/redo functionality for form changes, allowing users to step back through recent edits.

## User Value
- **Safety**: Recover from mistakes
- **Experiment**: Try changes without fear
- **Efficiency**: Quick correction of errors

## Implementation Details
- Track form state changes in history array
- Ctrl+Z to undo, Ctrl+Shift+Z to redo
- Add undo/redo buttons in form area
- Keep last 10-20 states
- Clear history on "New Event"
