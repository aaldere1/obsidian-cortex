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

### 0. Detect THIS machine's name (CRITICAL — DO NOT SKIP)

**Every example in this skill uses `<MACHINE>` as a placeholder.** You MUST substitute your actual machine name. Do NOT copy `"Laptop"` or any literal name from this doc.

```sh
hostname
ls ~/Obsidian-Vault/AI\ Brain/Machines/
```

Use the folder name that matches the hostname (case may differ — `Laptop` hostname → `LAPTOP` folder is fine). If you find yourself about to type the literal `"Laptop"` in a command, STOP — that's the bug from 2026-05-21 where LAPTOP clobbered Laptop's Current Activity. Always substitute.

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
- **Session title** = short imperative phrase (e.g., "Bootstrap wiki layer + session protocol").

### 3. Run closeout

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" closeout "<Project Name>" "<Session title>" "<MACHINE>" \
  --summary "<1–3 short bullets, newline-separated>" \
  --changes "<paths or areas touched>" \
  --decisions "<durable decisions, or 'None recorded'>" \
  --next "<specific next action>" \
  --questions "<open questions, or 'None recorded'>"
```

This writes `AI Brain/Projects/<Project>/Sessions/YYYY-MM-DD-HHMM-<slug>.md` AND appends to `AI Brain/Machines/Laptop/Session Log.md`.

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
node "AI Brain/scripts/brain.mjs" idle "<MACHINE>"
```

### 8. Daily-summary check

If the current local time is past 5pm AND no `AI Brain/Daily/<today>.md` exists yet, ask the user if they want to generate today's daily summary now via the `brain-daily` skill. (Don't run it automatically — defer to them.)

### 9. Commit and push (default: do it; pause only if something looks off)

Standing preference (from `AI Brain/Shared/Preferences.md`): commit and push vault updates by default on closeout. Only pause if `git status` shows unfamiliar or unrelated changes.

```sh
cd ~/Obsidian-Vault && git status --short
```

If everything in the status is from this session (closeout files + the vault paths you touched), commit and push without asking:

```sh
git add "AI Brain" "Synthesis" index.md log.md
git commit -m "<MACHINE> closeout: <session title>"
git push
```

Use the `<MACHINE>` name you detected in Step 0, not the literal "Laptop".

Only `git add` the paths you actually touched. If `git status` shows changes you don't recognize (random untracked files, edits to files this session never visited), STOP — list them to the user and ask before adding.

## Rules

- Never store secrets, credentials, or chat transcripts
- Be **concise** — a session file is a few short bullets, not a transcript
- Decisions go in `Decisions.md` (durable, with rationale), not in `Current State.md`
- If you don't know the project name and can't infer it: ask the user before writing — wrong project routing pollutes memory
