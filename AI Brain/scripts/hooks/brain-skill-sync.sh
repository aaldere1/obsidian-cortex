#!/bin/bash
# brain-skill-sync.sh — auto-sync canonical AI Brain skills from the Obsidian vault
# to ~/.claude/skills/ on Claude Code session start.
#
# Designed to be wired up via ~/.claude/settings.json hooks.SessionStart.
# Install with: node "AI Brain/scripts/brain.mjs" install-claude-hook
#
# Properties:
# - Discovers ALL canonical skill directories dynamically (any directory with SKILL.md)
# - Silent unless an update was actually applied
# - Never blocks or fails the session (always exits 0)
# - Skips quickly if vault is missing or this isn't the obsidian-cortex repo
# - Honors $BRAIN_VAULT env var to override the default vault path

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

[ ! -d "$SRC_ROOT" ] && exit 0

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
  echo "🧠 Brain skills updated from vault — new versions take effect this session."
fi

exit 0
