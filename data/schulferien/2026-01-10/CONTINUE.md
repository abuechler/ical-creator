# Continuing Schulferien Data Collection

## Quick Start Command

**IMPORTANT: Start 3 parallel agents immediately for faster collection!**

```bash
claude --resume "Continue collecting Swiss school holiday data. Read /workspace/data/schulferien/2026-01-10/CONTINUE.md for context. IMMEDIATELY launch 3+ parallel Task agents for different Bezirke/cantons using run_in_background:true."
```

Or use this prompt directly:

```
Continue collecting Swiss school holiday data.

**CRITICAL: Launch 3+ parallel agents immediately!**
- Use Task tool with subagent_type: general-purpose and run_in_background: true
- Assign each agent a different Bezirk or canton
- Do NOT work sequentially - parallelize everything!

Context:
- Working directory: /workspace/data/schulferien/2026-01-10/
- Progress tracking: tracking/zh-progress.json
- Automation script: scripts/escola-finder.js
- Strategy doc: methodology/automation-strategy.md

Current status:
1. Read tracking/zh-execution.md for timing and progress
2. Check which Bezirke are done vs pending
3. Run automation for pending Bezirke
4. Do manual collection for failures
5. Update source documentation

Start by reading CONTINUE.md and zh-execution.md to understand current state.
```

---

## Current Progress

**Started:** 2026-01-11 00:39:41 CET
**Approach:** Hybrid (automation + parallel manual)

### Bezirke Status

| Bezirk | Gemeinden | Status | Notes |
|--------|-----------|--------|-------|
| Bülach | 22 | Done | Manual collection, ~2 hours |
| Affoltern | 14 | Partial | Automation ran, needs review |
| Andelfingen | 20 | Partial | Automation ran, needs review |
| Dielsdorf | 22 | Partial | Automation ran, needs review |
| Dietikon | 11 | Partial | Automation ran, needs review |
| Hinwil | 11 | Partial | Automation ran, needs review |
| Horgen | 12 | Partial | Automation ran, needs review |
| Meilen | 11 | Partial | Automation ran, needs review |
| Pfäffikon | 12 | Partial | Automation ran, needs review |
| Uster | 10 | Partial | Automation ran, needs review |
| Winterthur | 17 | Pending | Not started |
| Zürich | 1 | Pending | Special case - Stadt Zürich |

---

## How to Continue

### Step 1: Check Current State

```bash
# View progress summary
cat tracking/zh-execution.md

# Check automation results per Bezirk
ls tracking/*-automation.json

# See what PDFs were downloaded
find data/zh -name "*.pdf" | wc -l
```

### Step 2: Review Automation Results

For each Bezirk, check the automation JSON:

```bash
# Example: Check Affoltern results
cat tracking/affoltern-automation.json | jq '.summary'
cat tracking/affoltern-automation.json | jq '.gemeinden[] | select(.status == "manual_required") | .name'
```

### Step 3: Run Automation for Remaining Bezirke

```bash
cd scripts/

# Run for a single Bezirk
node escola-finder.js --bezirk winterthur

# Or run parallel for multiple
./parallel-runner.sh --sessions 3 --phase automation
```

### Step 4: Manual Collection

For Gemeinden marked `manual_required`:

1. Open the school website (recorded in JSON)
2. Navigate to Ferienplan page
3. Download PDF
4. Record the discovery path

Use Playwright MCP tools for browser automation:
```
mcp__playwright__browser_navigate to school website
mcp__playwright__browser_snapshot to see page structure
mcp__playwright__browser_click to navigate
```

### Step 5: Document Sources

For each downloaded PDF, create/update source documentation:

**File:** `sources/zh/{bezirk}/{gemeinde}.md`

```markdown
# Gemeinde {Name} (BFS {number})

## Retrieved Files

| File | Retrieved | Size |
|------|-----------|------|
| [`{filename}.pdf`](../../../data/zh/{bezirk}/{filename}.pdf) | YYYY-MM-DD HH:MM:SS CET | XX KB |

## Source

- **Direct URL:** {pdf download URL}
- **Page URL:** {page where link was found}
- **Discovery Path:** {navigation steps}

## Discovery

- **Website:** {school website URL}
- **Domain Pattern:** `https://www.schule-{name}.ch`
- **Ferienplan Path:** `/schulorganisation/download/`
- **Escola Folder ID:** {if applicable}

## Notes

- Platform: {Escola/WordPress/TYPO3/other}
- {any special notes}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `CONTINUE.md` | This file - continuation instructions |
| `tracking/zh-execution.md` | Timing and progress tracking |
| `tracking/zh-progress.json` | Machine-readable progress |
| `tracking/{bezirk}-automation.json` | Per-Bezirk automation results |
| `scripts/escola-finder.js` | Automation script |
| `scripts/parallel-runner.sh` | Parallel execution |
| `methodology/automation-strategy.md` | Strategy documentation |
| `sources/zh/{bezirk}/INDEX.md` | Per-Bezirk source index |

---

## Recording Instructions

### For Each Gemeinde, Record:

1. **Website Discovery**
   - URL found
   - Domain pattern that worked
   - Patterns tried

2. **Ferienplan Discovery**
   - Path to Ferienplan page
   - Full URL
   - Discovery method (pattern/search/navigation)
   - Escola folder ID if applicable

3. **PDF Details**
   - Direct download URL
   - Filename
   - Link text on page
   - File size

4. **Timestamps**
   - When retrieved
   - Session duration

### Example Recording (JSON)

```json
{
  "name": "Oberrieden",
  "website": "https://www.schuleoberrieden.ch",
  "websiteDiscovery": {
    "method": "pattern",
    "domainPattern": "https://www.schule{name}.ch"
  },
  "ferienplan": {
    "path": "/portrait/downloads/",
    "fullUrl": "https://www.schuleoberrieden.ch/portrait/downloads/",
    "discoveryMethod": "navigation"
  },
  "downloaded": [{
    "filename": "oberrieden-ferienplan-2025-28.pdf",
    "directUrl": "https://...",
    "retrieved": "2026-01-11 01:15:00 CET"
  }]
}
```

---

## Estimates

| Remaining Work | Estimate |
|----------------|----------|
| Review automation results | 30 min |
| Manual collection (~100 Gemeinden) | 3-4 hours |
| Documentation | 1 hour |
| **Total remaining** | **4-6 hours** |

---

## Tips

1. **Batch by platform** - Escola sites have similar navigation
2. **Use discovered URLs** - Automation found most school websites
3. **Check automation JSON first** - Many have website URLs even if PDF not found
4. **Update tracking** - Mark Bezirke complete as you finish them
5. **Commit frequently** - Save progress regularly
6. **USE PARALLEL SESSIONS** - Launch multiple Task agents in background for different Bezirke

---

## CRITICAL: Use Parallel Sessions (MANDATORY)

**ALWAYS launch 3+ parallel Task agents immediately when starting a session!**

Launch multiple background agents using the Task tool with `run_in_background: true` and `subagent_type: general-purpose`.

**Example - launch these in a SINGLE message with multiple Task tool calls:**

```
Task 1: "Collect data for Bezirk Affoltern - navigate to each school website, download Ferienplan PDFs to data/zh/affoltern/"
Task 2: "Collect data for Bezirk Dietikon - navigate to each school website, download Ferienplan PDFs to data/zh/dietikon/"
Task 3: "Collect data for Bezirk Winterthur - navigate to each school website, download Ferienplan PDFs to data/zh/winterthur/"
```

**For each Task agent, include:**
- Working directory: /workspace/data/schulferien/2026-01-10/
- Check tracking/{bezirk}-automation.json for Gemeinden list
- Use Playwright MCP tools to navigate websites
- Download PDFs with naming: [gemeinde]-ferienplan-[years].pdf

**Monitor progress:**
```bash
find data/zh -name "*.pdf" | wc -l  # Count total PDFs
```

This reduces total collection time from ~6 hours sequential to ~1-2 hours parallel.

---

*Last updated: 2026-01-11*
