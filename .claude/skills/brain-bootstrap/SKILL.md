---
name: brain-bootstrap
description: Set up this machine and this agent to participate in the Obsidian-Vault brain — clone vault if needed, register the machine, install agent-flavor configuration, write Current Activity, verify. Use when the user says "bootstrap this machine", "set up the brain on this machine", "onboard this agent", "this is a new machine — set it up", "install the brain on this computer", "make this machine part of the brain", or any first-time brain installation request. ONE-SHOT setup, autonomous after the human answers vault path and machine name.
---

# brain-bootstrap

One-shot bootstrap for getting a new machine + agent fully participating in the Obsidian-Vault brain.


## When to invoke

- User says any of: "bootstrap this machine", "set up the brain", "set up the brain on this machine", "onboard this agent", "this is a new machine — set it up", "install the brain on this computer", "make this machine part of the brain"
- A new Claude Code session on a machine that has never been registered in `AI Brain/Machines/`
- A human is bringing up a fresh laptop/desktop and wants it talking to the same vault as their other machines

## What to do

### 0. Resolve the vault path — or choose one (DO NOT assume `~/Obsidian-Vault`)

Bootstrap may run *before* this machine has a vault. First check whether one already exists;
only clone if not. Either way, never hardcode the path:

```sh
VAULT="${BRAIN_VAULT:-}"
if [ -z "$VAULT" ]; then
  for c in "$HOME/Obsidian-Vault" "$HOME/obsidian-cortex" \
           "$HOME/Obsidian/Personal" "$HOME/GitHub/obsidian-cortex"; do
    [ -d "$c/AI Brain" ] && { VAULT="$c"; break; }
  done
fi
echo "vault: ${VAULT:-NONE — needs cloning}"
```

If it printed `NONE`, ask the human where to clone it (suggest `~/Obsidian-Vault`, which is
what the docs' examples use), clone there, and set `VAULT` to that path. Then **record the real
path** in this machine's `Local Setup.md` — a machine with no recorded path is one whose hook
status nobody can check.

Every `cd "$VAULT"` below depends on this. Known paths in a real fleet have included
`~/Obsidian-Vault`, `~/obsidian-cortex`, `~/GitHub/obsidian-cortex` and
`~/Obsidian/Personal` — one per machine. Background: `AI Brain/docs/brain-skill-sync-path-bug.md`.

The full runbook is in the vault at `"$VAULT/AGENT-BOOTSTRAP.md"`. Read it once, execute it top-to-bottom.

Quick orientation:

1. **Read the runbook first**: `Read "$VAULT/AGENT-BOOTSTRAP.md"` (or the equivalent path on this machine — if vault isn't cloned yet, you'll have to read this from somewhere else first; in that case, ask the human to paste the runbook content or point you at the GitHub URL: https://github.com/YOUR-USERNAME/obsidian-cortex/blob/main/AGENT-BOOTSTRAP.md)
2. **Run the four self-check detections** at the top of the runbook
3. **Decide which branches apply** using the decision table
4. **Pause and ask the human exactly once** for: vault path (if not at default), machine name. After those answers, proceed autonomously through the chosen branches.
5. **Verify with `status` and `snapshot`** at the end
6. **Commit and push** the machine setup
7. **Hand off to `AGENTS.md`** for ongoing protocol

## Rules

- ONE pause-and-ask for the human at the start (vault path + machine name combined into a single question if possible). After that, execute the rest autonomously.
- Never invent paths or machine names. Use what the human says verbatim.
- Never blanket `git add .` — only add `AI Brain/Machines/<MACHINE>/` and any other paths you explicitly created during bootstrap.
- Stop and ask if any verification step fails — do not improvise around errors.
- If snapshot shows another machine ACTIVE on the same project, tell the human before continuing.

## When to NOT invoke

- If `AI Brain/Machines/<thismachine>/` already exists and `snapshot` shows recent activity — this machine is already bootstrapped. Invoke `brain-startup` instead to begin a normal session.
- If the user just wants to start a session on an already-configured machine — that's `brain-startup`, not this skill.

This skill is for **first-time machine setup only**. Once bootstrapped, the normal session lifecycle is `brain-startup` → work → `brain-closeout` → (optional) `brain-daily`.

## After successful bootstrap

Brief the user:

> "Bootstrapped `<MACHINE>` into the brain. Vault is at `<VAULT>`. Snapshot shows N machines registered: <list>. Ready to work — what would you like to do?"

Then the agent is in the same state as if they'd just run `brain-startup` on an existing machine. The user can immediately give a real task.
