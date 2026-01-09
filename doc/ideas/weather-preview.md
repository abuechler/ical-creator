# Weather Preview for Event Date

## Description
Show weather forecast for the event date and location (if within forecast range).

## User Value
- **Planning**: Know if outdoor events might have bad weather
- **Preparation**: Plan attire or venue changes
- **Context**: Additional useful information

## Implementation Details
- Fetch weather for event date + location
- Only show for dates within 7-10 days
- Display: icon + temp + brief description
- Free weather API (Open-Meteo, no key required)
- Cache responses to reduce API calls
- Show "Forecast unavailable" for far dates
- Requires location to be filled
