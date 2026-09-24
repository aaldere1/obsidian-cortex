---
name: brain-daily
description: Generate the end-of-day rollup of everything that happened across all machines and projects — sessions, decisions, wiki edits, open loops. Writes AI Brain/Daily/YYYY-MM-DD.md. Triggers when the user says "daily summary", "what did I do today", "end of day", "wrap up the day", "daily rollup", or any end-of-day review request. Can also be invoked from a cron schedule.
---

# brain-daily

End-of-day rollup. Reads today's session files, machine session logs, and vault log; writes a single daily summary file.


## When to invoke

- User says: "daily summary", "what did I do today", "end of day", "daily rollup", "wrap up the day", "show today's work"
- Triggered from cron (recommended: `0 21 * * *` — 9pm local)
- Suggested by `brain-closeout` if it's past 5pm and no daily file exists yet for today

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

Why this matters: on Old-Laptop, `os.hostname()` returned literally `Mac`, which is **Laptop's folder** —
a different, live machine — because macOS `HostName` was unset and the name fell back to a
DHCP-derived value. Before 2026-08-30 `whoami` reported `canonical: Mac` there, so following
this step exactly would have written Old-Laptop's records into Laptop's. `brain.mjs` now prefers the alias
hit on `LocalHostName` and warns on the collision, but the lesson stands: **if the name looks
like another machine, stop and check `aliases.json`.**

If you find yourself about to copy a literal machine name from an example, stop and use the
resolved canonical value.

### 1. Run the daily command

```sh
cd "$VAULT"
node "AI Brain/scripts/brain.mjs" daily "<MACHINE>"
```

This auto-aggregates:

- All `AI Brain/Projects/*/Sessions/YYYY-MM-DD-*.md` files dated today
- All today's entries from vault `log.md`
- Writes `AI Brain/Daily/YYYY-MM-DD.md` with sections for sessions, projects, wiki events, decisions, open questions, and next steps synthesized from today's closeouts
- Appends a `daily | ...` entry to `log.md`

### 2. Verify the synthesized sections

The generator extracts three sections from today's session closeouts:

- **Decisions made** — durable decisions recorded by today's sessions
- **Open loops added or resolved** — open questions recorded by today's sessions
- **Notes for tomorrow** — next steps recorded by today's sessions

Read the generated Markdown before committing. Correct any stale or misleading source entry, add a
cross-project open-loop change that was recorded only in `Shared/Open Loops.md`, and confirm no
`TODO`, `TBD`, or generated instruction remains. Be concise; the daily summary is a TL;DR, not a transcript.

### 3. Brief the user

In 3–6 lines:

- How many sessions across how many projects
- Top 1–2 decisions or wiki additions worth surfacing
- The 1–3 things that should pick up tomorrow

### 4. Commit and push (ASK before pushing)

If the user agrees:

```sh
cd "$VAULT" && git add "AI Brain/Daily" log.md && git commit -m "Daily summary $(date +%Y-%m-%d)" && git push
```

## Edge cases

- **No sessions today** — the daily file is still written but mostly empty. Tell the user "no recorded sessions today" and confirm whether to keep the file or delete it.
- **Multi-machine days** — if `snapshot` shows other machines also worked today, mention this. Their session files (after they push) will appear in subsequent runs of `daily`; if a machine forgot to push, the daily for that day on this machine won't include them. Rerunning `daily` after the missing machine pushes will refresh the file.
- **Re-running on the same day** — overwrites the existing daily file. That's intentional — the file is always the latest synthesis. The `log.md` entry will appear twice; that's also fine.

## Rules

- Never store secrets, credentials, or chat transcripts
- Daily files are TL;DRs, not archives — the session files under `Projects/*/Sessions/` are the source of truth
- If the user wants weekly or monthly rollups later, that's a separate enhancement — `brain-daily` only does single days


## Fleet Apply Queue (2026-09-22)
Pull SoT, read `Shared/Fleet Apply Queue.md`, apply open items, mark machine + date, push. Write fleet learnings back the same way.
