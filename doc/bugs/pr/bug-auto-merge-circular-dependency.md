# Bug: Auto-merge Workflow Circular Dependency

## Description

The auto-merge GitHub Actions workflow has a circular dependency that prevents it from successfully merging approved PRs. The workflow waits for all checks to complete before merging, but it includes itself in the check list, creating a deadlock situation.

## Expected Behavior

When a PR is approved and all tests pass, the auto-merge workflow should automatically merge the PR within a reasonable time frame.

## Actual Behavior

The auto-merge workflow:
1. Runs when a PR is approved
2. Checks for pending checks, including itself
3. Waits 30 seconds and checks again
4. Repeats for 10 minutes (20 attempts)
5. Times out with "Checks did not complete within timeout, giving up"
6. Never merges the PR

From the logs of PR #13:
```
Checks still pending, waiting 30s... (attempt 1/20)
...
Checks still pending, waiting 30s... (attempt 19/20)
Checks did not complete within timeout, giving up
```

## Steps to Reproduce

1. Create a PR
2. Get approval from a reviewer
3. Wait for all tests to pass
4. Observe the auto-merge workflow run and timeout after 10 minutes
5. PR remains unmerged despite meeting all criteria

## Root Cause

In `.github/workflows/auto-merge.yml` line 114, the workflow checks for pending checks:

```javascript
const stillPending = currentChecks.data.check_runs.some(check => check.status !== 'completed');
```

This check includes the `auto-merge` check itself, which is still running. Since the workflow is waiting for itself to complete, it can never proceed.

## Impact

- PRs cannot be automatically merged
- Manual intervention required for every PR
- Defeats the purpose of the auto-merge workflow
- Wastes GitHub Actions minutes with 10-minute timeout loops

## Proposed Solution

1. **Fix circular dependency**: Filter out the `auto-merge` check itself when checking for pending checks
2. **Check all open PRs**: Instead of only checking the PR that triggered the workflow, check all open approved PRs on each run

This ensures:
- The workflow doesn't wait for itself
- Any approved PR gets merged when its checks complete
- More efficient use of workflow runs

## Files Affected

- `.github/workflows/auto-merge.yml`

## Planning Decisions

### Start timestamp
2026-01-08 23:15:00

### End timestamp
2026-01-08 23:30:00

### Duration
Approximately 15 minutes

### Implementation Decisions

1. **Remove circular dependency**: Modified the workflow to filter out checks named `auto-merge` when determining if checks are pending or have failed.

2. **Check all open PRs**: Rewrote the workflow to:
   - Get all open PRs at the start
   - Loop through each PR and check if it's ready to merge
   - Merge any PR that meets all criteria (approved, no conflicts, all checks passed)
   - This allows multiple PRs to be merged in a single workflow run

3. **Remove polling logic**: Since we now check all PRs immediately and don't wait for pending checks, removed the 10-minute polling loop. If checks are still pending for a PR, we skip it and move to the next one. The workflow will run again when checks complete.

4. **Better logging**: Added clear log separators and messages to show which PR is being checked and why it's being skipped or merged.

### Assumptions Made

1. It's acceptable to check all open PRs on every workflow run (more efficient than individual checks)
2. PRs should be merged immediately when ready, without waiting for pending checks to complete
3. The workflow will be triggered again when pending checks complete, so we don't need to poll
4. Filtering by check name (`auto-merge`) is sufficient to exclude the current workflow run

### Test Coverage

No automated tests added as this is GitHub Actions workflow logic. Testing will be done by:
1. Verifying PR #13 gets merged after this fix is deployed
2. Monitoring future PR auto-merges
3. Checking workflow logs for proper execution
