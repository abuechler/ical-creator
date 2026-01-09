# Event Duration Helper

## Description
Add a duration selector that automatically calculates end time based on start time + duration, instead of manually entering end time.

## User Value
- **Simplicity**: Think in duration, not end time
- **Accuracy**: Avoid calculation errors
- **Natural**: "1 hour meeting" vs "9:00-10:00"

## Implementation Details
- Add duration dropdown: 15min, 30min, 45min, 1h, 1.5h, 2h, 3h, Custom
- When duration selected, auto-calculate end time from start
- When end time manually changed, update duration display
- Keep both options available (duration OR end time)
