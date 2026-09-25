---
name: brain-closeout
description: Wrap up a session by writing a structured summary to the Obsidian AI Brain, updating project state, and marking this machine idle. Triggers when the user says "wrap up", "we're done", "let's commit", "let's push", "closeout", "end session", "done for today", or signals end of meaningful work. Captures what changed, what was decided, and what's next so the next session (on any machine) can pick up cleanly.
---

# brain-closeout

Writes a structured session summary to the Obsidian AI Brain, updates project state, and marks this machine idle.


## When to invoke

- User says any of: "wrap up", "we're done", "closeout", "end session", "done for today", "let's commit", "let's push", "save state"
- End of any meaningful work session — even if the user doesn't explicitly ask
- If a session is about to be paused for a long time

## What to do

### 0a. Resolve the vault path (DO NOT assume `~/Obsidian-Vault`)

The vault lives at a different path on each machine. Resolve it, never hardcode it:

```sh
VAULT="${BRAIN_VAULT:-}"
if [ -z "$VAULT" ]; then
  for c in "$HOME/Obsidian-Vault" "$HOME/obsidian-cortex" \
           "$HOME/Obsidian/Personal" "$HOME/GitHub/obsidian-cortex"; do
    [ -d "$c/AI Brain" ] && { VAULT="$c"; break; }
  done
fi
echo "vault: ${VAULT:?could not find the vault — set BRAIN_VAULT}"
```

Every `cd "$VAULT"` below depends on this. Known paths in a real fleet have included
`~/Obsidian-Vault`, `~/obsidian-cortex`, `~/GitHub/obsidian-cortex` and
`~/Obsidian/Personal` — one per machine. Background: `AI Brain/docs/brain-skill-sync-path-bug.md`.


### 0b. Resolve THIS machine's stable name (CRITICAL — DO NOT SKIP)

**Every example in this skill uses `<MACHINE>` as a placeholder.** You MUST substitute your actual machine name. Do NOT copy `"Laptop"` or any literal name from this doc.

```sh
cd "$VAULT"
node "AI Brain/scripts/brain.mjs" whoami
```

Use the reported `canonical:` value, and **read anything `whoami` prints on stderr**. It emits a
loud `warning: ambiguous machine identity` when `hostname` and `LocalHostName` resolve to
different machine folders — if you see that, the machine name is genuinely uncertain and you
should confirm before writing anything.

`hostname` can fall back to a value that matches a *different* machine's folder (macOS with
`HostName` unset), so **if the resolved name looks like another machine, stop and check
`aliases.json`** before writing.

If you find yourself about to copy a literal machine name from an example, stop and use the
resolved canonical value.

### 0c. Pull BEFORE you write (not just before you push)

```sh
cd "$VAULT" && git pull --rebase
```

Compose the closeout against current state, not the state from when the session began. The
project files you are about to edit — `Current State.md`, `Next Steps.md` — are written by every
machine in the fleet, so a session that started hours ago is editing a stale base and its commit
will collide on rebase at push time.

Pulling here does not remove the race, but it narrows the window from the whole session to the
closeout itself. If the pull brings changes that alter what you were going to write, re-read the project
files before drafting — the state you remember may already be gone.

### 1. Draft the summary from the session itself

You have the conversation context. Synthesize:

- **Summary** — what changed in 1–3 short bullets
- **Changes** — concrete files, repos, directories, or PRs touched (paths preferred)
- **Decisions** — anything durable that affects future work
- **Next** — the specific next action, written so any agent can pick it up
- **Questions** — anything unresolved that should land in `Shared/Open Loops.md`

If you're unsure, run `git status` and `git log --oneline -10` in the project repo to ground the summary in actual changes.

### 2. Determine project and machine

- **Project name** = the matching `AI Brain/Projects/<name>/` folder. If unsure: `node "AI Brain/scripts/brain.mjs" status` lists them.
- **Machine name** = the `<MACHINE>` you detected in Step 0 above. Do NOT default to "Laptop".
- **Session ID** = the `session_id` returned by this task's startup command. If unavailable, use `snapshot` and match the task by agent/project/focus; omit `--session` only if exactly one session is active on this machine.
- **Session title** = short imperative phrase (e.g., "Bootstrap wiki layer + session protocol").

### 3. Run closeout

```sh
cd "$VAULT"
node "AI Brain/scripts/brain.mjs" closeout "<Project Name>" "<Session title>" "<MACHINE>" \
  --had-commits --had-edits [--had-pr] --duration-band short|medium|long \
  --goal "<what this session set out to complete>" \
  --summary "<1–3 short bullets, newline-separated>" \
  --changes "<paths or areas touched>" \
  --decisions "<durable decisions, or 'None recorded'>" \
  --next "<specific next action>" \
  --questions "<open questions, or 'None recorded'>" \
  --refs "<useful references, or 'None'>"
```

This writes `AI Brain/Projects/<Project>/Sessions/YYYY-MM-DD-HHMM-<slug>.md` AND appends to `AI Brain/Machines/<MACHINE>/Session Log.md`.

The `--had-commits` / `--had-edits` / `--had-pr` / `--duration-band` flags feed the optional Jev
closeout-richness gate (advisory, never blocks). Pass the ones that are true — the command does not
infer them, so a closeout without them always reads as "not rich", even for a session that shipped.
If a caller omits a field, the helper writes an explicit `Unknown — caller omitted ...` marker rather
than a scaffold `TODO`; reconcile any such marker before committing or marking the activity idle.

### 4. Update durable project files if state changed

If the session changed project state, edit:

- `AI Brain/Projects/<Project>/Current State.md` — Snapshot, What Works, In Progress, Blockers, Recent Changes
- `AI Brain/Projects/<Project>/Next Steps.md` — Now / Soon / Later / Questions

Keep these tight. If nothing meaningfully changed, skip.

### 5. If decisions or open loops crossed project boundaries

- Add to `AI Brain/Shared/Decisions.md` (architectural / workflow-wide decisions)
- Add to `AI Brain/Shared/Open Loops.md` (cross-project unresolved questions)

### 6. If the session ingested a source, queried the wiki, or made wiki edits

Append to vault `log.md`:

```sh
node "AI Brain/scripts/brain.mjs" log-event ingest|query|lint|note "<subject>"
```

### 7. Mark this machine idle

```sh
node "AI Brain/scripts/brain.mjs" idle "<MACHINE>" --session "<SESSION_ID>"
```

Never use `idle --all` for a normal closeout; it would clear other concurrent tasks.

### 8. Daily-summary check

If the current local time is past 5pm AND no `AI Brain/Daily/<today>.md` exists yet, ask the user if they want to generate today's daily summary now via the `brain-daily` skill. (Don't run it automatically — defer to them.)

### 9. Commit and push (default: do it; pause only if something looks off)

Standing preference (from `AI Brain/Shared/Preferences.md`): commit and push vault updates by default on closeout. Only pause if `git status` shows unfamiliar or unrelated changes.

```sh
cd "$VAULT" && git status --short
```

If everything in the status is from this session (closeout files + the vault paths you touched), commit and push without asking:

```sh
git config --get user.email >/dev/null 2>&1 || { echo "No git identity configured on this machine — STOP. Do NOT supply one to get past this. Ask the user to run: git config --global user.email \"you@example.com\" && git config --global user.name \"Your Name\""; exit 1; }
git add "AI Brain" "Synthesis" index.md log.md
git commit -m "<MACHINE> closeout: <session title>"
git push
```

**Never fabricate a git identity to get past a stop.** Git refuses to commit when no
`user.email` is configured — that refusal is a feature, and it is *not* the failure mode.
The failure mode is an agent routing around it by supplying a placeholder inline, e.g.
`git -c user.name="handover" -c user.email="noreply@localhost" commit`. Such an identity can't be
attributed on GitHub and won't pass author-gated deploys, and it spreads to every repo the agent
touches. Stop and ask the user instead.

Note `user.useConfigOnly=true` hardens the *other* half of this (it disables git's own
hostname/GECOS guessing, which can otherwise succeed silently on a machine whose hostname
resolves to a dotted domain). It does **not** override an explicit `-c user.email=` or
`GIT_AUTHOR_EMAIL`, so it cannot prevent the fabrication case above. Only this rule can.

Use the `<MACHINE>` name you detected in Step 0, not the literal "Laptop".

Only `git add` the paths you actually touched. If `git status` shows changes you don't recognize (random untracked files, edits to files this session never visited), STOP — list them to the user and ask before adding.

## Rules

- Never store secrets, credentials, or chat transcripts
- Be **concise** — a session file is a few short bullets, not a transcript
- Decisions go in `Decisions.md` (durable, with rationale), not in `Current State.md`
- If you don't know the project name and can't infer it: ask the user before writing — wrong project routing pollutes memory

- Handoffs to another agent point at the Brain note path ("read the note — don't trust my summary"); live projects and session notes carry a `Stop when:`.
