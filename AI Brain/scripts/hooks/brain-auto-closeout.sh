#!/bin/bash
# brain-auto-closeout — SessionEnd hook. Safety net: if a session did meaningful work in a
# git repo but never wrote a rich AI Brain closeout, record a mechanical git-derived note so
# the brain is never left stale. When Claude already ran brain-closeout, this stays silent.
# Fail-open ALWAYS (exit 0). Never auto-creates junk projects (repo-gated).
set +e
INPUT=$(cat 2>/dev/null || true)
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
VAULT=$(_bv_resolve) || { _bv_log; exit 0; }
MJS="$VAULT/AI Brain/scripts/brain.mjs"
[ -f "$MJS" ] || exit 0
command -v node >/dev/null 2>&1 || exit 0

TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
CWD=$(printf '%s' "$INPUT" | jq -r '.cwd // empty' 2>/dev/null)
SOURCE_SESSION=$(printf '%s' "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
[ -n "$CWD" ] || CWD="$PWD"
[ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] || exit 0
[ -n "$SOURCE_SESSION" ] || SOURCE_SESSION=$(basename "$TRANSCRIPT" .jsonl 2>/dev/null)
[ -n "$SOURCE_SESSION" ] || SOURCE_SESSION="unavailable"

# Already closed out by the rich skill this session → don't double-write.
grep -Eq 'brain\.mjs[\\" ]{1,4}closeout' "$TRANSCRIPT" 2>/dev/null && exit 0

# Meaningful work signal: file edits or git write ops in the transcript. None → skip.
grep -Eq '"name":"(Edit|Write|MultiEdit)"|gh pr (merge|create)|git (commit|push)' "$TRANSCRIPT" 2>/dev/null || exit 0

# Repo-gated: only record work that lives in a git repo (avoids junk auto-projects).
ROOT=$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null)
[ -n "$ROOT" ] || exit 0
PROJECT=$(basename "$ROOT")
# A session run *inside the vault itself* is AI Brain work, not a project named after the
# vault's directory. Without this, the basename rule minted a parallel project folder
# (`Projects/obsidian-cortex/`) that split AI Brain memory in two for three weeks before
# it was caught and merged on 2026-08-31. The vault's directory name differs per machine,
# so compare resolved paths rather than names.
# Both sides come from git, so they share one canonicalisation — this survives the
# symlinked vault on Desktop and the case-insensitive-FS spellings on Studio (`pwd -P` does
# NOT normalise case, so comparing shell paths would silently mint a third folder).
_vault_root=$(git -C "$VAULT" rev-parse --show-toplevel 2>/dev/null)
if [ -n "$_vault_root" ] && [ "$ROOT" = "$_vault_root" ]; then
  PROJECT="Obsidian-AI-Brain"
fi

who=$( (cd "$VAULT" && node "$MJS" whoami 2>/dev/null) )
printf '%s' "$who" | grep -q 'registered: *yes' || exit 0
MACHINE=$(printf '%s' "$who" | awk -F': *' '/canonical:/{print $2; exit}')
[ -n "$MACHINE" ] || exit 0

BRANCH=$(git -C "$ROOT" branch --show-current 2>/dev/null); BRANCH=${BRANCH:-detached}
SHORT=$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null)
COMMITS=$(git -C "$ROOT" log --oneline -5 --no-decorate 2>/dev/null | sed 's/^/- /')
EDITS=$(grep -Ec '"name":"(Edit|Write|MultiEdit)"' "$TRANSCRIPT" 2>/dev/null); EDITS=${EDITS:-0}
DIRTY=$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')

# SessionEnd can be delivered more than once for one harness session. Give the safety-net a
# deterministic identity so a retry converges instead of minting another timestamped closeout.
# The producer session normally distinguishes separate sessions on the same branch/HEAD; the other
# fields keep the key scoped when a harness reuses identifiers across machines or repositories.
KEY_INPUT="${MACHINE}|${ROOT}|${BRANCH}|${SHORT}|${SOURCE_SESSION}"
if command -v shasum >/dev/null 2>&1; then
  KEY_HASH=$(printf '%s' "$KEY_INPUT" | shasum -a 256 | awk '{print substr($1,1,24)}')
elif command -v sha256sum >/dev/null 2>&1; then
  KEY_HASH=$(printf '%s' "$KEY_INPUT" | sha256sum | awk '{print substr($1,1,24)}')
else
  KEY_HASH=$(printf '%s' "$KEY_INPUT" | cksum | awk '{print $1}')
fi
KEY_MARKER="Safety-net key: ${KEY_HASH}"
SESSIONS_DIR="$VAULT/AI Brain/Projects/$PROJECT/Sessions"
if [ -d "$SESSIONS_DIR" ] && grep -R -F -q -- "$KEY_MARKER" "$SESSIONS_DIR" 2>/dev/null; then
  exit 0
fi

GOAL="Preserve a durable safety-net record for meaningful repository work that ended without a rich AI Brain closeout."
SUMMARY="(auto) Session ended on ${BRANCH}@${SHORT}. ${EDITS} file edit(s) this session; ${DIRTY} uncommitted on exit.
Recent commits:
${COMMITS:-- (none this session)}"
CHANGES="Mechanical evidence only: repository ${ROOT} at ${BRANCH}@${SHORT}; the transcript recorded ${EDITS} edit operation(s), and ${DIRTY} working-tree entry or entries remained on exit. Exact file ownership was not recoverable by the safety-net."
DECISIONS="None recoverable from the safety-net's mechanical evidence."
QUESTIONS="Whether the remaining working-tree entries or project memory need manual reconciliation."
NEXT="(auto-generated safety-net closeout — no rich brain-closeout ran. Review ${PROJECT} Current State / Next Steps if this was substantial.)"
REFS="${KEY_MARKER}; producer session: ${SOURCE_SESSION}; branch/HEAD: ${BRANCH}@${SHORT}."

(cd "$VAULT" && node "$MJS" closeout "$PROJECT" "Auto-closeout: ${BRANCH}@${SHORT}" "$MACHINE" \
  --goal "$GOAL" \
  --summary "$SUMMARY" \
  --changes "$CHANGES" \
  --decisions "$DECISIONS" \
  --questions "$QUESTIONS" \
  --next "$NEXT" \
  --refs "$REFS" >/dev/null 2>&1) || exit 0
(cd "$VAULT" && node "$MJS" idle "$MACHINE" >/dev/null 2>&1)

# Best-effort propagate so other machines sync even if Obsidian isn't running.
# SYNCHRONOUS (never backgrounded — a reaped session must not orphan a push mid-flight)
# and conflict-SAFE (any rebase trouble aborts and leaves the commit local; the next
# session's push carries it — the vault is never left mid-rebase). Fully fail-open.
#
# Identity is always explicit on this commit — never git's own hostname/GECOS fallback.
# A machine with no `user.email` configured (e.g. a fresh laptop) would otherwise get a
# silently synthesized author like "Old-Laptop handover <noreply@localhost>", which GitHub can't
# attribute and which breaks author-gated deploys (see the 2026-08-30 Old-Laptop incident).
GIT_ID_NAME=$(git -C "$VAULT" config --get user.name 2>/dev/null)
GIT_ID_EMAIL=$(git -C "$VAULT" config --get user.email 2>/dev/null)
{ [ -n "$GIT_ID_NAME" ] && [ -n "$GIT_ID_EMAIL" ]; } || exit 0   # no identity → never synthesize one
TO=""; command -v timeout >/dev/null 2>&1 && TO="timeout 20"
( cd "$VAULT" || exit 0
  git add "AI Brain/Projects/$PROJECT/Sessions" "AI Brain/Machines/$MACHINE" >/dev/null 2>&1 || exit 0
  git diff --cached --quiet >/dev/null 2>&1 && exit 0   # nothing staged → nothing to do
  git -c user.name="$GIT_ID_NAME" -c user.email="$GIT_ID_EMAIL" \
    commit -q -m "${MACHINE} auto-closeout: ${PROJECT} ${BRANCH}@${SHORT}" >/dev/null 2>&1 || exit 0
  git push --quiet >/dev/null 2>&1 && exit 0            # clean push — done
  # remote moved: rebase our commit on top; on ANY conflict, abort and keep it local
  if $TO git pull --rebase --quiet >/dev/null 2>&1; then
    git push --quiet >/dev/null 2>&1 || true
  else
    git rebase --abort >/dev/null 2>&1 || true
  fi )
exit 0
