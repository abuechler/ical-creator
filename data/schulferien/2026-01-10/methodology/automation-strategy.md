# Automation Strategy for Schulferien Data Collection

## Overview

This document describes approaches to accelerate the collection of Swiss school holiday data, specifically for cantons requiring per-Gemeinde data.

**Created:** 2026-01-11 (during ZH collection)

---

## Approach Options

### Option 1: Parallel Playwright Sessions

Run multiple browser sessions simultaneously, each handling a different Bezirk.

**Pros:**
- Linear speedup (3-4 sessions = 3-4x faster)
- Each session works independently
- Easy to implement

**Cons:**
- Still requires manual navigation per Gemeinde
- Resource intensive (memory/CPU)

**Implementation:**
```bash
# Launch parallel sessions for different Bezirke
playwright session --bezirk affoltern &
playwright session --bezirk andelfingen &
playwright session --bezirk dielsdorf &
```

---

### Option 2: Escola Platform Automation

Most Zürich schools use Escola CMS with predictable URL patterns.

**Known Escola Patterns:**

```
# School website domains
https://www.schule-{name}.ch
https://www.{name}-schule.ch
https://www.schule{name}.ch

# Ferienplan page patterns
/schulorganisation/download/
/informationen/ferienplan
/download/ferienplan

# PDF download URLs
/download.php?action=download&doc_id={hash}&download_type=3
/public/upload/assets/{id}/{filename}.pdf
```

**Detection Method:**
1. Check for Escola meta tags or footer
2. Look for `/download.php` pattern in page source
3. Search for "Ferienplan" folder in download section

**Pros:**
- Very fast for Escola sites (~70% of ZH schools)
- Predictable navigation

**Cons:**
- Doesn't cover non-Escola sites
- URL patterns may change

---

### Option 3: Pre-fetch School Website URLs

Build a database of school websites before starting collection.

**Sources:**
1. **Wikidata SPARQL** - Query municipality → school website
2. **Bildungsdirektion ZH** - Cantonal education department lists
3. **BFS API** - Municipality data with website links
4. **Google search** - "schule {gemeinde} zürich ferienplan"

**Query Example (Wikidata):**
```sparql
SELECT ?gemeinde ?gemeindeLabel ?website WHERE {
  ?gemeinde wdt:P31 wd:Q70208;           # municipality of Switzerland
            wdt:P131 wd:Q11933;           # in Kanton Zürich
            wdt:P856 ?website.            # official website
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de". }
}
```

**Pros:**
- Eliminates search step for known URLs
- Can be done once, reused for future updates

**Cons:**
- Not all schools have Wikidata entries
- May have outdated URLs

---

### Option 4: Template-based Search Script

Automated script that tries common URL patterns.

**Algorithm:**
```javascript
const domainPatterns = [
  'https://www.schule-{name}.ch',
  'https://www.{name}-schule.ch',
  'https://www.schule{name}.ch',
  'https://www.ps-{name}.ch',
  'https://www.primarschule-{name}.ch',
];

const ferienplanPaths = [
  '/ferienplan',
  '/schulorganisation/download/',
  '/informationen/ferienplan',
  '/aktuelles/ferienplan',
  '/downloads',
];

async function findFerienplan(gemeinde) {
  const name = gemeinde.toLowerCase().replace(/[äöü]/g, match =>
    ({ä:'ae', ö:'oe', ü:'ue'})[match]);

  for (const pattern of domainPatterns) {
    const baseUrl = pattern.replace('{name}', name);
    if (await siteExists(baseUrl)) {
      for (const path of ferienplanPaths) {
        const result = await searchForPdf(baseUrl + path);
        if (result) return result;
      }
    }
  }
  return null; // Requires manual search
}
```

**Pros:**
- Fast first-pass attempt
- Reduces manual work significantly

**Cons:**
- Won't find all sites
- Needs fallback to manual search

---

### Option 5: Hybrid Approach (RECOMMENDED)

Combine automation with parallel manual work.

**Phases:**

| Phase | Description | Time Estimate |
|-------|-------------|---------------|
| 1 | Automated: Run script to find school websites and attempt Escola downloads | ~30 min |
| 2 | Parallel manual: Split failures across 3-4 Playwright sessions | ~2-3 hours |
| 3 | Document: Merge results, generate source documentation | ~30 min |

**Workflow:**

```
Phase 1: Automation
├── Load BFS Gemeinde list for Bezirk
├── For each Gemeinde:
│   ├── Try domain patterns → find school website
│   ├── If Escola: try known Ferienplan paths
│   ├── If PDF found: download + log
│   └── If not found: add to manual queue
└── Output: downloaded PDFs + manual queue

Phase 2: Parallel Manual
├── Split manual queue across N sessions
├── Each session:
│   ├── Open Gemeinde website
│   ├── Navigate to school → Ferienplan
│   ├── Download PDF
│   └── Document source
└── Output: remaining PDFs + source docs

Phase 3: Documentation
├── Merge all PDFs into data/zh/{bezirk}/
├── Generate source .md files
├── Update INDEX.md
└── Commit
```

**Expected Speedup:**
- Original estimate: 9-12 hours
- With hybrid: 3-4 hours
- Speedup factor: ~3x

---

## Additional Considerations

### Rate Limiting
- Add 1-2 second delay between requests
- Don't parallel-fetch from same domain
- Respect robots.txt

### Error Handling
- Timeout after 10 seconds per page
- Log failures for manual retry
- Handle SSL certificate issues

### Verification
- Check PDF file size (> 10KB)
- Verify filename contains "ferien" or year
- Quick visual check for date tables

### Caching
- Skip Gemeinden with existing PDFs
- Track which Bezirke are complete
- Resume from last checkpoint

### Resumability
- Save progress after each Gemeinde
- Log to tracking file
- Allow restart from any point

### Source Documentation
- Auto-generate source .md files
- Include: URL, timestamp, file size, search path
- Flag automated vs manual collection

---

## Implementation Files

| File | Purpose |
|------|---------|
| `scripts/escola-finder.js` | Escola pattern matching and download |
| `scripts/parallel-runner.sh` | Orchestrate parallel Playwright sessions |
| `scripts/merge-results.js` | Combine outputs and generate docs |
| `tracking/zh-progress.json` | Track per-Gemeinde status |

---

*Created: 2026-01-11*
