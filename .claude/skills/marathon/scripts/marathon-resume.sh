#!/bin/bash
# marathon-resume — relaunch a headless Claude session to continue an incomplete marathon.
# Run manually, via /loop, or from launchd after a session dies at a context boundary.
# Usage: marathon-resume.sh [repo-dir]
set -u
DIR="${1:-$PWD}"
STATE="$DIR/tasks/marathon.md"
[ -f "$STATE" ] || { echo "no marathon at $STATE"; exit 0; }
grep -qiE '^status:[[:space:]]*active' "$STATE" || { echo "marathon not active"; exit 0; }
REMAINING=$(grep -c -- '- \[ \]' "$STATE" 2>/dev/null); REMAINING=${REMAINING:-0}
[ "$REMAINING" -gt 0 ] || { echo "marathon complete (0 unchecked)"; exit 0; }

echo "resuming marathon in $DIR ($REMAINING items remaining)"
cd "$DIR" || exit 1
exec claude -p "Read tasks/marathon.md and continue the marathon from the first unchecked item. Follow the Completion Contract: work until done, tick items off in the state file as they complete, update goal/done/next/branch-to-test at every milestone."
