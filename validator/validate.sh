#!/bin/bash
# Wrapper script to run the iCal validator
# Usage: ./validate.sh <file.ics>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/target"

# Check if built
if [ ! -f "$TARGET_DIR/ical-validator-1.0.0.jar" ]; then
    echo "Building validator..."
    cd "$SCRIPT_DIR"
    ./mvnw package -q -DskipTests
fi

# Run validator
java -cp "$TARGET_DIR/ical-validator-1.0.0.jar:$TARGET_DIR/lib/*" ICalValidator "$@"
