#!/bin/bash
#
# Parallel Runner for Schulferien Data Collection
#
# Orchestrates multiple Playwright sessions to collect data in parallel.
#
# Usage: ./parallel-runner.sh [--sessions N] [--phase automation|manual]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(dirname "$SCRIPT_DIR")"
TRACKING_DIR="$BASE_DIR/tracking"
LOG_DIR="$TRACKING_DIR/logs"

# Default settings
SESSIONS=4
PHASE="automation"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --sessions)
      SESSIONS="$2"
      shift 2
      ;;
    --phase)
      PHASE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Create log directory
mkdir -p "$LOG_DIR"

# Bezirke to process (excluding Bülach which is done)
BEZIRKE=(
  "affoltern"
  "andelfingen"
  "dielsdorf"
  "dietikon"
  "hinwil"
  "horgen"
  "meilen"
  "pfaeffikon"
  "uster"
  "winterthur"
  "zuerich"
)

TOTAL_BEZIRKE=${#BEZIRKE[@]}

echo "========================================"
echo "Parallel Runner - Schulferien Collection"
echo "========================================"
echo "Phase: $PHASE"
echo "Sessions: $SESSIONS"
echo "Bezirke: $TOTAL_BEZIRKE"
echo "Start time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "========================================"
echo ""

# Update tracking file with start time
TIMESTAMP=$(date -Iseconds)
if [ -f "$TRACKING_DIR/zh-progress.json" ]; then
  # Update phase start time
  if [ "$PHASE" == "automation" ]; then
    jq ".phases.phase1_automation.status = \"running\" | .phases.phase1_automation.start_time = \"$TIMESTAMP\"" \
      "$TRACKING_DIR/zh-progress.json" > "$TRACKING_DIR/zh-progress.json.tmp" && \
      mv "$TRACKING_DIR/zh-progress.json.tmp" "$TRACKING_DIR/zh-progress.json"
  else
    jq ".phases.phase2_manual.status = \"running\" | .phases.phase2_manual.start_time = \"$TIMESTAMP\"" \
      "$TRACKING_DIR/zh-progress.json" > "$TRACKING_DIR/zh-progress.json.tmp" && \
      mv "$TRACKING_DIR/zh-progress.json.tmp" "$TRACKING_DIR/zh-progress.json"
  fi
fi

if [ "$PHASE" == "automation" ]; then
  echo "Running Phase 1: Automation"
  echo "============================="
  echo ""

  # Distribute Bezirke across sessions
  PIDS=()
  for i in $(seq 0 $((SESSIONS - 1))); do
    # Calculate which Bezirke this session handles
    SESSION_BEZIRKE=()
    for j in $(seq $i $SESSIONS $((TOTAL_BEZIRKE - 1))); do
      if [ $j -lt $TOTAL_BEZIRKE ]; then
        SESSION_BEZIRKE+=("${BEZIRKE[$j]}")
      fi
    done

    if [ ${#SESSION_BEZIRKE[@]} -gt 0 ]; then
      echo "Session $((i + 1)): ${SESSION_BEZIRKE[*]}"
      LOG_FILE="$LOG_DIR/session-$((i + 1))-automation.log"

      # Run session in background
      (
        for bezirk in "${SESSION_BEZIRKE[@]}"; do
          echo "[$(date '+%H:%M:%S')] Starting $bezirk"
          node "$SCRIPT_DIR/escola-finder.js" --bezirk "$bezirk" 2>&1
          echo "[$(date '+%H:%M:%S')] Completed $bezirk"
        done
      ) > "$LOG_FILE" 2>&1 &

      PIDS+=($!)
    fi
  done

  echo ""
  echo "Waiting for ${#PIDS[@]} sessions to complete..."
  echo "Logs in: $LOG_DIR/"
  echo ""

  # Wait for all sessions
  FAILED=0
  for pid in "${PIDS[@]}"; do
    if ! wait $pid; then
      ((FAILED++))
    fi
  done

  echo ""
  echo "All sessions completed. Failed: $FAILED"

  # Aggregate results
  echo ""
  echo "Aggregating results..."
  TOTAL_FOUND=0
  TOTAL_ESCOLA=0
  TOTAL_PDF=0
  TOTAL_MANUAL=0

  for bezirk in "${BEZIRKE[@]}"; do
    RESULT_FILE="$TRACKING_DIR/${bezirk}-automation.json"
    if [ -f "$RESULT_FILE" ]; then
      FOUND=$(jq '.summary.websiteFound' "$RESULT_FILE")
      ESCOLA=$(jq '.summary.escolaDetected' "$RESULT_FILE")
      PDF=$(jq '.summary.pdfDownloaded' "$RESULT_FILE")
      MANUAL=$(jq '.summary.manualRequired' "$RESULT_FILE")

      echo "  $bezirk: found=$FOUND escola=$ESCOLA pdf=$PDF manual=$MANUAL"

      TOTAL_FOUND=$((TOTAL_FOUND + FOUND))
      TOTAL_ESCOLA=$((TOTAL_ESCOLA + ESCOLA))
      TOTAL_PDF=$((TOTAL_PDF + PDF))
      TOTAL_MANUAL=$((TOTAL_MANUAL + MANUAL))
    fi
  done

  echo ""
  echo "========================================"
  echo "Phase 1 Summary"
  echo "========================================"
  echo "Websites found: $TOTAL_FOUND"
  echo "Escola detected: $TOTAL_ESCOLA"
  echo "PDFs downloaded: $TOTAL_PDF"
  echo "Manual required: $TOTAL_MANUAL"
  echo "End time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "========================================"

  # Update tracking
  END_TIMESTAMP=$(date -Iseconds)
  if [ -f "$TRACKING_DIR/zh-progress.json" ]; then
    jq ".phases.phase1_automation.status = \"completed\" |
        .phases.phase1_automation.end_time = \"$END_TIMESTAMP\" |
        .phases.phase1_automation.websites_found = $TOTAL_FOUND |
        .phases.phase1_automation.escola_detected = $TOTAL_ESCOLA |
        .phases.phase1_automation.pdfs_downloaded = $TOTAL_PDF |
        .phases.phase1_automation.queued_for_manual = $TOTAL_MANUAL" \
      "$TRACKING_DIR/zh-progress.json" > "$TRACKING_DIR/zh-progress.json.tmp" && \
      mv "$TRACKING_DIR/zh-progress.json.tmp" "$TRACKING_DIR/zh-progress.json"
  fi

else
  echo "Phase 2: Manual Collection"
  echo "=========================="
  echo ""
  echo "Manual phase requires interactive Playwright sessions."
  echo ""
  echo "Suggested distribution:"
  echo ""

  for i in $(seq 0 $((SESSIONS - 1))); do
    SESSION_BEZIRKE=()
    SESSION_GEMEINDEN=0
    for j in $(seq $i $SESSIONS $((TOTAL_BEZIRKE - 1))); do
      if [ $j -lt $TOTAL_BEZIRKE ]; then
        SESSION_BEZIRKE+=("${BEZIRKE[$j]}")
        # Rough gemeinden count
        case "${BEZIRKE[$j]}" in
          affoltern) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 14)) ;;
          andelfingen) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 20)) ;;
          dielsdorf) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 22)) ;;
          dietikon) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 11)) ;;
          hinwil) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 11)) ;;
          horgen) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 9)) ;;
          meilen) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 11)) ;;
          pfaeffikon) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 10)) ;;
          uster) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 10)) ;;
          winterthur) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 19)) ;;
          zuerich) SESSION_GEMEINDEN=$((SESSION_GEMEINDEN + 1)) ;;
        esac
      fi
    done

    if [ ${#SESSION_BEZIRKE[@]} -gt 0 ]; then
      echo "  Session $((i + 1)) (~$SESSION_GEMEINDEN Gemeinden):"
      echo "    ${SESSION_BEZIRKE[*]}"
      echo ""
    fi
  done

  echo "To start a manual session for a Bezirk, check the automation results"
  echo "in $TRACKING_DIR/<bezirk>-automation.json for the list of Gemeinden"
  echo "that require manual search."
fi

echo ""
echo "Done."
