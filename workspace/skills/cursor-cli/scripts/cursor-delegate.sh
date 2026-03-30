#!/bin/bash
# Spawn a Cursor agent for non-interactive coding tasks
# Usage: ./scripts/cursor-delegate.sh "prompt" [--cloud] [--mode=plan|ask]

set -e

PROMPT="$1"
MODE=""
CLOUD=""

# Parse arguments
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --cloud|-c)
            CLOUD="-c"
            shift
            ;;
        --mode=*)
            MODE="$1"
            shift
            ;;
        --mode)
            MODE="--mode=$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

if [ -z "$PROMPT" ]; then
    echo "Usage: cursor-delegate.sh 'your coding prompt' [--cloud] [--mode=plan|ask]"
    exit 1
fi

# Check if agent is installed
if ! command -v agent &> /dev/null; then
    echo "Cursor CLI not found. Installing..."
    curl https://cursor.com/install -fsS | bash
fi

# Build command
CMD="agent -p"

if [ -n "$CLOUD" ]; then
    CMD="agent -c"
fi

if [ -n "$MODE" ]; then
    CMD="$CMD $MODE"
fi

CMD="$CMD \"$PROMPT\""

echo "Executing: $CMD"
eval $CMD