# Duplicate Event Feature

## Description
Add a "Duplicate" button to saved events that loads the event into the form for editing. This makes it easy to create similar events with slight modifications.

## User Value
- **Efficiency**: Quickly create similar events without re-entering all data
- **Consistency**: Maintain similar event patterns
- **Convenience**: Modify one field instead of creating from scratch

## Implementation Details
- Add "Duplicate" button next to "Load" and "Delete" in saved event cards
- Clicking "Duplicate" loads event into form (same as Load)
- Optionally increment date by default (e.g., next week/month)
- User can modify any fields before saving
- Consider renaming to include "Copy" suffix automatically

## Technical Considerations
- Reuse existing load functionality
- Generate new unique ID for duplicated event
- Increment date intelligently based on recurrence pattern
- Scroll to top of form after loading

## Planning Decisions

### Start Timestamp
2026-01-09 15:30:00

### Implementation Details
- Added "Duplicate" button next to Load and Delete buttons in saved event cards
- Created `duplicateEvent()` function that loads event data into form
- Automatically appends " (Copy)" to duplicated event title
- Clears `state.currentEventId` to ensure a new event is created when saved
- Clears exceptions for duplicated recurring events (fresh start)
- Shows success message: "Event duplicated. Modify and save as new event."
- Button styled with `btn-secondary` class (gray button)

### Screenshots
- Desktop (1440x900): Before and after duplication showing the feature in action
- Mobile (375x812): Full page view showing duplicate buttons

### End Timestamp
2026-01-09 16:00:00

### Duration
30 minutes
