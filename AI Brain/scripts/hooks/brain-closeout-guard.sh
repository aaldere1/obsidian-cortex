#!/bin/bash
# brain-closeout-guard — Stop hook. If this session shipped something (PR merge / ship
# skill) but never wrote an AI Brain closeout, block the stop ONCE and tell Claude to
# run the brain-closeout skill. Fires at most once per session; inert otherwise.
set -u
INPUT=$(cat 2>/dev/null || true)
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
SESSION=$(printf '%s' "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
[ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] || exit 0
[ -n "$SESSION" ] || exit 0

STATE_DIR="$HOME/.claude/hooks/.state"
MARKER="$STATE_DIR/brain-guard-$SESSION"
[ -f "$MARKER" ] && exit 0

# Closeout already happened this session? (brain.mjs closeout leaves this fingerprint;
# quotes arrive JSON-escaped in the transcript, so allow \ and " between mjs and closeout)
grep -Eq 'brain\.mjs[\\" ]{1,4}closeout' "$TRANSCRIPT" 2>/dev/null && exit 0

# Durable-work events: PR merge/create, ship skill, or any git commit/push
grep -q -e 'gh pr merge' -e 'gh pr create' -e '"skill":"ship"' -e '"skill":"gsd-ship"' -e 'git commit' -e 'git push' "$TRANSCRIPT" 2>/dev/null || exit 0

mkdir -p "$STATE_DIR"
: > "$MARKER"
# housekeeping: drop markers older than 7 days
find "$STATE_DIR" -name 'brain-guard-*' -mtime +7 -delete 2>/dev/null

# Include this session's auto-registered brain activity id if the SessionStart hook mapped one
BRAIN_ID=$(sed -n '2p' "$STATE_DIR/brain-session-$SESSION" 2>/dev/null)
HINT=""
[ -n "$BRAIN_ID" ] && HINT=" Use --session $BRAIN_ID for the idle step."
jq -cn --arg hint "$HINT" '{decision: "block", reason: ("This session shows durable work (commit/push/PR/ship) but no AI Brain closeout was written. If real work happened: run the brain-closeout skill now — session summary to AI Brain, update Current State/Next Steps, mark machine idle, commit+push the vault." + $hint + " If nothing durable actually happened, you may stop; this reminder fires once per session.")}'
