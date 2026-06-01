# Set Up The Brain On Another Computer

Goal: bring a new machine to full parity with Laptop in under 10 minutes. After this, any Claude Code or Codex session on the new machine will read from and write to the same `obsidian-cortex` vault as every other machine.

This is the **one-shot onboarding**. Follow top to bottom. Estimated time: 5–10 minutes.

---

## 0. Prerequisites

The new machine needs:

- `git` configured with access to `https://github.com/YOUR-USERNAME/obsidian-cortex` (https + a token, or SSH key)
- `node` (any LTS or current — verified with v22+, v25)
- Optional but recommended: Obsidian app installed
- Optional but recommended: Claude Code installed (`claude`) and/or Codex CLI installed

---

## 1. Clone the vault

Pick a stable path (suggested: `~/Obsidian-Vault`). All examples below assume that path; substitute if you choose differently.

```sh
cd ~
git clone https://github.com/YOUR-USERNAME/obsidian-cortex.git Obsidian-Vault
cd Obsidian-Vault
```

If Obsidian is installed, open this folder as a vault.

---

## 2. Pick a machine name

The machine name is the folder under `AI Brain/Machines/`. It's how other machines see this computer in the snapshot. Pick something stable and short. Examples: `Laptop`, `MBP-Studio`, `Mac-Mini`, `Windows-Desktop`. **Use the exact same name forever** — renaming later orphans the history.

For the rest of this doc, replace `<MACHINE>` with the name you picked.

---

## 3. Create the machine folder

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" init-machine "<MACHINE>"
```

This creates:

```
AI Brain/Machines/<MACHINE>/
  Current Context.md
  Local Setup.md
  Session Log.md
```

Then **fill in `Local Setup.md`** with: OS, shell, vault path, Node version, common project paths. Takes 2 minutes; lets future agents on this machine know where things are.

---

## 4. Bootstrap Current Activity (writes the in-flight signal file)

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

You should see your new machine in the list with `ACTIVE` status.

---

## 5. Configure agents on this machine

### Claude Code

Symlink or copy the three `brain-*` skills from your `~/.claude/skills/` directory. If you sync `~/.claude/` across machines (e.g. via dotfiles), skip this — they're already there. Otherwise copy them from Laptop:

```sh
# from Laptop, copy to clipboard / file transfer / git, then on the new machine:
mkdir -p ~/.claude/skills
# place brain-startup, brain-closeout, brain-daily under ~/.claude/skills/
```

The three skills will then be auto-discovered by Claude Code on session start.

### Codex

Add the AI Brain memory section to the global Codex AGENTS.md at `~/.codex/AGENTS.md`. The canonical version is in `~/Obsidian-Vault/AI Brain/docs/global-codex-instructions.md` — copy the relevant section into the new machine's `~/.codex/AGENTS.md` and replace any `Laptop` references with `<MACHINE>` and any `~/Obsidian-Vault` references with the actual path on the new machine.

---

## 6. (Optional) Schedule the daily summary

Add a cron entry so the daily rollup runs even if you forget:

```sh
crontab -e
# add this line — replace path and machine name:
0 21 * * * cd /Users/<you>/Obsidian-Vault && node "AI Brain/scripts/brain.mjs" daily "<MACHINE>" >> /tmp/brain-daily.log 2>&1
```

This runs at 9pm local. The skills will also remind you at session-closeout if no daily exists for today.

---

## 7. Commit and push the machine setup

```sh
cd ~/Obsidian-Vault
git status --short
git add "AI Brain/Machines/<MACHINE>"
git commit -m "Onboard <MACHINE> to the brain"
git push
```

After this push, every other machine that runs `snapshot` will see `<MACHINE>` in the list.

---

## 8. Verify

Run these and confirm:

```sh
node "AI Brain/scripts/brain.mjs" status              # lists machines + projects
node "AI Brain/scripts/brain.mjs" snapshot            # in-flight activity across all machines
node "AI Brain/scripts/brain.mjs" help                # full command surface
```

Then in a Claude Code session: invoke the `brain-startup` skill and confirm it briefs you on shared memory + the current activity snapshot.

You're done. Every meaningful session on this machine should now follow the protocol in the vault root `AGENTS.md`.

---

## Daily workflow on any machine (cheat sheet)

```sh
# Start of work
cd ~/Obsidian-Vault && git pull
# Then invoke the brain-startup skill in your agent

# During work — bump heartbeat occasionally
node "AI Brain/scripts/brain.mjs" activity "<MACHINE>" --focus "What I'm doing now"

# End of work — invoke the brain-closeout skill
# (it runs the closeout command + idle + asks about push)

# End of day — invoke the brain-daily skill
# (or let the 9pm cron handle it)
```

---

## Rules (same on every machine)

- Do **not** store secrets, credentials, API keys, cookies, recovery codes
- Do **not** paste full chat transcripts into memory
- Store concise summaries, decisions, next steps, open questions, and durable preferences
- Keep files small enough to edit by hand in Obsidian
- Use `YYYY-MM-DD` dates everywhere
- One Current Activity file per machine, overwritten not appended
- One Session Log per machine, appended only
- One Daily rollup per day per machine (overwriting same-day re-runs is fine)
- Vault `index.md` and `log.md` are append-only catalogs of the wiki layer

---

## Troubleshooting

**Conflict on `git pull`.** Two machines edited the same file (usually `Current Activity.md` or `index.md`). Resolve by hand — never blindly accept one side. The `log.md` file should always concatenate cleanly because entries are timestamped.

**`brain.mjs` says "no Current Activity file".** You skipped step 4. Run `startup` first.

**Snapshot shows a stale `ACTIVE` machine.** Last heartbeat older than ~2 hours and no closeout. Either the session crashed or someone forgot to closeout. Proceed but tell the user; manually `idle` the machine via `node "AI Brain/scripts/brain.mjs" idle "<that machine>"` if appropriate.

**Skills not appearing in Claude Code.** Check `~/.claude/skills/brain-*/SKILL.md` exists with valid YAML frontmatter. Skill discovery happens on session start; restart the Claude Code session.

**Codex not following protocol.** Confirm `~/.codex/AGENTS.md` includes the AI Brain section and references the correct local vault path on this machine. Restart any Codex session after editing.
