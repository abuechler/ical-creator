# Sort and Filter Saved Events

## Description
Add ability to sort saved events by date or name, and filter/search events by text. This improves usability when users have many saved events.

## User Value
- **Organization**: Find events quickly in long lists
- **Usability**: Better manage many saved events
- **Search**: Quickly locate specific events by name or location

## Implementation Details
- Add sort dropdown above saved events: "Sort by: Date | Name"
- Add search input field to filter events by text
- Sort options:
  - Date (ascending/descending)
  - Name (A-Z, Z-A)
- Search filters events by title, location, or description
- Real-time filtering as user types
- Show count: "Showing X of Y events"

## Technical Considerations
- Sort in JavaScript before rendering
- Case-insensitive search
- Persist sort preference in localStorage
- Highlight matching text in search results (optional)
- Handle empty states ("No events found")
