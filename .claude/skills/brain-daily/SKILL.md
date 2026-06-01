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

### 0. Detect THIS machine's name (CRITICAL — DO NOT SKIP)

**Every example in this skill uses `<MACHINE>` as a placeholder.** You MUST substitute your actual machine name. Do NOT copy `"Laptop"` or any literal name from this doc.

```sh
hostname
ls ~/Obsidian-Vault/AI\ Brain/Machines/
```

Use the folder name that matches the hostname (case may differ — `Laptop` hostname → `LAPTOP` folder is fine). If you find yourself about to type the literal `"Laptop"` in a command, STOP — that's a real bug we hit where one machine clobbered another's Current Activity. Always substitute.

### 1. Run the daily command

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" daily "<MACHINE>"
```

This auto-aggregates:

- All `AI Brain/Projects/*/Sessions/YYYY-MM-DD-*.md` files dated today
- All today's entries from vault `log.md`
- Writes `AI Brain/Daily/YYYY-MM-DD.md` with sections: Sessions, Projects, Wiki events, Decisions (placeholder), Open Loops (placeholder), Notes for tomorrow (placeholder)
- Appends a `daily | ...` entry to `log.md`

### 2. Enrich the placeholder sections

The auto-generated file leaves three sections for you to fill:

- **Decisions made** — read the linked session files, extract durable decisions, write 1–3 bullets
- **Open loops added or resolved** — diff `AI Brain/Shared/Open Loops.md` against yesterday (or just summarize current open vs. resolved), write 1–3 bullets
- **Notes for tomorrow** — read each project's `Next Steps.md`, pull the top "Now" items, write a short, prioritized list

Be concise. The daily summary is a TL;DR of the day, not a transcript.

### 3. Brief the user

In 3–6 lines:

- How many sessions across how many projects
- Top 1–2 decisions or wiki additions worth surfacing
- The 1–3 things that should pick up tomorrow

### 4. Commit and push (ASK before pushing)

If the user agrees:

```sh
cd ~/Obsidian-Vault && git add "AI Brain/Daily" log.md && git commit -m "Daily summary $(date +%Y-%m-%d)" && git push
```

## Edge cases

- **No sessions today** — the daily file is still written but mostly empty. Tell the user "no recorded sessions today" and confirm whether to keep the file or delete it.
- **Multi-machine days** — if `snapshot` shows other machines also worked today, mention this. Their session files (after they push) will appear in subsequent runs of `daily`; if a machine forgot to push, the daily for that day on this machine won't include them. Rerunning `daily` after the missing machine pushes will refresh the file.
- **Re-running on the same day** — overwrites the existing daily file. That's intentional — the file is always the latest synthesis. The `log.md` entry will appear twice; that's also fine.

## Rules

- Never store secrets, credentials, or chat transcripts
- Daily files are TL;DRs, not archives — the session files under `Projects/*/Sessions/` are the source of truth
- If the user wants weekly or monthly rollups later, that's a separate enhancement — `brain-daily` only does single days
