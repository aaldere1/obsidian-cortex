#!/bin/bash
# brain-auto-startup — SessionStart hook. Loads AI Brain state automatically at the top of
# every session and injects a compact digest so Claude starts warm without being asked.
# Fail-open ALWAYS: any error exits 0 with no output so a session is never blocked/delayed.
set +e
# --- vault resolution (see AI Brain/docs/brain-skill-sync-path-bug.md) --------
# Run it in place from the vault, or copy it to ~/.claude/hooks/ — a copy cannot
# derive the vault from its own location, so stamp the real path into VAULT_STAMP
# below (brain-skill-sync.sh keeps stamped copies converged). Order: explicit override, stamp, self-derive (in case
# it is being run in place), then a probe of known layouts.
VAULT_STAMP="__BRAIN_VAULT_STAMP__"
_bv_valid() { [ -d "$1/AI Brain" ] && { [ -d "$1/.git" ] || [ -f "$1/.git" ]; }; }  # .git is a file in worktrees/submodules
_bv_resolve() {
  if [ -n "${BRAIN_VAULT:-}" ] && _bv_valid "$BRAIN_VAULT"; then
    printf '%s' "$BRAIN_VAULT"; return 0
  fi
  case "$VAULT_STAMP" in
    __BRAIN_VAULT*) : ;;                      # unstamped placeholder, skip
    *) if _bv_valid "$VAULT_STAMP"; then printf '%s' "$VAULT_STAMP"; return 0; fi ;;
  esac
  local d
  d=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd -P) || d=""
  while [ -n "$d" ] && [ "$d" != "/" ]; do
    if _bv_valid "$d"; then printf '%s' "$d"; return 0; fi
    d=$(dirname "$d")
  done
  for c in "$HOME/Obsidian-Vault" "$HOME/obsidian-cortex" \
           "$HOME/Obsidian/Personal" "$HOME/GitHub/obsidian-cortex"; do
    if _bv_valid "$c"; then printf '%s' "$c"; return 0; fi
  done
  return 1
}
_bv_log() {
  printf '%s %s: no vault found (stamp=%s, BRAIN_VAULT unset/invalid, probe failed)\n' \
    "$(date '+%Y-%m-%dT%H:%M:%S' 2>/dev/null)" "${BASH_SOURCE[0]:-$0}" "$VAULT_STAMP" \
    >> /tmp/brain-hook.log 2>/dev/null
}
# ------------------------------------------------------------------------------
VAULT=$(_bv_resolve) || { _bv_log; exit 0; }   # no vault on this machine → silent no-op
BRAIN="$VAULT/AI Brain"
MJS="$BRAIN/scripts/brain.mjs"
[ -f "$MJS" ] || exit 0
command -v node >/dev/null 2>&1 || exit 0

# Resolve canonical machine; if unregistered, don't auto-bootstrap — just skip briefing.
who=$( (cd "$VAULT" && node "$MJS" whoami 2>/dev/null) )
printf '%s' "$who" | grep -q 'registered: *yes' || exit 0
MACHINE=$(printf '%s' "$who" | awk -F': *' '/canonical:/{print $2; exit}')
[ -n "$MACHINE" ] || exit 0

# Best-effort pull (bounded) + snapshot; never let slowness stall the session.
TO=""; command -v timeout >/dev/null 2>&1 && TO="timeout 20"
(cd "$VAULT" && $TO git pull --ff-only --quiet 2>/dev/null)
# Reap ghost sessions: terminal kills skip SessionEnd, leaking "active" records.
# brain.mjs reap removes records with no heartbeat in 48h and rebuilds Current Activity.
(cd "$VAULT" && $TO node "$MJS" reap "$MACHINE" >/dev/null 2>&1)
snap=$( (cd "$VAULT" && $TO node "$MJS" snapshot 2>/dev/null) )
active=$(printf '%s' "$snap" | grep -iE 'ACTIVE' | grep -iv "$MACHINE" | head -3 | tr '\n' ';' | sed 's/  */ /g')
[ -n "$active" ] || active="none"

loops=$(grep -cE '^[-*] ' "$BRAIN/Shared/Open Loops.md" 2>/dev/null); loops=${loops:-0}
projects=$(grep -cE '^[-*#] ' "$BRAIN/Shared/Active Projects.md" 2>/dev/null); projects=${projects:-0}

ctx="[AI Brain · ${MACHINE}] Vault pulled. Active on other machines: ${active}. Open loops: ${loops}; active projects tracked: ${projects}. If this session is meaningful project work, run the brain-startup skill to load that project's memory (Current State / Next Steps / Decisions), register this session's activity so other machines see it, and give a short brief. Trivial/one-off turn? Skip it."

# JSON-escape the context and inject via SessionStart additionalContext.
esc=$(printf '%s' "$ctx" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))' 2>/dev/null)
[ -n "$esc" ] || exit 0
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":%s}}\n' "$esc"
exit 0
