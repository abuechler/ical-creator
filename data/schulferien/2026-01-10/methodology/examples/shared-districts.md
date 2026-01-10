# Example: Shared School Districts (Schulgemeinden)

## Overview

Some Swiss municipalities share a school district (Schulgemeinde). This means:
- One school organization serves multiple municipalities
- Same Ferienplan applies to all member municipalities
- Only need to download once, but document the relationship

## Example: Schule RFT (Rorbas, Freienstein-Teufen)

### Identification

The school name "RFT" indicates it serves multiple places:
- **R** = Rorbas (BFS 68)
- **F** = Freienstein
- **T** = Teufen (together BFS 57: Freienstein-Teufen)

### Source

- **Website:** https://www.schule-rft.ch
- **Ferienplan:** Same PDF for both municipalities

### Documentation

In source files:
- `rorbas.md` - Contains full download details
- `freienstein-teufen.md` - References rorbas.md, notes "Shared School District"

## Example: Schule UR (Unteres Rafzerfeld)

### Identification

"UR" = Unteres Rafzerfeld, serving:
- Wasterkingen (BFS 70)
- Hüntwangen (BFS 61)
- Wil (ZH) (BFS 71)

### Source

- **Website:** https://www.schule-ur.ch
- **Ferienplan:** Single PDF for all three municipalities

### Documentation

In source files:
- `wasterkingen.md` - Contains full download details
- `huentwangen.md` - References wasterkingen.md
- `wil.md` - References wasterkingen.md

## How to Identify Shared Districts

1. **School name contains multiple place names** (RFT, UR, etc.)
2. **School website mentions multiple municipalities**
3. **Gemeinde website says "Schulgemeinde [X]"**
4. **BFS data shows same parent for education**

## Best Practices

1. Download PDF once under the "primary" municipality
2. Create source files for all member municipalities
3. Reference the primary file from secondary files
4. Note the relationship clearly in both files
5. Use consistent naming (e.g., files named after primary municipality)

---

*Last updated: 2026-01-10*
