# Input Masks & Formatting

## Description
Add input masks for time fields that auto-format as you type (e.g., typing "930" becomes "09:30").

## User Value
- **Speed**: Type numbers without colons
- **Consistency**: Uniform time format
- **Error prevention**: Can't enter invalid times

## Implementation Details
- Time field: typing "930" → "09:30"
- Auto-add colon after 2 digits
- Accept 24h or 12h format based on locale
- Visual placeholder showing expected format
- Works with keyboard and paste
