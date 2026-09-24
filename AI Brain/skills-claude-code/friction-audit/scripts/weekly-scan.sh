#!/bin/bash
# weekly-scan — launchd-driven mechanical friction scan (free, no LLM tokens).
# Writes dated results to ~/.claude/friction-weekly/ and keeps the last 8 runs.
# Full /friction-audit (with agent deep-reads) stays on-demand in a live session.
set -u
OUT_ROOT="$HOME/.claude/friction-weekly"
STAMP=$(date +%Y-%m-%d)
OUT="$OUT_ROOT/$STAMP"
mkdir -p "$OUT"

bash "$HOME/.claude/skills/friction-audit/scripts/friction-scan.sh" "$OUT" 7 > "$OUT/scan.log" 2>&1

# one-glance summary
awk -F'\t' 'NR>1 {er+=$6; ir+=$7; dn+=$8; ae+=$9; s++} END {printf "%s: %d sessions | %d errors | %d interrupts | %d denials | %d api_errors\n", "'"$STAMP"'", s, er, ir, dn, ae}' \
  "$OUT/signals.tsv" >> "$OUT_ROOT/history.log" 2>/dev/null

# retention: keep newest 8 dated dirs
ls -dt "$OUT_ROOT"/20* 2>/dev/null | tail -n +9 | xargs rm -rf 2>/dev/null
exit 0
