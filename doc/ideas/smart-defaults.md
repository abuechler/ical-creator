# Smart Defaults

## Description
Intelligently pre-fill form fields based on common patterns and time of day.

## User Value
- **Speed**: Less typing required
- **Smart**: App anticipates your needs
- **Contextual**: Relevant suggestions

## Implementation Details
- Start time: Round to next 30min slot
- End time: Default 1 hour after start
- If morning (before noon): suggest AM times
- If creating on Friday: suggest next week dates
- Remember last used timezone
- Suggest common durations based on title keywords
