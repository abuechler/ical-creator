# Holiday Indicators

## Description
Display holiday markers on the calendar preview to help users avoid scheduling events on holidays. Shows major holidays for the selected timezone region.

## User Value
- **Awareness**: See at a glance which days are holidays
- **Better Planning**: Avoid accidentally scheduling events on holidays
- **Context**: Understand the calendar context when planning recurring events

## Implementation Details
- Show small holiday indicators on calendar days
- Support major holidays (New Year, Christmas, Easter, etc.)
- Visual indicator (small dot or icon) on holiday dates
- Tooltip or hover effect to show holiday name
- Consider timezone/locale for regional holidays

## Planning Decisions

### Start Timestamp
2026-01-09 04:20:00

### Implementation Plan
1. Create a holiday data source with major international holidays
2. Add CSS styling for holiday indicators on calendar days
3. Update calendar rendering to mark holidays
4. Add tooltip functionality to show holiday names
5. Write Playwright tests

### Assumptions
- Focus on major international holidays (New Year's Day, Christmas, etc.)
- Use a simple static holiday list (no external API dependency)
- Holidays are displayed as a small indicator dot below the date number
- Hover/focus shows holiday name in tooltip
- Holiday calculations work for any year (Easter computed algorithmically)
- Different color (red) for holidays vs event days (teal)

### End Timestamp
2026-01-09 04:35:00

### Duration
15 minutes

## Screenshots

### Desktop (1440x900)
![Holiday Indicators - Desktop](screenshots/holiday-indicators-desktop.png)

### Mobile (375x812)
![Holiday Indicators - Mobile](screenshots/holiday-indicators-mobile.png)
