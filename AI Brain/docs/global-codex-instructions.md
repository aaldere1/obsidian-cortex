# Global Codex Instructions For AI Brain

Purpose: Tell Codex agents to use AI Brain without adding files to every project repo.

On M5, the global Codex instruction file is:

```text
~/.codex/AGENTS.md
```

That file now includes an `Obsidian AI Brain Memory` section.

## Why This Is Better Than Per-Repo Files

Most project repos should stay clean.

Instead of adding `AGENTS.md` to every repo under `~`, the global Codex instructions tell agents:

- where the AI Brain vault is
- which M5 machine files to read
- where project memory lives
- how to create a closeout summary
- what not to store

Per-repo `AGENTS.md` files are still allowed, but only when a repo needs special local instructions.

## M5 Global Memory Path

```text
~/Obsidian-Vault/AI Brain
```

## Startup Rule For Agents

At the start of meaningful work, read:

```text
~/Obsidian-Vault/AI Brain/Shared/Profile.md
~/Obsidian-Vault/AI Brain/Shared/Preferences.md
~/Obsidian-Vault/AI Brain/Shared/Active Projects.md
~/Obsidian-Vault/AI Brain/Shared/Open Loops.md
~/Obsidian-Vault/AI Brain/Machines/M5/Current Context.md
~/Obsidian-Vault/AI Brain/Machines/M5/Local Setup.md
~/Obsidian-Vault/AI Brain/Machines/M5/Working Projects.md
```

If the current repo has project memory, also read:

```text
~/Obsidian-Vault/AI Brain/Projects/<Project Name>/Overview.md
~/Obsidian-Vault/AI Brain/Projects/<Project Name>/Current State.md
~/Obsidian-Vault/AI Brain/Projects/<Project Name>/Next Steps.md
~/Obsidian-Vault/AI Brain/Projects/<Project Name>/Decisions.md
```

## Closeout Rule For Agents

At the end of meaningful work:

```sh
cd ~/Obsidian-Vault
node "AI Brain/scripts/brain.mjs" closeout "Project Name" "Short session title" "M5" --summary "What changed" --next "Next action"
```

Then update project `Current State.md` and `Next Steps.md` if needed.

## Other Computers

Other computers should use the same idea:

1. Pull the Obsidian vault.
2. Create a machine folder under `AI Brain/Machines/`.
3. Add an AI Brain section to that computer's global Codex instruction file.
4. Point it to that computer's local vault path and machine folder.

