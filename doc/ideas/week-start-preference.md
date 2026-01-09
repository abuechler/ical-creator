# Week Start Day Preference

## Description
Allow users to choose whether the calendar week starts on Sunday or Monday.

## User Value
- **Regional**: Different regions use different week starts
- **Preference**: Match user's mental model
- **Consistency**: Match other calendars they use

## Implementation Details
- Add setting in debug section or preferences
- Options: Sunday (US) or Monday (EU/ISO)
- Update calendar grid rendering
- Persist preference in localStorage
- Default based on locale if possible
