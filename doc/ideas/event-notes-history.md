# Event Version History

## Description
Track changes to saved events over time and allow viewing previous versions.

## User Value
- **Audit trail**: See what changed and when
- **Recovery**: Restore previous version
- **Tracking**: Review event modifications

## Implementation Details
- Store versions when event is saved
- Keep last 5 versions per event
- Show "History" button on saved events
- Modal displays version timeline
- Click version to view or restore
