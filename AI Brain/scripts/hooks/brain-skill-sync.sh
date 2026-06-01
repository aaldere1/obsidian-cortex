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
# - Skips quickly if vault is missing or this isn't the obsidian-personal repo
# - Honors $BRAIN_VAULT env var to override the default vault path

set +e

VAULT="${BRAIN_VAULT:-$HOME/Obsidian-Personal}"

# Skip if vault doesn't exist on this machine
[ ! -d "$VAULT/.git" ] && exit 0

# Skip if this isn't the obsidian-personal repo (defensive: avoid running in
# a random git repo that happens to live at $BRAIN_VAULT)
GIT_REMOTE=$(cd "$VAULT" 2>/dev/null && git config --get remote.origin.url 2>/dev/null)
case "$GIT_REMOTE" in
  *obsidian-personal*) ;;
  *) exit 0 ;;
esac

# Pull silently. Ignore failures (network down, merge conflict, etc.) —
# we'll still sync whatever's already on disk.
(cd "$VAULT" && git pull --ff-only --quiet 2>/dev/null) || true

# Compare each canonical skill against its installed counterpart.
NEEDS_UPDATE=0
for skill in brain-startup brain-closeout brain-daily brain-bootstrap; do
  SRC="$VAULT/AI Brain/skills-claude-code/$skill/SKILL.md"
  DST="$HOME/.claude/skills/$skill/SKILL.md"
  [ ! -f "$SRC" ] && continue
  if [ ! -f "$DST" ] || ! diff -q "$SRC" "$DST" > /dev/null 2>&1; then
    NEEDS_UPDATE=1
    break
  fi
done

if [ "$NEEDS_UPDATE" -eq 1 ]; then
  node "$VAULT/AI Brain/scripts/brain.mjs" install-claude-skills --force > /dev/null 2>&1
  echo "🧠 Brain skills updated from vault — new versions take effect this session."
fi

exit 0
