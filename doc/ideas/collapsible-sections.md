# Collapsible Form Sections

## Description
Make form sections (Event Details, Recurrence, Reminder) collapsible to reduce visual clutter and focus on one section at a time.

## User Value
- **Focus**: See only what you're working on
- **Clean UI**: Less overwhelming for new users
- **Mobile**: Better use of screen space

## Implementation Details
- Add collapse/expand toggle to each card header
- Animate expand/collapse smoothly
- Remember collapsed state in localStorage
- Show summary when collapsed (e.g., "Weekly, Mon/Wed/Fri")
- Auto-expand section with validation errors
