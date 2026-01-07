# Add README

I would like to add a README file to the project that explains its purpose and how to use it. The usage shall not be
detailed, but rather give short instruction on how to use the generated file. On use case is to download the file and
sent it via email or a messaging app. Also make short note about privacy and mention that this is a generated tool.

## Proper Attribution

The SVG is from https://openmoji.org under the CC BY-SA 4.0 license. Chech how to propertly attribute it and make
changes to the license file if needed. Check usage docs under https://openmoji.org/faq/ for the SVG. The svg is from the
URL https://openmoji.org/library/emoji-1F512/.

I would also add a link in the README to the GitHub Pages site. The GitHub Pages site (ical-creator.html is renamed to
index.html there) should also have links to the acutall repository and and specifiically the README. 

## Planning Decisions

### 1. README Structure
**Decision:** Minimal structure
- Title + one-line description
- Usage (2-3 sentences about downloading and sharing the .ics file)
- Privacy note
- Attribution/License
- Link to GitHub Pages demo

### 2. License File Approach
**Decision:** Single LICENSE file with MIT license
- Main section: MIT license for the project
- Third-Party section: OpenMoji attribution (CC BY-SA 4.0)
- Attribution text: "All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0"

### 3. Privacy Note Content
**Decision:** Use the same text as the privacy modal in the tool for consistency:
> Your data stays private
>
> All data is stored locally on your device using your browser's localStorage. Nothing is sent to or stored on any external server.
>
> This means:
> - Your events are only accessible on this device and browser
> - Clearing your browser data will remove saved events
> - No account or sign-up required

### 4. Cross-linking Strategy
**Decision:** Prominent links in both locations
- README: Dedicated "Demo" section with link to GitHub Pages
- GitHub Pages: Header with link to repository and documentation

### 5. GitHub Pages Link Placement
**Decision:** Header bar
- Add a subtle header bar/button near the title area
- More visible than footer, integrates with page design

### 6. Header Bar Style
**Decision:** Icon + text link
- Small GitHub icon with "View on GitHub" text
- Positioned in top-right corner with subtle styling

### Links
- GitHub Pages: https://abuechler.github.io/ical-creator/
- Repository: https://github.com/abuechler/ical-creator