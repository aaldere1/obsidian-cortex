#!/bin/bash
# brain-skill-sync.sh — auto-sync canonical AI Brain agent integrations
# from the Obsidian vault on Claude Code session start.
#
# - Discovers ALL canonical Claude skills dynamically (any directory with SKILL.md)
# - Refreshes the canonical Codex AI Brain block too, when Codex is installed
# - Pulls latest vault state first
# - Never blocks/fails the session
# - Honors $BRAIN_VAULT

set +e

VAULT="${BRAIN_VAULT:-$HOME/Obsidian-Vault}"
SRC_ROOT="$VAULT/AI Brain/skills-claude-code"
DST_ROOT="$HOME/.claude/skills"

[ ! -d "$VAULT/.git" ] && exit 0

GIT_REMOTE=$(cd "$VAULT" 2>/dev/null && git config --get remote.origin.url 2>/dev/null)
case "$GIT_REMOTE" in
  *obsidian-cortex*) ;;
  *) exit 0 ;;
esac

(cd "$VAULT" && git pull --ff-only --quiet 2>/dev/null) || true

UPDATED=0

# Dynamically discover every canonical Claude skill.
if [ -d "$SRC_ROOT" ]; then
  NEEDS_UPDATE=0
  while IFS= read -r skill_file; do
    skill_dir=$(dirname "$skill_file")
    skill=$(basename "$skill_dir")
    dst="$DST_ROOT/$skill/SKILL.md"

    if [ ! -f "$dst" ] || ! diff -q "$skill_file" "$dst" > /dev/null 2>&1; then
      NEEDS_UPDATE=1
      break
    fi
  done < <(find "$SRC_ROOT" -mindepth 2 -maxdepth 2 -name SKILL.md -type f 2>/dev/null | sort)

  if [ "$NEEDS_UPDATE" -eq 1 ]; then
    node "$VAULT/AI Brain/scripts/brain.mjs" install-claude-skills --force > /dev/null 2>&1
    UPDATED=1
  fi
fi

# Keep Codex's installed AI Brain block current too.
# whoami resolves host aliases to the canonical machine folder.
if [ -f "$HOME/.codex/AGENTS.md" ]; then
  CANONICAL=$(node "$VAULT/AI Brain/scripts/brain.mjs" whoami 2>/dev/null | awk -F': *' '/^canonical:/ {print $2; exit}')
  if [ -n "$CANONICAL" ]; then
    node "$VAULT/AI Brain/scripts/brain.mjs" codex-install "$CANONICAL" --force > /dev/null 2>&1
  fi
fi

if [ "$UPDATED" -eq 1 ]; then
  echo "🧠 AI Brain integrations updated from vault — canonical skills/protocol are current."
fi

exit 0
