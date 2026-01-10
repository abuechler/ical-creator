# Data Collection Instructions

This folder contains external data collected from official sources. Follow these rules when adding or updating data.

## Directory Structure

See @schulferien/2026-01-10/README.md for the current structure.

```
data/
└── schulferien/
    └── YYYY-MM-DD/           # Collection date
        ├── data/             # Raw files only (PDFs)
        ├── sources/          # Source tracking per item
        └── methodology/      # Reusable search instructions
```

## Rules for Data Collection

### 1. Always Document Sources

For every downloaded file, create a source document with:
- **Direct URL**: The exact download URL
- **Page URL**: The page where the link was found
- **Retrieved timestamp**: Format `YYYY-MM-DD HH:MM:SS CET`
- **File size**: In KB or MB
- **Search path**: Step-by-step how you found it

Example:
```markdown
| File | Retrieved | Size |
|------|-----------|------|
| [`filename.pdf`](../data/path/filename.pdf) | 2026-01-10 23:45:00 CET | 123 KB |
```

### 2. Use Relative Links

Always link to files using relative paths:
- From `sources/zh/buelach/*.md` → `../../../data/zh/buelach/file.pdf`
- From `sources/official.md` → `../data/official/file.pdf`

### 3. Document Failures Too

If data cannot be retrieved, still create a source file documenting:
- What was attempted
- Why it failed (restricted, no PDF, webpage only)
- Alternative sources or extracted data if available

### 4. Date-Based Versioning

Each collection run gets its own dated folder (`2026-01-10/`). This allows:
- Tracking changes over time
- Re-running collection without overwriting
- Comparing data between dates

### 5. Separate Data from Documentation

- `data/` = Raw files only (PDFs, no markdown)
- `sources/` = Metadata, URLs, timestamps
- `methodology/` = Reusable how-to guides

## Search Methodology

See @schulferien/2026-01-10/methodology/search-strategy.md for detailed instructions.

Key points:
1. Check Gemeinde website first for "Ferien" or "Ferienplan"
2. If not found, search for "Schule" to find school website
3. On school website, check: Organisation, Informationen, Downloads
4. Use correct language for the region (DE/FR/IT)

## Platform-Specific Guides

- @schulferien/2026-01-10/methodology/platforms/escola.md - Most common in ZH
- @schulferien/2026-01-10/methodology/platforms/wordpress.md
- @schulferien/2026-01-10/methodology/platforms/typo3.md

## Adding New Regions

1. Create directory: `data/[category]/[date]/data/[kanton]/[bezirk]/`
2. Create source index: `sources/[kanton]/[bezirk]/INDEX.md`
3. Create per-item source files
4. Follow existing patterns from Bezirk Bülach

## File Naming

- PDFs: `[gemeinde]-ferienplan-[start]-[end].pdf`
- Source docs: `[gemeinde].md`
- Use lowercase, hyphens for spaces
- Remove "gemeinde-" prefix (directory structure provides context)
