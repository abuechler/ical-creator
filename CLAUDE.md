# Project Notes

This project is a simple website to create iCal calendar files (.ics) with recurring events support. It is implemented purely with HTML, CSS and JavaScript - no build step required to run. GitHub Actions runs tests via Maven and Playwright.

1. When started with the continue command, check which doc/stories or doc/bugs are not yet done. Pick one and work on it
   in a separate branch.
2. Before doing any actual work or planning, check the section [execution instructions](#execution-instructions) below.
3. When done, move the story or bug document to the directory doc/{stories,bugs}/pr.
4. Create a PR for the changes when done.
5. Kill the current session when the PR is created with the command `pkill -f "claude"`
6. If you cannot find any open stories or bugs, check for open PRs and comments on them. Address any review comments or
   questions. If there are none, exit the session with `pkill -f "claude"`.
7. If the current session is fully used up, exit with `pkill -f "claude"`.

## Execution Instructions

- For every story/bug or task, create a separate git branch named `story/<story-name>` or `bug/<bug-name>`.
- IMPORTANT: Do not ask any questions about a story/bug, if there is something unclear, make reasonable assumptions and
  document them in the "Planning Decisions" section at the end of the document.
- Add a "Planning Decisions" section at the end of each story/bug document with:
    - Start timestamp (YYYY-MM-DD HH:MM:SS)
    - End timestamp (YYYY-MM-DD HH:MM:SS)
    - Duration (time spent on planning and implementation)
    - Any assumptions made and decisions taken
- IMPORTANT: Implement the feature or fix the bug as per the plan you created, not questions!
- Add tests for any new features or bug fixes using mcp playwright with firefox in responsive design mode using iPhone
  11 (375x812 px) and also a laptop (1440x900 px) viewport.
- Before submitting a PR, run all tests and make sure ALL of them pass:
    - `npm install`
    - `npx playwright install firefox`
    - `npx playwright test`
    - `mvn -f /workspace/validator/pom.xml test`
- Commit as Author: `claude-code-ical-creator[bot] <253599583+claude-code-ical-creator[bot]@users.noreply.github.com>`

## GitHub App Authentication

A GitHub App is configured so that Claude's actions (PRs, comments, etc.) appear as coming from `claude-code-ical-creator[bot]` instead of a personal account.

### Token Generation

Use the script at `/home/node/github-app-token.sh` to generate a short-lived installation token:

```bash
# Generate a token (valid for 1 hour)
/home/node/github-app-token.sh
```

### Using with gh CLI

Prefix `gh` commands with the token to act as the bot:

```bash
# Create PR as bot
GH_TOKEN=$(/home/node/github-app-token.sh 2>/dev/null) gh pr create --title "My PR" --body "Description"

# Comment on PR as bot
GH_TOKEN=$(/home/node/github-app-token.sh 2>/dev/null) gh pr comment 123 --body "Comment text"

# Close PR as bot
GH_TOKEN=$(/home/node/github-app-token.sh 2>/dev/null) gh pr close 123
```

### Git Commits

For commits to be attributed to the bot, use the bot's author information:

```bash
git commit --author="claude-code-ical-creator[bot] <253599583+claude-code-ical-creator[bot]@users.noreply.github.com>" -m "Commit message"
```

### How It Works

1. The script generates a JWT signed with the app's private key
2. Exchanges it for a short-lived installation access token (1 hour)
3. The token is used with `gh` CLI or GitHub API
4. Actions appear as `claude-code-ical-creator[bot]` in GitHub

## Versioning

Update the version in `package.json` using [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking changes or major rewrites
- **MINOR** (0.x.0): New features (backward compatible)
- **PATCH** (0.0.x): Bug fixes (backward compatible)

Examples:

- New feature (e.g., demo events): `1.0.0` → `1.1.0`
- Bug fix (e.g., fixing a typo or broken functionality): `1.1.0` → `1.1.1`
- Breaking change (e.g., changing data format): `1.1.1` → `2.0.0`

## CSS Centering Techniques

Reference: https://www.w3.org/Style/Examples/007/center.en.html

### Aligning inline elements (images/icons with text)

Use `vertical-align: middle` on inline elements:

```css
.icon {
    vertical-align: middle;
}

.text {
    display: inline;
    vertical-align: middle;
}
```

**Important:** `vertical-align` does NOT work on flex items. If using flexbox, the property is ignored.

### Flexbox centering

```css
.container {
    display: flex;
    align-items: center; /* vertical */
    justify-content: center; /* horizontal */
}
```

### CSS specificity matters

When overriding styles, ensure your rule has higher specificity or comes later in the cascade:

```css
/* Lower specificity */
.modal-body strong {
    display: block;
}

/* Higher specificity - wins */
.modal-body .privacy-modal-title strong {
    display: inline;
}
```
