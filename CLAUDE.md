# Project Notes

- When given a file for task or story do the following after reading it:
    - Note the start time in the document for tracking in the relevant section (use full timestamp format: YYYY-MM-DD HH:MM:SS).
    - Analyze the content and identify key requirements or instructions.
    - Research any unfamiliar concepts or technologies mentioned.
    - If you have any questions to any steps in the document, go through them one by one, offer suggestions and choices.
    - Write down all planning prompts, answers and decisions in a "Planning Decisions" section at the end of the
      document.
    - Write down the total time spent on planning at the beginning of the "Planning Decisions" section with the current
      date and time. If there are multiple planning sessions, note each session separately.
- When creating an implementation plan note start and end time for each step. Do this for bugs as well.
- Make sure to add tests for all features implemented, use mcp playwright with firefox and switch to a responsive design
  mode with a mobile device ((e.g iPhone 11 with 375x812 px viewport).)
- Playwright tests should use `file://` protocol to access HTML files directly - no HTTP server needed.
- Before assuming a task/feature as done, execute all tests (Maven or Playwright) and make sure they pass.

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
