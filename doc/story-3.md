# Add tests and execute them via GitHub Actions

- Add a GitHub Actions workflow to run tests on each push and pull request.
- Make sure all tests in a certain folder are executed.
- Use playwright to create iCal files for various different event configurations and validate the generated files with an iCal validator.
- Use the iCal library https://www.ical4j.org/validation/ to test the files.
- Add a workflow option in case its manually triggered to test the files also with the online validator at https://icalendar.org/validator.html


## Planning Decisions

**Planning Session 1 Start:** 2026-01-06 21:26:50

### Requirements Analysis

**Key Requirements Identified:**
1. GitHub Actions workflow for running tests on push/PR
2. Execute all tests from a designated test folder
3. Use Playwright to generate iCal files for various event configurations
4. Validate generated files with ical4j (Java library)
5. Manual workflow trigger option for online validator at icalendar.org

**Research Findings:**

1. **ical4j**: Java library (not CLI tool) - requires Java code to use
2. **icalendar.org validator**: Web-form only, no API - requires browser automation
3. **Current project**: Static HTML application, no existing test infrastructure

---

### Planning Questions & Decisions

**Q1: How should ical4j (Java library) be integrated for local validation?**
- **Decision:** Create Java CLI wrapper with JDK setup in GitHub Actions
- Rationale: Fulfills the story requirement to use ical4j specifically

**Q2: Which test framework should be used for Playwright tests?**
- **Decision:** Playwright Test (native test runner)
- Rationale: Built-in assertions, parallel execution, excellent test reporting

**Q3: What event configurations should be tested?**
- **Decision:** Comprehensive coverage
- Test cases:
  - Simple event with title/date/time
  - All-day event
  - Recurring daily event
  - Recurring weekly event (with day selection)
  - Recurring monthly event (by date and by day-of-week)
  - Event with reminder
  - Recurring event with exceptions
  - Event with location, description, URL

**Q4: Where should the test folder be located?**
- **Decision:** `/tests` at project root

---

### Implementation Plan

1. **Setup Playwright Test infrastructure**
   - Initialize npm project with Playwright Test
   - Configure Playwright for Firefox with mobile viewport (375x812)
   - Create test folder structure

2. **Create Java CLI validator using ical4j**
   - Write ICalValidator.java using ical4j library
   - Compile as runnable JAR or compile-and-run in CI

3. **Write Playwright tests for iCal generation**
   - Test: Simple event
   - Test: All-day event
   - Test: Recurring events (daily, weekly, monthly)
   - Test: Event with reminder
   - Test: Recurring event with exceptions
   - Test: Event with optional fields (location, description, URL)

4. **Create GitHub Actions workflow**
   - Trigger on push and pull request
   - Setup JDK for ical4j
   - Setup Node.js and install dependencies
   - Run all Playwright tests
   - Validate generated files with Java CLI

5. **Add manual workflow for online validator**
   - workflow_dispatch trigger
   - Use Playwright to submit files to icalendar.org/validator.html
   - Report validation results

**Planning Session 1 End:** 2026-01-06 21:30:13
**Planning Duration:** ~4 minutes

---

### Implementation

**Implementation Start:** 2026-01-06 21:31:21

#### Files Created

1. **package.json** - Node.js project configuration with Playwright Test
2. **playwright.config.js** - Playwright configuration for Firefox with mobile viewport (375x812)
3. **tests/ical-creator.spec.js** - Main test suite with 12 test cases:
   - Simple event with title, date, and time
   - All-day event
   - Recurring daily event
   - Recurring weekly event with day selection
   - Recurring monthly event by date
   - Recurring monthly event by day of week
   - Event with reminder
   - Recurring event with exceptions
   - Event with location, description, and URL
   - Recurring all-day monthly event
   - Form validation tests (2)

4. **tests/online-validator.spec.js** - Online validator test for manual workflow
5. **validator/pom.xml** - Maven configuration for ical4j validator
6. **validator/src/ICalValidator.java** - Java CLI validator using ical4j
7. **validator/validate.sh** - Shell script wrapper for validator
8. **.github/workflows/test.yml** - GitHub Actions workflow with:
   - Triggers on push/PR to main and feature branches
   - JDK 17 setup for ical4j
   - Node.js 20 setup for Playwright
   - Test execution and artifact upload
   - Optional online validator job (manual trigger)

#### npm Scripts

- `npm test` - Run main Playwright tests
- `npm run test:online` - Run online validator tests
- `npm run test:headed` - Run tests with visible browser
- `npm run validate` - Run Java ical4j validator on generated files
- `npm run test:report` - View HTML test report

**Implementation End:** 2026-01-06 21:46:13
**Implementation Duration:** ~15 minutes

---

### Planning Session 2: Maven Wrapper

**Planning Session 2 Start:** 2026-01-06 21:48:15

**Issue:** User requested to use Maven Wrapper instead of requiring Maven installation.

**Decision:** Add Maven Wrapper (mvnw) to the validator project so that:
- No Maven installation is required locally or in CI
- Use `./mvnw` instead of `mvn` commands
- More portable and reproducible builds

**Tasks:**
- Add Maven Wrapper files to validator directory
- Update GitHub Actions workflow to use `./mvnw`
- Update npm scripts to use `./mvnw`
- Update validate.sh to use `./mvnw`

#### Files Added/Modified

- `validator/mvnw` - Maven Wrapper shell script (Unix/macOS/Linux)
- `validator/mvnw.cmd` - Maven Wrapper batch script (Windows)
- `validator/.mvn/wrapper/maven-wrapper.properties` - Maven Wrapper configuration (v3.9.6)
- `.github/workflows/test.yml` - Updated to use `./mvnw` instead of `mvn`
- `validator/validate.sh` - Updated to use `./mvnw`
- `package.json` - Updated validate script to use `./mvnw`

**Planning Session 2 End:** 2026-01-06 21:50:45
**Planning Session 2 Duration:** ~3 minutes

---

### Planning Session 3: Security & Version Updates

**Planning Session 3 Start:** 2026-01-06 21:54:49

**Issues:**
1. GitHub Actions using version tags (e.g., `@v4`) instead of pinned commit SHAs
2. Node.js version 20 instead of current LTS (24)

**Decisions:**
- Pin all GitHub Actions to full 40-character commit SHAs for security
- Add semantic version comments for readability
- Update Node.js to version 24 (current LTS)

**Changes to `.github/workflows/test.yml`:**

| Action | SHA | Version |
|--------|-----|---------|
| actions/checkout | `34e114876b0b11c390a56381ad16ebd13914f8d5` | v4.3.1 |
| actions/setup-node | `49933ea5288caeca8642d1e84afbd3f7d6820020` | v4.4.0 |
| actions/setup-java | `c1e323688fd81a25caa38c78aa6df2d33d3e20d9` | v4.8.0 |
| actions/upload-artifact | `ea165f8d65b6e75b540449e92b4886f43607fa02` | v4.6.2 |
| actions/download-artifact | `d3f86a106a0bac45b974a628896c90dbdf5c8093` | v4.3.0 |

**Planning Session 3 End:** 2026-01-06 21:56:57
**Planning Session 3 Duration:** ~2 minutes

---

### Planning Session 4: Java Version Update

**Planning Session 4 Start:** 2026-01-06 21:57:45

**Issue:** Java 17 used instead of current LTS

**Decision:** Update to Java 21 (LTS released September 2023)
- Java 25 is newest LTS (September 2025) but Java 21 chosen for broader tooling support
- Updated both `.github/workflows/test.yml` and `validator/pom.xml`

**Planning Session 4 End:** 2026-01-06 21:59:04
**Planning Session 4 Duration:** ~1 minute

---

### Implementation Session 2: Bug Fixes from Validation

**Session Start:** 2026-01-06 22:01:00

**Bugs Found via ical4j Validation:**

1. **DTSTAMP missing UTC timezone suffix**
   - Error: `Text '20260106T215139' could not be parsed at index 15`
   - Cause: `ICAL.Time.now()` doesn't set UTC timezone by default
   - Fix: Set `dtstamp.zone = ICAL.Timezone.utcTimezone` before adding to event

2. **Duplicate VALUE=DATE parameter on all-day events**
   - Error: `The following are OPTIONAL, but MUST NOT occur more than once: VALUE`
   - Cause: `ICAL.Time.fromDateString()` already marks value as DATE type internally, then `setParameter('value', 'DATE')` was adding it again
   - Fix: Removed manual `setParameter('value', 'DATE')` calls - `setValue()` handles it automatically

**Files Modified:**
- `ical-creator.html` - Fixed DTSTAMP timezone and removed duplicate VALUE parameters

**Validation Results:** 10/10 ICS files pass ical4j validation

**Session End:** 2026-01-06 22:06:55
**Session Duration:** ~6 minutes