# How This Brain Works

A plain-language guide to the Obsidian-Vault vault: what it is, how to use it day-to-day, and how to bring up a new computer.

If you only read one file in this vault, read this one.

---

## What this is, in 30 seconds

A single Obsidian vault that does three jobs at once:

1. **Stores your raw stuff** — PDFs, articles, exports, attachments. Read-only to the AI; never modified.
2. **Holds a wiki that compounds** — synthesis pages the AI writes for you, organized by topic, with cross-links. Grows every time you ingest a source or ask a substantive question.
3. **Remembers what your AI agents are doing** — per-machine context, per-project state, session logs, daily rollups. So any agent on any machine picks up where the last one left off.

GitHub syncs everything between computers. Obsidian Git polls every few minutes and pulls/pushes automatically. Three Claude Code skills (`brain-startup`, `brain-closeout`, `brain-daily`) plus a small Node CLI (`brain.mjs`) do all the bookkeeping.

You write almost none of it. You curate, point at things, ask questions. The AI does the rest.

---

## The three layers (where things live)

```
~/Obsidian-Vault/         ← the vault
├── AGENTS.md                              ← the schema (rules for AI agents)
├── HOW-IT-WORKS.md                        ← this file (rules for you)
├── index.md                               ← catalog of wiki pages
├── log.md                                 ← chronological event log
│
├── Sources/                               ← raw reference material (READ-ONLY)
├── Apps/   Tools/   Concepts/            ← existing entity wikis (one page per thing)
├── Synthesis/                             ← new LLM-maintained synthesis pages
│   ├── Apps/        (one page per product)
│   ├── People/      (one page per person)
│   ├── Concepts/    (cross-cutting ideas)
│   ├── Comparisons/ (side-by-side analyses)
│   └── Notes/       (everything else)
│
└── AI Brain/                              ← agent operational memory
    ├── Shared/        (user-wide: profile, preferences, decisions, open loops)
    ├── Machines/<name>/  (per-computer: context, current activity, session log)
    ├── Projects/<name>/  (per-project: overview, state, decisions, sessions/)
    ├── Daily/         (end-of-day rollups: YYYY-MM-DD.md)
    ├── scripts/       (brain.mjs — the CLI)
    ├── templates/     (skeleton files for new entries)
    └── docs/          (deep docs incl. setup-other-computers.md)
```

**The rule of thumb**:
- Raw reference material (PDFs, articles, exports) → stays where it is, AI reads it
- New synthesis page you'd write yourself → goes in `Synthesis/<category>/`
- Anything about *how the AI works* or *what was decided/done* → goes in `AI Brain/`

---

## Your daily workflow (what you actually do)

The flow is the same in both Claude Code and Codex; the only difference is **how the protocol gets triggered**.

- In **Claude Code**, just say one of the trigger phrases below and the relevant skill auto-fires.
- In **Codex**, the protocol is in `~/.codex/AGENTS.md` so it runs automatically when relevant — but Codex won't *announce itself* the same way. If it doesn't seem to be doing the right thing, you can always nudge: *"follow the AI Brain protocol"* or run the `brain.mjs` commands directly.

**You do not need to open the agent inside the vault folder.** Open Claude Code or Codex wherever you're actually working — typically in a project repo like `~/my-project`, `~/another-app`, or whatever you are focused on. The vault is the *brain* (memory and knowledge); your project is *where you're doing the work*. The agent reads/writes the vault behind the scenes. You stay in your project; the agent goes to the vault when it needs to.

**The reliable way to drive the brain is slash commands.** Natural-language triggers exist but are probabilistic — Claude Code's skill auto-discovery may decide a generic phrase like "start a session" doesn't merit firing the skill (this happened in real testing on 2026-05-21). Slash commands are unambiguous and always fire.

### Starting work

In Claude Code, type:

```
/brain-startup
```

This auto-fires the `brain-startup` skill, which will:

1. `git pull` the vault
2. Run a cross-machine snapshot (who else is active?)
3. Read shared memory + this machine's context + relevant project memory + relevant wiki pages
4. Write `Current Activity.md` so other machines know what you're doing
5. Brief you in 3–6 lines on what's open and what's recommended next

In Codex, the protocol is in `~/.codex/AGENTS.md` and runs automatically when relevant. If it doesn't seem to be doing the right thing, nudge: *"follow the AI Brain protocol"* or run the commands directly:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" snapshot
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" --agent "Codex" --project "<Project>" --focus "<what you're doing>" --cwd "$(pwd)"
```

(Replace `<MACHINE>` with this machine's actual name — `hostname` will tell you.)

Natural-language fallback (if you forget the slash command): *"start a session"*, *"catch me up"*, *"what was I working on"*, *"where did I leave off"*. These usually work; the slash command always works.

### During work

Work normally. The skill bumped a heartbeat at startup; another happens at closeout. If you shift focus mid-session and want to update the in-flight signal:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" activity "<MACHINE>" --focus "<new focus>"
```

To ingest a new source into the wiki mid-session, ask Claude something concrete like *"read [path/URL] and write a synthesis page for it under Apps/"* (or Concepts/People/Comparisons/Notes — whichever category fits). The agent will read it, write `Synthesis/<category>/<title>.md`, update `index.md`, and append a `log-event ingest` entry to `log.md`.

### Ending work

In Claude Code:

```
/brain-closeout
```

This auto-fires the `brain-closeout` skill, which will:

1. Draft a session summary from the conversation
2. Run `brain.mjs closeout` — writes the session file + appends to `Session Log.md`
3. Update `Current State.md` and `Next Steps.md` for the project if state changed
4. Mark this machine `idle`
5. Ask if you want to commit + push (yes/no)

If you say no on the push, Obsidian Git will eventually auto-push it on its next cycle. You're never stuck.

In Codex (no skill, run the commands):

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" closeout "<Project Name>" "<Short session title>" "<MACHINE>" \
  --summary "What changed" \
  --changes "Files / repos / areas touched" \
  --decisions "Durable decisions, or 'None recorded'" \
  --next "Specific next action"
node "AI Brain/scripts/brain.mjs" idle "<MACHINE>"
git add "AI Brain" && git commit -m "<MACHINE> closeout: <session title>" && git push
```

Natural-language fallback: *"wrap up"*, *"closeout"*, *"we're done"*, *"end session"*, *"done for today"*, *"let's commit"*.

### End of day

In Claude Code:

```
/brain-daily
```

This auto-fires the `brain-daily` skill, which rolls up the day's session files into `AI Brain/Daily/YYYY-MM-DD.md` — sessions, projects touched, wiki events, decisions, open loops, notes for tomorrow.

In Codex or any terminal:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" daily "<MACHINE>"
```

A 9pm cron does the same thing automatically if you set it up during onboarding (Step 7 of `START-HERE.md`). The closeout skill will also prompt you about it if it's past 5pm and no daily exists for today.

Natural-language fallback: *"daily summary"*, *"what did I do today"*, *"end of day"*, *"wrap up the day"*, *"daily rollup"*.

---

## Setting up a new computer

**Just open [`START-HERE.md`](START-HERE.md) on the new computer and follow it top to bottom.** It's a 10-step terminal-only walkthrough that assumes nothing is installed beyond `git` and `node`. Takes ~5 minutes total.

It handles the chicken-and-egg of "the bootstrap skill can't auto-fire if it isn't installed yet" by giving you copy-paste shell commands instead of relying on agent magic. After running it, both Claude Code and Codex on that machine will follow the brain protocol automatically.

**On a machine that already has the skills installed** (e.g., because you sync `~/.claude/` across machines via dotfiles), you can use the agent-driven shortcut instead: open Claude Code and say *"bootstrap this machine"* — the `brain-bootstrap` skill fires the runbook at `AGENT-BOOTSTRAP.md`.

The deeper technical onboarding doc with troubleshooting: `AI Brain/docs/setup-other-computers.md`.

### Old long-form walkthrough (kept for reference)

The 9 steps below are what `START-HERE.md` walks through in less prose. Either path works; use whichever you prefer.

Assumptions:

- Obsidian is installed
- `git` is installed and configured with access to `github.com/YOUR-USERNAME/obsidian-cortex`
- `node` is installed (any recent version)
- Claude Code is installed (and/or Codex CLI)

### Step 1 — Clone the vault

```sh
cd ~
git clone https://github.com/YOUR-USERNAME/obsidian-cortex.git Obsidian-Vault
cd Obsidian-Vault
```

Open `~/Obsidian-Vault` in Obsidian as a vault. Enable the Obsidian Git plugin if you want automatic sync (recommended).

### Step 2 — Pick a machine name

Short, stable, unique. Examples: `Laptop`, `MBP-Studio`, `Mac-Mini`, `Windows-Desktop`.

**Use the same name forever.** Renaming later orphans the history under the old name.

For the rest of these instructions, replace `<MACHINE>` with the name you picked.

### Step 3 — Create the machine folder

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" init-machine "<MACHINE>"
```

This creates `AI Brain/Machines/<MACHINE>/` with `Current Context.md`, `Local Setup.md`, `Session Log.md`.

Open `Local Setup.md` in Obsidian and fill in: OS, shell, local vault path, Node version, common project folders. Takes 2 minutes. Future agents on this machine read this to know where things are.

### Step 4 — Bootstrap Current Activity

```sh
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" \
  --agent "manual" \
  --project "Obsidian-AI-Brain" \
  --focus "Onboarding this machine" \
  --cwd "$(pwd)"
```

Verify:

```sh
node "AI Brain/scripts/brain.mjs" snapshot
```

Should show your new machine listed as `ACTIVE`.

### Step 5 — Install the Claude Code skills

The skills live at `~/.claude/skills/` on each machine. They aren't synced via the vault (they're personal Claude config). Copy them from Laptop in whichever way you usually move dotfiles:

```sh
# easiest: copy from Laptop via a temp dir, USB, AirDrop, scp, or your dotfiles repo
# then on the new machine:
mkdir -p ~/.claude/skills
# place these three directories under ~/.claude/skills/:
#   brain-startup/    (contains SKILL.md)
#   brain-closeout/   (contains SKILL.md)
#   brain-daily/      (contains SKILL.md)
```

After copying, the next Claude Code session on this machine will auto-discover them. No restart needed beyond starting a new session.

### Step 6 — Configure Codex (if you use it)

Copy the AI Brain section from your primary machine's `~/.codex/AGENTS.md` into the new machine's `~/.codex/AGENTS.md`. Replace `Laptop` → `<MACHINE>` and replace `~/Obsidian-Vault` → the actual vault path on the new machine (in case the username differs).

Restart any open Codex session for it to load the new instructions.

### Step 7 — (Optional) Schedule the daily rollup

```sh
crontab -e
# add one line — adjust path and machine name:
0 21 * * * cd ~/Obsidian-Vault && node "AI Brain/scripts/brain.mjs" daily "<MACHINE>" >> /tmp/brain-daily.log 2>&1
```

Runs at 9pm local. The closeout skill will also prompt you about it at session end if no daily exists for today.

### Step 8 — Commit and push the machine setup

```sh
cd ~/Obsidian-Vault
git add "AI Brain/Machines/<MACHINE>"
git commit -m "Onboard <MACHINE> to the brain"
git push
```

After this push, every other machine's next `snapshot` will see `<MACHINE>` in the list.

### Step 9 — Verify

In a new Claude Code session on the new machine, say *"start a session"*. The `brain-startup` skill should fire, pull, snapshot (you'll see both machines now), brief you, and confirm.

You're done. This machine is fully participating.

For the deeper technical version of this checklist (with troubleshooting), see `AI Brain/docs/setup-other-computers.md`.

---

## How the cross-machine coordination actually works

Each machine writes its in-flight state to `AI Brain/Machines/<MACHINE>/Current Activity.md` — a small overwritten file with YAML frontmatter showing status, agent, project, focus, started, and last_heartbeat.

When a session starts, `brain-startup` runs `git pull` and then `snapshot`, which reads every machine's Current Activity and reports:

```
In-flight activity across all machines:
  ACTIVE   Laptop    agent=Claude Code   project=my-project
                 focus: Implementing Vimeo playback selection
                 started: 2026-05-21 09:15   heartbeat: 2026-05-21 09:43
  idle     Studio agent=—            project=—
                 focus: (idle)
                 started: —          heartbeat: 2026-05-21 08:01
```

If you start a session on `Studio` and see `Laptop` is `ACTIVE` on the same project, the skill tells you and asks how to proceed. No silent stomping on each other's work.

The Obsidian Git plugin auto-pulls every few minutes, so Current Activity changes propagate quickly. But `brain-startup`'s explicit `git pull` makes the snapshot accurate to the second.

---

## What gets stored vs. what doesn't

**Stored** (concise, durable, useful next session):
- Session summaries (what changed, what was decided, what's next)
- Per-machine context (paths, tools, in-flight work)
- Per-project state (current state, next steps, decisions, open questions)
- Synthesis pages (entity descriptions, comparisons, concept notes)
- Vault log entries (one line per ingest/query/lint/daily/note)

**Never stored**:
- Secrets, API keys, tokens, passwords, cookies, SSH keys, recovery codes
- Full chat transcripts (use brief summaries instead)
- Raw terminal logs
- Sensitive personal data not needed for development work

If unsure, write less and link to a repo file or doc.

---

## When things go weird

**`brain-startup` says "no Current Activity file".**
You haven't run `init-machine` for this machine yet, or `startup` has never been called. See Step 3 and 4 above.

**Snapshot shows a stale `ACTIVE` machine (heartbeat hours old).**
That session probably crashed or someone forgot to closeout. Proceed but tell the user. To clear it manually: `node "AI Brain/scripts/brain.mjs" idle "<that-machine>"`.

**Git pull fails with conflicts.**
Two machines edited the same file. Most likely `index.md`, a `Current Activity.md`, or both. Open the file, resolve by hand (preserve both intents), `git add`, `git commit`. Never blindly accept one side.

**Surprise commits in `git log` titled "vault backup: TIMESTAMP".**
That's the Obsidian Git plugin auto-committing. Expected behavior. It runs every ~3 hours and bundles whatever's changed. To do an atomic commit yourself, chain `git add && git commit` in a single shell command so they're atomic.

**Skills not appearing in Claude Code.**
Check `~/.claude/skills/brain-*/SKILL.md` exists with valid YAML frontmatter. Skill discovery happens on session start; start a new session.

**Codex not following the protocol.**
Confirm `~/.codex/AGENTS.md` includes the AI Brain section and references the correct local vault path on this machine.

**Two machines pushed at the same time and Obsidian Git crashed.**
Open a terminal, `cd ~/Obsidian-Vault && git status` — fix whatever's in conflict, then `git add && git commit && git push`.

---

## Cheat sheet (print this)

```sh
# Daily life — Claude Code (most reliable: slash commands)
/brain-startup                → guaranteed to fire brain-startup
/brain-closeout               → guaranteed to fire brain-closeout
/brain-daily                  → guaranteed to fire brain-daily
/brain-bootstrap              → guaranteed to fire brain-bootstrap (new machine only)

# Note: skill updates auto-sync on every Claude Code session start (via the
# brain-skill-sync SessionStart hook installed at bootstrap time). When a skill
# in the vault changes, the next Claude Code session on this machine picks up
# the new version automatically — no manual command needed.

# Auto-discovery (works most of the time, but not always)
say "start a session"        → brain-startup runs
say "wrap up"                → brain-closeout runs
say "daily summary"          → brain-daily runs
say "bootstrap this machine" → brain-bootstrap runs (new machine only)

# Daily life — Codex (protocol from ~/.codex/AGENTS.md)
# Codex follows the same trigger phrases above, but the behavior comes from
# the AI Brain Memory section of ~/.codex/AGENTS.md, not from skills.
# If Codex doesn't seem to be following the protocol, you can either:
#   - explicitly say "follow the AI Brain protocol"
#   - or run the brain.mjs commands directly:

cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" snapshot        # who's doing what
node "AI Brain/scripts/brain.mjs" status          # list machines + projects
node "AI Brain/scripts/brain.mjs" startup "Laptop" --agent "Codex" --project "X" --focus "Y" --cwd "$(pwd)"
node "AI Brain/scripts/brain.mjs" activity "Laptop" --focus "Updated focus"
node "AI Brain/scripts/brain.mjs" closeout "Project" "Title" "Laptop" --summary "..." --next "..."
node "AI Brain/scripts/brain.mjs" idle "Laptop"
node "AI Brain/scripts/brain.mjs" daily "Laptop"
node "AI Brain/scripts/brain.mjs" log-event ingest|note "Subject"
node "AI Brain/scripts/brain.mjs" help            # all commands

# New computer: see "Setting up a new computer" above (~5-10 min)
```

---

## Want to go deeper?

- **Full schema for agents** — `AGENTS.md` (in this folder)
- **Deep onboarding checklist** — `AI Brain/docs/setup-other-computers.md`
- **Original LLM Wiki + AI Brain design notes** — `AI Brain/docs/always-on-workflow.md`, `AI Brain/docs/automation-roadmap.md`
- **Cataloged wiki pages** — `index.md`
- **Event timeline** — `log.md`

---

*Last updated: 2026-05-21*
