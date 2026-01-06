# GitHub Pages Deployment Configuration

This document summarizes the GitHub Pages setup for the iCal Creator static website.

## Configuration Decisions

| Option | Choice | Alternatives |
|--------|--------|--------------|
| **Deployment Source** | Deploy from branch | GitHub Actions (more control, supports build steps) |
| **Branch** | `gh-pages` | `main`, `master` |
| **Serving Folder** | `/` (root) | `/docs` |
| **Entry Point** | Rename to `index.html` | Keep as `ical-creator.html` (requires direct URL access) |
| **Domain** | Default GitHub URL | Custom domain (requires DNS setup) |
| **Trigger** | On push to `main` | Manual only, Both |

## How It Works

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Push to main   │ ──▶  │  Workflow runs   │ ──▶  │ gh-pages branch │
│  (source code)  │      │  (copies files)  │      │   (deployed)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

1. You edit and commit code to the `main` branch
2. GitHub Actions workflow automatically triggers
3. Workflow copies files to `gh-pages` branch (renaming `ical-creator.html` → `index.html`)
4. GitHub Pages serves the `gh-pages` branch

## Site URL

After enabling GitHub Pages in your repository settings, your site will be available at:

```
https://<username>.github.io/<repository-name>/
```

## Files Created

- `.github/workflows/deploy-gh-pages.yml` - The GitHub Actions workflow

## Security Considerations

### SHA Pinning

All GitHub Actions are pinned to their full SHA-1 commit hash instead of version tags:

```yaml
# Insecure - tag can be moved/overwritten
uses: actions/checkout@v4

# Secure - SHA is immutable, with version comment for readability
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

**Why?** Version tags (v4, v4.2.2) can be force-pushed by the action maintainer (or an attacker who compromises their account). SHA pins guarantee you run exactly the code you reviewed.

### No Third-Party Actions

This workflow uses only:
- `actions/checkout` - Official GitHub action
- Native `git` commands - No external dependencies

**Why?** Third-party actions introduce supply chain risk. The `peaceiris/actions-gh-pages` action is popular but:
- Maintainer could be compromised
- Dependencies could be malicious
- You're trusting code you didn't audit

### Finding SHAs for Actions

To find the SHA for an action version:

```bash
# Clone the action repo and find the tag's commit
git ls-remote --tags https://github.com/actions/checkout | grep v4.2.2
```

Or on GitHub: navigate to the release tag and copy the full commit SHA.

## GitHub Setup Required

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
4. Click **Save**

### Step 2: First Deployment

Push this branch to trigger the first workflow run:

```bash
git add .github/workflows/deploy-gh-pages.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

The workflow will create the `gh-pages` branch automatically on first run.

### Step 3: Verify

1. Go to **Actions** tab to see the workflow run
2. Once complete, go to **Settings** → **Pages** to find your site URL

## Alternative Configurations

### Custom Domain

To use a custom domain:

1. Add a `CNAME` file to your repository containing your domain
2. In GitHub Pages settings, enter your custom domain
3. Configure DNS:
   - For apex domain: A records pointing to GitHub's IPs
   - For subdomain: CNAME record pointing to `<username>.github.io`

### Manual Deployment

To add manual trigger option, modify the workflow:

```yaml
on:
  push:
    branches:
      - main
  workflow_dispatch:  # Adds manual trigger button
```

### Deploy from main directly

If you prefer simpler setup without a separate branch:

1. Change GitHub Pages source to `main` branch
2. Rename `ical-creator.html` to `index.html` in your repository
3. Delete the workflow file (no longer needed)

## Review and Fixes

This section documents the interactive session that created this workflow.

### Initial Configuration Prompts

| Question | Answer | Alternatives Offered |
|----------|--------|----------------------|
| Which deployment source for GitHub Pages? | **Deploy from branch** | GitHub Actions (more control, supports build steps) |
| Which branch should GitHub Pages deploy from? | **gh-pages** | main, master |
| Which folder in gh-pages branch should be served? | **/ (root)** | /docs |
| Main file is 'ical-creator.html'. GitHub Pages expects 'index.html'. What would you prefer? | **Rename to index.html** | Keep as ical-creator.html |
| Do you want to configure a custom domain? | **Use default GitHub URL** | Configure custom domain (requires DNS setup) |
| When should the workflow run? | **On push to main** | Manual only, Both |

### Clarification: Branch vs Trigger

During configuration, a clarification was needed:

> **User:** "On push, but didn't we say only the gh-pages branch is deployed?"

**Explanation provided:** Two separate concepts exist:
1. **GitHub Pages source** (gh-pages) - What GitHub *serves/hosts*
2. **Workflow trigger** (main) - When the workflow *runs* to copy files TO gh-pages

The flow is: `Push to main → Workflow triggers → Copies files to gh-pages → GitHub serves gh-pages`

### Security Review

After initial workflow creation, security issues were identified:

> **User:** "Why do we need to use third party action to do this? And why are actions not pinned to their SHA1? Both are security issues!"

**Issues identified:**
1. Used `peaceiris/actions-gh-pages@v4` - third-party action (supply chain risk)
2. Used `actions/checkout@v4` - tag instead of SHA (tag can be force-pushed)

**Fixes applied:**

| Before (Insecure) | After (Secure) |
|-------------------|----------------|
| `uses: actions/checkout@v4` | `uses: actions/checkout@...683 # v4.2.2` |
| `uses: peaceiris/actions-gh-pages@v4` | Removed - replaced with native `git` commands |

The workflow was rewritten to:
- Pin the official `actions/checkout` to its full SHA-1 hash (v4.2.2)
- Replace the third-party deployment action with native git commands
- Eliminate all external dependencies except GitHub's own official action

### Inline Version Comments

> **User:** "Pinning actions support a comment containing the version so that it's readable for humans. Please add them."

**Fix applied:** Added inline version comment for human readability:

```yaml
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

This convention keeps the security of SHA pinning while making it easy to see which version is in use.
