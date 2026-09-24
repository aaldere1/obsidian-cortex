#!/bin/bash
# friction-scan.sh — mechanical friction-signal scan over Claude Code session transcripts.
# Usage: friction-scan.sh <output-dir> [days-back:30] [exclude-session-id]
# Emits: signals.tsv (per-session counts) + user_prompts.txt (typed prompts, one per line, TSV: project<TAB>session<TAB>text)
set -u
OUT="${1:?usage: friction-scan.sh <output-dir> [days]}"
DAYS="${2:-30}"
# Session to exclude as the in-flight one. Prefer the explicit 3rd arg: $CLAUDE_SESSION_ID is
# NOT exported into the Bash tool environment (verified on Desktop 2026-08-31), so relying on it
# alone makes this filter silently no-op — the exact failure class this skill exists to catch.
SKIP_SESSION="${3:-${CLAUDE_SESSION_ID:-__none__}}"
mkdir -p "$OUT"
PROJ_ROOT="$HOME/.claude/projects"

# NOTE: grep -c prints "0" AND exits 1 on no-match — never `|| echo 0` after it (doubles the field).
count() { local c; c=$(grep -c -- "$1" "$2" 2>/dev/null); echo "${c:-0}"; }

echo -e "project\tsession\tmtime\tkb\tuser_lines\terrors\tinterrupts\tdenials\tapi_errors" > "$OUT/signals.tsv"
: > "$OUT/user_prompts.txt"

find "$PROJ_ROOT" -name "*.jsonl" -mtime "-$DAYS" -print0 2>/dev/null | while IFS= read -r -d '' f; do
  # exclude workflow-agent transcripts and subagent sidechains — user friction lives in main sessions
  case "$f" in */wf_*|*/subagents/*) continue;; esac
  # exclude the IN-FLIGHT session: its own scan activity ranks it top, and its prompts
  # pollute the theme greps (observed 2026-08-31 on Desktop: 7 of 15 prompts came from the
  # running session, producing a false "revert|undo|wrong" hit on the word "wrong").
  case "$(basename "$f" .jsonl)" in "$SKIP_SESSION") continue;; esac
  proj=$(basename "$(dirname "$f")")
  sess=$(basename "$f" .jsonl)
  mtime=$(stat -f '%Sm' -t '%Y-%m-%d' "$f")
  kb=$(( $(stat -f '%z' "$f") / 1024 ))
  ul=$(count '"type":"user"' "$f")
  er=$(count '"is_error":true' "$f")
  ir=$(count 'Request interrupted by user' "$f")
  dn=$(count "doesn't want to proceed" "$f")
  ae=$(count '"isApiErrorMessage":true' "$f")
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$proj" "$sess" "$mtime" "$kb" "$ul" "$er" "$ir" "$dn" "$ae" >> "$OUT/signals.tsv"

  # typed user prompts only: no tool_results, no meta, no sidechains, no command wrappers
  jq -r --arg p "$proj" --arg s "$sess" '
    select(.type=="user" and (.isMeta|not) and (.isSidechain|not))
    | .message.content
    | if type=="string" then . elif type=="array" then ([.[] | select(.type=="text") | .text] | join(" ")) else empty end
    | select(length>0 and length<2000)
    | select(startswith("<") | not)
    | select(startswith("[Request interrupted") | not)
    | select(test("^Caveat:") | not)
    | "\($p)\t\($s)\t\(gsub("\n"; " "))"
  ' "$f" 2>/dev/null >> "$OUT/user_prompts.txt"
done

echo "DONE: $(( $(wc -l < "$OUT/signals.tsv") - 1 )) sessions, $(wc -l < "$OUT/user_prompts.txt") prompts -> $OUT"
