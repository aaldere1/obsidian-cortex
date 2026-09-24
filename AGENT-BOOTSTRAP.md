# Agent Bootstrap Runbook

You are an AI agent. You are reading this because you've been asked to set yourself up to participate in the Obsidian-Vault brain. Follow this document top to bottom. Do not skip the self-check. Do not skip the verification at the end.

This runbook is **document-as-script** — read it, execute it, verify, hand off to `AGENTS.md` for ongoing operation.

---

## Hard rules — read first, never violate

- **Never store** secrets, API keys, auth tokens, passwords, cookies, SSH keys, recovery codes, or full chat transcripts anywhere in the vault.
- **Never blindly resolve** git conflicts. Preserve both versions, flag the conflict, ask the human.
- **Never invent** a machine name. Ask the human exactly once; use what they say verbatim.
- **Never invent** a vault path. Ask the human exactly once if the vault isn't where you expect; use what they say verbatim.
- **Never auto-push** without confirming the diff is what you intended.
- Auto-backup commits titled `vault backup: TIMESTAMP` exist in `git log` — that's the Obsidian Git plugin. Don't touch them, don't try to undo them.

If anything in your execution doesn't match what this runbook expects, **stop and tell the human**. Don't improvise.

---

## Step 1 — Self-check

Run these four detections silently. Capture the answers; you'll branch based on them.

```sh
# Detection 1: is the vault cloned at the expected path?
test -d ~/Obsidian-Vault/.git && echo "vault: YES" || echo "vault: NO"

# Detection 2: is this machine registered?
# (you need a machine name to check — see Step 2 for asking the human if you don't have one)
test -d "~/Obsidian-Vault/AI Brain/Machines/<MACHINE>" && echo "machine: YES" || echo "machine: NO"

# Detection 3: is your agent flavor configured on this machine?
# If you are Claude Code:
test -f ~/.claude/skills/brain-startup/SKILL.md && \
test -f ~/.claude/skills/brain-closeout/SKILL.md && \
test -f ~/.claude/skills/brain-daily/SKILL.md && \
echo "claude-skills: YES" || echo "claude-skills: NO"

# If you are Codex:
grep -q "Obsidian AI Brain" ~/.codex/AGENTS.md 2>/dev/null && \
echo "codex-config: YES" || echo "codex-config: NO"

# Detection 4: have you already written Current Activity for this session?
# (only meaningful if machine is registered)
test -f "~/Obsidian-Vault/AI Brain/Machines/<MACHINE>/Current Activity.md" && \
grep -q "^status: active" "~/Obsidian-Vault/AI Brain/Machines/<MACHINE>/Current Activity.md" && \
echo "current-activity: ACTIVE" || echo "current-activity: NOT-ACTIVE"
```

Decide which branches to run, in order:

| Vault | Machine | Agent flavor | Current Activity | Run branches |
|---|---|---|---|---|
| NO | — | — | — | A, B, C, D |
| YES | NO | — | — | B, C, D |
| YES | YES | NO | — | C, D |
| YES | YES | YES | NOT-ACTIVE | D |
| YES | YES | YES | ACTIVE | (skip — already bootstrapped; go to handoff) |

---

## Branch A — Clone the vault

**This branch needs human input.** Ask exactly one question, then proceed.

> "I'm about to clone the brain vault. The default path is `~/Obsidian-Vault`. Confirm or give me a different absolute path."

Then:

```sh
cd "$(dirname <PATH>)" && git clone https://github.com/YOUR-USERNAME/obsidian-cortex.git "$(basename <PATH>)"
cd <PATH>
```

Verify:

```sh
git remote -v
# should show: origin  https://github.com/YOUR-USERNAME/obsidian-cortex.git
ls "AI Brain"
# should show: Daily/  Machines/  Projects/  Shared/  docs/  scripts/  templates/
```

If the human wants this vault opened in the Obsidian app, tell them to do so manually now — you don't have a UI to open it. The vault will work for the agent regardless.

Throughout the rest of this runbook, the symbol `<VAULT>` refers to whatever path the human gave.

---

## Branch B — Register this machine

**This branch needs human input.** Ask exactly one question:

> "I need a short, stable name for this machine. It will be the folder under `AI Brain/Machines/` and how other machines see this one in snapshots. Examples: `Laptop`, `Studio`, `MBP-Studio`, `Mac-Mini`, `Windows-Desktop`. Use the same name forever — renaming later orphans history. What should I call this machine?"

Then:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" init-machine "<MACHINE>"
```

Verify:

```sh
ls "AI Brain/Machines/<MACHINE>"
# should show: Current Context.md  Local Setup.md  Session Log.md
```

Now populate `Local Setup.md`. You can detect most of this autonomously:

```sh
# gather facts to fill in
uname -a                     # OS + kernel
echo "$SHELL"                # default shell
node --version               # node version
python3 --version 2>&1       # python version (optional)
git --version                # git version
```

Edit `AI Brain/Machines/<MACHINE>/Local Setup.md` and fill in: machine name, OS, shell, vault path (`<VAULT>`), AI Brain path (`<VAULT>/AI Brain`), tool versions. Skip "common project paths" — the human will fill those in if needed; don't invent them.

---

## Branch C — Configure this agent flavor on this machine

### If you are Claude Code

The three skills must exist at `~/.claude/skills/brain-startup/`, `~/.claude/skills/brain-closeout/`, `~/.claude/skills/brain-daily/`. Each contains a single `SKILL.md`.

If they're missing, you need to install them. The canonical copies live on the Laptop machine at `~/.claude/skills/brain-{startup,closeout,daily}/`. They are NOT in the vault repo (they're personal Claude config). Options:

- **If the human syncs `~/.claude/` across machines** (via dotfiles, Mackup, etc.), they're already there. Ask the human to confirm.
- **If not**, ask the human to copy the three directories from Laptop (or whichever machine has them) into `~/.claude/skills/` on this machine via any file-transfer method they prefer (scp, AirDrop, USB, git dotfiles repo, copy-paste in chat).

After they confirm the directories are in place — or better, use the one-shot installer that copies from the vault canonical:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" install-claude-skills
node "AI Brain/scripts/brain.mjs" install-claude-hook
```

Verify:

```sh
ls ~/.claude/skills/brain-startup/SKILL.md
ls ~/.claude/skills/brain-closeout/SKILL.md
ls ~/.claude/skills/brain-daily/SKILL.md
ls ~/.claude/skills/brain-bootstrap/SKILL.md
grep -q "brain-skill-sync" ~/.claude/settings.json && echo "hook installed"
# all four skills must exist; hook line must print "hook installed"
```

Skills auto-discover on the next session start. The hook auto-pulls the vault and re-runs `install-claude-skills --force` on every future Claude Code session start, so this machine will pick up skill updates from any other machine without manual intervention.

### If you are Codex

Check `~/.codex/AGENTS.md` for an Obsidian AI Brain section:

```sh
grep -A 5 "Obsidian AI Brain Memory" ~/.codex/AGENTS.md 2>/dev/null
```

If the grep returns the section, you're already configured — skip to Branch D.

If missing, run the one-shot installer:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" codex-install "<MACHINE>"
```

This reads the canonical snippet at `<VAULT>/AI Brain/docs/codex-agents-snippet.md`, substitutes `<MACHINE>` and `<VAULT>` correctly, and **appends** the block to `~/.codex/AGENTS.md` (it doesn't replace anything else in the file). The command is idempotent — if the block is already there, it will not duplicate it and will tell you so.

Verify:

```sh
grep -A 3 "Obsidian AI Brain Memory" ~/.codex/AGENTS.md
# should show the appended section
```

Restart any open Codex sessions for the new config to take effect. New Codex sessions will read `~/.codex/AGENTS.md` automatically on startup.

**Important difference from Claude Code:** Codex does not auto-discover skills by trigger phrase the way Claude Code does. The protocol behavior comes entirely from `~/.codex/AGENTS.md`. So once that file is configured, every Codex session on this machine will follow the protocol — there's nothing else to install.

### If you are some other agent flavor

The protocol is implementation-agnostic. You need to:

1. Read `<VAULT>/AGENTS.md` at every session start
2. Run the `brain.mjs` commands at the right boundaries (startup, activity, closeout, idle)
3. Treat the vault as the single source of truth for cross-machine state

Document your flavor's integration in `<VAULT>/AI Brain/docs/` so the next agent of your flavor benefits.

---

## Branch D — Write Current Activity and run startup

Now write your initial Current Activity record so other machines see you're alive:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" startup "<MACHINE>" \
  --agent "<YOUR-AGENT-NAME>" \
  --project "<PROJECT-OR-Bootstrap>" \
  --focus "Bootstrapping this machine into the brain" \
  --cwd "$(pwd)"
```

Replace `<YOUR-AGENT-NAME>` with what you are — e.g., `"Claude Code"`, `"Codex"`, `"Aider"`. Replace `<PROJECT-OR-Bootstrap>` with the project name the human told you to work on, or `Obsidian-AI-Brain` if you're just bootstrapping.

---

## Verification

Run all three and confirm they look right:

```sh
cd <VAULT>
node "AI Brain/scripts/brain.mjs" status
# should list all known machines and projects, including <MACHINE>

node "AI Brain/scripts/brain.mjs" snapshot
# should show <MACHINE> as ACTIVE with your focus, plus any other machines

git log --oneline -5
# should show recent vault commits
```

If snapshot shows another machine as ACTIVE on the same project with a recent heartbeat (< 2 hours), **tell the human before proceeding** — they may want to coordinate or pick a different task.

---

## Commit and push

Stage only what you changed during bootstrap:

```sh
cd <VAULT>
git status --short
# expect:
#   ?? AI Brain/Machines/<MACHINE>/   (or M for the Current Activity update)
```

If `git status` shows files you don't recognize, **stop and tell the human**. Do not blanket-add.

When clean:

```sh
git add "AI Brain/Machines/<MACHINE>"
git commit -m "Onboard <MACHINE> to the brain"
git push
```

---

## Handoff

You are now bootstrapped. From this point forward, follow `<VAULT>/AGENTS.md` for the ongoing session protocol:

- Bump heartbeats during meaningful work: `node "AI Brain/scripts/brain.mjs" activity "<MACHINE>" --focus "..."`
- Log wiki events: `node "AI Brain/scripts/brain.mjs" log-event ingest|query|lint|note "..."`
- At session end, run closeout: `node "AI Brain/scripts/brain.mjs" closeout "..." "..." "<MACHINE>" --summary "..." --next "..."`
- Then mark idle: `node "AI Brain/scripts/brain.mjs" idle "<MACHINE>"`
- End of day: `node "AI Brain/scripts/brain.mjs" daily "<MACHINE>"`

If you are Claude Code, the equivalent skills (`brain-startup`, `brain-closeout`, `brain-daily`) auto-fire on the right trigger phrases — see `~/.claude/skills/brain-*/SKILL.md` for the trigger lists.

Tell the human:

> "I'm bootstrapped on `<MACHINE>` and registered with the brain. <N> other machines are currently in the snapshot: <list>. I'm ready to work."

---

## Common gotchas you'll hit

- **CWD reset after every shell call**: the harness resets cwd to wherever it started, not where `cd` last left you. Always either chain `cd <VAULT> && ...` at the top of each Bash call, or use absolute paths.
- **Surprise commits titled `vault backup: TIMESTAMP`**: the Obsidian Git plugin auto-commits every ~3 hours. If you `git add` a batch of files and a backup fires between your add and your commit, your changes will land in the backup commit instead of yours. Mitigation: chain `git add && git commit` in a single shell call.
- **Working in a deleted directory**: if you `rm -rf` the directory you're currently in, your next command will error with "Working directory was deleted; shell cwd recovered". Just `cd <VAULT>` and retry.
- **Case-insensitive macOS filesystem**: `~/Obsidian-Vault` and `/Users/YOUR-USERNAME/obsidian-cortex` are the same inode on macOS. Use the canonical capitalized form to match docs.
- **Conflicts on `Current Activity.md` or `index.md`**: most common conflict files. Resolve by preserving both intents. For `Current Activity.md`, the newer `last_heartbeat` wins by default. For `index.md`, keep both new entries.

---

## When this runbook breaks

If at any step the verification fails or a command errors in a way you don't understand:

1. **Stop executing.** Do not proceed.
2. **Tell the human** exactly which step failed, the exact command you ran, the exact output you got.
3. **Wait for direction.** Do not improvise around the failure.

If the runbook itself seems wrong or outdated, that's a real possibility — the brain evolves. Tell the human what you observed vs. what the runbook expected; they may want to update the runbook based on what you found.

---

*Last updated: 2026-05-21*
