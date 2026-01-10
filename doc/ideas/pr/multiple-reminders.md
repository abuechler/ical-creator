# Multiple Reminders

## Description
Allow users to add multiple reminders for a single event (e.g., 1 day before, 1 hour before, 15 minutes before). Currently only one reminder is supported.

## User Value
- **Flexibility**: Set multiple alerts at different times before the event
- **Better Preparation**: Get reminded far in advance and again closer to the event
- **Customization**: Choose exactly when to be reminded based on event importance

## Implementation Details
- Replace single reminder dropdown with ability to add multiple reminders
- Add "Add another reminder" button
- Allow removing individual reminders
- Show list of added reminders
- Generate multiple VALARM components in ICS file

## Planning Decisions

### Start Timestamp
2026-01-09 04:05:00

### Implementation Plan
1. Update HTML to support multiple reminders with add/remove buttons
2. Add CSS for reminder list styling
3. Update JavaScript to manage array of reminders
4. Update ICS generation to output multiple VALARM components
5. Update form state save/restore to handle reminder array
6. Write Playwright tests

### Assumptions
- Maximum of 5 reminders per event (to prevent abuse)
- Same reminder time options as current implementation
- Each reminder can be removed individually
- At least one reminder must remain if reminders are enabled (removing the last one disables reminders)
- Reminders are stored as array in form state
- Backward compatibility maintained for old `reminderTime` single value format

### End Timestamp
2026-01-09 04:15:00

### Duration
10 minutes

## Screenshots

### Desktop (1440x900)
![Multiple Reminders - Desktop](screenshots/multiple-reminders-desktop.png)

### Mobile (375x812)
![Multiple Reminders - Mobile](screenshots/multiple-reminders-mobile.png)
