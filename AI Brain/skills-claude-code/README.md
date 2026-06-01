# Claude Code Skills — Canonical Copies

These are versioned copies of the four `brain-*` skills used by Claude Code on every machine. They live here so a fresh `git clone` of the vault carries everything needed to set up Claude Code on a new machine — no external file transfer required.

## Skills

- `brain-startup/SKILL.md` — session start: pull + snapshot + brief + write Current Activity
- `brain-closeout/SKILL.md` — session end: draft summary + closeout + idle + ask about push
- `brain-daily/SKILL.md` — end-of-day rollup into `AI Brain/Daily/`
- `brain-bootstrap/SKILL.md` — first-contact setup for a new machine

## Install on a new machine

Run from any directory:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" install-claude-skills
node "AI Brain/scripts/brain.mjs" install-claude-hook
```

The first command copies all four skill directories into `~/.claude/skills/`. The second wires a `SessionStart` hook into `~/.claude/settings.json` that auto-syncs future skill updates from the vault. Both are idempotent.

To restore the canonical versions if a machine's local copies have drifted:

```sh
node "AI Brain/scripts/brain.mjs" install-claude-skills --force
```

To re-wire the hook (e.g., after the hook script path changes):

```sh
node "AI Brain/scripts/brain.mjs" install-claude-hook --force
```

## Auto-sync: how the hook works

After `install-claude-hook`, every Claude Code session start on this machine runs `AI Brain/scripts/hooks/brain-skill-sync.sh`:

1. Pulls the vault silently (`git pull --ff-only`)
2. Diffs each canonical skill in `AI Brain/skills-claude-code/` against `~/.claude/skills/`
3. If any differ, runs `install-claude-skills --force` automatically
4. Prints `🧠 Brain skills updated…` only when an update was actually applied (silent otherwise)

This means: edit a skill in the vault on Laptop, push, and the next Claude Code session on any other machine picks up the update with no manual command. The current session still has the old description in memory (skills load before SessionStart hooks fire), but the next one is up to date.

## Keep in sync

When you edit a skill (e.g., a `~/.claude/skills/brain-startup/SKILL.md` on Laptop), also update the canonical copy here in the vault. Otherwise other machines onboarding will install the outdated version.

(A future improvement: a `brain.mjs sync-claude-skills` command that diffs the two locations and prompts which side wins. For now, copy by hand when you edit.)

## Why duplicate?

Claude Code looks for skills in `~/.claude/skills/`, not the vault. So the runtime location is `~/.claude/skills/`. The vault copy is the **source of truth** that gets copied into the runtime location. Same pattern as the Codex AGENTS snippet at `AI Brain/docs/codex-agents-snippet.md`.
