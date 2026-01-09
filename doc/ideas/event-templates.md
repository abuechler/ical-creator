# Event Templates

## Description
Provide pre-configured event templates for common recurring events. Users can quickly create events from templates instead of filling all fields manually.

## User Value
- **Speed**: Create common events faster
- **Consistency**: Standard events have same format
- **Convenience**: No need to remember meeting details
- **Learning**: Templates show how to use features

## Implementation Details
- Add "Use Template" button/dropdown near "New Event" button
- Built-in templates:
  - Daily Standup (15 min, weekdays 9am)
  - Weekly Team Meeting (1 hour, Monday 2pm)
  - Lunch Break (1 hour, weekdays 12pm)
  - Birthday (all-day, yearly)
  - Monthly Review (1 hour, last Friday 4pm)
- Templates pre-fill form but allow customization
- Optional: Allow users to save custom templates

## Technical Considerations
- Templates stored as JavaScript objects
- Load template into form fields without downloading
- Clear form before applying template
- Future: Save custom templates to localStorage
