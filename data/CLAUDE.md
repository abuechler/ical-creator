# Data Collection Rules

## Structure

See @schulferien/2026-01-10/README.md for current structure and coverage.

## CRITICAL: URL Integrity Rules

**NEVER invent, guess, or fabricate URLs.** Every URL in this data collection MUST be verified.

### Before Adding Any URL

1. **Fetch the URL first** - Use WebFetch or browser to confirm the URL works
2. **Copy exactly** - Copy/paste URLs from the browser, never type them manually
3. **Verify the domain** - Check the actual domain spelling (e.g., `schule-rft.ch` not `schulerft.ch`)
4. **Test PDF downloads** - Ensure PDF URLs actually download the file

### Common URL Mistakes to Avoid

- Guessing domain patterns (e.g., `www.schule{name}.ch` vs `www.schule-{name}.ch`)
- Assuming URL structures without verification
- Inventing asset IDs or document hashes
- Making up page paths like `/ferienplan` without checking

### URL Validation

Before committing any changes to data files:

```bash
# Validate all URLs in the schulferien data
node data/scripts/validate-urls.js

# Or check a specific file
node data/scripts/validate-urls.js data/schulferien/2026-01-10/schulferien-schweiz.json
```

**All URLs must pass validation before committing.**

## Required Documentation

For every file downloaded, document in `sources/`:
- **Direct URL** - exact download link (MUST be verified working)
- **Page URL** - where the link was found (MUST be verified working)
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
