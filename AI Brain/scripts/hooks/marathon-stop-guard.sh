#!/bin/bash
# marathon-stop-guard — Stop hook. Blocks Claude from ending its turn while a marathon
# (tasks/marathon.md, status: active) still has unchecked items.
# Inert (exit 0, no output) unless the cwd project has an ACTIVE marathon file.
# Escape hatches: set 'status: paused' or 'status: done' (+ 'blocked: <why>' if stuck).
# Loop guard: if we're already in a stop-hook continuation (stop_hook_active) and the
# state file hasn't been touched in 10+ minutes, allow the stop — no infinite loops.
set -u
INPUT=$(cat 2>/dev/null || true)
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
[ -n "$CWD" ] || CWD="$PWD"
STATE="$CWD/tasks/marathon.md"

[ -f "$STATE" ] || exit 0
grep -qiE '^status:[[:space:]]*active' "$STATE" || exit 0

REMAINING=$(grep -c -- '- \[ \]' "$STATE" 2>/dev/null)
REMAINING=${REMAINING:-0}
[ "$REMAINING" -gt 0 ] || exit 0

STOP_ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
if [ "$STOP_ACTIVE" = "true" ]; then
  NOW=$(date +%s)
  MTIME=$(stat -f %m "$STATE" 2>/dev/null || stat -c %Y "$STATE" 2>/dev/null || echo 0)
  if [ $((NOW - MTIME)) -gt 600 ]; then
    printf '{"systemMessage":"marathon-stop-guard: %s unchecked items remain but tasks/marathon.md has not been updated in 10+ min — allowing stop to avoid a loop. Resume with: read tasks/marathon.md and continue."}\n' "$REMAINING"
    exit 0
  fi
fi

GOAL=$(grep -m1 -iE '^goal:' "$STATE" | sed 's/^[Gg]oal:[[:space:]]*//' | head -c 120)
jq -cn --arg reason "Marathon active: '$GOAL' — $REMAINING unchecked item(s) in tasks/marathon.md. Continue with the next unchecked item and tick items off as they complete. Only stop by updating tasks/marathon.md: set 'status: done' when finished, or 'status: paused' plus a 'blocked: <what you need>' line and next/branch-to-test notes if genuinely blocked." \
  '{decision: "block", reason: $reason}'
