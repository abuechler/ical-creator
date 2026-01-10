# Data Collection Rules

## Structure

See @schulferien/2026-01-10/README.md for current structure and coverage.

## Required Documentation

For every file downloaded, document in `sources/`:
- **Direct URL** - exact download link
- **Page URL** - where the link was found
- **Retrieved** - timestamp `YYYY-MM-DD HH:MM:SS CET`
- **Size** - in KB/MB
- **Search path** - steps taken to find it

Use relative markdown links: `[filename.pdf](../data/path/filename.pdf)`

Document failures too (restricted access, webpage-only, not found).

## Search Methodology

See @schulferien/2026-01-10/methodology/search-strategy.md

## Conventions

- Date-based folders: `schulferien/2026-01-10/`
- Raw files in `data/`, metadata in `sources/`
- Lowercase filenames with hyphens
- One source `.md` per item documenting its retrieval
