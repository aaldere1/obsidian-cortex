#!/bin/bash
# brain-skill-sync.sh — auto-sync brain-* skills from the Obsidian vault
# to ~/.claude/skills/ on Claude Code session start.
#
# Designed to be wired up via ~/.claude/settings.json hooks.SessionStart.
# Install with: node "AI Brain/scripts/brain.mjs" install-claude-hook
#
# Properties:
# - Silent unless an update was actually applied
# - Never blocks or fails the session (always exits 0)
# - Skips quickly if vault is missing or this isn't the obsidian-cortex repo
# - Finds the vault from its OWN location, so it works at any vault path.
#   $BRAIN_VAULT still overrides. Run with --doctor to see what it resolved.

set +e

# --- vault resolution (see AI Brain/docs/brain-skill-sync-path-bug.md) --------
# This script lives INSIDE the vault, so it can find the vault from its own
# location instead of guessing a path. Order: explicit override, then
# self-derivation, then a probe of known layouts. Never assume $HOME/<name>.
_bv_valid() { [ -d "$1/AI Brain" ] && { [ -d "$1/.git" ] || [ -f "$1/.git" ]; }; }  # .git is a file in worktrees/submodules
_bv_resolve() {
  if [ -n "${BRAIN_VAULT:-}" ] && _bv_valid "$BRAIN_VAULT"; then
    printf '%s' "$BRAIN_VAULT"; return 0
  fi
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
  printf '%s %s: no vault found (BRAIN_VAULT unset/invalid, self-derive and probe failed)\n' \
    "$(date '+%Y-%m-%dT%H:%M:%S' 2>/dev/null)" "${BASH_SOURCE[0]:-$0}" \
    >> /tmp/brain-hook.log 2>/dev/null
}
# ------------------------------------------------------------------------------
# --- canonical-set hash ---------------------------------------------------------
# Hash every file the VAULT copy of a skill contains, as read from $2. Extra files
# on the installed side (backups, .stale-*) are ignored on purpose; what matters is
# that every canonical file is present and identical. Comparing SKILL.md alone let
# scripts/ changes go stale while --doctor still reported green.
_skill_hash() { # $1 = canonical skill dir, $2 = dir to hash the canonical file-set in
  ( cd "$1" 2>/dev/null || return 1
    find . -type f ! -name '.DS_Store' -print | LC_ALL=C sort ) | while IFS= read -r f; do
      shasum -a 256 "$2/$f" 2>/dev/null | cut -d' ' -f1 || echo "MISSING:$f"
    done | shasum -a 256 | cut -d' ' -f1
}

# --- doctor: read-only self-test ----------------------------------------------
# Usage on any machine:  bash "<vault>/AI Brain/scripts/hooks/brain-skill-sync.sh" --doctor
# Reports which resolution step won and whether skills are in sync. Changes nothing.
if [ "${1:-}" = "--doctor" ]; then
  echo "brain-skill-sync doctor"
  echo "  script:       ${BASH_SOURCE[0]:-$0}"
  echo "  HOME:         $HOME"
  echo "  BRAIN_VAULT:  ${BRAIN_VAULT:-(unset)}"
  _step=""
  if [ -n "${BRAIN_VAULT:-}" ] && _bv_valid "$BRAIN_VAULT"; then
    _step='1 — $BRAIN_VAULT override'
  fi
  if [ -z "$_step" ]; then
    _d=$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd -P) || _d=""
    while [ -n "$_d" ] && [ "$_d" != "/" ]; do
      if _bv_valid "$_d"; then _step="2 — self-derived from script location"; break; fi
      _d=$(dirname "$_d")
    done
  fi
  if [ -z "$_step" ]; then
    for _c in "$HOME/Obsidian-Vault" "$HOME/obsidian-cortex" \
              "$HOME/Obsidian/Personal" "$HOME/GitHub/obsidian-cortex"; do
      if _bv_valid "$_c"; then _step="3 — probe matched $_c"; break; fi
    done
  fi
  _V=$(_bv_resolve) || {
    echo "  resolved:     NONE"
    echo "  verdict:      BROKEN — the hook would silently no-op on this machine."
    echo "                Fix: run it from inside the vault, or export BRAIN_VAULT=/path/to/vault"
    exit 1
  }
  echo "  resolved via: step $_step"
  echo "  vault:        $_V"
  echo "  git remote:   $(cd "$_V" 2>/dev/null && git config --get remote.origin.url 2>/dev/null)"
  echo "  canonical skills vs installed:"
  _ok=0; _diff=0; _missing=0
  for _SRC in "$_V/AI Brain/skills-claude-code"/*/SKILL.md; do
    [ -f "$_SRC" ] || continue
    _s=$(basename "$(dirname "$_SRC")")
    _SDIR=$(dirname "$_SRC"); _DDIR="$HOME/.claude/skills/$_s"
    if [ ! -f "$_DDIR/SKILL.md" ]; then
      printf '    MISSING  %s\n' "$_s"; _missing=$((_missing+1))
    elif [ "$(_skill_hash "$_SDIR" "$_SDIR")" = "$(_skill_hash "$_SDIR" "$_DDIR")" ]; then
      _ok=$((_ok+1))
    else
      printf '    DIFFERS  %s (whole-dir compare)\n' "$_s"; _diff=$((_diff+1))
    fi
  done
  echo "    in sync: $_ok   differing: $_diff   missing: $_missing"
  if [ $((_diff + _missing)) -eq 0 ]; then
    echo "  verdict:      OK — resolution works and skills are in sync"
  else
    echo "  verdict:      OK — resolution works; next session start will sync the above"
  fi
  exit 0
fi
# ------------------------------------------------------------------------------
HOOK_INPUT=$(cat 2>/dev/null)     # SessionStart JSON (session_id, cwd) — empty when run by hand
VAULT=$(_bv_resolve) || { _bv_log; exit 0; }

# Skip if this isn't the obsidian-cortex repo (defensive: avoid running in
# a random git repo that happens to live at $BRAIN_VAULT)
GIT_REMOTE=$(cd "$VAULT" 2>/dev/null && git config --get remote.origin.url 2>/dev/null)
case "$GIT_REMOTE" in
  *obsidian-cortex*) ;;
  *) exit 0 ;;
esac

# Pull silently. Ignore failures (network down, merge conflict, etc.) —
# we'll still sync whatever's already on disk.
(cd "$VAULT" && git pull --ff-only --quiet 2>/dev/null) || true

# Compare every canonical skill (any dir with a SKILL.md) against its installed
# counterpart. brain.mjs install-claude-skills copies whole dirs, so new skills
# added to the vault propagate automatically.
NEEDS_UPDATE=0
for SRC in "$VAULT/AI Brain/skills-claude-code"/*/SKILL.md; do
  [ -f "$SRC" ] || continue
  skill=$(basename "$(dirname "$SRC")")
  SDIR=$(dirname "$SRC"); DDIR="$HOME/.claude/skills/$skill"
  if [ ! -f "$DDIR/SKILL.md" ] || [ "$(_skill_hash "$SDIR" "$SDIR")" != "$(_skill_hash "$SDIR" "$DDIR")" ]; then
    NEEDS_UPDATE=1
    break
  fi
done

if [ "$NEEDS_UPDATE" -eq 1 ]; then
  node "$VAULT/AI Brain/scripts/brain.mjs" install-claude-skills --force > /dev/null 2>&1
  echo "🧠 Brain skills updated from vault — new versions take effect this session."
fi

# Keep any hook scripts this machine copied to ~/.claude/hooks/ converged with the vault
# (stamping VAULT_STAMP). Only refreshes hooks that exist locally — hooks run in place
# from the vault need nothing, and wiring a NEW hook into settings.json is manual.
KIT="$VAULT/AI Brain/scripts/hooks"; HOOKS_UPDATED=""
if [ -d "$KIT" ]; then
  for src in "$KIT"/*.sh; do
    [ -f "$src" ] || continue
    h=$(basename "$src"); dst="$HOME/.claude/hooks/$h"
    [ -f "$dst" ] || continue
    want=$(sed "s|^VAULT_STAMP=\"__BRAIN_VAULT_STAMP__\"|VAULT_STAMP=\"$VAULT\"|" "$src")
    if [ "$want" != "$(cat "$dst")" ]; then printf '%s\n' "$want" > "$dst"; chmod +x "$dst"; HOOKS_UPDATED="$HOOKS_UPDATED $h"; fi
  done
  [ -n "$HOOKS_UPDATED" ] && echo "🧠 Brain hooks updated from vault:${HOOKS_UPDATED} — take effect next session."
fi


exit 0
