# Swiss School Holidays Data Collection

**Collection Date:** 2026-01-10
**Coverage:** Kanton Zürich, Bezirk Bülach (22 Gemeinden)

## Purpose

This repository contains Swiss school holiday (Schulferien) data collected from official sources, organized for easy reference and future expansion.

## Directory Structure

```
2026-01-10/
├── README.md                 # This file
├── data/                     # Raw PDF files only
│   ├── official/             # Cantonal/federal sources
│   └── zh/                   # Kanton Zürich
│       └── buelach/          # Bezirk Bülach
├── sources/                  # Source documentation
│   ├── official.md           # EDK, TCS, BFS sources
│   └── zh/
│       └── buelach/
│           ├── INDEX.md      # Overview of all 22 Gemeinden
│           └── [gemeinde].md # Per-municipality source details
└── methodology/              # How-to documentation
    ├── search-strategy.md    # General search approach
    ├── platforms/            # CMS-specific guides
    │   ├── escola.md
    │   ├── wordpress.md
    │   └── typo3.md
    └── examples/             # Worked examples
        ├── direct-gemeinde.md
        ├── school-search.md
        └── shared-districts.md
```

## Quick Start

### Find a Specific Gemeinde's Ferienplan

1. Check `sources/zh/buelach/INDEX.md` for status
2. If "PDF Downloaded": file is in `data/zh/buelach/`
3. If "Webpage Only": see the source file for extracted dates
4. For source details: see `sources/zh/buelach/[gemeinde].md`

### Understand How Data Was Found

1. Read `methodology/search-strategy.md` for general approach
2. Check platform-specific guides in `methodology/platforms/`
3. See worked examples in `methodology/examples/`

## Coverage Summary

### Official Sources
- EDK/IDES - Swiss conference of cantonal education directors
- TCS - Touring Club Schweiz summary

### Bezirk Bülach (22 Gemeinden)

| Status | Count | Description |
|--------|-------|-------------|
| PDF Downloaded | 19 | Full Ferienplan PDF available |
| Webpage Only | 2 | Data extracted from website |
| Restricted | 1 | Requires login |

See `sources/zh/buelach/INDEX.md` for complete list.

## File Naming Conventions

### PDFs
```
[gemeinde]-ferienplan-[start_year]-[end_year].pdf
Example: buelach-ferienplan-2025-28.pdf
```

### Source Files
```
[gemeinde].md
Example: sources/zh/buelach/buelach.md
```

## Key Concepts

### Shared School Districts (Schulgemeinden)

Some municipalities share a school administration:
- **Schule RFT**: Rorbas + Freienstein-Teufen
- **Schule UR**: Wasterkingen + Hüntwangen + Wil (ZH)

Same Ferienplan applies to all member municipalities.

### Platforms

Most schools in Kanton Zürich use:
- **Escola** - Swiss school CMS (most common)
- **WordPress** - Some smaller schools
- **TYPO3** - Some larger municipalities

See `methodology/platforms/` for details.

## Expansion

To add more regions:

1. Create `data/[kanton]/[bezirk]/` for PDFs
2. Create `sources/[kanton]/[bezirk]/INDEX.md` for overview
3. Create per-Gemeinde source files
4. Follow methodology in `methodology/search-strategy.md`

### Suggested Next Steps

- Other Bezirke in Kanton Zürich (11 remaining)
- Other cantons requiring per-Gemeinde data (AG, AR, BE, SG)

## Data Quality Notes

- All source URLs and retrieval timestamps documented
- Both successful downloads and failures documented
- Extracted webpage data marked as such
- Shared districts clearly indicated

---

*Generated: 2026-01-10*
*Contact: [your contact info]*
