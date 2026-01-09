# Export/Import Saved Events

## Description
Add functionality to export all saved events to a JSON file and import them back. This provides users with a backup/restore capability and enables event transfer between devices or browsers.

## User Value
- **Backup**: Users can backup their events to prevent data loss
- **Transfer**: Move events between devices/browsers
- **Sharing**: Share event collections with others
- **Migration**: Easy to migrate when clearing browser data

## Implementation Details
- Add "Export All" button next to "Clear All" in Saved Events section
- Export creates a JSON file with all saved events (download as .json)
- Add "Import" button that opens file picker
- Import validates JSON structure and merges with existing events (no duplicates)
- Show success/error messages for import operations

## Technical Considerations
- JSON format should match localStorage structure
- Handle duplicate events gracefully (skip or overwrite based on timestamp)
- Validate imported data to prevent corrupted localStorage
- Add metadata (export date, version) to export file
